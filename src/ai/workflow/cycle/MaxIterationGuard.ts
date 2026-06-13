/**
 * V2099 Direction A Iteration 14/30 Round 6: MaxIterationGuard
 *
 * Maximum iteration guard — wraps LoopCounterNode with cycle context, an
 * onExceeded callback, and an ETA estimator.
 *
 * Inspired by:
 * - ruflo-design: trust-score based execution guard
 * - claude-code-design: budget tracking for long-running workflows
 * - nanobot-design: atomic retry counter with bounded budget
 */

import {
  createLoopCounterNode,
  incrementCounter,
  hasReachedMax,
  type LoopCounterNode,
} from './LoopCounterNode';

export interface MaxIterationGuardConfig {
  cycleId: string;
  maxIterations: number;
  /** Optional callback invoked exactly once when the guard first exceeds. */
  onExceeded?: (guard: MaxIterationGuard) => void;
  /** Time provider for tests. */
  now?: () => number;
}

export interface MaxIterationGuard {
  cycleId: string;
  counter: LoopCounterNode;
  config: MaxIterationGuardConfig;
  startedAt: number;
  exceededFired: boolean;
}

/**
 * Create a maximum iteration guard.
 */
export function createMaxIterationGuard(
  config: MaxIterationGuardConfig
): MaxIterationGuard {
  if (!Number.isFinite(config.maxIterations) || config.maxIterations < 1) {
    throw new Error(
      `maxIterations must be a positive integer, got ${config.maxIterations}`
    );
  }
  const now = config.now ?? (() => Date.now());
  return {
    cycleId: config.cycleId,
    counter: createLoopCounterNode(`guard-${config.cycleId}`, {
      max: config.maxIterations,
      min: 0,
      step: 1,
      initial: 0,
    }),
    config,
    startedAt: now(),
    exceededFired: false,
  };
}

/** True if the guard permits another iteration. */
export function shouldAllowIteration(guard: MaxIterationGuard): boolean {
  return !hasReachedMax(guard.counter);
}

/** Record an iteration; triggers onExceeded callback if this is the over-budget one. */
export function recordIteration(guard: MaxIterationGuard): number {
  let next: number;
  try {
    next = incrementCounter(guard.counter);
  } catch {
    // Already at max — still record the over-budget attempt but don't throw.
    next = guard.counter.state.value;
  }
  if (!guard.exceededFired && guard.counter.state.value >= guard.config.maxIterations) {
    if (guard.config.onExceeded) {
      guard.config.onExceeded(guard);
    }
    guard.exceededFired = true;
  }
  return next;
}

/** Number of iterations remaining before the guard hard-limits. */
export function getRemainingIterations(guard: MaxIterationGuard): number {
  return Math.max(0, guard.config.maxIterations - guard.counter.state.value);
}

/** Progress descriptor. */
export interface GuardProgress {
  iterations: number;
  max: number;
  ratio: number;
  etaIterations: number;
}

export function getProgress(guard: MaxIterationGuard): GuardProgress {
  const iterations = guard.counter.state.value;
  const max = guard.config.maxIterations;
  const ratio = max === 0 ? 1 : Math.min(1, iterations / max);
  const etaIterations = Math.max(0, max - iterations);
  return { iterations, max, ratio, etaIterations };
}

/** Reset the guard back to 0 iterations and clear exceeded flag. */
export function resetGuard(guard: MaxIterationGuard): void {
  guard.counter.state.value = 0;
  guard.counter.state.totalIncrements = 0;
  guard.counter.state.totalDecrements = 0;
  guard.counter.state.totalResets += 1;
  guard.exceededFired = false;
  if (guard.config.now) guard.startedAt = guard.config.now();
}

/** True if the guard has been tripped. */
export function isExceeded(guard: MaxIterationGuard): boolean {
  return guard.counter.state.value >= guard.config.maxIterations;
}

/** Returns the wall-clock duration (ms) since the guard was created. */
export function guardAge(guard: MaxIterationGuard, now: () => number = Date.now): number {
  return now() - guard.startedAt;
}
