/**
 * V2094 Direction A Iteration 9/30 Round 6: CycleSanitizer
 *
 * Cycle sanitizer — guards a cycle against runaway execution by enforcing
 * iteration, memory and time budgets. Records any violations and offers a
 * `sanitizeCycle` helper that prunes a cycle that exceeds its budget.
 *
 * Inspired by:
 * - nanobot-design: sandbox with iteration/time/memory ceilings
 * - ruflo-design: trust-score based execution guard
 * - claude-code-design: budget tracking for long-running workflows
 */

export type ViolationKind = 'iteration' | 'memory' | 'execution' | 'depth';

export interface SanitizerConfig {
  /** Maximum iterations allowed (default 100). */
  maxIterations?: number;
  /** Maximum memory in MB (default 256). */
  maxMemoryMB?: number;
  /** Maximum execution time in milliseconds (default 30_000). */
  maxExecutionMs?: number;
  /** Maximum nesting depth (default 8). */
  maxDepth?: number;
}

export interface SanitizerState {
  iterations: number;
  memoryMB: number;
  elapsedMs: number;
  depth: number;
}

export interface Violation {
  kind: ViolationKind;
  observed: number;
  threshold: number;
  cycleId: string;
  recordedAt: number;
}

export interface Sanitizer {
  config: Required<SanitizerConfig>;
  state: SanitizerState;
  violations: Violation[];
}

/**
 * Create a cycle sanitizer with the given configuration.
 */
export function createSanitizer(
  cycleId: string,
  config: SanitizerConfig = {},
  now: () => number = () => Date.now()
): Sanitizer {
  const cfg: Required<SanitizerConfig> = {
    maxIterations: config.maxIterations ?? 100,
    maxMemoryMB: config.maxMemoryMB ?? 256,
    maxExecutionMs: config.maxExecutionMs ?? 30_000,
    maxDepth: config.maxDepth ?? 8,
  };
  for (const k of ['maxIterations', 'maxMemoryMB', 'maxExecutionMs', 'maxDepth'] as const) {
    if (!Number.isFinite(cfg[k]) || cfg[k] < 0) {
      throw new Error(`${k} must be a finite non-negative number, got ${cfg[k]}`);
    }
  }
  void now();
  return {
    config: cfg,
    state: { iterations: 0, memoryMB: 0, elapsedMs: 0, depth: 0 },
    violations: [],
  };
}

/**
 * Record a single iteration increment against the sanitizer. Mutates state
 * and records a violation if the limit is exceeded.
 */
export function recordIteration(sanitizer: Sanitizer): void {
  sanitizer.state.iterations += 1;
  if (sanitizer.state.iterations > sanitizer.config.maxIterations) {
    recordViolation(sanitizer, 'iteration', sanitizer.state.iterations);
  }
}

/**
 * Update the memory usage reading and flag if it exceeds the budget.
 */
export function recordMemoryUsage(sanitizer: Sanitizer, memoryMB: number): void {
  sanitizer.state.memoryMB = memoryMB;
  if (memoryMB > sanitizer.config.maxMemoryMB) {
    recordViolation(sanitizer, 'memory', memoryMB);
  }
}

/**
 * Update the elapsed time and flag if it exceeds the budget.
 */
export function recordExecutionTime(sanitizer: Sanitizer, elapsedMs: number): void {
  sanitizer.state.elapsedMs = elapsedMs;
  if (elapsedMs > sanitizer.config.maxExecutionMs) {
    recordViolation(sanitizer, 'execution', elapsedMs);
  }
}

/**
 * Increment the recursion depth and flag if it exceeds the budget.
 */
export function recordDepth(sanitizer: Sanitizer): void {
  sanitizer.state.depth += 1;
  if (sanitizer.state.depth > sanitizer.config.maxDepth) {
    recordViolation(sanitizer, 'depth', sanitizer.state.depth);
  }
}

/**
 * Internal: push a violation entry onto the sanitizer log.
 */
export function recordViolation(
  sanitizer: Sanitizer,
  kind: ViolationKind,
  observed: number,
  cycleId: string = '_default_',
  now: () => number = () => Date.now()
): Violation {
  const threshold = thresholdFor(sanitizer, kind);
  const v: Violation = {
    kind,
    observed,
    threshold,
    cycleId,
    recordedAt: now(),
  };
  sanitizer.violations.push(v);
  return v;
}

function thresholdFor(s: Sanitizer, kind: ViolationKind): number {
  switch (kind) {
    case 'iteration':
      return s.config.maxIterations;
    case 'memory':
      return s.config.maxMemoryMB;
    case 'execution':
      return s.config.maxExecutionMs;
    case 'depth':
      return s.config.maxDepth;
  }
}

/**
 * True if any of the recorded metrics exceed its respective threshold.
 */
export function shouldTerminate(sanitizer: Sanitizer): boolean {
  if (sanitizer.state.iterations > sanitizer.config.maxIterations) return true;
  if (sanitizer.state.memoryMB > sanitizer.config.maxMemoryMB) return true;
  if (sanitizer.state.elapsedMs > sanitizer.config.maxExecutionMs) return true;
  if (sanitizer.state.depth > sanitizer.config.maxDepth) return true;
  return false;
}

/**
 * Snapshot the violations for inspection / serialization.
 */
export function getViolations(sanitizer: Sanitizer): Violation[] {
  return sanitizer.violations.map((v) => ({ ...v }));
}

/**
 * Clear violation history. Returns the number of entries cleared.
 */
export function clearViolations(sanitizer: Sanitizer): number {
  const n = sanitizer.violations.length;
  sanitizer.violations = [];
  return n;
}

/**
 * Prune a cycle that exceeds its budget: drops the tail of the cycle so the
 * remaining length fits inside `maxIterations` (or returns it unchanged if
 * already within budget).
 */
export function sanitizeCycle(
  cycle: string[],
  sanitizer: Sanitizer
): string[] {
  if (cycle.length <= sanitizer.config.maxIterations) return [...cycle];
  return cycle.slice(0, sanitizer.config.maxIterations);
}

/**
 * Compute the headroom (how much budget remains) for a given dimension.
 * Returns 0 when the dimension is already over budget.
 */
export function budgetHeadroom(
  sanitizer: Sanitizer,
  kind: ViolationKind
): number {
  switch (kind) {
    case 'iteration':
      return Math.max(0, sanitizer.config.maxIterations - sanitizer.state.iterations);
    case 'memory':
      return Math.max(0, sanitizer.config.maxMemoryMB - sanitizer.state.memoryMB);
    case 'execution':
      return Math.max(0, sanitizer.config.maxExecutionMs - sanitizer.state.elapsedMs);
    case 'depth':
      return Math.max(0, sanitizer.config.maxDepth - sanitizer.state.depth);
  }
}

/**
 * Compute a coarse health score in [0, 1]. 1 = no violations; 0 = at least
 * one dimension fully consumed.
 */
export function healthScore(sanitizer: Sanitizer): number {
  const dims: ViolationKind[] = ['iteration', 'memory', 'execution', 'depth'];
  const scores = dims.map((d) => {
    const head = budgetHeadroom(sanitizer, d);
    const limit =
      d === 'iteration'
        ? sanitizer.config.maxIterations
        : d === 'memory'
          ? sanitizer.config.maxMemoryMB
          : d === 'execution'
            ? sanitizer.config.maxExecutionMs
            : sanitizer.config.maxDepth;
    return limit === 0 ? 1 : Math.min(1, head / limit);
  });
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return sum / scores.length;
}
