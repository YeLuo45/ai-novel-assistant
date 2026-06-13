/**
 * V2095 QualityGate tests - 50+ tests covering construction,
 * normalisation, weighted scoring, threshold checks, evaluation,
 * immutable updates, and inspection helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_DIMENSIONS,
  createQualityGate,
  evaluateQualityGate,
  updateQualityGate,
  setThreshold,
  setMinScore,
  setWeights,
  normalizeMetrics,
  computeWeightedScore,
  allDimensionsAbove,
  allDimensionsMeetThresholds,
  isQualityDimension,
  clampUnit,
  describeQualityGate,
  failingDimensions,
  type QualityGate,
  type QualityScores,
  type RawMetrics,
} from '../QualityGate';

const ZERO_THRESHOLDS = {
  prose: 0,
  structure: 0,
  pacing: 0,
  theme: 0,
  character: 0,
  novelty: 0,
};

const UNIT_WEIGHTS = [1, 1, 1, 1, 1, 1];

function makeGate(overrides: Partial<{
  thresholds: typeof ZERO_THRESHOLDS;
  weights: number[];
  minScore: number;
}> = {}): QualityGate {
  return createQualityGate({
    thresholds: overrides.thresholds ?? { ...ZERO_THRESHOLDS },
    weights: overrides.weights ?? [...UNIT_WEIGHTS],
    minScore: overrides.minScore ?? 0.5,
  });
}

const PERFECT: QualityScores = {
  prose: 1,
  structure: 1,
  pacing: 1,
  theme: 1,
  character: 1,
  novelty: 1,
};

const ZERO: QualityScores = {
  prose: 0,
  structure: 0,
  pacing: 0,
  theme: 0,
  character: 0,
  novelty: 0,
};

/* ========================================================================== */
/* Dimensions + isQualityDimension                                             */
/* ========================================================================== */

describe('QualityGate - dimensions', () => {
  it('exposes six known dimensions', () => {
    expect(ALL_DIMENSIONS).toEqual([
      'prose',
      'structure',
      'pacing',
      'theme',
      'character',
      'novelty',
    ]);
  });

  it('isQualityDimension recognises every known dimension', () => {
    for (const d of ALL_DIMENSIONS) {
      expect(isQualityDimension(d)).toBe(true);
    }
  });

  it('isQualityDimension rejects unknown names', () => {
    expect(isQualityDimension('foo')).toBe(false);
    expect(isQualityDimension('')).toBe(false);
    expect(isQualityDimension('Prose')).toBe(false);
  });

  it('clampUnit clamps below zero and above one', () => {
    expect(clampUnit(-0.5)).toBe(0);
    expect(clampUnit(0)).toBe(0);
    expect(clampUnit(0.5)).toBe(0.5);
    expect(clampUnit(1)).toBe(1);
    expect(clampUnit(1.5)).toBe(1);
  });

  it('clampUnit coerces NaN to zero', () => {
    expect(clampUnit(NaN)).toBe(0);
  });
});

/* ========================================================================== */
/* createQualityGate                                                           */
/* ========================================================================== */

describe('QualityGate - createQualityGate', () => {
  it('creates a gate from a valid config', () => {
    const g = makeGate();
    expect(g.minScore).toBe(0.5);
    expect(g.weights).toEqual([1, 1, 1, 1, 1, 1]);
    expect(g.dimensions).toEqual(ALL_DIMENSIONS);
  });

  it('clones thresholds and weights (no shared reference)', () => {
    const thr = { ...ZERO_THRESHOLDS };
    const w = [1, 1, 1, 1, 1, 1];
    const g = createQualityGate({ thresholds: thr, weights: w, minScore: 0.5 });
    thr.prose = 0.99;
    w[0] = 99;
    expect(g.thresholds.prose).toBe(0);
    expect(g.weights[0]).toBe(1);
  });

  it('throws when weights length is wrong', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [1, 1, 1],
        minScore: 0.5,
      })
    ).toThrow(/weights must be an array of length 6/);
  });

  it('throws when weights are non-finite or negative', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [NaN, 1, 1, 1, 1, 1],
        minScore: 0.5,
      })
    ).toThrow(/weights\[0\]/);
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [-1, 1, 1, 1, 1, 1],
        minScore: 0.5,
      })
    ).toThrow(/weights\[0\]/);
  });

  it('throws when weights sum to zero or negative', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [0, 0, 0, 0, 0, 0],
        minScore: 0.5,
      })
    ).toThrow(/weights must sum/);
  });

  it('throws when minScore is out of [0,1]', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [...UNIT_WEIGHTS],
        minScore: 1.5,
      })
    ).toThrow(/minScore/);
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [...UNIT_WEIGHTS],
        minScore: -0.1,
      })
    ).toThrow(/minScore/);
  });

  it('throws when minScore is non-finite', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS },
        weights: [...UNIT_WEIGHTS],
        minScore: NaN,
      })
    ).toThrow(/minScore/);
  });

  it('throws when any threshold is out of [0,1]', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS, prose: 1.2 },
        weights: [...UNIT_WEIGHTS],
        minScore: 0.5,
      })
    ).toThrow(/thresholds.prose/);
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS, theme: -0.1 },
        weights: [...UNIT_WEIGHTS],
        minScore: 0.5,
      })
    ).toThrow(/thresholds.theme/);
  });

  it('throws when a threshold is non-finite', () => {
    expect(() =>
      createQualityGate({
        thresholds: { ...ZERO_THRESHOLDS, pacing: Infinity },
        weights: [...UNIT_WEIGHTS],
        minScore: 0.5,
      })
    ).toThrow(/thresholds.pacing/);
  });

  it('throws when thresholds is missing or not an object', () => {
    expect(() =>
      createQualityGate({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thresholds: null as any,
        weights: [...UNIT_WEIGHTS],
        minScore: 0.5,
      })
    ).toThrow(/thresholds must be an object/);
  });

  it('throws when config itself is not an object', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createQualityGate(null as any)
    ).toThrow(/config must be an object/);
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createQualityGate(undefined as any)
    ).toThrow(/config must be an object/);
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createQualityGate('bad' as any)
    ).toThrow(/config must be an object/);
  });
});

/* ========================================================================== */
/* normalizeMetrics                                                            */
/* ========================================================================== */

describe('QualityGate - normalizeMetrics', () => {
  it('returns zeros for undefined input', () => {
    expect(normalizeMetrics(undefined)).toEqual(ZERO);
  });

  it('returns zeros for null input', () => {
    expect(normalizeMetrics(null)).toEqual(ZERO);
  });

  it('returns zeros for empty object', () => {
    expect(normalizeMetrics({})).toEqual(ZERO);
  });

  it('copies finite values within range', () => {
    const raw: RawMetrics = {
      prose: 0.1,
      structure: 0.2,
      pacing: 0.3,
      theme: 0.4,
      character: 0.5,
      novelty: 0.6,
    };
    expect(normalizeMetrics(raw)).toEqual({
      prose: 0.1,
      structure: 0.2,
      pacing: 0.3,
      theme: 0.4,
      character: 0.5,
      novelty: 0.6,
    });
  });

  it('clamps values above 1 and below 0', () => {
    const out = normalizeMetrics({
      prose: 1.5,
      structure: -0.3,
      pacing: 2,
      theme: -2,
      character: 0.5,
      novelty: 0.5,
    });
    expect(out.prose).toBe(1);
    expect(out.structure).toBe(0);
    expect(out.pacing).toBe(1);
    expect(out.theme).toBe(0);
  });

  it('coerces NaN / Infinity to zero', () => {
    const out = normalizeMetrics({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prose: NaN as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structure: Infinity as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pacing: -Infinity as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      theme: 'x' as any,
      character: 0.5,
      novelty: 0.5,
    });
    expect(out.prose).toBe(0);
    expect(out.structure).toBe(0);
    expect(out.pacing).toBe(0);
    expect(out.theme).toBe(0);
  });

  it('always returns a full dimension set', () => {
    const out = normalizeMetrics({ prose: 0.5 });
    for (const d of ALL_DIMENSIONS) {
      expect(typeof out[d]).toBe('number');
      expect(Number.isFinite(out[d])).toBe(true);
    }
  });
});

/* ========================================================================== */
/* computeWeightedScore                                                        */
/* ========================================================================== */

describe('QualityGate - computeWeightedScore', () => {
  it('returns 0 for empty weights', () => {
    expect(computeWeightedScore(PERFECT, [])).toBe(0);
  });

  it('returns 0 when every weight is zero', () => {
    expect(computeWeightedScore(PERFECT, [0, 0, 0, 0, 0, 0])).toBe(0);
  });

  it('uniform weights: equals the arithmetic mean', () => {
    const scores: QualityScores = {
      prose: 0.6,
      structure: 0.7,
      pacing: 0.8,
      theme: 0.9,
      character: 0.5,
      novelty: 0.4,
    };
    const expected = (0.6 + 0.7 + 0.8 + 0.9 + 0.5 + 0.4) / 6;
    expect(computeWeightedScore(scores, UNIT_WEIGHTS)).toBeCloseTo(expected, 10);
  });

  it('weighted: prose contributes more than others', () => {
    const weights = [10, 1, 1, 1, 1, 1];
    const scores: QualityScores = {
      prose: 1,
      structure: 0,
      pacing: 0,
      theme: 0,
      character: 0,
      novelty: 0,
    };
    const expected = 10 / 15;
    expect(computeWeightedScore(scores, weights)).toBeCloseTo(expected, 10);
  });

  it('returns 0 for all-zero scores', () => {
    expect(computeWeightedScore(ZERO, UNIT_WEIGHTS)).toBe(0);
  });

  it('returns 1 for all-one scores', () => {
    expect(computeWeightedScore(PERFECT, UNIT_WEIGHTS)).toBe(1);
  });

  it('ignores malformed (non-finite, negative) weights', () => {
    const weights = [1, NaN, 1, 1, 1, 1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = computeWeightedScore(PERFECT, weights as any);
    // Only 5 valid weights remain, perfect score on those.
    expect(result).toBe(1);
  });

  it('ignores non-finite scores', () => {
    const weights = UNIT_WEIGHTS;
    const scores = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prose: NaN as any,
      structure: 1,
      pacing: 1,
      theme: 1,
      character: 1,
      novelty: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = computeWeightedScore(scores as any, weights);
    // 5 valid (weight, score) pairs all equal to 1 -> 5/5.
    expect(result).toBeCloseTo(1, 10);
  });

  it('handles a short weights array (weights length < 6)', () => {
    const scores: QualityScores = {
      prose: 0.5,
      structure: 0.5,
      pacing: 0.5,
      theme: 0.5,
      character: 0.5,
      novelty: 0.5,
    };
    // Only 3 weights supplied; remaining dims get weight 0.
    const result = computeWeightedScore(scores, [1, 1, 1]);
    // 3 weights, all 0.5 scores, average 0.5
    expect(result).toBeCloseTo(0.5, 10);
  });
});

/* ========================================================================== */
/* allDimensionsAbove / allDimensionsMeetThresholds                            */
/* ========================================================================== */

describe('QualityGate - allDimensionsAbove', () => {
  it('returns true when every score >= min', () => {
    const scores: QualityScores = {
      prose: 0.5,
      structure: 0.5,
      pacing: 0.5,
      theme: 0.5,
      character: 0.5,
      novelty: 0.5,
    };
    expect(allDimensionsAbove(scores, 0.5)).toBe(true);
  });

  it('returns false when any score < min', () => {
    const scores: QualityScores = {
      prose: 0.4,
      structure: 0.6,
      pacing: 0.6,
      theme: 0.6,
      character: 0.6,
      novelty: 0.6,
    };
    expect(allDimensionsAbove(scores, 0.5)).toBe(false);
  });

  it('returns true for min=0 regardless of scores', () => {
    expect(allDimensionsAbove(ZERO, 0)).toBe(true);
  });

  it('coerces a non-finite min to zero', () => {
    expect(allDimensionsAbove(ZERO, NaN)).toBe(true);
  });

  it('coerces out-of-range scores before comparing', () => {
    const scores: QualityScores = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prose: 2 as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structure: 2 as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pacing: 2 as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      theme: 2 as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      character: 2 as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      novelty: 2 as any,
    };
    expect(allDimensionsAbove(scores, 0.5)).toBe(true);
  });
});

describe('QualityGate - allDimensionsMeetThresholds', () => {
  it('returns true when every dimension meets its own threshold', () => {
    const scores: QualityScores = {
      prose: 0.8,
      structure: 0.7,
      pacing: 0.9,
      theme: 0.5,
      character: 0.6,
      novelty: 0.4,
    };
    const t = {
      prose: 0.7,
      structure: 0.6,
      pacing: 0.8,
      theme: 0.4,
      character: 0.5,
      novelty: 0.3,
    };
    expect(allDimensionsMeetThresholds(scores, t)).toBe(true);
  });

  it('returns false when a single dimension falls short', () => {
    const scores: QualityScores = {
      prose: 0.8,
      structure: 0.5,
      pacing: 0.9,
      theme: 0.5,
      character: 0.6,
      novelty: 0.4,
    };
    const t = {
      prose: 0.7,
      structure: 0.6,
      pacing: 0.8,
      theme: 0.4,
      character: 0.5,
      novelty: 0.3,
    };
    expect(allDimensionsMeetThresholds(scores, t)).toBe(false);
  });

  it('returns false when a threshold is non-finite', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = { ...ZERO_THRESHOLDS, prose: NaN as any };
    expect(allDimensionsMeetThresholds(ZERO, t)).toBe(false);
  });
});

/* ========================================================================== */
/* evaluateQualityGate                                                         */
/* ========================================================================== */

describe('QualityGate - evaluateQualityGate', () => {
  it('passes perfect metrics against a permissive gate', () => {
    const g = makeGate({ minScore: 0.5 });
    const r = evaluateQualityGate(g, PERFECT);
    expect(r.passed).toBe(true);
    expect(r.weightedScore).toBe(1);
    expect(r.dimensionsPass).toBe(true);
    expect(r.weightedPass).toBe(true);
  });

  it('fails when weighted score is below minScore (but per-dim passes)', () => {
    const g = makeGate({ minScore: 0.9 });
    const raw: RawMetrics = {
      prose: 0.5,
      structure: 0.5,
      pacing: 0.5,
      theme: 0.5,
      character: 0.5,
      novelty: 0.5,
    };
    const r = evaluateQualityGate(g, raw);
    expect(r.passed).toBe(false);
    expect(r.weightedPass).toBe(false);
    // Per-dim thresholds are all 0, so all six 0.5 scores pass.
    expect(r.dimensionsPass).toBe(true);
  });

  it('fails when a per-dim threshold is missed even if weighted passes', () => {
    const thresholds = { ...ZERO_THRESHOLDS, prose: 0.9 };
    const g = createQualityGate({
      thresholds,
      weights: [...UNIT_WEIGHTS],
      minScore: 0.5,
    });
    const raw: RawMetrics = {
      prose: 0.5,
      structure: 1,
      pacing: 1,
      theme: 1,
      character: 1,
      novelty: 1,
    };
    const r = evaluateQualityGate(g, raw);
    expect(r.weightedScore).toBeCloseTo((0.5 + 5) / 6, 10);
    expect(r.weightedPass).toBe(true);
    expect(r.dimensionsPass).toBe(false);
    expect(r.passed).toBe(false);
  });

  it('passes with bounded quality + all dimensions above zero thresholds', () => {
    const g = makeGate({ minScore: 0.3 });
    const raw: RawMetrics = {
      prose: 0.4,
      structure: 0.4,
      pacing: 0.4,
      theme: 0.4,
      character: 0.4,
      novelty: 0.4,
    };
    const r = evaluateQualityGate(g, raw);
    expect(r.passed).toBe(true);
    expect(r.weightedScore).toBeCloseTo(0.4, 10);
  });

  it('uses weighted score, not arithmetic mean, when weights differ', () => {
    const g = createQualityGate({
      thresholds: { ...ZERO_THRESHOLDS },
      weights: [3, 1, 1, 1, 1, 1],
      minScore: 0.6,
    });
    const raw: RawMetrics = {
      prose: 0.9,
      structure: 0.5,
      pacing: 0.5,
      theme: 0.5,
      character: 0.5,
      novelty: 0.5,
    };
    const r = evaluateQualityGate(g, raw);
    const expected = (3 * 0.9 + 5 * 0.5) / 8;
    expect(r.weightedScore).toBeCloseTo(expected, 10);
    expect(r.weightedPass).toBe(true);
  });

  it('normalises out-of-range metrics before scoring', () => {
    const g = makeGate({ minScore: 0.5 });
    const raw: RawMetrics = {
      prose: 2,
      structure: 2,
      pacing: 2,
      theme: 2,
      character: 2,
      novelty: 2,
    };
    const r = evaluateQualityGate(g, raw);
    expect(r.weightedScore).toBe(1);
    expect(r.scores.prose).toBe(1);
    expect(r.passed).toBe(true);
  });

  it('returns zeros for missing metrics and fails a positive minScore', () => {
    const g = makeGate({ minScore: 0.5 });
    const r = evaluateQualityGate(g, {});
    expect(r.weightedScore).toBe(0);
    expect(r.passed).toBe(false);
  });

  it('returns a fully populated scores map even when only one dim is supplied', () => {
    const g = makeGate();
    const r = evaluateQualityGate(g, { prose: 0.5 });
    for (const d of ALL_DIMENSIONS) {
      expect(typeof r.scores[d]).toBe('number');
    }
  });
});

/* ========================================================================== */
/* setThreshold / setMinScore / setWeights                                     */
/* ========================================================================== */

describe('QualityGate - setThreshold', () => {
  it('updates a single dimension threshold and returns a new gate', () => {
    const g0 = makeGate();
    const g1 = setThreshold(g0, 'prose', 0.9);
    expect(g1.thresholds.prose).toBe(0.9);
    expect(g0.thresholds.prose).toBe(0);
  });

  it('preserves other fields', () => {
    const g0 = makeGate({ minScore: 0.7 });
    const g1 = setThreshold(g0, 'theme', 0.3);
    expect(g1.minScore).toBe(0.7);
    expect(g1.weights).toEqual(g0.weights);
  });

  it('throws on out-of-range value', () => {
    const g = makeGate();
    expect(() => setThreshold(g, 'prose', 1.1)).toThrow(/value must be a finite/);
    expect(() => setThreshold(g, 'prose', -0.1)).toThrow(/value must be a finite/);
  });

  it('throws on non-finite value', () => {
    const g = makeGate();
    expect(() => setThreshold(g, 'prose', NaN)).toThrow(/value must be a finite/);
  });

  it('throws on unknown dimension', () => {
    const g = makeGate();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setThreshold(g, 'nope' as any, 0.5)
    ).toThrow(/unknown dimension/);
  });
});

describe('QualityGate - setMinScore', () => {
  it('updates minScore and returns a new gate', () => {
    const g0 = makeGate({ minScore: 0.4 });
    const g1 = setMinScore(g0, 0.9);
    expect(g1.minScore).toBe(0.9);
    expect(g0.minScore).toBe(0.4);
  });

  it('throws on out-of-range value', () => {
    const g = makeGate();
    expect(() => setMinScore(g, 1.1)).toThrow(/value must be a finite/);
    expect(() => setMinScore(g, -0.5)).toThrow(/value must be a finite/);
  });
});

describe('QualityGate - setWeights', () => {
  it('updates weights and returns a new gate', () => {
    const g0 = makeGate();
    const g1 = setWeights(g0, [2, 2, 2, 2, 2, 2]);
    expect(g1.weights).toEqual([2, 2, 2, 2, 2, 2]);
    expect(g0.weights).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('throws on wrong length', () => {
    const g = makeGate();
    expect(() => setWeights(g, [1, 2, 3])).toThrow(/weights must be an array of length 6/);
  });

  it('throws on negative or non-finite weight', () => {
    const g = makeGate();
    expect(() => setWeights(g, [-1, 1, 1, 1, 1, 1])).toThrow(/weights\[0\]/);
    expect(() => setWeights(g, [NaN, 1, 1, 1, 1, 1])).toThrow(/weights\[0\]/);
  });
});

/* ========================================================================== */
/* updateQualityGate                                                           */
/* ========================================================================== */

describe('QualityGate - updateQualityGate', () => {
  it('applies a partial threshold patch', () => {
    const g0 = makeGate();
    const g1 = updateQualityGate(g0, { prose: 0.8, theme: 0.3 });
    expect(g1.thresholds.prose).toBe(0.8);
    expect(g1.thresholds.theme).toBe(0.3);
    expect(g1.thresholds.structure).toBe(g0.thresholds.structure);
  });

  it('returns a new gate without mutating the original', () => {
    const g0 = makeGate();
    const g1 = updateQualityGate(g0, { prose: 0.8 });
    expect(g1).not.toBe(g0);
    expect(g0.thresholds.prose).toBe(0);
  });

  it('with empty patch returns a structurally new gate with same values', () => {
    const g0 = makeGate();
    const g1 = updateQualityGate(g0, {});
    expect(g1.thresholds).toEqual(g0.thresholds);
    expect(g1.weights).toEqual(g0.weights);
    expect(g1.minScore).toBe(g0.minScore);
  });

  it('throws on unknown dimension in patch', () => {
    const g = makeGate();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateQualityGate(g, { unknown: 0.5 } as any)
    ).toThrow(/unknown dimension/);
  });

  it('throws on out-of-range value in patch', () => {
    const g = makeGate();
    expect(() => updateQualityGate(g, { prose: 1.5 })).toThrow(/threshold\.prose/);
  });

  it('throws on non-object patch', () => {
    const g = makeGate();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateQualityGate(g, null as any)
    ).toThrow(/patch must be an object/);
  });
});

/* ========================================================================== */
/* describeQualityGate / failingDimensions                                     */
/* ========================================================================== */

describe('QualityGate - describeQualityGate', () => {
  it('includes min and per-dimension thresholds/weights', () => {
    const g = makeGate({ minScore: 0.5 });
    const s = describeQualityGate(g);
    expect(s).toContain('min=0.50');
    expect(s).toContain('prose');
    expect(s).toContain('novelty');
  });
});

describe('QualityGate - failingDimensions', () => {
  it('returns dimensions that miss their threshold', () => {
    const scores: QualityScores = {
      prose: 0.9,
      structure: 0.2,
      pacing: 0.9,
      theme: 0.1,
      character: 0.5,
      novelty: 0.9,
    };
    const t = { ...ZERO_THRESHOLDS };
    t.structure = 0.5;
    t.theme = 0.5;
    const failing = failingDimensions(scores, t);
    expect(failing).toEqual(['structure', 'theme']);
  });

  it('returns empty list when all dimensions pass', () => {
    expect(failingDimensions(PERFECT, { ...ZERO_THRESHOLDS })).toEqual([]);
  });
});
