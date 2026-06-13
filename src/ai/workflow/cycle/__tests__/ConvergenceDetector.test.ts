/**
 * V2098 ConvergenceDetector tests — 30+ tests covering creation, validation,
 * metric recording, sliding window semantics, convergence detection for each
 * metric type, statistic helpers, trend classification, reset, and snapshot.
 */

import { describe, it, expect } from 'vitest';
import {
  createConvergenceDetector,
  recordMetric,
  hasConverged,
  computeMean,
  computeVariance,
  computeRange,
  computeMin,
  computeMax,
  computeStdDev,
  computeTrend,
  resetDetector,
  getWindowSamples,
  snapshotDetector,
} from '../ConvergenceDetector';
import type { ConvergenceMetric } from '../ConvergenceDetector';

function makeDetector(
  overrides: Partial<Parameters<typeof createConvergenceDetector>[0]> = {}
) {
  return createConvergenceDetector({ windowSize: 5, threshold: 0.1, ...overrides });
}

describe('ConvergenceDetector - createConvergenceDetector', () => {
  it('creates a detector with sensible defaults', () => {
    const d = makeDetector();
    expect(d.config.metric).toBe('range');
    expect(d.config.trendEpsilon).toBeCloseTo(0.01, 9);
    expect(d.samples).toEqual([]);
    expect(d.totalRecorded).toBe(0);
    expect(d.totalResets).toBe(0);
  });

  it('honours explicit metric', () => {
    const d = createConvergenceDetector({ windowSize: 4, threshold: 0.5, metric: 'variance' });
    expect(d.config.metric).toBe('variance');
  });

  it('honours explicit trendEpsilon', () => {
    const d = createConvergenceDetector({ windowSize: 3, threshold: 0.1, trendEpsilon: 0.05 });
    expect(d.config.trendEpsilon).toBe(0.05);
  });

  it('uses 1e-9 trendEpsilon fallback when threshold is 0', () => {
    const d = createConvergenceDetector({ windowSize: 3, threshold: 0 });
    expect(d.config.trendEpsilon).toBeCloseTo(1e-9, 12);
  });

  it('rejects non-integer windowSize', () => {
    expect(() => createConvergenceDetector({ windowSize: 2.5, threshold: 0.1 })).toThrow();
  });

  it('rejects non-positive windowSize', () => {
    expect(() => createConvergenceDetector({ windowSize: 0, threshold: 0.1 })).toThrow();
    expect(() => createConvergenceDetector({ windowSize: -1, threshold: 0.1 })).toThrow();
  });

  it('rejects negative threshold', () => {
    expect(() => createConvergenceDetector({ windowSize: 3, threshold: -0.1 })).toThrow();
  });

  it('rejects non-finite windowSize / threshold', () => {
    expect(() => createConvergenceDetector({ windowSize: NaN, threshold: 0.1 })).toThrow();
    expect(() => createConvergenceDetector({ windowSize: 3, threshold: NaN })).toThrow();
    expect(() => createConvergenceDetector({ windowSize: Infinity, threshold: 0.1 })).toThrow();
  });

  it('rejects unknown metric', () => {
    expect(() =>
      createConvergenceDetector({ windowSize: 3, threshold: 0.1, metric: 'nope' as unknown as ConvergenceMetric })
    ).toThrow();
  });

  it('rejects negative trendEpsilon', () => {
    expect(() =>
      createConvergenceDetector({ windowSize: 3, threshold: 0.1, trendEpsilon: -0.01 })
    ).toThrow();
  });

  it('records createdAt / lastRecordedAt via now()', () => {
    const d = createConvergenceDetector({ windowSize: 3, threshold: 0.1 }, () => 1000);
    expect(d.createdAt).toBe(1000);
    expect(d.lastRecordedAt).toBe(1000);
  });
});

describe('ConvergenceDetector - recordMetric', () => {
  it('appends samples to the window', () => {
    const d = makeDetector();
    recordMetric(d, 1);
    recordMetric(d, 2);
    expect(d.samples).toEqual([1, 2]);
    expect(d.totalRecorded).toBe(2);
  });

  it('updates lastRecordedAt via now()', () => {
    let t = 100;
    const d = makeDetector();
    recordMetric(d, 1, () => t);
    expect(d.lastRecordedAt).toBe(100);
    t = 200;
    recordMetric(d, 2, () => t);
    expect(d.lastRecordedAt).toBe(200);
  });

  it('returns the recorded value', () => {
    const d = makeDetector();
    expect(recordMetric(d, 3.14)).toBe(3.14);
  });

  it('drops oldest samples once windowSize is exceeded', () => {
    const d = makeDetector({ windowSize: 3 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    recordMetric(d, 3);
    recordMetric(d, 4);
    expect(d.samples).toEqual([2, 3, 4]);
  });

  it('counts totalRecorded even after eviction', () => {
    const d = makeDetector({ windowSize: 2 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    recordMetric(d, 3);
    recordMetric(d, 4);
    expect(d.totalRecorded).toBe(4);
    expect(d.samples.length).toBe(2);
  });

  it('rejects non-finite values', () => {
    const d = makeDetector();
    expect(() => recordMetric(d, NaN)).toThrow();
    expect(() => recordMetric(d, Infinity)).toThrow();
    expect(() => recordMetric(d, -Infinity)).toThrow();
  });
});

describe('ConvergenceDetector - hasConverged (range metric)', () => {
  it('returns false on an empty detector', () => {
    expect(hasConverged(makeDetector())).toBe(false);
  });

  it('returns true when range < threshold', () => {
    const d = makeDetector({ windowSize: 4, threshold: 0.5 });
    recordMetric(d, 1);
    recordMetric(d, 1.1);
    recordMetric(d, 1.2);
    expect(hasConverged(d)).toBe(true);
  });

  it('returns false when range >= threshold', () => {
    const d = makeDetector({ windowSize: 4, threshold: 0.1 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    recordMetric(d, 3);
    expect(hasConverged(d)).toBe(false);
  });

  it('treats an exact range == threshold as not converged (strict <)', () => {
    const d = makeDetector({ windowSize: 3, threshold: 1 });
    recordMetric(d, 0);
    recordMetric(d, 1);
    expect(hasConverged(d)).toBe(false);
  });

  it('reports converged for identical samples with any positive threshold', () => {
    const d = makeDetector({ windowSize: 3, threshold: 0.01 });
    recordMetric(d, 5);
    recordMetric(d, 5);
    recordMetric(d, 5);
    expect(hasConverged(d)).toBe(true);
  });

  it('treats threshold 0 with identical samples as not converged (strict <)', () => {
    const d = makeDetector({ windowSize: 3, threshold: 0 });
    recordMetric(d, 5);
    recordMetric(d, 5);
    recordMetric(d, 5);
    expect(hasConverged(d)).toBe(false);
  });

  it('partial window still converges when spread is below threshold', () => {
    const d = makeDetector({ windowSize: 10, threshold: 0.5 });
    recordMetric(d, 1);
    recordMetric(d, 1.1);
    expect(hasConverged(d)).toBe(true);
  });
});

describe('ConvergenceDetector - hasConverged (variance / stddev metric)', () => {
  it('uses variance when configured', () => {
    const d = createConvergenceDetector({ windowSize: 4, threshold: 0.05, metric: 'variance' });
    recordMetric(d, 1);
    recordMetric(d, 1.1);
    recordMetric(d, 1.2);
    recordMetric(d, 1.3);
    expect(hasConverged(d)).toBe(true);
  });

  it('uses stddev when configured', () => {
    const d = createConvergenceDetector({ windowSize: 4, threshold: 0.2, metric: 'stddev' });
    recordMetric(d, 1);
    recordMetric(d, 1.1);
    recordMetric(d, 1.2);
    recordMetric(d, 1.3);
    expect(hasConverged(d)).toBe(true);
  });

  it('variance detector rejects spread samples', () => {
    const d = createConvergenceDetector({ windowSize: 4, threshold: 0.01, metric: 'variance' });
    recordMetric(d, 1);
    recordMetric(d, 5);
    recordMetric(d, 9);
    recordMetric(d, 13);
    expect(hasConverged(d)).toBe(false);
  });
});

describe('ConvergenceDetector - computeMean', () => {
  it('returns 0 for empty input', () => {
    expect(computeMean([])).toBe(0);
  });

  it('returns the value for a single sample', () => {
    expect(computeMean([5])).toBe(5);
  });

  it('returns the arithmetic mean', () => {
    expect(computeMean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('handles negative samples', () => {
    expect(computeMean([-2, 0, 2])).toBe(0);
  });
});

describe('ConvergenceDetector - computeVariance', () => {
  it('returns 0 for empty input', () => {
    expect(computeVariance([])).toBe(0);
  });

  it('returns 0 for single-sample input', () => {
    expect(computeVariance([5])).toBe(0);
  });

  it('returns 0 for identical samples', () => {
    expect(computeVariance([3, 3, 3, 3])).toBe(0);
  });

  it('computes population variance for [1,2,3,4,5]', () => {
    expect(computeVariance([1, 2, 3, 4, 5])).toBeCloseTo(2, 9);
  });

  it('computes variance symmetric around mean', () => {
    const v = computeVariance([-2, -1, 1, 2]);
    expect(v).toBeCloseTo(2.5, 9);
  });
});

describe('ConvergenceDetector - computeRange / computeMin / computeMax / computeStdDev', () => {
  it('computeRange returns 0 for empty', () => {
    expect(computeRange([])).toBe(0);
  });

  it('computeRange returns 0 for identical samples', () => {
    expect(computeRange([4, 4, 4])).toBe(0);
  });

  it('computeRange returns max - min', () => {
    expect(computeRange([1, 4, 2, 9, -3])).toBe(12);
  });

  it('computeMin returns Infinity for empty', () => {
    expect(computeMin([])).toBe(Infinity);
  });

  it('computeMin returns the smallest sample', () => {
    expect(computeMin([3, 1, 4, 1, 5, 9, 2, 6])).toBe(1);
  });

  it('computeMax returns -Infinity for empty', () => {
    expect(computeMax([])).toBe(-Infinity);
  });

  it('computeMax returns the largest sample', () => {
    expect(computeMax([3, 1, 4, 1, 5, 9, 2, 6])).toBe(9);
  });

  it('computeStdDev matches sqrt(variance)', () => {
    const samples = [1, 2, 3, 4, 5];
    expect(computeStdDev(samples)).toBeCloseTo(Math.sqrt(computeVariance(samples)), 9);
  });

  it('computeStdDev is 0 for empty / single-sample input', () => {
    expect(computeStdDev([])).toBe(0);
    expect(computeStdDev([7])).toBe(0);
  });
});

describe('ConvergenceDetector - computeTrend', () => {
  it('returns stable for empty input', () => {
    expect(computeTrend([])).toBe('stable');
  });

  it('returns stable for single sample', () => {
    expect(computeTrend([5])).toBe('stable');
  });

  it('returns stable for identical samples', () => {
    expect(computeTrend([3, 3, 3, 3])).toBe('stable');
  });

  it('returns increasing for an ascending series', () => {
    expect(computeTrend([1, 2, 3, 4, 5])).toBe('increasing');
  });

  it('returns decreasing for a descending series', () => {
    expect(computeTrend([5, 4, 3, 2, 1])).toBe('decreasing');
  });

  it('returns stable for a near-flat series within epsilon', () => {
    expect(computeTrend([1.0, 1.001, 0.999, 1.0005], 0.01)).toBe('stable');
  });

  it('rejects non-finite or negative epsilon', () => {
    expect(() => computeTrend([1, 2], -0.01)).toThrow();
    expect(() => computeTrend([1, 2], NaN)).toThrow();
  });
});

describe('ConvergenceDetector - resetDetector', () => {
  it('clears the sample buffer', () => {
    const d = makeDetector();
    recordMetric(d, 1);
    recordMetric(d, 2);
    resetDetector(d);
    expect(d.samples).toEqual([]);
    expect(d.totalRecorded).toBe(2);
  });

  it('increments totalResets', () => {
    const d = makeDetector();
    resetDetector(d);
    resetDetector(d);
    expect(d.totalResets).toBe(2);
  });

  it('updates lastRecordedAt via now()', () => {
    let t = 50;
    const d = makeDetector();
    resetDetector(d, () => t);
    expect(d.lastRecordedAt).toBe(50);
  });
});

describe('ConvergenceDetector - getWindowSamples', () => {
  it('returns the last n samples', () => {
    const d = makeDetector({ windowSize: 10 });
    for (let i = 0; i < 6; i++) recordMetric(d, i);
    expect(getWindowSamples(d, 3)).toEqual([3, 4, 5]);
  });

  it('defaults to windowSize', () => {
    const d = makeDetector({ windowSize: 3 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    recordMetric(d, 3);
    recordMetric(d, 4);
    expect(getWindowSamples(d)).toEqual([2, 3, 4]);
  });

  it('clamps n to available samples', () => {
    const d = makeDetector({ windowSize: 10 });
    recordMetric(d, 7);
    expect(getWindowSamples(d, 5)).toEqual([7]);
  });

  it('returns [] when n <= 0', () => {
    const d = makeDetector();
    recordMetric(d, 1);
    expect(getWindowSamples(d, 0)).toEqual([]);
    expect(getWindowSamples(d, -3)).toEqual([]);
  });

  it('returns empty when detector has no samples', () => {
    expect(getWindowSamples(makeDetector())).toEqual([]);
  });
});

describe('ConvergenceDetector - snapshotDetector', () => {
  it('returns an immutable summary', () => {
    const d = makeDetector({ windowSize: 4, threshold: 0.5 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    const s = snapshotDetector(d);
    expect(s.windowSize).toBe(4);
    expect(s.threshold).toBe(0.5);
    expect(s.metric).toBe('range');
    expect(s.sampleCount).toBe(2);
    expect(s.mean).toBe(1.5);
    expect(s.range).toBe(1);
    expect(s.variance).toBeCloseTo(0.25, 9);
    expect(s.totalRecorded).toBe(2);
    expect(s.converged).toBe(false);
  });

  it('snapshot is independent from later mutation', () => {
    const d = makeDetector({ windowSize: 4, threshold: 0.5 });
    recordMetric(d, 1);
    const s = snapshotDetector(d);
    recordMetric(d, 100);
    expect(s.mean).toBe(1);
    expect(s.range).toBe(0);
  });

  it('reports converged true in snapshot when range below threshold', () => {
    const d = makeDetector({ windowSize: 4, threshold: 1 });
    recordMetric(d, 0.1);
    recordMetric(d, 0.2);
    expect(snapshotDetector(d).converged).toBe(true);
  });

  it('reports trend in snapshot', () => {
    const d = makeDetector({ windowSize: 5, threshold: 0.1 });
    recordMetric(d, 1);
    recordMetric(d, 2);
    recordMetric(d, 3);
    expect(snapshotDetector(d).trend).toBe('increasing');
  });
});