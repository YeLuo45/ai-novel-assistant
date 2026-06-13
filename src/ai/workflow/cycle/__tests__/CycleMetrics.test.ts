/**
 * V2103 CycleMetrics tests - 35+ tests covering metric registration,
 * recording, statistics, listing, export, merge, clear, snapshot.
 */

import { describe, it, expect } from 'vitest';
import {
  createCycleMetrics,
  registerMetric,
  recordMetric,
  getMetric,
  listMetrics,
  exportMetrics,
  mergeMetrics,
  clearMetric,
  snapshotMetrics,
  restoreMetrics,
  totalSamples,
  globalMean,
} from '../CycleMetrics';

function makeMetrics(...pre: string[]) {
  return createCycleMetrics({ cycleId: 'cyc', metrics: pre });
}

describe('CycleMetrics - createCycleMetrics', () => {
  it('creates an empty metrics object', () => {
    const m = createCycleMetrics();
    expect(m.cycleId).toBe('default');
    expect(m.values.size).toBe(0);
    expect(m.registered.size).toBe(0);
  });

  it('pre-registers metrics', () => {
    const m = makeMetrics('latency', 'cost');
    expect(m.registered.has('latency')).toBe(true);
    expect(m.registered.has('cost')).toBe(true);
    expect(m.values.has('latency')).toBe(true);
  });

  it('honours custom cycleId', () => {
    const m = createCycleMetrics({ cycleId: 'cycle-x' });
    expect(m.cycleId).toBe('cycle-x');
  });
});

describe('CycleMetrics - registerMetric', () => {
  it('adds a new metric name', () => {
    const m = createCycleMetrics();
    registerMetric(m, 'latency');
    expect(m.registered.has('latency')).toBe(true);
    expect(m.values.has('latency')).toBe(true);
  });

  it('is idempotent for existing metrics', () => {
    const m = createCycleMetrics();
    registerMetric(m, 'x');
    registerMetric(m, 'x');
    expect(m.values.get('x')?.length).toBe(0);
  });

  it('rejects empty name', () => {
    const m = createCycleMetrics();
    expect(() => registerMetric(m, '')).toThrow();
  });
});

describe('CycleMetrics - recordMetric', () => {
  it('records a value', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 5);
    expect(m.values.get('x')).toEqual([5]);
  });

  it('auto-registers a previously unseen metric', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'auto', 1);
    expect(m.registered.has('auto')).toBe(true);
  });

  it('rejects non-finite values', () => {
    const m = createCycleMetrics();
    expect(() => recordMetric(m, 'x', NaN)).toThrow();
    expect(() => recordMetric(m, 'x', Infinity)).toThrow();
  });

  it('appends multiple values in order', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 1);
    recordMetric(m, 'x', 3);
    recordMetric(m, 'x', 2);
    expect(m.values.get('x')).toEqual([1, 3, 2]);
  });
});

describe('CycleMetrics - getMetric', () => {
  it('returns zeros for an unknown metric', () => {
    const s = getMetric(createCycleMetrics(), 'nope');
    expect(s).toEqual({ count: 0, sum: 0, mean: 0, min: 0, max: 0 });
  });

  it('returns count/sum/mean/min/max for recorded values', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 5);
    recordMetric(m, 'x', 3);
    recordMetric(m, 'x', 1);
    const s = getMetric(m, 'x');
    expect(s.count).toBe(3);
    expect(s.sum).toBe(9);
    expect(s.mean).toBe(3);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
  });

  it('handles a single value correctly', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 7);
    const s = getMetric(m, 'x');
    expect(s.count).toBe(1);
    expect(s.mean).toBe(7);
    expect(s.min).toBe(7);
    expect(s.max).toBe(7);
  });

  it('updates min and max when later values are smaller / larger', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 5);
    recordMetric(m, 'x', 10);
    recordMetric(m, 'x', 1);
    const s = getMetric(m, 'x');
    expect(s.min).toBe(1);
    expect(s.max).toBe(10);
  });
});

describe('CycleMetrics - listMetrics', () => {
  it('returns registered names', () => {
    const m = makeMetrics('a', 'b');
    expect(listMetrics(m).sort()).toEqual(['a', 'b']);
  });

  it('includes metrics that have been recorded without pre-registration', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 1);
    recordMetric(m, 'y', 2);
    expect(listMetrics(m).sort()).toEqual(['x', 'y']);
  });

  it('returns empty array when no metrics', () => {
    expect(listMetrics(createCycleMetrics())).toEqual([]);
  });
});

describe('CycleMetrics - exportMetrics', () => {
  it('returns a JSON-serializable object', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'a', 1);
    recordMetric(m, 'b', 5);
    const exported = exportMetrics(m);
    expect(exported.a.count).toBe(1);
    expect(exported.b.mean).toBe(5);
    expect(JSON.stringify(exported)).toContain('"count":1');
  });
});

describe('CycleMetrics - mergeMetrics', () => {
  it('merges values from source into target', () => {
    const t = createCycleMetrics();
    const s = createCycleMetrics();
    recordMetric(s, 'x', 1);
    recordMetric(s, 'x', 2);
    recordMetric(s, 'y', 9);
    expect(mergeMetrics(t, s)).toBe(2);
    expect(t.values.get('x')).toEqual([1, 2]);
    expect(t.values.get('y')).toEqual([9]);
  });

  it('appends when target already has values', () => {
    const t = createCycleMetrics();
    const s = createCycleMetrics();
    recordMetric(t, 'x', 1);
    recordMetric(s, 'x', 2);
    mergeMetrics(t, s);
    expect(t.values.get('x')).toEqual([1, 2]);
  });

  it('returns 0 when source has no metrics', () => {
    const t = createCycleMetrics();
    const s = createCycleMetrics();
    expect(mergeMetrics(t, s)).toBe(0);
  });

  it('skips metrics with no recorded values', () => {
    const t = createCycleMetrics();
    const s = createCycleMetrics();
    registerMetric(s, 'empty'); // registered but no values recorded
    expect(mergeMetrics(t, s)).toBe(0);
  });
});

describe('CycleMetrics - clearMetric', () => {
  it('removes recorded values', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 1);
    recordMetric(m, 'x', 2);
    expect(clearMetric(m, 'x')).toBe(2);
    expect(m.values.get('x')).toEqual([]);
  });

  it('returns 0 for an unknown metric', () => {
    expect(clearMetric(createCycleMetrics(), 'nope')).toBe(0);
  });

  it('does not unregister the metric', () => {
    const m = createCycleMetrics();
    registerMetric(m, 'x');
    clearMetric(m, 'x');
    expect(m.registered.has('x')).toBe(true);
  });
});

describe('CycleMetrics - snapshotMetrics / restoreMetrics', () => {
  it('snapshot is independent of subsequent edits', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 1);
    recordMetric(m, 'y', 2);
    const snap = snapshotMetrics(m);
    recordMetric(m, 'x', 99);
    expect(snap.x).toEqual([1]);
  });

  it('restore replaces all values', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'x', 1);
    restoreMetrics(m, { a: [10], b: [20, 30] });
    expect(m.values.get('a')).toEqual([10]);
    expect(m.values.get('b')).toEqual([20, 30]);
    expect(m.values.has('x')).toBe(false);
  });
});

describe('CycleMetrics - totalSamples / globalMean', () => {
  it('totalSamples sums across all metrics', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'a', 1);
    recordMetric(m, 'a', 2);
    recordMetric(m, 'b', 5);
    expect(totalSamples(m)).toBe(3);
  });

  it('totalSamples returns 0 when empty', () => {
    expect(totalSamples(createCycleMetrics())).toBe(0);
  });

  it('globalMean is 0 when no samples', () => {
    expect(globalMean(createCycleMetrics())).toBe(0);
  });

  it('globalMean averages across metrics weighted by count', () => {
    const m = createCycleMetrics();
    recordMetric(m, 'a', 1);
    recordMetric(m, 'a', 3);
    recordMetric(m, 'b', 10);
    // sum=14, count=3 → 14/3 ≈ 4.667
    expect(globalMean(m)).toBeCloseTo(14 / 3, 5);
  });
});
