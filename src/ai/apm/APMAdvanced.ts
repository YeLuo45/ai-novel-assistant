// V5316-V5325: CY Performance Profiling 2.0 Advanced Batch 2/3
// LatencyAnalyzer + ErrorTracker + HealthChecker + CapacityPlanner + AnomalyDetector + CorrelationEngine + SamplingOptimizer + QueryAnalyzer + ProfileAggregator + AdvancedIndex

export class LatencyAnalyzer {
  // Compute p50, p95, p99
  private _percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[idx];
  }

  analyze(latencies: number[]): { p50: number; p95: number; p99: number; mean: number } {
    if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, mean: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    return {
      p50: this._percentile(sorted, 0.5),
      p95: this._percentile(sorted, 0.95),
      p99: this._percentile(sorted, 0.99),
      mean
    };
  }

  isSlow(latencyMs: number, thresholdMs = 1000): boolean {
    return latencyMs >= thresholdMs;
  }
}

export class ErrorTracker {
  private _errors: Array<{ ts: number; message: string; stack?: string; fingerprint: string }> = [];

  record(message: string, stack?: string): string {
    const fingerprint = `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._errors.push({ ts: Date.now(), message, stack, fingerprint });
    return fingerprint;
  }

  count(): number { return this._errors.length; }

  byFingerprint(fingerprint: string): { ts: number; message: string; stack?: string } | null {
    return this._errors.find(e => e.fingerprint === fingerprint) ?? null;
  }

  recent(limit = 10): Array<{ ts: number; message: string; stack?: string; fingerprint: string }> {
    return this._errors.slice(-limit);
  }

  clear(): void { this._errors = []; }
}

export class HealthChecker {
  private _checks: Map<string, { healthy: boolean; ts: number; details?: string }> = new Map();

  setHealth(name: string, healthy: boolean, details?: string): this {
    this._checks.set(name, { healthy, ts: Date.now(), details });
    return this;
  }

  isHealthy(name: string): boolean {
    return this._checks.get(name)?.healthy ?? false;
  }

  details(name: string): string | undefined {
    return this._checks.get(name)?.details;
  }

  age(name: string): number {
    const c = this._checks.get(name);
    return c ? Date.now() - c.ts : -1;
  }

  allHealthy(): boolean {
    if (this._checks.size === 0) return false;
    for (const c of this._checks.values()) if (!c.healthy) return false;
    return true;
  }

  unhealthyChecks(): string[] {
    const result: string[] = [];
    for (const [name, c] of this._checks.entries()) {
      if (!c.healthy) result.push(name);
    }
    return result;
  }

  count(): number { return this._checks.size; }
}

export class CapacityPlanner {
  // Project future usage
  project(current: number, growthRate: number, periods: number): number[] {
    const result: number[] = [];
    let v = current;
    for (let i = 0; i < periods; i++) {
      v = v * (1 + growthRate);
      result.push(v);
    }
    return result;
  }

  // Days until capacity exceeded
  daysUntilFull(current: number, max: number, dailyGrowth: number): number {
    if (dailyGrowth <= 0) return Infinity;
    if (current >= max) return 0;
    return Math.ceil((max - current) / dailyGrowth);
  }

  recommendScale(current: number, max: number, targetUtilization = 0.7): number {
    const target = current / targetUtilization;
    return Math.max(target, max);
  }
}

export class AnomalyDetector {
  // Simple z-score detector
  isAnomaly(value: number, history: number[], threshold = 2.5): boolean {
    if (history.length < 2) return false;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    if (value === mean) return false; // exact match not anomalous
    const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length;
    const std = Math.sqrt(variance);
    if (std === 0) return true; // any deviation when history is constant
    return Math.abs(value - mean) / std > threshold;
  }

  detectAnomalies(values: number[], threshold = 2.5): number[] {
    return values
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => this.isAnomaly(v, values.slice(0, i), threshold))
      .map(({ i }) => i);
  }
}

export class CorrelationEngine {
  // Pearson correlation
  correlate(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const denom = Math.sqrt(denX * denY);
    return denom === 0 ? 0 : num / denom;
  }
}

export class SamplingOptimizer {
  // Recommend sample rate to stay under budget
  recommendRate(budget: number, samplesNeeded: number): number {
    if (samplesNeeded === 0) return 1.0;
    return Math.min(1.0, budget / samplesNeeded);
  }

  // Adaptive: lower rate under high QPS
  adaptive(qps: number, targetSamplesPerSec = 100): number {
    return Math.min(1.0, targetSamplesPerSec / Math.max(1, qps));
  }
}

export class QueryAnalyzer {
  analyze(query: string): { tokens: number; uniqueTokens: number; type: 'select' | 'insert' | 'update' | 'delete' | 'unknown' } {
    const tokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const uniqueTokens = new Set(tokens).size;
    let type: 'select' | 'insert' | 'update' | 'delete' | 'unknown' = 'unknown';
    if (query.toLowerCase().includes('select')) type = 'select';
    else if (query.toLowerCase().includes('insert')) type = 'insert';
    else if (query.toLowerCase().includes('update')) type = 'update';
    else if (query.toLowerCase().includes('delete')) type = 'delete';
    return { tokens: tokens.length, uniqueTokens, type };
  }

  isExpensive(query: string, threshold = 10): boolean {
    return this.analyze(query).tokens >= threshold;
  }
}

export class ProfileAggregator {
  private _runs: Map<string, Array<{ ts: number; durationMs: number; bytes: number }>> = new Map();

  record(profileId: string, durationMs: number, bytes: number): this {
    let list = this._runs.get(profileId);
    if (!list) { list = []; this._runs.set(profileId, list); }
    list.push({ ts: Date.now(), durationMs, bytes });
    return this;
  }

  totalDuration(profileId: string): number {
    return (this._runs.get(profileId) ?? []).reduce((s, r) => s + r.durationMs, 0);
  }

  totalBytes(profileId: string): number {
    return (this._runs.get(profileId) ?? []).reduce((s, r) => s + r.bytes, 0);
  }

  runCount(profileId: string): number {
    return this._runs.get(profileId)?.length ?? 0;
  }

  averageDuration(profileId: string): number {
    const list = this._runs.get(profileId);
    return list && list.length > 0 ? list.reduce((s, r) => s + r.durationMs, 0) / list.length : 0;
  }
}

// V5325: APMAdvancedIndex
export const CY_BATCH_2_ENGINES = [
  'LatencyAnalyzer', 'ErrorTracker', 'HealthChecker', 'CapacityPlanner', 'AnomalyDetector',
  'CorrelationEngine', 'SamplingOptimizer', 'QueryAnalyzer', 'ProfileAggregator', 'APMAdvancedIndex'
] as const;

export class APMAdvancedIndex {
  list(): string[] {
    return [...CY_BATCH_2_ENGINES];
  }

  count(): number {
    return CY_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CY_BATCH_2_ENGINES.includes(name as typeof CY_BATCH_2_ENGINES[number]);
  }
}