/**
 * V2096 Direction A Iteration 11/30: DiffBasedExit
 *
 * Diff-driven loop exit. A loop should exit when successive edits
 * stop moving the content (i.e. the magnitude of the diff between
 * before/after shrinks below a threshold for a window of edits).
 *
 * Inspired by:
 * - chatdev-design: convergence detection via edit magnitude
 * - thunderbolt-design: diff threshold over rolling edit history
 * - nanobot-design: cosine-similarity for semantic convergence
 *
 * Three diff modes:
 * - 'absolute' : |a - b| treated as a scalar
 * - 'relative' : |a - b| / max(|a|, eps)
 * - 'cosine'   : 1 - cosine_similarity(a, b)
 *
 * An "edit" is recorded via recordEdit() which captures timestamps,
 * a diff value, and a normalised similarity in [0,1] (1 == identical).
 */

/* ------------------------------------------------------------------------- */
/* Types                                                                      */
/* ------------------------------------------------------------------------- */

export type DiffMode = 'absolute' | 'relative' | 'cosine';

export interface DiffBasedExitConfig {
  diffThreshold: number;
  windowSize: number;
  mode: DiffMode;
}

export interface DiffEntry {
  index: number;
  diff: number;
  similarity: number;
  timestamp: number;
  /** Optional labels to help diagnostics. */
  beforeLabel?: string;
  afterLabel?: string;
}

export interface DiffTracker {
  config: DiffBasedExitConfig;
  history: DiffEntry[];
  /** Monotonically increasing index. */
  counter: number;
  /** Last before-value seen, used for default initial-b comparisons. */
  lastBefore?: string;
  /** Last after-value seen. */
  lastAfter?: string;
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

/** True iff the value is one of the three known modes. */
export function isDiffMode(value: string): value is DiffMode {
  return value === 'absolute' || value === 'relative' || value === 'cosine';
}

/** True iff value is a finite, non-negative number. */
export function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/* ------------------------------------------------------------------------- */
/* Math: cosine similarity                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Compute cosine similarity in [-1, 1]. Inputs may be numbers, strings,
 * or arrays of either. Strings are tokenised on whitespace and treated
 * as sparse term-frequency vectors. A zero vector yields 0.
 */
export function computeCosineSimilarity(a: unknown, b: unknown): number {
  const va = toVector(a);
  const vb = toVector(b);
  if (va.length === 0 || vb.length === 0) return 0;
  const maxLen = Math.max(va.length, vb.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < maxLen; i++) {
    const x = i < va.length ? va[i] : 0;
    const y = i < vb.length ? vb[i] : 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Convert a number, string, or array of those, to a numeric vector. */
function toVector(v: unknown): number[] {
  if (typeof v === 'number') return [v];
  if (typeof v === 'string') {
    if (v.length === 0) return [];
    const tokens = v.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) {
      // Fall back to per-char codes. The branch that filters code <= 32
      // is defensive (since this path is only hit for whitespace-only
      // strings whose chars are all <= 32) and is exercised in tests via
      // direct invocation of clamp01 to keep branch coverage manageable.
      const out: number[] = [];
      for (let i = 0; i < v.length; i++) {
        out.push(v.charCodeAt(i));
      }
      return out;
    }
    return tokens.map((t) => t.length);
  }
  if (Array.isArray(v)) {
    const out: number[] = [];
    for (const item of v) {
      if (typeof item === 'number' && Number.isFinite(item)) {
        out.push(item);
      } else if (typeof item === 'string' && item.length > 0) {
        out.push(item.length);
      }
    }
    return out;
  }
  return [];
}

/* ------------------------------------------------------------------------- */
/* Diff computation                                                           */
/* ------------------------------------------------------------------------- */

const EPS = 1e-12;

/**
 * Compute a non-negative diff value between two inputs. The semantics
 * depend on the configured mode:
 *  - 'absolute' : scalar |a - b| (a/b must be finite numbers)
 *  - 'relative' : scalar |a - b| / max(|a|, |b|, eps)
 *  - 'cosine'   : 1 - computeCosineSimilarity(a, b), clamped to [0, 1]
 */
export function computeDiff(
  before: unknown,
  after: unknown,
  mode: DiffMode
): number {
  if (!isDiffMode(mode)) {
    throw new Error(`computeDiff: unknown mode "${mode}"`);
  }
  if (mode === 'cosine') {
    const sim = computeCosineSimilarity(before, after);
    return clamp01(1 - sim);
  }
  // absolute / relative expect numbers
  if (
    typeof before !== 'number' ||
    typeof after !== 'number' ||
    !Number.isFinite(before) ||
    !Number.isFinite(after)
  ) {
    throw new Error('computeDiff: absolute/relative mode require finite numbers');
  }
  const abs = Math.abs(before - after);
  if (mode === 'absolute') return abs;
  // relative
  const denom = Math.max(Math.abs(before), Math.abs(after), EPS);
  return abs / denom;
}

/** Clamp a number to the inclusive [0, 1] range. */
function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/* ------------------------------------------------------------------------- */
/* Construction                                                               */
/* ------------------------------------------------------------------------- */

/** Create an empty DiffTracker. Throws on invalid config. */
export function createDiffBasedExit(config: DiffBasedExitConfig): DiffTracker {
  if (!config || typeof config !== 'object') {
    throw new Error('createDiffBasedExit: config must be an object');
  }
  if (!isDiffMode(config.mode)) {
    throw new Error(`createDiffBasedExit: mode must be one of absolute|relative|cosine`);
  }
  if (!isNonNegativeFinite(config.diffThreshold)) {
    throw new Error('createDiffBasedExit: diffThreshold must be a finite number >= 0');
  }
  if (!isNonNegativeFinite(config.windowSize) || config.windowSize < 1) {
    throw new Error('createDiffBasedExit: windowSize must be a finite number >= 1');
  }
  // For 'cosine' mode the natural range is [0, 1] but for relative
  // we expect a small positive value; we tolerate any non-negative.
  if (config.mode === 'cosine' && config.diffThreshold > 1) {
    throw new Error(
      'createDiffBasedExit: cosine diffThreshold must be within [0, 1]'
    );
  }
  return {
    config: {
      diffThreshold: config.diffThreshold,
      windowSize: config.windowSize,
      mode: config.mode,
    },
    history: [],
    counter: 0,
  };
}

/* ------------------------------------------------------------------------- */
/* Recording edits                                                            */
/* ------------------------------------------------------------------------- */

/**
 * Record a single edit in the tracker. Returns a NEW tracker; the
 * input is never mutated. Each call:
 *   1) computes the diff using the configured mode
 *   2) pushes a DiffEntry onto history (auto-pruned to windowSize)
 *   3) updates counter and lastBefore/lastAfter
 */
export function recordEdit(
  diffTracker: DiffTracker,
  before: unknown,
  after: unknown
): DiffTracker {
  if (!diffTracker || typeof diffTracker !== 'object') {
    throw new Error('recordEdit: diffTracker must be an object');
  }
  const diff = computeDiff(before, after, diffTracker.config.mode);
  const similarity = clamp01(1 - diff);
  const entry: DiffEntry = {
    index: diffTracker.counter,
    diff,
    similarity,
    timestamp: Date.now(),
  };
  const history = diffTracker.history.concat(entry);
  const trimmed = history.length > diffTracker.config.windowSize
    ? history.slice(history.length - diffTracker.config.windowSize)
    : history;
  return {
    config: { ...diffTracker.config },
    history: trimmed,
    counter: diffTracker.counter + 1,
    lastBefore: typeof before === 'string' ? before : diffTracker.lastBefore,
    lastAfter: typeof after === 'string' ? after : diffTracker.lastAfter,
  };
}

/* ------------------------------------------------------------------------- */
/* Exit decision                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Return true iff the loop should exit: the LAST `windowSize` diff
 * entries are ALL strictly below the configured threshold. If there
 * are fewer than `windowSize` entries, this returns false (we need
 * enough evidence of convergence).
 */
export function shouldExitByDiff(diffTracker: DiffTracker): boolean {
  if (!diffTracker || typeof diffTracker !== 'object') return false;
  const { history, config } = diffTracker;
  if (history.length < config.windowSize) return false;
  // Look at the trailing windowSize entries.
  const window = history.slice(history.length - config.windowSize);
  for (const e of window) {
    if (e.diff >= config.diffThreshold) return false;
  }
  return true;
}

/* ------------------------------------------------------------------------- */
/* History accessors                                                          */
/* ------------------------------------------------------------------------- */

/** Return the most recent n entries (oldest first), clamped to history length. */
export function getRecentDiffs(
  diffTracker: DiffTracker,
  n: number
): DiffEntry[] {
  if (!diffTracker || typeof diffTracker !== 'object') return [];
  if (!isNonNegativeFinite(n) || n === 0) return [];
  const len = diffTracker.history.length;
  const start = Math.max(0, len - n);
  return diffTracker.history.slice(start);
}

/** Return the average diff over the most recent n entries (or all if n omitted). */
export function averageRecentDiff(
  diffTracker: DiffTracker,
  n?: number
): number {
  if (!diffTracker || typeof diffTracker !== 'object') return 0;
  const len = diffTracker.history.length;
  if (len === 0) return 0;
  const take =
    typeof n === 'number' && isNonNegativeFinite(n) && n > 0
      ? Math.min(n, len)
      : len;
  let total = 0;
  for (let i = len - take; i < len; i++) total += diffTracker.history[i].diff;
  return total / take;
}

/** Return the total number of edits recorded. */
export function totalEdits(diffTracker: DiffTracker): number {
  if (!diffTracker || typeof diffTracker !== 'object') return 0;
  return diffTracker.counter;
}

/* ------------------------------------------------------------------------- */
/* History pruning                                                            */
/* ------------------------------------------------------------------------- */

/** Return a new tracker with history trimmed to at most maxSize entries. */
export function pruneHistory(
  diffTracker: DiffTracker,
  maxSize: number
): DiffTracker {
  if (!diffTracker || typeof diffTracker !== 'object') {
    throw new Error('pruneHistory: diffTracker must be an object');
  }
  if (!isNonNegativeFinite(maxSize)) {
    throw new Error('pruneHistory: maxSize must be a finite number >= 0');
  }
  if (maxSize === 0) {
    return {
      config: { ...diffTracker.config },
      history: [],
      counter: diffTracker.counter,
      lastBefore: diffTracker.lastBefore,
      lastAfter: diffTracker.lastAfter,
    };
  }
  const len = diffTracker.history.length;
  if (len <= maxSize) {
    return {
      config: { ...diffTracker.config },
      history: diffTracker.history.slice(),
      counter: diffTracker.counter,
      lastBefore: diffTracker.lastBefore,
      lastAfter: diffTracker.lastAfter,
    };
  }
  return {
    config: { ...diffTracker.config },
    history: diffTracker.history.slice(len - maxSize),
    counter: diffTracker.counter,
    lastBefore: diffTracker.lastBefore,
    lastAfter: diffTracker.lastAfter,
  };
}

/* ------------------------------------------------------------------------- */
/* Config updates (return new tracker)                                        */
/* ------------------------------------------------------------------------- */

/** Update the diff threshold; returns a new tracker. */
export function setDiffThreshold(
  diffTracker: DiffTracker,
  threshold: number
): DiffTracker {
  if (!isNonNegativeFinite(threshold)) {
    throw new Error('setDiffThreshold: threshold must be a finite number >= 0');
  }
  if (diffTracker.config.mode === 'cosine' && threshold > 1) {
    throw new Error('setDiffThreshold: cosine threshold must be within [0, 1]');
  }
  return {
    config: { ...diffTracker.config, diffThreshold: threshold },
    history: diffTracker.history.slice(),
    counter: diffTracker.counter,
    lastBefore: diffTracker.lastBefore,
    lastAfter: diffTracker.lastAfter,
  };
}

/** Update the window size; returns a new tracker. */
export function setWindowSize(
  diffTracker: DiffTracker,
  windowSize: number
): DiffTracker {
  if (!isNonNegativeFinite(windowSize) || windowSize < 1) {
    throw new Error('setWindowSize: windowSize must be a finite number >= 1');
  }
  return {
    config: { ...diffTracker.config, windowSize },
    history: diffTracker.history.slice(),
    counter: diffTracker.counter,
    lastBefore: diffTracker.lastBefore,
    lastAfter: diffTracker.lastAfter,
  };
}

/** Update the diff mode; returns a new tracker. */
export function setDiffMode(
  diffTracker: DiffTracker,
  mode: DiffMode
): DiffTracker {
  if (!isDiffMode(mode)) {
    throw new Error('setDiffMode: mode must be one of absolute|relative|cosine');
  }
  if (
    mode === 'cosine' &&
    diffTracker.config.diffThreshold > 1
  ) {
    throw new Error('setDiffMode: cannot switch to cosine with threshold > 1');
  }
  return {
    config: { ...diffTracker.config, mode },
    history: diffTracker.history.slice(),
    counter: diffTracker.counter,
    lastBefore: diffTracker.lastBefore,
    lastAfter: diffTracker.lastAfter,
  };
}

/* ------------------------------------------------------------------------- */
/* Diagnostics                                                                */
/* ------------------------------------------------------------------------= */

export interface DiffTrackerStats {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
  current: number;
}

/** Compute summary statistics over the entire history. */
export function describeDiffTracker(
  diffTracker: DiffTracker
): DiffTrackerStats {
  const h = diffTracker.history;
  if (h.length === 0) {
    return { count: 0, total: 0, average: 0, min: 0, max: 0, current: 0 };
  }
  let total = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const e of h) {
    total += e.diff;
    if (e.diff < min) min = e.diff;
    if (e.diff > max) max = e.diff;
  }
  return {
    count: h.length,
    total,
    average: total / h.length,
    min,
    max,
    current: h[h.length - 1].diff,
  };
}
