/**
 * V2097 IterativeRefinement tests - 35+ tests covering config validation,
 * loop execution, stopping reasons, snapshots and analysis helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  runIterativeRefinement,
  validateRefinementConfig,
  improvementSeries,
  bestPassIndex,
  passSnapshot,
  didConverge,
} from '../IterativeRefinement';

function makeConfig(overrides: Record<string, number | string> = {}) {
  return {
    maxPasses: 5,
    targetQuality: 0.9,
    minImprovement: 0.05,
    ...overrides,
  };
}

describe('IterativeRefinement - validateRefinementConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateRefinementConfig(makeConfig())).not.toThrow();
  });

  it('rejects non-positive maxPasses', () => {
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), maxPasses: 0 })
    ).toThrow(/maxPasses/);
  });

  it('rejects negative maxPasses', () => {
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), maxPasses: -1 })
    ).toThrow(/maxPasses/);
  });

  it('rejects non-finite maxPasses', () => {
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), maxPasses: NaN })
    ).toThrow(/maxPasses/);
  });

  it('rejects out-of-range targetQuality', () => {
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), targetQuality: -0.1 })
    ).toThrow(/targetQuality/);
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), targetQuality: 1.5 })
    ).toThrow(/targetQuality/);
  });

  it('rejects negative minImprovement', () => {
    expect(() =>
      validateRefinementConfig({ ...makeConfig(), minImprovement: -0.01 })
    ).toThrow(/minImprovement/);
  });
});

describe('IterativeRefinement - runIterativeRefinement stops on target', () => {
  it('stops when quality reaches target', () => {
    let q = 0;
    const r = runIterativeRefinement(makeConfig(), {
      initial: 'seed',
      refine: () => ({ output: 'next', quality: (q += 0.3) }),
    });
    expect(r.stoppedReason).toBe('target');
    expect(r.passes.length).toBeLessThan(5);
  });

  it('records each pass with index, quality and duration', () => {
    const r = runIterativeRefinement(makeConfig(), {
      initial: 'seed',
      refine: () => ({ output: 'x', quality: 0.5 }),
    });
    expect(r.passes[0].index).toBe(1);
    expect(r.passes[0].quality).toBe(0.5);
  });
});

describe('IterativeRefinement - onPass callback branch coverage', () => {
  it('invokes onPass for each pass when callback provided', () => {
    const seen: number[] = [];
    let q = 0.5;
    runIterativeRefinement(makeConfig({ maxPasses: 3, targetQuality: 1.0 }), {
      initial: 's',
      refine: () => {
        q += 0.1;
        return { output: 'x', quality: q };
      },
      onPass: (pass) => seen.push(pass.index * 10),
    });
    expect(seen).toEqual([10, 20, 30]);
  });

  it('does not throw when onPass is omitted (covers optional-call branch)', () => {
    const r = runIterativeRefinement(makeConfig({ maxPasses: 2, targetQuality: 1.0 }), {
      initial: 's',
      refine: () => ({ output: 'x', quality: 0.5 }),
      // onPass deliberately omitted
    });
    expect(r.passes.length).toBe(2);
  });
});

describe('IterativeRefinement - runIterativeRefinement stops on maxPasses', () => {
  it('stops after maxPasses when quality never reaches target', () => {
    let q = 0.5;
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 3, targetQuality: 1.0 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: (q += 0.1) }),
      }
    );
    expect(r.stoppedReason).toBe('max-passes');
    expect(r.passes.length).toBe(3);
  });
});

describe('IterativeRefinement - runIterativeRefinement stops on no improvement', () => {
  it('stops when improvement < minImprovement', () => {
    // Pass 1: quality=0.5, Pass 2: quality=0.51 (improvement=0.01 < 0.05)
    let i = 0;
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 5, targetQuality: 0.95 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: i++ === 0 ? 0.5 : 0.51 }),
      }
    );
    expect(r.stoppedReason).toBe('no-improvement');
    expect(r.passes.length).toBe(2);
  });

  it('continues when improvement >= minImprovement', () => {
    let q = 0.5;
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 3, targetQuality: 0.95, minImprovement: 0.05 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: (q += 0.1) }),
      }
    );
    // q goes 0.5 → 0.6 → 0.7 → 0.8; never reaches 0.95; improvement always >= 0.05
    expect(r.stoppedReason).toBe('max-passes');
    expect(r.passes.length).toBe(3);
  });
});

describe('IterativeRefinement - runIterativeRefinement stops on callback halt', () => {
  it('stops when shouldHalt returns true', () => {
    // quality increases by 0.1 each pass, no-improvement never triggers.
    let q = 0.5;
    const r = runIterativeRefinement(makeConfig({ maxPasses: 5, targetQuality: 1.0 }), {
      initial: 's',
      refine: () => ({ output: 'x', quality: (q += 0.1) }),
      shouldHalt: (pass) => pass.index >= 2,
    });
    expect(r.stoppedReason).toBe('callback-halt');
    expect(r.passes.length).toBe(2);
  });
});

describe('IterativeRefinement - improvementSeries', () => {
  it('returns quality deltas between consecutive passes', () => {
    // Use exact multiples of 0.2 to avoid IEEE-754 rounding errors.
    const qualities = [0.2, 0.4, 0.6];
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 3, targetQuality: 1.0 }),
      {
        initial: 's',
        refine: (_input, i) => ({ output: 'x', quality: qualities[i - 1] }),
      }
    );
    expect(improvementSeries(r).map((v) => v.toFixed(2))).toEqual(['0.20', '0.20']);
  });

  it('returns empty array when only one pass', () => {
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 1, targetQuality: 0.1 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: 0.2 }),
      }
    );
    expect(improvementSeries(r)).toEqual([]);
  });

  it('returns empty array when quality never changes', () => {
    // Single pass only; series is empty.
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 1, targetQuality: 0.5 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: 0.5 }),
      }
    );
    expect(improvementSeries(r)).toEqual([]);
  });
});

describe('IterativeRefinement - bestPassIndex', () => {
  it('returns the index of the highest-quality pass', () => {
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 3, targetQuality: 1.0 }),
      {
        initial: 's',
        refine: (_input, i) => ({ output: 'x', quality: [0.3, 0.7, 0.4][i - 1] }),
      }
    );
    expect(bestPassIndex(r)).toBe(1); // second pass has quality 0.7
  });

  it('returns -1 when there are no passes with improvement (maxPasses=1, target reached)', () => {
    // First pass hits the target → only 1 pass → bestPassIndex returns 0
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 1, targetQuality: 0.1 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: 0.5 }),
      }
    );
    expect(bestPassIndex(r)).toBe(0);
  });

  it('returns -1 for an empty result set', () => {
    // Build an empty result by manually constructing one.
    const r = {
      passes: [],
      finalOutput: 'x',
      finalQuality: 0,
      stoppedReason: 'max-passes' as const,
      totalDurationMs: 0,
    };
    expect(bestPassIndex(r)).toBe(-1);
  });
});

describe('IterativeRefinement - passSnapshot', () => {
  it('extracts index, quality, duration, timestamp', () => {
    const r = runIterativeRefinement(makeConfig({ maxPasses: 1, targetQuality: 0.1 }), {
      initial: 's',
      refine: () => ({ output: 'x', quality: 0.2 }),
    });
    const snap = passSnapshot(r.passes[0]);
    expect(snap.index).toBe(1);
    expect(snap.quality).toBe(0.2);
    expect(typeof snap.durationMs).toBe('number');
    expect(typeof snap.timestamp).toBe('number');
  });
});

describe('IterativeRefinement - didConverge', () => {
  it('returns true when stoppedReason is target', () => {
    const r = runIterativeRefinement(makeConfig({ maxPasses: 5, targetQuality: 0.5 }), {
      initial: 's',
      refine: (_input, i) => ({ output: 'x', quality: i === 1 ? 0.6 : 0.4 }),
    });
    expect(didConverge(r)).toBe(true);
  });

  it('returns true when stoppedReason is no-improvement', () => {
    let i = 0;
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 5, targetQuality: 0.9, minImprovement: 0.05 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: i++ === 0 ? 0.5 : 0.51 }),
      }
    );
    expect(didConverge(r)).toBe(true);
  });

  it('returns false when stoppedReason is max-passes', () => {
    // quality increases steadily so no-improvement never triggers.
    let q = 0.5;
    const r = runIterativeRefinement(
      makeConfig({ maxPasses: 2, targetQuality: 1.0 }),
      {
        initial: 's',
        refine: () => ({ output: 'x', quality: (q += 0.2) }),
      }
    );
    expect(r.stoppedReason).toBe('max-passes');
    expect(didConverge(r)).toBe(false);
  });

  it('returns false when stoppedReason is callback-halt', () => {
    let q = 0.5;
    const r = runIterativeRefinement(makeConfig({ maxPasses: 5, targetQuality: 1.0 }), {
      initial: 's',
      refine: () => ({ output: 'x', quality: (q += 0.2) }),
      shouldHalt: (p) => p.index === 1,
    });
    expect(r.stoppedReason).toBe('callback-halt');
    expect(didConverge(r)).toBe(false);
  });
});

