// V5316-V5325: CY Performance Profiling 2.0 Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  LatencyAnalyzer,
  ErrorTracker,
  HealthChecker,
  CapacityPlanner,
  AnomalyDetector,
  CorrelationEngine,
  SamplingOptimizer,
  QueryAnalyzer,
  ProfileAggregator,
  APMAdvancedIndex,
  CY_BATCH_2_ENGINES
} from './APMAdvanced';

describe('LatencyAnalyzer + ErrorTracker + HealthChecker', () => {
  it('LatencyAnalyzer analyze + isSlow', () => {
    const l = new LatencyAnalyzer();
    expect(l.analyze([])).toEqual({ p50: 0, p95: 0, p99: 0, mean: 0 });
    const r = l.analyze([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(r.p50).toBeGreaterThan(0);
    expect(r.mean).toBe(55);
    expect(l.isSlow(2000, 1000)).toBe(true);
    expect(l.isSlow(500, 1000)).toBe(false);
  });

  it('ErrorTracker record + count + byFingerprint + recent + clear', () => {
    const e = new ErrorTracker();
    const id1 = e.record('err 1');
    e.record('err 2', 'stack trace');
    expect(e.count()).toBe(2);
    expect(e.byFingerprint(id1)?.message).toBe('err 1');
    expect(e.byFingerprint('missing')).toBeNull();
    expect(e.recent(1).length).toBe(1);
    e.clear();
    expect(e.count()).toBe(0);
  });

  it('HealthChecker setHealth + isHealthy + details + age + allHealthy + unhealthyChecks + count', () => {
    const h = new HealthChecker();
    expect(h.allHealthy()).toBe(false); // no checks
    h.setHealth('db', true, 'ok');
    h.setHealth('cache', false, 'down');
    expect(h.isHealthy('db')).toBe(true);
    expect(h.isHealthy('cache')).toBe(false);
    expect(h.details('db')).toBe('ok');
    expect(h.isHealthy('missing')).toBe(false);
    expect(h.age('db')).toBeGreaterThanOrEqual(0);
    expect(h.unhealthyChecks()).toEqual(['cache']);
    expect(h.allHealthy()).toBe(false);
    h.setHealth('cache', true);
    expect(h.allHealthy()).toBe(true);
    expect(h.count()).toBe(2);
  });
});

describe('CapacityPlanner + AnomalyDetector + CorrelationEngine + SamplingOptimizer', () => {
  it('CapacityPlanner project + daysUntilFull + recommendScale', () => {
    const c = new CapacityPlanner();
    const projected = c.project(100, 0.1, 3);
    expect(projected[0]).toBeCloseTo(110);
    expect(projected[1]).toBeCloseTo(121);
    expect(projected[2]).toBeCloseTo(133.1);
    expect(c.daysUntilFull(50, 100, 10)).toBe(5);
    expect(c.daysUntilFull(0, 100, 0)).toBe(Infinity);
    expect(c.daysUntilFull(100, 100, 10)).toBe(0);
    expect(c.recommendScale(700, 1000, 0.7)).toBeGreaterThanOrEqual(1000);
  });

  it('AnomalyDetector isAnomaly + detectAnomalies', () => {
    const a = new AnomalyDetector();
    expect(a.isAnomaly(100, [])).toBe(false);
    expect(a.isAnomaly(100, [10, 10, 10, 10])).toBe(true); // outlier (std=0 path: value !== mean)
    expect(a.isAnomaly(10, [10, 10, 10, 10])).toBe(false);
    expect(a.isAnomaly(10, [10, 10])).toBe(false); // < 2 history
    const indices = a.detectAnomalies([10, 10, 10, 100, 10, 200]);
    expect(indices.length).toBeGreaterThan(0);
  });

  it('CorrelationEngine correlate', () => {
    const c = new CorrelationEngine();
    expect(c.correlate([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5);
    expect(c.correlate([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 5);
    expect(c.correlate([1, 1, 1, 1], [1, 2, 3, 4])).toBe(0); // zero variance
    expect(c.correlate([], [])).toBe(0);
    expect(c.correlate([1, 2], [1, 2, 3])).toBe(0); // length mismatch
  });

  it('SamplingOptimizer recommendRate + adaptive', () => {
    const s = new SamplingOptimizer();
    expect(s.recommendRate(100, 1000)).toBe(0.1);
    expect(s.recommendRate(0, 0)).toBe(1.0);
    expect(s.recommendRate(1000, 0)).toBe(1.0);
    expect(s.adaptive(100, 100)).toBe(1.0);
    expect(s.adaptive(200, 100)).toBe(0.5);
  });
});

describe('QueryAnalyzer + ProfileAggregator + APMAdvancedIndex', () => {
  it('QueryAnalyzer analyze + isExpensive', () => {
    const q = new QueryAnalyzer();
    expect(q.analyze('SELECT * FROM users').type).toBe('select');
    expect(q.analyze('INSERT INTO x VALUES (1)').type).toBe('insert');
    expect(q.analyze('UPDATE users SET name = 1').type).toBe('update');
    expect(q.analyze('DELETE FROM users').type).toBe('delete');
    expect(q.analyze('CREATE TABLE x').type).toBe('unknown');
    // 'SELECT a b c' splits to 4 tokens (select, a, b, c)
    expect(q.analyze('SELECT a b c').tokens).toBe(4);
    // 15 tokens → expensive (threshold 10)
    expect(q.isExpensive('SELECT a b c d e f g h i j k l m n o', 10)).toBe(true);
    expect(q.isExpensive('SELECT a', 10)).toBe(false);
  });

  it('ProfileAggregator record + totals + runCount + averageDuration', () => {
    const p = new ProfileAggregator();
    p.record('p1', 100, 50).record('p1', 200, 100);
    expect(p.totalDuration('p1')).toBe(300);
    expect(p.totalBytes('p1')).toBe(150);
    expect(p.runCount('p1')).toBe(2);
    expect(p.averageDuration('p1')).toBe(150);
    expect(p.runCount('missing')).toBe(0);
    expect(p.averageDuration('missing')).toBe(0);
  });

  it('APMAdvancedIndex', () => {
    expect(new APMAdvancedIndex().list()).toHaveLength(10);
    const idx = new APMAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('LatencyAnalyzer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
    expect(CY_BATCH_2_ENGINES).toHaveLength(10);
  });
});