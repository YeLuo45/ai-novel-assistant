/**
 * V2095 Direction A Iteration 10/30: QualityGate
 *
 * Multi-dimensional quality gate for workflow loops. A loop should exit
 * only when its content meets a configurable threshold across every
 * quality dimension (prose, structure, pacing, theme, character, novelty).
 *
 * Inspired by:
 * - chatdev-design: composite quality scoring before loop exit
 * - thunderbolt-design: weighted gating over multiple metrics
 * - nanobot-design: dimension-by-dimension evaluation with per-dim min
 *
 * Concepts:
 * - dimensions: a fixed set of named quality axes
 * - thresholds: per-dimension minimum acceptable score in [0,1]
 * - weights: per-dimension weight used to compute the weighted average
 * - minScore: the minimum acceptable weighted average
 *
 * A gate "passes" when BOTH allDimensionsAbove() and
 * computeWeightedScore() >= minScore hold simultaneously.
 */

/* ------------------------------------------------------------------------- */
/* Types                                                                      */
/* ------------------------------------------------------------------------- */

export type QualityDimension =
  | 'prose'
  | 'structure'
  | 'pacing'
  | 'theme'
  | 'character'
  | 'novelty';

export const ALL_DIMENSIONS: readonly QualityDimension[] = [
  'prose',
  'structure',
  'pacing',
  'theme',
  'character',
  'novelty',
] as const;

/** Raw metrics may be unbounded; we normalise to [0,1] before scoring. */
export type RawMetrics = Partial<Record<QualityDimension, number>>;

/** Scores are the normalised representation of RawMetrics. */
export type QualityScores = Record<QualityDimension, number>;

/** Per-dimension threshold used by allDimensionsAbove(). */
export type QualityThresholds = Record<QualityDimension, number>;

/** Configuration consumed by createQualityGate(). */
export interface QualityGateConfig {
  thresholds: QualityThresholds;
  weights: number[];
  minScore: number;
}

/** A constructed quality gate (immutable shape, mutating returns a new one). */
export interface QualityGate {
  thresholds: QualityThresholds;
  weights: number[];
  minScore: number;
  /** Order of dimensions corresponds to weights[i]. */
  dimensions: QualityDimension[];
}

/** Result of evaluating a gate against a set of metrics. */
export interface QualityEvaluation {
  passed: boolean;
  scores: QualityScores;
  weightedScore: number;
  /** True iff every dimension's normalised score meets its threshold. */
  dimensionsPass: boolean;
  /** True iff the weighted average is >= minScore. */
  weightedPass: boolean;
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

/** True iff the supplied string is one of the known quality dimensions. */
export function isQualityDimension(value: string): value is QualityDimension {
  return (
    value === 'prose' ||
    value === 'structure' ||
    value === 'pacing' ||
    value === 'theme' ||
    value === 'character' ||
    value === 'novelty'
  );
}

/** Clamp a number to the inclusive [lo, hi] range. */
export function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Return a deep-cloned QualityThresholds object. */
function cloneThresholds(t: QualityThresholds): QualityThresholds {
  return {
    prose: t.prose,
    structure: t.structure,
    pacing: t.pacing,
    theme: t.theme,
    character: t.character,
    novelty: t.novelty,
  };
}

/* ------------------------------------------------------------------------- */
/* Construction                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Construct a quality gate. Throws on invalid configuration:
 * - weights must contain exactly one entry per known dimension
 * - thresholds must be within [0,1] and finite
 * - minScore must be a finite number in [0,1]
 */
export function createQualityGate(config: QualityGateConfig): QualityGate {
  if (!config || typeof config !== 'object') {
    throw new Error('createQualityGate: config must be an object');
  }
  const dims = ALL_DIMENSIONS;
  if (!Array.isArray(config.weights) || config.weights.length !== dims.length) {
    throw new Error(
      `createQualityGate: weights must be an array of length ${dims.length}`
    );
  }
  for (let i = 0; i < config.weights.length; i++) {
    const w = config.weights[i];
    if (typeof w !== 'number' || !Number.isFinite(w) || w < 0) {
      throw new Error(
        `createQualityGate: weights[${i}] must be a finite non-negative number`
      );
    }
  }
  if (
    typeof config.minScore !== 'number' ||
    !Number.isFinite(config.minScore) ||
    config.minScore < 0 ||
    config.minScore > 1
  ) {
    throw new Error('createQualityGate: minScore must be a finite number in [0,1]');
  }
  if (!config.thresholds || typeof config.thresholds !== 'object') {
    throw new Error('createQualityGate: thresholds must be an object');
  }
  for (const d of dims) {
    const t = config.thresholds[d];
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > 1) {
      throw new Error(
        `createQualityGate: thresholds.${d} must be a finite number in [0,1]`
      );
    }
  }
  const sumWeights = config.weights.reduce((s, w) => s + w, 0);
  if (sumWeights <= 0) {
    throw new Error('createQualityGate: weights must sum to a positive number');
  }
  return {
    dimensions: [...dims],
    thresholds: cloneThresholds(config.thresholds),
    weights: [...config.weights],
    minScore: config.minScore,
  };
}

/* ------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Normalise raw metrics into [0,1]-clamped scores. Missing dimensions
 * default to 0. Any non-finite value also defaults to 0. Inputs above 1
 * are clamped down to 1; negative inputs are clamped up to 0.
 */
export function normalizeMetrics(metrics: RawMetrics | undefined | null): QualityScores {
  const empty: QualityScores = {
    prose: 0,
    structure: 0,
    pacing: 0,
    theme: 0,
    character: 0,
    novelty: 0,
  };
  if (!metrics || typeof metrics !== 'object') return empty;
  const out: QualityScores = { ...empty };
  for (const d of ALL_DIMENSIONS) {
    const v = (metrics as Record<string, unknown>)[d];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[d] = clampUnit(v);
    } else {
      out[d] = 0;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------- */
/* Weighted scoring                                                           */
/* ------------------------------------------------------------------------- */

/**
 * Compute the weighted average of normalised scores.
 * If the weights sum to 0 the result is 0. The returned value is in
 * [0,1] only when the supplied scores are themselves in [0,1] and the
 * weights are non-negative.
 */
export function computeWeightedScore(
  scores: QualityScores,
  weights: number[]
): number {
  if (!Array.isArray(weights) || weights.length === 0) return 0;
  const dims = ALL_DIMENSIONS;
  let total = 0;
  let weightSum = 0;
  for (let i = 0; i < dims.length; i++) {
    const w = i < weights.length ? weights[i] : 0;
    const s = scores[dims[i]];
    if (typeof w !== 'number' || !Number.isFinite(w) || w < 0) continue;
    if (typeof s !== 'number' || !Number.isFinite(s)) continue;
    total += w * clampUnit(s);
    weightSum += w;
  }
  if (weightSum <= 0) return 0;
  return total / weightSum;
}

/* ------------------------------------------------------------------------- */
/* Per-dimension threshold check                                              */
/* ------------------------------------------------------------------------- */

/**
 * True iff every dimension's score meets or exceeds the corresponding
 * threshold. A missing dimension is treated as 0 and therefore only
 * passes when its threshold is also 0.
 */
export function allDimensionsAbove(
  scores: QualityScores,
  min: number
): boolean {
  const m = typeof min === 'number' && Number.isFinite(min) ? min : 0;
  for (const d of ALL_DIMENSIONS) {
    if (clampUnit(scores[d]) < m) return false;
  }
  return true;
}

/**
 * Per-dimension check against a per-dimension threshold map.
 * Returns true iff every dimension meets its own threshold.
 */
export function allDimensionsMeetThresholds(
  scores: QualityScores,
  thresholds: QualityThresholds
): boolean {
  for (const d of ALL_DIMENSIONS) {
    const t = thresholds[d];
    if (typeof t !== 'number' || !Number.isFinite(t)) return false;
    if (clampUnit(scores[d]) < t) return false;
  }
  return true;
}

/* ------------------------------------------------------------------------- */
/* Evaluation                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Evaluate a gate against raw metrics. The returned object always
 * contains a fully populated `scores` map (every dimension present).
 * `passed` is true iff BOTH:
 *   1) weightedScore >= minScore
 *   2) every dimension meets its individual threshold
 */
export function evaluateQualityGate(
  gate: QualityGate,
  metrics: RawMetrics
): QualityEvaluation {
  const scores = normalizeMetrics(metrics);
  const weighted = computeWeightedScore(scores, gate.weights);
  const dimsPass = allDimensionsMeetThresholds(scores, gate.thresholds);
  const weightedPass = weighted >= gate.minScore;
  return {
    passed: dimsPass && weightedPass,
    scores,
    weightedScore: weighted,
    dimensionsPass: dimsPass,
    weightedPass,
  };
}

/* ------------------------------------------------------------------------- */
/* Mutation (returns a new gate, never mutates in place)                      */
/* ------------------------------------------------------------------------- */

/** Update a single threshold; returns a new gate. */
export function setThreshold(
  gate: QualityGate,
  dim: QualityDimension,
  value: number
): QualityGate {
  if (!isQualityDimension(dim)) {
    throw new Error(`setThreshold: unknown dimension "${dim}"`);
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`setThreshold: value must be a finite number in [0,1]`);
  }
  return {
    dimensions: [...gate.dimensions],
    thresholds: { ...gate.thresholds, [dim]: value },
    weights: [...gate.weights],
    minScore: gate.minScore,
  };
}

/** Update the overall minScore; returns a new gate. */
export function setMinScore(gate: QualityGate, value: number): QualityGate {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('setMinScore: value must be a finite number in [0,1]');
  }
  return {
    dimensions: [...gate.dimensions],
    thresholds: cloneThresholds(gate.thresholds),
    weights: [...gate.weights],
    minScore: value,
  };
}

/** Update the entire weight vector; returns a new gate. */
export function setWeights(gate: QualityGate, weights: number[]): QualityGate {
  if (!Array.isArray(weights) || weights.length !== gate.weights.length) {
    throw new Error(
      `setWeights: weights must be an array of length ${gate.weights.length}`
    );
  }
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (typeof w !== 'number' || !Number.isFinite(w) || w < 0) {
      throw new Error(`setWeights: weights[${i}] must be a finite non-negative number`);
    }
  }
  return {
    dimensions: [...gate.dimensions],
    thresholds: cloneThresholds(gate.thresholds),
    weights: [...weights],
    minScore: gate.minScore,
  };
}

/**
 * Higher-level update: apply a partial threshold patch. Throws if the
 * patch introduces an out-of-range or non-finite value.
 */
export function updateQualityGate(
  gate: QualityGate,
  threshold: Partial<QualityThresholds>
): QualityGate {
  if (!threshold || typeof threshold !== 'object') {
    throw new Error('updateQualityGate: threshold patch must be an object');
  }
  const next: QualityThresholds = cloneThresholds(gate.thresholds);
  for (const key of Object.keys(threshold) as QualityDimension[]) {
    if (!isQualityDimension(key)) {
      throw new Error(`updateQualityGate: unknown dimension "${key}"`);
    }
    const v = threshold[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(
        `updateQualityGate: threshold.${key} must be a finite number in [0,1]`
      );
    }
    next[key] = v;
  }
  return {
    dimensions: [...gate.dimensions],
    thresholds: next,
    weights: [...gate.weights],
    minScore: gate.minScore,
  };
}

/* ------------------------------------------------------------------------- */
/* Inspection                                                                 */
/* ------------------------------------------------------------------------- */

/** Return a stable, human-readable description of the gate. */
export function describeQualityGate(gate: QualityGate): string {
  const parts = gate.dimensions.map((d, i) => {
    const t = gate.thresholds[d].toFixed(2);
    const w = gate.weights[i].toFixed(2);
    return `${d}(t=${t},w=${w})`;
  });
  return `QualityGate[min=${gate.minScore.toFixed(2)} ${parts.join(' ')}]`;
}

/** List the dimensions that would fail their threshold given a score map. */
export function failingDimensions(
  scores: QualityScores,
  thresholds: QualityThresholds
): QualityDimension[] {
  const out: QualityDimension[] = [];
  for (const d of ALL_DIMENSIONS) {
    if (clampUnit(scores[d]) < thresholds[d]) out.push(d);
  }
  return out;
}
