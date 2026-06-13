/**
 * V2098 Direction A Iteration 12/30 Round 6: ConvergenceDetector
 *
 * Convergence detector — observes a stream of metric samples and reports
 * when a strongly connected component (cycle) has stabilized. The detector
 * keeps a sliding window of the most recent samples and computes variance,
 * mean, and trend so callers can ask "has the loop converged yet?".
 *
 * Inspired by:
 * - nanobot-design: convergence check on iterated refinement score
 * - ruflo-design: trust score convergence between workers
 * - chatdev-design: chat history delta convergence detection
 */

export type ConvergenceMetric = 'range' | 'variance' | 'stddev';

export interface ConvergenceDetectorConfig {
  /** Number of samples in the sliding window. */
  windowSize: number;
  /** Maximum allowed metric value for the detector to report "converged". */
  threshold: number;
  /**
   * Which metric to compare against `threshold`. Defaults to `'range'`:
   *  - 'range'    → max(samples) - min(samples)
   *  - 'variance' → population variance of the window
   *  - 'stddev'    → population standard deviation of the window
   */
  metric?: ConvergenceMetric;
  /**
   * Threshold used by `computeTrend` to label a series as 'stable'.
   * Defaults to `threshold * 0.1` (or `1e-9` when threshold is 0).
   */
  trendEpsilon?: number;
}

export interface NormalizedConvergenceConfig {
  windowSize: number;
  threshold: number;
  metric: ConvergenceMetric;
  trendEpsilon: number;
}

export interface ConvergenceDetector {
  config: NormalizedConvergenceConfig;
  samples: number[];
  totalRecorded: number;
  totalResets: number;
  lastRecordedAt: number;
  createdAt: number;
}

export interface ConvergenceSnapshot {
  windowSize: number;
  threshold: number;
  metric: ConvergenceMetric;
  sampleCount: number;
  totalRecorded: number;
  totalResets: number;
  mean: number;
  variance: number;
  range: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  converged: boolean;
  lastRecordedAt: number;
  createdAt: number;
}

/**
 * Create a new convergence detector. Validates configuration and stores a
 * normalized copy on the detector so callers cannot accidentally mutate
 * inputs after creation.
 *
 * @throws when `windowSize` is not a finite positive integer
 * @throws when `threshold` is not a finite non-negative number
 * @throws when `metric` is not one of the allowed values
 */
export function createConvergenceDetector(
  config: ConvergenceDetectorConfig,
  now: () => number = () => Date.now()
): ConvergenceDetector {
  if (!Number.isFinite(config.windowSize) || !Number.isInteger(config.windowSize) || config.windowSize <= 0) {
    throw new Error(`windowSize must be a finite positive integer, got ${config.windowSize}`);
  }
  if (!Number.isFinite(config.threshold) || config.threshold < 0) {
    throw new Error(`threshold must be a finite non-negative number, got ${config.threshold}`);
  }
  const metric: ConvergenceMetric = config.metric ?? 'range';
  if (metric !== 'range' && metric !== 'variance' && metric !== 'stddev') {
    throw new Error(`metric must be one of 'range' | 'variance' | 'stddev', got '${metric}'`);
  }
  const trendEpsilon = config.trendEpsilon ?? (config.threshold === 0 ? 1e-9 : config.threshold * 0.1);
  if (!Number.isFinite(trendEpsilon) || trendEpsilon < 0) {
    throw new Error(`trendEpsilon must be a finite non-negative number, got ${trendEpsilon}`);
  }
  const t = now();
  return {
    config: { windowSize: config.windowSize, threshold: config.threshold, metric, trendEpsilon },
    samples: [],
    totalRecorded: 0,
    totalResets: 0,
    lastRecordedAt: t,
    createdAt: t,
  };
}

/**
 * Record a single metric sample. Pushes onto the sliding window; older
 * samples beyond `windowSize` are discarded. Returns the value accepted so
 * callers can chain. Non-finite values throw.
 */
export function recordMetric(detector: ConvergenceDetector, value: number, now: () => number = () => Date.now()): number {
  if (!Number.isFinite(value)) {
    throw new Error(`value must be a finite number, got ${value}`);
  }
  detector.samples.push(value);
  if (detector.samples.length > detector.config.windowSize) {
    detector.samples.splice(0, detector.samples.length - detector.config.windowSize);
  }
  detector.totalRecorded += 1;
  detector.lastRecordedAt = now();
  return value;
}

/**
 * True when the sliding window is full (or beyond) AND the chosen metric
 * is strictly below `threshold`. An empty window never converges.
 */
export function hasConverged(detector: ConvergenceDetector): boolean {
  if (detector.samples.length === 0) return false;
  if (detector.samples.length < detector.config.windowSize) {
    // A partial window can still converge when every sample is identical
    // and the metric evaluates to 0 — but only when windowSize > 0 (guaranteed).
    const value = metricFor(detector.config.metric, detector.samples);
    return value < detector.config.threshold;
  }
  return metricFor(detector.config.metric, detector.samples) < detector.config.threshold;
}

function metricFor(metric: ConvergenceMetric, samples: number[]): number {
  switch (metric) {
    case 'range':
      return computeRange(samples);
    case 'variance':
      return computeVariance(samples);
    case 'stddev':
      return Math.sqrt(computeVariance(samples));
  }
}

/** Minimum value in the sample array, or `Infinity` when empty. */
export function computeMin(samples: number[]): number {
  if (samples.length === 0) return Infinity;
  let m = samples[0]!;
  for (let i = 1; i < samples.length; i++) {
    const v = samples[i]!;
    if (v < m) m = v;
  }
  return m;
}

/** Maximum value in the sample array, or `-Infinity` when empty. */
export function computeMax(samples: number[]): number {
  if (samples.length === 0) return -Infinity;
  let m = samples[0]!;
  for (let i = 1; i < samples.length; i++) {
    const v = samples[i]!;
    if (v > m) m = v;
  }
  return m;
}

/** Range = max - min. Returns 0 for empty input. */
export function computeRange(samples: number[]): number {
  if (samples.length === 0) return 0;
  return computeMax(samples) - computeMin(samples);
}

/** Arithmetic mean. Returns 0 for empty input. */
export function computeMean(samples: number[]): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const v of samples) sum += v;
  return sum / samples.length;
}

/**
 * Population variance (divides by n, not n-1). Returns 0 for empty input or
 * for a single-sample window (no spread).
 */
export function computeVariance(samples: number[]): number {
  if (samples.length <= 1) return 0;
  const mean = computeMean(samples);
  let sum = 0;
  for (const v of samples) {
    const d = v - mean;
    sum += d * d;
  }
  return sum / samples.length;
}

/** Population standard deviation. Returns 0 for empty / single-sample input. */
export function computeStdDev(samples: number[]): number {
  return Math.sqrt(computeVariance(samples));
}

/**
 * Classify the linear trend of a sample series.
 *  - 'increasing'  → least-squares slope >  epsilon
 *  - 'decreasing'  → least-squares slope < -epsilon
 *  - 'stable'      → |slope| <= epsilon
 *
 * For a window of < 2 samples the trend is always 'stable'.
 */
export function computeTrend(
  samples: number[],
  epsilon: number = 1e-9
): 'increasing' | 'decreasing' | 'stable' {
  if (samples.length < 2) return 'stable';
  if (!Number.isFinite(epsilon) || epsilon < 0) {
    throw new Error(`epsilon must be a finite non-negative number, got ${epsilon}`);
  }
  const n = samples.length;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += samples[i]!;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    const dy = samples[i]! - meanY;
    num += dx * dy;
    den += dx * dx;
  }
  // For n >= 2 with i = 0..n-1, the variance of x is (n^2-1)/12 > 0,
  // so `den` is strictly positive here. We compute num / den unconditionally.
  const slope = num / den;
  if (slope > epsilon) return 'increasing';
  if (slope < -epsilon) return 'decreasing';
  return 'stable';
}

/** Reset sample history and counters; preserve configuration. */
export function resetDetector(
  detector: ConvergenceDetector,
  now: () => number = () => Date.now()
): void {
  detector.samples = [];
  detector.totalResets += 1;
  detector.lastRecordedAt = now();
}

/**
 * Return the most recent `n` samples. `n` defaults to the configured
 * window size. `n <= 0` returns an empty array. `n > windowSize` is clamped.
 */
export function getWindowSamples(detector: ConvergenceDetector, n?: number): number[] {
  const requested = n ?? detector.config.windowSize;
  if (requested <= 0) return [];
  const start = Math.max(0, detector.samples.length - requested);
  return detector.samples.slice(start);
}

/** Immutable snapshot of the detector's state for logging / serialization. */
export function snapshotDetector(detector: ConvergenceDetector): ConvergenceSnapshot {
  const samples = detector.samples;
  return {
    windowSize: detector.config.windowSize,
    threshold: detector.config.threshold,
    metric: detector.config.metric,
    sampleCount: samples.length,
    totalRecorded: detector.totalRecorded,
    totalResets: detector.totalResets,
    mean: computeMean(samples),
    variance: computeVariance(samples),
    range: computeRange(samples),
    trend: computeTrend(samples, detector.config.trendEpsilon),
    converged: hasConverged(detector),
    lastRecordedAt: detector.lastRecordedAt,
    createdAt: detector.createdAt,
  };
}