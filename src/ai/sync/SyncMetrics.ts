// V2122 SyncMetrics - Direction A Iter 7/30
// 同步指标 - 吞吐/延迟/冲突率
// Source: thunderbolt (metrics pipeline)

export interface SyncMetricPoint {
  timestamp: number;
  throughputOps: number;
  latencyMs: number;
  conflictCount: number;
  errorCount: number;
}

export interface SyncMetricsState {
  points: SyncMetricPoint[];
  totalOps: number;
  totalConflicts: number;
  totalErrors: number;
  rollingWindowMs: number;
}

export function createMetrics(rollingWindowMs = 60000): SyncMetricsState {
  return { points: [], totalOps: 0, totalConflicts: 0, totalErrors: 0, rollingWindowMs };
}

export function recordPoint(state: SyncMetricsState, point: Omit<SyncMetricPoint, 'timestamp'>): SyncMetricsState {
  const newPoint: SyncMetricPoint = { ...point, timestamp: Date.now() };
  return {
    points: [...state.points, newPoint],
    totalOps: state.totalOps + point.throughputOps,
    totalConflicts: state.totalConflicts + point.conflictCount,
    totalErrors: state.totalErrors + point.errorCount,
    rollingWindowMs: state.rollingWindowMs,
  };
}

export function windowPoints(state: SyncMetricsState, now = Date.now()): SyncMetricPoint[] {
  return state.points.filter((p) => now - p.timestamp <= state.rollingWindowMs);
}

export function avgLatency(state: SyncMetricsState): number {
  const recent = windowPoints(state);
  if (recent.length === 0) return 0;
  return recent.reduce((s, p) => s + p.latencyMs, 0) / recent.length;
}

export function p95Latency(state: SyncMetricsState): number {
  const recent = windowPoints(state);
  if (recent.length === 0) return 0;
  const sorted = [...recent].map((p) => p.latencyMs).sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.95);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export function conflictRate(state: SyncMetricsState): number {
  if (state.totalOps === 0) return 0;
  return state.totalConflicts / state.totalOps;
}

export function errorRate(state: SyncMetricsState): number {
  if (state.totalOps === 0) return 0;
  return state.totalErrors / state.totalOps;
}

export function dashboardSnapshot(state: SyncMetricsState): {
  avgLatency: number;
  p95Latency: number;
  conflictRate: number;
  errorRate: number;
  health: number;
} {
  const avg = avgLatency(state);
  const p95 = p95Latency(state);
  const cRate = conflictRate(state);
  const eRate = errorRate(state);
  const health = Math.max(0, 1 - eRate - cRate * 0.5);
  return { avgLatency: avg, p95Latency: p95, conflictRate: cRate, errorRate: eRate, health };
}
