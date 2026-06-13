import { describe, it, expect } from 'vitest';
import {
  createMetrics,
  recordPoint,
  windowPoints,
  avgLatency,
  p95Latency,
  conflictRate,
  errorRate,
  dashboardSnapshot,
} from './SyncMetrics';

describe('V2122 SyncMetrics', () => {
  it('should create empty metrics', () => {
    const m = createMetrics();
    expect(m.points).toEqual([]);
    expect(m.totalOps).toBe(0);
  });

  it('should record point with timestamp', () => {
    let m = createMetrics();
    m = recordPoint(m, { throughputOps: 10, latencyMs: 100, conflictCount: 1, errorCount: 0 });
    expect(m.points).toHaveLength(1);
    expect(m.totalOps).toBe(10);
    expect(m.totalConflicts).toBe(1);
  });

  it('should filter window points', () => {
    let m = createMetrics(60000);
    m = recordPoint(m, { throughputOps: 1, latencyMs: 50, conflictCount: 0, errorCount: 0 });
    const w = windowPoints(m);
    expect(w).toHaveLength(1);
  });

  it('should compute average latency', () => {
    let m = createMetrics();
    m = recordPoint(m, { throughputOps: 1, latencyMs: 100, conflictCount: 0, errorCount: 0 });
    m = recordPoint(m, { throughputOps: 1, latencyMs: 200, conflictCount: 0, errorCount: 0 });
    expect(avgLatency(m)).toBe(150);
  });

  it('should compute P95 latency', () => {
    let m = createMetrics();
    for (let i = 1; i <= 100; i++) {
      m = recordPoint(m, { throughputOps: 1, latencyMs: i, conflictCount: 0, errorCount: 0 });
    }
    expect(p95Latency(m)).toBeGreaterThan(90);
  });

  it('should compute conflict rate', () => {
    let m = createMetrics();
    m = recordPoint(m, { throughputOps: 10, latencyMs: 0, conflictCount: 2, errorCount: 0 });
    expect(conflictRate(m)).toBeCloseTo(0.2);
  });

  it('should compute error rate', () => {
    let m = createMetrics();
    m = recordPoint(m, { throughputOps: 10, latencyMs: 0, conflictCount: 0, errorCount: 3 });
    expect(errorRate(m)).toBeCloseTo(0.3);
  });

  it('should return 0 for empty metrics dashboard', () => {
    const m = createMetrics();
    const s = dashboardSnapshot(m);
    expect(s.avgLatency).toBe(0);
    expect(s.health).toBe(1);
  });

  it('should compute dashboard snapshot with health', () => {
    let m = createMetrics();
    m = recordPoint(m, { throughputOps: 10, latencyMs: 100, conflictCount: 1, errorCount: 0 });
    m = recordPoint(m, { throughputOps: 10, latencyMs: 200, conflictCount: 0, errorCount: 1 });
    const s = dashboardSnapshot(m);
    expect(s.avgLatency).toBe(150);
    expect(s.errorRate).toBeCloseTo(0.05);
    expect(s.health).toBeGreaterThan(0.5);
  });
});
