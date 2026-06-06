/**
 * V1186 NarrativeTimeFoldEngine — Direction G Iter 1/20 (Round 5)
 * Time fold engine: folding time in narrative
 * Sources: nanobot fold + thunderbolt + ruflo
 */

export type TimeFoldType = 'forward' | 'backward' | 'parallel' | 'recursive' | 'nested' | 'convergent';
export type TimeFoldSmoothness = 'rough' | 'uneven' | 'smooth' | 'seamless' | 'invisible';
export type TimeFoldComplexity = 'simple' | 'moderate' | 'complex' | 'labyrinthine' | 'impossible';

export interface TimeFold {
  foldId: string;
  type: TimeFoldType;
  smoothness: TimeFoldSmoothness;
  complexity: TimeFoldComplexity;
  description: string;
  clarity: number;
  effect: number;
  chapter: number;
}

export interface TimeFoldPattern {
  patternId: string,
  foldIds: string[],
  cumulativeClarity: number,
  coherence: number,
}

export interface NarrativeTimeFoldEngineState {
  folds: Map<string, TimeFold>;
  patterns: Map<string, TimeFoldPattern>;
  totalFolds: number;
  totalPatterns: number;
  averageClarity: number;
  averageEffect: number;
  patternCoherence: number;
  timeFoldMastery: number;
}

// Factory
export function createNarrativeTimeFoldEngineState(): NarrativeTimeFoldEngineState {
  return {
    folds: new Map(),
    patterns: new Map(),
    totalFolds: 0,
    totalPatterns: 0,
    averageClarity: 0.5,
    averageEffect: 0.5,
    patternCoherence: 0.5,
    timeFoldMastery: 0.5,
  };
}

// Add fold
export function addTimeFold(
  state: NarrativeTimeFoldEngineState,
  foldId: string,
  type: TimeFoldType,
  smoothness: TimeFoldSmoothness,
  complexity: TimeFoldComplexity,
  description: string,
  clarity: number,
  effect: number,
  chapter: number
): NarrativeTimeFoldEngineState {
  const fold: TimeFold = { foldId, type, smoothness, complexity, description, clarity, effect, chapter };
  const folds = new Map(state.folds).set(foldId, fold);
  return recomputeTimeFold({ ...state, folds, totalFolds: folds.size });
}

// Add pattern
export function addTimeFoldPattern(
  state: NarrativeTimeFoldEngineState,
  patternId: string,
  foldIds: string[]
): NarrativeTimeFoldEngineState {
  const folds = foldIds.map(id => state.folds.get(id)).filter((f): f is TimeFold => f !== undefined);
  const cumulativeClarity = folds.length === 0 ? 0
    : folds.reduce((s, f) => s + f.clarity, 0) / folds.length;
  const typeSet = new Set(folds.map(f => f.type));
  const coherence = Math.min(1, typeSet.size / 6);
  const pattern: TimeFoldPattern = { patternId, foldIds, cumulativeClarity, coherence };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeTimeFold({ ...state, patterns, totalPatterns: patterns.size });
}

// Get folds by type
export function getTimeFoldsByType(state: NarrativeTimeFoldEngineState, type: TimeFoldType): TimeFold[] {
  return Array.from(state.folds.values()).filter(f => f.type === type);
}

// Get time fold report
export function getTimeFoldReport(state: NarrativeTimeFoldEngineState): {
  totalFolds: number;
  totalPatterns: number;
  averageClarity: number;
  averageEffect: number;
  timeFoldMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFolds === 0) recommendations.push('No folds — add time folds');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.timeFoldMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFolds: state.totalFolds,
    totalPatterns: state.totalPatterns,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageEffect: Math.round(state.averageEffect * 100) / 100,
    timeFoldMastery: Math.round(state.timeFoldMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeFold(state: NarrativeTimeFoldEngineState): NarrativeTimeFoldEngineState {
  const folds = Array.from(state.folds.values());
  const averageClarity = folds.length === 0 ? 0.5
    : folds.reduce((s, f) => s + f.clarity, 0) / folds.length;
  const averageEffect = folds.length === 0 ? 0.5
    : folds.reduce((s, f) => s + f.effect, 0) / folds.length;

  const patterns = Array.from(state.patterns.values());
  const patternCoherence = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.coherence, 0) / patterns.length;

  const timeFoldMastery = (averageClarity * 0.4 + averageEffect * 0.3 + patternCoherence * 0.3);

  return { ...state, averageClarity, averageEffect, patternCoherence, timeFoldMastery };
}

// Reset
export function resetNarrativeTimeFoldEngineState(): NarrativeTimeFoldEngineState {
  return createNarrativeTimeFoldEngineState();
}