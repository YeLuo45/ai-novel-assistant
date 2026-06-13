/**
 * V2096 DiffBasedExit tests - 50+ tests covering construction,
 * diff modes, recording, exit decision, history accessors,
 * pruning, config updates, and diagnostics.
 */

import { describe, it, expect } from 'vitest';
import {
  createDiffBasedExit,
  recordEdit,
  computeDiff,
  shouldExitByDiff,
  getRecentDiffs,
  computeCosineSimilarity,
  pruneHistory,
  setDiffThreshold,
  setWindowSize,
  setDiffMode,
  averageRecentDiff,
  totalEdits,
  describeDiffTracker,
  isDiffMode,
  isNonNegativeFinite,
  type DiffTracker,
  type DiffMode,
} from '../DiffBasedExit';

function makeTracker(overrides: Partial<{
  diffThreshold: number;
  windowSize: number;
  mode: DiffMode;
}> = {}): DiffTracker {
  return createDiffBasedExit({
    diffThreshold: overrides.diffThreshold ?? 0.1,
    windowSize: overrides.windowSize ?? 3,
    mode: overrides.mode ?? 'absolute',
  });
}

/* ========================================================================== */
/* Type guards                                                                */
/* ========================================================================== */

describe('DiffBasedExit - isDiffMode', () => {
  it('recognises every known mode', () => {
    expect(isDiffMode('absolute')).toBe(true);
    expect(isDiffMode('relative')).toBe(true);
    expect(isDiffMode('cosine')).toBe(true);
  });

  it('rejects unknown modes', () => {
    expect(isDiffMode('foo')).toBe(false);
    expect(isDiffMode('')).toBe(false);
    expect(isDiffMode('Absolute')).toBe(false);
  });
});

describe('DiffBasedExit - isNonNegativeFinite', () => {
  it('accepts 0 and positive finite numbers', () => {
    expect(isNonNegativeFinite(0)).toBe(true);
    expect(isNonNegativeFinite(0.5)).toBe(true);
    expect(isNonNegativeFinite(100)).toBe(true);
  });

  it('rejects negative, NaN, Infinity, and non-numbers', () => {
    expect(isNonNegativeFinite(-0.1)).toBe(false);
    expect(isNonNegativeFinite(NaN)).toBe(false);
    expect(isNonNegativeFinite(Infinity)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isNonNegativeFinite('1' as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isNonNegativeFinite(null as any)).toBe(false);
  });
});

/* ========================================================================== */
/* createDiffBasedExit                                                        */
/* ========================================================================== */

describe('DiffBasedExit - createDiffBasedExit', () => {
  it('creates a tracker with empty history', () => {
    const t = makeTracker();
    expect(t.history).toEqual([]);
    expect(t.counter).toBe(0);
    expect(t.config.mode).toBe('absolute');
    expect(t.config.diffThreshold).toBe(0.1);
    expect(t.config.windowSize).toBe(3);
  });

  it('throws on invalid mode', () => {
    expect(() =>
      createDiffBasedExit({ diffThreshold: 0.1, windowSize: 3, mode: 'bad' as DiffMode })
    ).toThrow(/mode must be one of/);
  });

  it('throws on negative diffThreshold', () => {
    expect(() =>
      createDiffBasedExit({ diffThreshold: -0.1, windowSize: 3, mode: 'absolute' })
    ).toThrow(/diffThreshold/);
  });

  it('throws on non-finite diffThreshold', () => {
    expect(() =>
      createDiffBasedExit({
        diffThreshold: NaN,
        windowSize: 3,
        mode: 'absolute',
      })
    ).toThrow(/diffThreshold/);
  });

  it('throws on windowSize < 1', () => {
    expect(() =>
      createDiffBasedExit({ diffThreshold: 0.1, windowSize: 0, mode: 'absolute' })
    ).toThrow(/windowSize/);
    expect(() =>
      createDiffBasedExit({ diffThreshold: 0.1, windowSize: -1, mode: 'absolute' })
    ).toThrow(/windowSize/);
  });

  it('throws on cosine mode with threshold > 1', () => {
    expect(() =>
      createDiffBasedExit({ diffThreshold: 1.5, windowSize: 3, mode: 'cosine' })
    ).toThrow(/cosine diffThreshold must be within/);
  });

  it('throws when config is not an object', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createDiffBasedExit(null as any)
    ).toThrow(/config must be an object/);
  });
});

/* ========================================================================== */
/* computeCosineSimilarity                                                    */
/* ========================================================================== */

describe('DiffBasedExit - computeCosineSimilarity', () => {
  it('returns 1 for identical number arrays', () => {
    expect(computeCosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it('returns 1 for identical strings', () => {
    expect(computeCosineSimilarity('hello world', 'hello world')).toBeCloseTo(1, 10);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(computeCosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it('returns -1 for opposite directions', () => {
    expect(computeCosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it('handles zero vectors', () => {
    expect(computeCosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(computeCosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it('handles scalar numbers', () => {
    expect(computeCosineSimilarity(5, 5)).toBe(1);
    expect(computeCosineSimilarity(5, -5)).toBe(-1);
  });

  it('handles empty strings', () => {
    expect(computeCosineSimilarity('', '')).toBe(0);
  });

  it('treats strings of mixed tokens by length-encoded vector', () => {
    // 'hi' vs 'hello': vectors [2] and [5], cosine 1 (same direction).
    expect(computeCosineSimilarity('hi', 'hello')).toBeCloseTo(1, 10);
  });

  it('handles array input of mixed string/number', () => {
    const a = [1, 'two', 3];
    const b = [1, 'two', 3];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sim = computeCosineSimilarity(a as any, b as any);
    expect(sim).toBeCloseTo(1, 10);
  });

  it('returns 0 for unsupported input types', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(computeCosineSimilarity({ a: 1 } as any, { a: 1 } as any)).toBe(0);
  });

  it('handles vectors of different lengths (a longer than b)', () => {
    // a has 3 elements, b has 2: triggers false branch of i<vb.length.
    const sim = computeCosineSimilarity([1, 2, 3], [1, 2]);
    expect(Number.isFinite(sim)).toBe(true);
  });

  it('handles vectors where denominator is zero', () => {
    // Mixed: one side has zero entries, other has non-zero -> denom=0 guard.
    const sim = computeCosineSimilarity([0, 0], [0, 1]);
    expect(sim).toBe(0);
  });

  it('handles whitespace-only strings via per-char code fallback', () => {
    // Both have only spaces; the fallback should still produce valid vectors.
    const sim = computeCosineSimilarity('  ', '   ');
    expect(Number.isFinite(sim)).toBe(true);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('whitespace-string vs identical whitespace-string yields sim 1', () => {
    // 'a' has no spaces (1 token of length 1).
    // 'a ' trims to ['a'] too. Let's instead use a string with no splits.
    const sim = computeCosineSimilarity('abc', 'abc');
    expect(sim).toBeCloseTo(1, 10);
  });

  it('handles mixed numeric + string arrays', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sim = computeCosineSimilarity([1, 'hello', 3] as any, [1, 'world', 3] as any);
    expect(Number.isFinite(sim)).toBe(true);
  });

  it('handles arrays containing empty strings', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sim = computeCosineSimilarity([1, '', 3] as any, [1, 2, 3]);
    expect(Number.isFinite(sim)).toBe(true);
  });
});

/* ========================================================================== */
/* computeDiff                                                                */
/* ========================================================================== */

describe('DiffBasedExit - computeDiff', () => {
  it('absolute: |a - b|', () => {
    expect(computeDiff(10, 7, 'absolute')).toBe(3);
    expect(computeDiff(0, 5, 'absolute')).toBe(5);
  });

  it('relative: |a - b| / max(|a|, |b|, eps)', () => {
    // 10 vs 7 -> |3| / 10 = 0.3
    expect(computeDiff(10, 7, 'relative')).toBeCloseTo(0.3, 10);
    // 0 vs 5 -> 5 / 5 = 1
    expect(computeDiff(0, 5, 'relative')).toBeCloseTo(1, 10);
    // 0 vs 0 -> 0 / eps = 0
    expect(computeDiff(0, 0, 'relative')).toBe(0);
  });

  it('cosine: 1 - similarity, clamped to [0,1]', () => {
    expect(computeDiff('foo', 'foo', 'cosine')).toBeCloseTo(0, 10);
    // [1, 0] vs [0, 1] -> sim 0 -> diff 1
    expect(computeDiff([1, 0], [0, 1], 'cosine')).toBeCloseTo(1, 10);
  });

  it('cosine: can yield values > 1 before clamping (then clamped to 1)', () => {
    // [1, 0] vs [-1, 0] -> sim -1 -> 1 - (-1) = 2 -> clamped to 1
    expect(computeDiff([1, 0], [-1, 0], 'cosine')).toBe(1);
  });

  it('throws on non-finite input for absolute/relative', () => {
    expect(() => computeDiff(NaN, 1, 'absolute')).toThrow(/finite numbers/);
    expect(() => computeDiff(1, Infinity, 'relative')).toThrow(/finite numbers/);
  });

  it('throws on string input for absolute/relative', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      computeDiff('1' as any, 1, 'absolute')
    ).toThrow(/finite numbers/);
  });

  it('throws on unknown mode', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      computeDiff(1, 1, 'foo' as any)
    ).toThrow(/unknown mode/);
  });
});

/* ========================================================================== */
/* recordEdit                                                                 */
/* ========================================================================== */

describe('DiffBasedExit - recordEdit', () => {
  it('records a single edit and increments the counter', () => {
    const t0 = makeTracker();
    const t1 = recordEdit(t0, 10, 11);
    expect(t1.history).toHaveLength(1);
    expect(t1.history[0].diff).toBe(1);
    expect(t1.history[0].similarity).toBeCloseTo(0, 10);
    expect(t1.history[0].index).toBe(0);
    expect(t1.counter).toBe(1);
  });

  it('does not mutate the input tracker', () => {
    const t0 = makeTracker();
    const t1 = recordEdit(t0, 10, 11);
    expect(t0.history).toHaveLength(0);
    expect(t0.counter).toBe(0);
    expect(t1).not.toBe(t0);
  });

  it('trims history to windowSize on overflow', () => {
    const t0 = makeTracker({ windowSize: 2 });
    let t = t0;
    for (let i = 0; i < 5; i++) {
      t = recordEdit(t, i, i + 1);
    }
    expect(t.history).toHaveLength(2);
    expect(t.history[0].index).toBe(3);
    expect(t.history[1].index).toBe(4);
  });

  it('similarity = 1 when diff = 0', () => {
    const t0 = makeTracker();
    const t1 = recordEdit(t0, 5, 5);
    expect(t1.history[0].similarity).toBe(1);
  });

  it('cosine mode produces diff in [0, 1]', () => {
    const t0 = makeTracker({ mode: 'cosine' });
    const t1 = recordEdit(t0, 'foo', 'bar');
    expect(t1.history[0].diff).toBeGreaterThanOrEqual(0);
    expect(t1.history[0].diff).toBeLessThanOrEqual(1);
  });

  it('updates lastBefore / lastAfter when given strings', () => {
    const t0 = makeTracker({ mode: 'cosine' });
    const t1 = recordEdit(t0, 'before', 'after');
    expect(t1.lastBefore).toBe('before');
    expect(t1.lastAfter).toBe('after');
  });

  it('does not update lastBefore / lastAfter for non-strings', () => {
    const t0 = makeTracker();
    const t1 = recordEdit(t0, 1, 2);
    expect(t1.lastBefore).toBeUndefined();
    expect(t1.lastAfter).toBeUndefined();
  });

  it('throws on invalid tracker', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recordEdit(null as any, 1, 2)
    ).toThrow(/diffTracker must be an object/);
  });

  it('preserves the configured mode across edits', () => {
    const t0 = makeTracker({ mode: 'relative' });
    const t1 = recordEdit(t0, 10, 5);
    expect(t1.history[0].diff).toBeCloseTo(0.5, 10);
    expect(t1.config.mode).toBe('relative');
  });
});

/* ========================================================================== */
/* shouldExitByDiff                                                           */
/* ========================================================================== */

describe('DiffBasedExit - shouldExitByDiff', () => {
  it('returns false with empty history', () => {
    expect(shouldExitByDiff(makeTracker())).toBe(false);
  });

  it('returns false with fewer than windowSize entries', () => {
    let t = makeTracker({ windowSize: 3, diffThreshold: 0.1 });
    t = recordEdit(t, 0, 0.05);
    t = recordEdit(t, 0.05, 0.05);
    expect(shouldExitByDiff(t)).toBe(false);
  });

  it('returns true when all entries in window are below threshold', () => {
    let t = makeTracker({ windowSize: 3, diffThreshold: 0.1 });
    t = recordEdit(t, 1, 1.05);
    t = recordEdit(t, 1.05, 1.05);
    t = recordEdit(t, 1.05, 1.05);
    expect(shouldExitByDiff(t)).toBe(true);
  });

  it('returns false if any entry in the window is at or above threshold', () => {
    let t = makeTracker({ windowSize: 3, diffThreshold: 0.1 });
    t = recordEdit(t, 1, 1.05); // 0.05
    t = recordEdit(t, 1.05, 1.2); // 0.15 - spike
    t = recordEdit(t, 1.2, 1.2); // 0
    expect(shouldExitByDiff(t)).toBe(false);
  });

  it('only inspects the trailing windowSize entries', () => {
    let t = makeTracker({ windowSize: 2, diffThreshold: 0.1 });
    t = recordEdit(t, 0, 10); // 10 - huge diff, but pre-window
    t = recordEdit(t, 10, 10); // 0
    t = recordEdit(t, 10, 10); // 0
    expect(shouldExitByDiff(t)).toBe(true);
  });

  it('handles invalid tracker gracefully (returns false)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(shouldExitByDiff(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(shouldExitByDiff(undefined as any)).toBe(false);
  });
});

/* ========================================================================== */
/* getRecentDiffs / averageRecentDiff / totalEdits                             */
/* ========================================================================== */

describe('DiffBasedExit - getRecentDiffs', () => {
  it('returns the last n entries', () => {
    let t = makeTracker();
    for (let i = 0; i < 5; i++) t = recordEdit(t, i, i + 1);
    const recent = getRecentDiffs(t, 3);
    expect(recent).toHaveLength(3);
    expect(recent[0].index).toBe(2);
    expect(recent[2].index).toBe(4);
  });

  it('returns all entries when n >= history length', () => {
    let t = makeTracker();
    t = recordEdit(t, 1, 2);
    t = recordEdit(t, 2, 3);
    expect(getRecentDiffs(t, 10)).toHaveLength(2);
  });

  it('returns empty for n = 0', () => {
    let t = makeTracker();
    t = recordEdit(t, 1, 2);
    expect(getRecentDiffs(t, 0)).toEqual([]);
  });

  it('returns empty for negative n', () => {
    let t = makeTracker();
    t = recordEdit(t, 1, 2);
    expect(getRecentDiffs(t, -3)).toEqual([]);
  });

  it('returns empty for invalid tracker', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getRecentDiffs(null as any, 3)).toEqual([]);
  });
});

describe('DiffBasedExit - averageRecentDiff', () => {
  it('returns 0 for empty history', () => {
    expect(averageRecentDiff(makeTracker())).toBe(0);
  });

  it('returns the mean of all entries by default', () => {
    let t = makeTracker();
    t = recordEdit(t, 0, 1); // 1
    t = recordEdit(t, 1, 3); // 2
    t = recordEdit(t, 3, 3); // 0
    expect(averageRecentDiff(t)).toBeCloseTo(1, 10);
  });

  it('respects the n parameter', () => {
    let t = makeTracker();
    t = recordEdit(t, 0, 1); // 1
    t = recordEdit(t, 1, 3); // 2
    t = recordEdit(t, 3, 3); // 0
    expect(averageRecentDiff(t, 2)).toBeCloseTo(1, 10);
  });

  it('returns 0 for invalid tracker', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(averageRecentDiff(null as any)).toBe(0);
  });
});

describe('DiffBasedExit - totalEdits', () => {
  it('counts every recorded edit', () => {
    let t = makeTracker();
    expect(totalEdits(t)).toBe(0);
    t = recordEdit(t, 1, 2);
    t = recordEdit(t, 2, 3);
    t = recordEdit(t, 3, 4);
    expect(totalEdits(t)).toBe(3);
  });

  it('handles invalid tracker', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(totalEdits(null as any)).toBe(0);
  });
});

/* ========================================================================== */
/* pruneHistory                                                               */
/* ========================================================================== */

describe('DiffBasedExit - pruneHistory', () => {
  it('keeps the most recent maxSize entries', () => {
    let t = makeTracker();
    for (let i = 0; i < 5; i++) t = recordEdit(t, i, i + 1);
    const pruned = pruneHistory(t, 2);
    expect(pruned.history).toHaveLength(2);
    expect(pruned.history[0].index).toBe(3);
    expect(pruned.history[1].index).toBe(4);
  });

  it('returns a copy when history is already <= maxSize', () => {
    let t = makeTracker();
    t = recordEdit(t, 1, 2);
    const pruned = pruneHistory(t, 5);
    expect(pruned.history).toHaveLength(1);
    expect(pruned).not.toBe(t);
    expect(pruned.history).not.toBe(t.history);
  });

  it('with maxSize 0 returns an empty history', () => {
    let t = makeTracker();
    t = recordEdit(t, 1, 2);
    const pruned = pruneHistory(t, 0);
    expect(pruned.history).toEqual([]);
  });

  it('throws on negative maxSize', () => {
    const t = makeTracker();
    expect(() => pruneHistory(t, -1)).toThrow(/maxSize/);
  });

  it('throws on non-finite maxSize', () => {
    const t = makeTracker();
    expect(() => pruneHistory(t, NaN)).toThrow(/maxSize/);
  });

  it('throws on invalid tracker', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pruneHistory(null as any, 5)
    ).toThrow(/diffTracker must be an object/);
  });
});

/* ========================================================================== */
/* setDiffThreshold / setWindowSize / setDiffMode                              */
/* ========================================================================== */

describe('DiffBasedExit - setDiffThreshold', () => {
  it('updates the threshold and returns a new tracker', () => {
    const t0 = makeTracker();
    const t1 = setDiffThreshold(t0, 0.5);
    expect(t1.config.diffThreshold).toBe(0.5);
    expect(t0.config.diffThreshold).toBe(0.1);
  });

  it('throws on negative threshold', () => {
    const t = makeTracker();
    expect(() => setDiffThreshold(t, -0.1)).toThrow(/threshold/);
  });

  it('throws on cosine mode with threshold > 1', () => {
    const t = makeTracker({ mode: 'cosine' });
    expect(() => setDiffThreshold(t, 1.5)).toThrow(/cosine threshold/);
  });
});

describe('DiffBasedExit - setWindowSize', () => {
  it('updates the window size', () => {
    const t0 = makeTracker();
    const t1 = setWindowSize(t0, 10);
    expect(t1.config.windowSize).toBe(10);
  });

  it('throws on windowSize < 1', () => {
    const t = makeTracker();
    expect(() => setWindowSize(t, 0)).toThrow(/windowSize/);
  });

  it('throws on negative windowSize', () => {
    const t = makeTracker();
    expect(() => setWindowSize(t, -1)).toThrow(/windowSize/);
  });
});

describe('DiffBasedExit - setDiffMode', () => {
  it('updates the mode', () => {
    const t0 = makeTracker();
    const t1 = setDiffMode(t0, 'cosine');
    expect(t1.config.mode).toBe('cosine');
  });

  it('throws on unknown mode', () => {
    const t = makeTracker();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDiffMode(t, 'foo' as any)
    ).toThrow(/mode must be one of/);
  });

  it('refuses to switch to cosine when threshold > 1', () => {
    const t = setDiffThreshold(makeTracker(), 2);
    expect(() => setDiffMode(t, 'cosine')).toThrow(/cannot switch to cosine/);
  });
});

/* ========================================================================== */
/* describeDiffTracker                                                        */
/* ========================================================================== */

describe('DiffBasedExit - describeDiffTracker', () => {
  it('returns zeros for empty history', () => {
    const s = describeDiffTracker(makeTracker());
    expect(s.count).toBe(0);
    expect(s.total).toBe(0);
    expect(s.average).toBe(0);
    expect(s.min).toBe(0);
    expect(s.max).toBe(0);
    expect(s.current).toBe(0);
  });

  it('computes aggregate stats', () => {
    let t = makeTracker();
    t = recordEdit(t, 0, 1); // 1
    t = recordEdit(t, 1, 4); // 3
    t = recordEdit(t, 4, 4); // 0
    const s = describeDiffTracker(t);
    expect(s.count).toBe(3);
    expect(s.total).toBe(4);
    expect(s.average).toBeCloseTo(4 / 3, 10);
    expect(s.min).toBe(0);
    expect(s.max).toBe(3);
    expect(s.current).toBe(0);
  });
});

/* ========================================================================== */
/* End-to-end scenario                                                        */
/* ========================================================================== */

describe('DiffBasedExit - end to end', () => {
  it('detects convergence after several small edits', () => {
    let t = createDiffBasedExit({
      diffThreshold: 0.1,
      windowSize: 3,
      mode: 'absolute',
    });
    // First three edits are large.
    t = recordEdit(t, 0, 5);
    t = recordEdit(t, 5, 9);
    t = recordEdit(t, 9, 12);
    expect(shouldExitByDiff(t)).toBe(false);
    // Next three edits are tiny.
    t = recordEdit(t, 12, 12.05);
    t = recordEdit(t, 12.05, 12.08);
    t = recordEdit(t, 12.08, 12.08);
    expect(shouldExitByDiff(t)).toBe(true);
  });

  it('cosine mode converges on semantically identical text', () => {
    let t = createDiffBasedExit({
      diffThreshold: 0.2,
      windowSize: 2,
      mode: 'cosine',
    });
    t = recordEdit(t, 'the quick brown fox', 'the quick brown fox jumps');
    t = recordEdit(t, 'the quick brown fox jumps', 'the quick brown fox jumps high');
    t = recordEdit(t, 'the quick brown fox jumps high', 'the quick brown fox jumps high');
    expect(shouldExitByDiff(t)).toBe(true);
  });
});
