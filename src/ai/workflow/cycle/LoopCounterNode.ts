/**
 * V2089 Direction A Iteration 4/30 Round 6: LoopCounterNode
 *
 * Loop counter node — bounds how many times a strongly connected component
 * (cycle) may iterate before it must yield to an exit condition.
 *
 * Inspired by:
 * - chatdev-design: LoopCounter node used in chatdev cycle engine
 * - ruflo-design: Hook workers with iteration quotas and trust scoring
 * - nanobot-design: Atomic retry counter with bounded budget
 */

export interface LoopCounterConfig {
  /** Initial value of the counter (default 0). */
  initial?: number;
  /** Maximum iterations before the loop must exit (default 100). */
  max: number;
  /** Step size applied by increment / decrement (default 1). */
  step?: number;
  /** Lower bound; decrement will refuse to go below this (default 0). */
  min?: number;
  /** Optional identifier for logging / introspection. */
  label?: string;
}

export interface NormalizedLoopCounterConfig {
  initial: number;
  max: number;
  step: number;
  min: number;
  label?: string;
}

export interface LoopCounterNode {
  id: string;
  config: NormalizedLoopCounterConfig;
  state: LoopCounterState;
}

export interface LoopCounterState {
  value: number;
  totalIncrements: number;
  totalDecrements: number;
  totalResets: number;
  lastUpdatedAt: number;
  history: number[];
}

export interface LoopCounterSnapshot {
  id: string;
  value: number;
  totalIncrements: number;
  totalDecrements: number;
  max: number;
  min: number;
  step: number;
}

/**
 * Create a new loop counter node.
 * @throws when `max` is not a finite positive integer.
 */
export function createLoopCounterNode(
  id: string,
  config: LoopCounterConfig,
  now: () => number = () => Date.now()
): LoopCounterNode {
  if (!Number.isFinite(config.max) || config.max < 0) {
    throw new Error(`max must be a finite non-negative number, got ${config.max}`);
  }
  const step = config.step ?? 1;
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error(`step must be a finite positive number, got ${step}`);
  }
  const min = config.min ?? 0;
  if (!Number.isFinite(min)) {
    throw new Error(`min must be a finite number, got ${config.min}`);
  }
  if (min > config.max) {
    throw new Error(`min (${min}) must be <= max (${config.max})`);
  }
  const initial = config.initial ?? min;
  if (initial < min || initial > config.max) {
    throw new Error(`initial (${initial}) must be within [min, max]`);
  }
  return {
    id,
    config: {
      initial: initial,
      max: config.max,
      step: step,
      min: min,
      label: config.label,
    },
    state: {
      value: initial,
      totalIncrements: 0,
      totalDecrements: 0,
      totalResets: 0,
      lastUpdatedAt: now(),
      history: [initial],
    },
  };
}

/**
 * Increment by `step` (or by a custom override). Returns the new value.
 * Throws when the increment would exceed `max`.
 */
export function incrementCounter(
  node: LoopCounterNode,
  amount?: number,
  now: () => number = () => Date.now()
): number {
  const step = amount ?? node.config.step;
  const next = node.state.value + step;
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error(`increment amount must be a finite positive number, got ${step}`);
  }
  if (next > node.config.max) {
    throw new Error(
      `increment would exceed max (${next} > ${node.config.max}) for node "${node.id}"`
    );
  }
  node.state.value = next;
  node.state.totalIncrements += 1;
  node.state.lastUpdatedAt = now();
  node.state.history.push(next);
  return next;
}

/**
 * Decrement by `step` (or by a custom override). Returns the new value.
 * Throws when the decrement would go below `min`.
 */
export function decrementCounter(
  node: LoopCounterNode,
  amount?: number,
  now: () => number = () => Date.now()
): number {
  const step = amount ?? node.config.step;
  const next = node.state.value - step;
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error(`decrement amount must be a finite positive number, got ${step}`);
  }
  if (next < node.config.min) {
    throw new Error(
      `decrement would go below min (${next} < ${node.config.min}) for node "${node.id}"`
    );
  }
  node.state.value = next;
  node.state.totalDecrements += 1;
  node.state.lastUpdatedAt = now();
  node.state.history.push(next);
  return next;
}

/**
 * Reset the counter to `initial` (or to a custom value within [min, max]).
 */
export function resetCounter(
  node: LoopCounterNode,
  toValue?: number,
  now: () => number = () => Date.now()
): number {
  const target = toValue ?? node.config.initial;
  if (target < node.config.min || target > node.config.max) {
    throw new Error(
      `reset target (${target}) must be within [${node.config.min}, ${node.config.max}]`
    );
  }
  node.state.value = target;
  node.state.totalResets += 1;
  node.state.lastUpdatedAt = now();
  node.state.history.push(target);
  return target;
}

/** True when the counter has reached its maximum. */
export function hasReachedMax(node: LoopCounterNode): boolean {
  return node.state.value >= node.config.max;
}

/** True when the counter has reached its minimum. */
export function hasReachedMin(node: LoopCounterNode): boolean {
  return node.state.value <= node.config.min;
}

/** Number of iterations remaining before the counter hits max. */
export function getRemainingIterations(node: LoopCounterNode): number {
  return Math.max(0, node.config.max - node.state.value);
}

/** Fraction of max already consumed (0..1). */
export function getProgressRatio(node: LoopCounterNode): number {
  const range = node.config.max - node.config.min;
  if (range <= 0) {
    if (node.state.value >= node.config.max) return 1;
    return 0;
  }
  return Math.min(1, Math.max(0, (node.state.value - node.config.min) / range));
}

/** Convert the live node to an immutable snapshot for logging/serialization. */
export function snapshotCounter(node: LoopCounterNode): LoopCounterSnapshot {
  return {
    id: node.id,
    value: node.state.value,
    totalIncrements: node.state.totalIncrements,
    totalDecrements: node.state.totalDecrements,
    max: node.config.max,
    min: node.config.min,
    step: node.config.step,
  };
}

/** Reconstruct a node from a snapshot (history is reset to a single value). */
export function deserializeCounter(
  id: string,
  config: LoopCounterConfig,
  snapshot: LoopCounterSnapshot,
  now: () => number = () => Date.now()
): LoopCounterNode {
  const node = createLoopCounterNode(id, config, now);
  if (snapshot.value < node.config.min || snapshot.value > node.config.max) {
    throw new Error(`snapshot value (${snapshot.value}) outside [min, max]`);
  }
  node.state.value = snapshot.value;
  node.state.totalIncrements = snapshot.totalIncrements;
  node.state.totalDecrements = snapshot.totalDecrements;
  return node;
}

/**
 * Estimate how many increments can still be applied before max is reached,
 * given a step size.
 */
export function estimateCapacity(node: LoopCounterNode, stepSize?: number): number {
  const step = stepSize ?? node.config.step;
  if (step <= 0) return 0;
  return Math.max(0, Math.floor((node.config.max - node.state.value) / step));
}

/**
 * Compare two snapshots; returns negative if a<b, 0 if equal, positive if a>b.
 */
export function compareCounters(a: LoopCounterSnapshot, b: LoopCounterSnapshot): number {
  return a.value - b.value;
}
