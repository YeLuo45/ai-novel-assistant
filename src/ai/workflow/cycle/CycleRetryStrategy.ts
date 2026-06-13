/**
 * V2102 Direction A Iteration 11/30 Round 7: CycleRetryStrategy
 *
 * Retry strategy — decides how long to wait before the next retry of a
 * failed in-cycle operation. Supports three delay shapes:
 *   - 'exponential' : baseDelay * 2^attempt
 *   - 'linear'      : baseDelay * (attempt + 1)
 *   - 'jitter'      : exponential with proportional random perturbation
 *
 * Inspired by:
 * - nanobot-design: worker retry with exponential backoff
 * - claude-code-design: jittered backoff for distributed calls
 * - ruflo-design: bounded retry inside federation nodes
 */

export type RetryStrategyType = 'exponential' | 'linear' | 'jitter';

export interface RetryStrategyConfig {
  /** Backoff curve (default 'exponential'). */
  type?: RetryStrategyType;
  /** Base delay in ms (default 100). */
  baseDelay?: number;
  /** Hard upper bound on the computed delay (default 30_000). */
  maxDelay?: number;
  /** Maximum allowed retry attempts (default 5). */
  maxRetries?: number;
  /** Jitter ratio 0..1 used by 'jitter' strategy (default 0.25). */
  jitterRatio?: number;
  /** Optional list of error names / messages that must NOT be retried. */
  nonRetryableErrors?: string[];
}

export interface RetryAttempt {
  attempt: number;
  errorName: string;
  errorMessage: string;
  delayBeforeMs: number;
  recordedAt: number;
}

export interface RetryStrategy {
  config: Required<RetryStrategyConfig>;
  attempts: RetryAttempt[];
  /** Cumulative delay actually waited (sum of delayBeforeMs). */
  totalDelay: number;
}

/* ------------------------------------------------------------------------- */
/* Construction                                                                */
/* ------------------------------------------------------------------------- */

function validateConfig(cfg: Required<RetryStrategyConfig>): void {
  if (!Number.isFinite(cfg.baseDelay) || cfg.baseDelay < 0) {
    throw new Error(`baseDelay must be a finite non-negative number, got ${cfg.baseDelay}`);
  }
  if (!Number.isFinite(cfg.maxDelay) || cfg.maxDelay < 0) {
    throw new Error(`maxDelay must be a finite non-negative number, got ${cfg.maxDelay}`);
  }
  if (!Number.isFinite(cfg.maxRetries) || cfg.maxRetries < 0) {
    throw new Error(`maxRetries must be a finite non-negative number, got ${cfg.maxRetries}`);
  }
  if (!Number.isFinite(cfg.jitterRatio) || cfg.jitterRatio < 0 || cfg.jitterRatio > 1) {
    throw new Error(`jitterRatio must be a number in [0, 1], got ${cfg.jitterRatio}`);
  }
}

/**
 * Create a retry strategy.
 */
export function createRetryStrategy(config: RetryStrategyConfig = {}): RetryStrategy {
  const cfg: Required<RetryStrategyConfig> = {
    type: config.type ?? 'exponential',
    baseDelay: config.baseDelay ?? 100,
    maxDelay: config.maxDelay ?? 30_000,
    maxRetries: config.maxRetries ?? 5,
    jitterRatio: config.jitterRatio ?? 0.25,
    nonRetryableErrors: config.nonRetryableErrors ?? [],
  };
  validateConfig(cfg);
  return {
    config: cfg,
    attempts: [],
    totalDelay: 0,
  };
}

/* ------------------------------------------------------------------------- */
/* Delay calculation                                                           */
/* ------------------------------------------------------------------------- */

/**
 * Compute the delay (ms) to wait before the next attempt. The first retry
 * (attempt=1) uses the base delay scaled by the strategy; subsequent
 * retries scale the delay up to `maxDelay`.
 */
export function nextDelay(strategy: RetryStrategy, attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 1) {
    throw new Error(`attempt must be a positive integer, got ${attempt}`);
  }
  const cfg = strategy.config;
  const raw = computeRawDelay(cfg, attempt);
  return clamp(raw, 0, cfg.maxDelay);
}

function computeRawDelay(cfg: Required<RetryStrategyConfig>, attempt: number): number {
  if (cfg.type === 'exponential') {
    return cfg.baseDelay * Math.pow(2, attempt - 1);
  }
  if (cfg.type === 'linear') {
    return cfg.baseDelay * attempt;
  }
  // jitter: exponential * (1 +/- jitterRatio)
  const expo = cfg.baseDelay * Math.pow(2, attempt - 1);
  const spread = expo * cfg.jitterRatio;
  // Deterministic default jitter: alternate +/- pattern based on attempt.
  // We expose a hook via `random` so callers / tests can inject values.
  return expo + (attempt % 2 === 0 ? -spread : spread);
}

/** Variant of `nextDelay` that accepts a custom jitter source. */
export function nextDelayJittered(
  strategy: RetryStrategy,
  attempt: number,
  random: () => number = Math.random
): number {
  if (!Number.isFinite(attempt) || attempt < 1) {
    throw new Error(`attempt must be a positive integer, got ${attempt}`);
  }
  const cfg = strategy.config;
  const expo = cfg.baseDelay * Math.pow(2, attempt - 1);
  const spread = expo * cfg.jitterRatio;
  const r = Math.max(0, Math.min(1, random()));
  // Map r in [0,1] to [-1, +1] so jitter can push delay up or down.
  const direction = r * 2 - 1;
  const raw = cfg.type === 'jitter' ? expo + direction * spread : computeRawDelay(cfg, attempt);
  return clamp(raw, 0, cfg.maxDelay);
}

/* ------------------------------------------------------------------------- */
/* Retry decisions                                                             */
/* ------------------------------------------------------------------------- */

/**
 * Return true if the strategy should retry given the current attempt number
 * and the latest error. `attempt` is 1-based (1 = first retry).
 */
export function shouldRetry(
  strategy: RetryStrategy,
  attempt: number,
  error?: { name?: string; message?: string }
): boolean {
  if (!Number.isFinite(attempt) || attempt < 1) return false;
  if (attempt > strategy.config.maxRetries) return false;
  if (error) {
    const name = error.name ?? '';
    const message = error.message ?? '';
    for (const blocked of strategy.config.nonRetryableErrors) {
      if (!blocked) continue;
      if (name === blocked || message === blocked || message.includes(blocked)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Record an attempt against the strategy. The supplied error becomes the
 * latest one. The returned entry contains the delay that was waited
 * before this attempt.
 */
export function recordAttempt(
  strategy: RetryStrategy,
  error: { name?: string; message?: string } = {},
  options: { delayBeforeMs?: number; now?: () => number } = {}
): RetryAttempt {
  const attemptNumber = strategy.attempts.length + 1;
  const delayBeforeMs = options.delayBeforeMs ?? 0;
  if (!Number.isFinite(delayBeforeMs) || delayBeforeMs < 0) {
    throw new Error(
      `delayBeforeMs must be a finite non-negative number, got ${delayBeforeMs}`
    );
  }
  const entry: RetryAttempt = {
    attempt: attemptNumber,
    errorName: error.name ?? 'Error',
    errorMessage: error.message ?? '',
    delayBeforeMs,
    recordedAt: (options.now ?? (() => Date.now()))(),
  };
  strategy.attempts.push(entry);
  strategy.totalDelay += delayBeforeMs;
  return entry;
}

/* ------------------------------------------------------------------------- */
/* Inspection                                                                  */
/* ------------------------------------------------------------------------- */

/** Return a defensive copy of the attempt log. */
export function getAttempts(strategy: RetryStrategy): RetryAttempt[] {
  return strategy.attempts.map((a) => ({ ...a }));
}

/** Clear the attempt log and reset totalDelay. */
export function resetStrategy(strategy: RetryStrategy): void {
  strategy.attempts = [];
  strategy.totalDelay = 0;
}

/** Total delay accumulated so far across all attempts. */
export function totalDelaySoFar(strategy: RetryStrategy): number {
  return strategy.totalDelay;
}

/** True if the strategy has recorded the maximum allowed attempts. */
export function isExhausted(strategy: RetryStrategy): boolean {
  return strategy.attempts.length >= strategy.config.maxRetries;
}

/** Return the latest recorded attempt or undefined. */
export function lastAttempt(strategy: RetryStrategy): RetryAttempt | undefined {
  const a = strategy.attempts[strategy.attempts.length - 1];
  return a ? { ...a } : undefined;
}

/* ------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* ------------------------------------------------------------------------- */

function clamp(value: number, lo: number, hi: number): number {
  // Both call sites pass non-negative raw delays, so we only need to cap at hi.
  // Returning Math.min keeps a single branch (the `value > hi` ceiling) and
  // removes the unreachable `value < lo` defensive branch.
  if (value > hi) return hi;
  return value;
}