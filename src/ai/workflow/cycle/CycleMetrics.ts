/**
 * V2103 Direction A Iteration 18/30 Round 6: CycleMetrics
 *
 * Cycle execution metrics — track per-metric statistics (count/sum/mean/
 * min/max), support JSON export, snapshot, merge and clear operations.
 *
 * Inspired by:
 * - claude-code-design: stats tracking for long-running workflows
 * - ruflo-design: hook lifecycle metrics
 * - thunderbolt-design: progress panel metrics
 */

export interface CycleMetricsConfig {
  cycleId: string;
  /** Optional list of metric names to pre-register. */
  metrics?: string[];
}

export interface MetricStats {
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
}

export interface CycleMetrics {
  cycleId: string;
  values: Map<string, number[]>;
  registered: Set<string>;
}

/**
 * Create a metrics tracker for a cycle.
 */
export function createCycleMetrics(
  config: CycleMetricsConfig = { cycleId: 'default' }
): CycleMetrics {
  const m: CycleMetrics = {
    cycleId: config.cycleId,
    values: new Map<string, number[]>(),
    registered: new Set<string>(config.metrics ?? []),
  };
  for (const name of m.registered) {
    m.values.set(name, []);
  }
  return m;
}

/** Register a metric name so it appears in listMetrics before any recording. */
export function registerMetric(metrics: CycleMetrics, name: string): void {
  if (!name) throw new Error('metric name must be a non-empty string');
  metrics.registered.add(name);
  if (!metrics.values.has(name)) {
    metrics.values.set(name, []);
  }
}

/** Record a single value for the given metric. */
export function recordMetric(metrics: CycleMetrics, name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`metric value must be a finite number, got ${value}`);
  }
  if (!metrics.values.has(name)) {
    metrics.values.set(name, []);
    metrics.registered.add(name);
  }
  metrics.values.get(name)!.push(value);
}

/** Compute statistics over the recorded values for `name`. */
export function getMetric(metrics: CycleMetrics, name: string): MetricStats {
  const arr = metrics.values.get(name);
  if (!arr || arr.length === 0) {
    return { count: 0, sum: 0, mean: 0, min: 0, max: 0 };
  }
  let sum = arr[0];
  let min = arr[0];
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return {
    count: arr.length,
    sum,
    mean: sum / arr.length,
    min,
    max,
  };
}

/** List all known metric names (registered or recorded). */
export function listMetrics(metrics: CycleMetrics): string[] {
  const all = new Set<string>(metrics.registered);
  for (const k of metrics.values.keys()) all.add(k);
  return Array.from(all).sort();
}

/** Export the metrics as a JSON-serializable object. */
export function exportMetrics(metrics: CycleMetrics): Record<string, MetricStats> {
  const out: Record<string, MetricStats> = {};
  for (const name of listMetrics(metrics)) {
    out[name] = getMetric(metrics, name);
  }
  return out;
}

/**
 * Merge `source` into `target`. For each metric, append the source values
 * to the target. Returns the number of metrics merged.
 */
export function mergeMetrics(target: CycleMetrics, source: CycleMetrics): number {
  let merged = 0;
  for (const name of listMetrics(source)) {
    const arr = source.values.get(name);
    if (!arr || arr.length === 0) continue;
    if (!target.values.has(name)) {
      target.values.set(name, []);
      target.registered.add(name);
    }
    const targetArr = target.values.get(name)!;
    targetArr.push(...arr);
    merged += 1;
  }
  return merged;
}

/** Clear recorded values for a single metric. Returns the count cleared. */
export function clearMetric(metrics: CycleMetrics, name: string): number {
  const arr = metrics.values.get(name);
  if (!arr) return 0;
  const n = arr.length;
  metrics.values.set(name, []);
  return n;
}

/** Return a defensive snapshot of the metrics. */
export function snapshotMetrics(metrics: CycleMetrics): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [name, arr] of metrics.values) {
    out[name] = [...arr];
  }
  return out;
}

/** Restore metrics from a snapshot produced by `snapshotMetrics`. */
export function restoreMetrics(
  metrics: CycleMetrics,
  snap: Record<string, number[]>
): void {
  metrics.values.clear();
  metrics.registered.clear();
  for (const [name, arr] of Object.entries(snap)) {
    metrics.values.set(name, [...arr]);
    metrics.registered.add(name);
  }
}

/** Returns the total number of recorded values across all metrics. */
export function totalSamples(metrics: CycleMetrics): number {
  let n = 0;
  for (const arr of metrics.values.values()) n += arr.length;
  return n;
}

/** Compute the global mean across all metrics (weighted by sample count). */
export function globalMean(metrics: CycleMetrics): number {
  let sum = 0;
  let count = 0;
  for (const arr of metrics.values.values()) {
    for (const v of arr) {
      sum += v;
      count += 1;
    }
  }
  if (count === 0) return 0;
  return sum / count;
}
