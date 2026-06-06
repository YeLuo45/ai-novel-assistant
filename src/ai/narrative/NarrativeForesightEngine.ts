/**
 * V1070 NarrativeForesightEngine — Direction D Iter 3/20 (Round 6)
 * Narrative foresight engine: predict narrative outcomes + trends
 * Sources: generic-agent foresight + thunderbolt + nanobot
 */

export type ForesightScope = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'arc_wide';
export type ForesightConfidence = 'speculative' | 'low' | 'moderate' | 'high' | 'certain';
export type ForesightType = 'plot' | 'character' | 'reader' | 'theme' | 'market' | 'meta';

export interface ForesightPrediction {
  predictionId: string;
  scope: ForesightScope;
  confidence: ForesightConfidence;
  type: ForesightType;
  description: string;
  likelihood: number;
  impact: number;
  timestamp: number;
}

export interface ForesightValidation {
  validationId: string,
  predictionId: string,
  actualOutcome: number,
  accuracy: number,
  surprise: number,
}

export interface NarrativeForesightEngineState {
  predictions: Map<string, ForesightPrediction>;
  validations: Map<string, ForesightValidation>;
  totalPredictions: number;
  totalValidations: number;
  averageLikelihood: number;
  averageImpact: number;
  validationAccuracy: number;
  foresightMastery: number;
}

// Factory
export function createNarrativeForesightEngineState(): NarrativeForesightEngineState {
  return {
    predictions: new Map(),
    validations: new Map(),
    totalPredictions: 0,
    totalValidations: 0,
    averageLikelihood: 0.5,
    averageImpact: 0.5,
    validationAccuracy: 0.5,
    foresightMastery: 0.5,
  };
}

// Add prediction
export function addForesightPrediction(
  state: NarrativeForesightEngineState,
  predictionId: string,
  scope: ForesightScope,
  confidence: ForesightConfidence,
  type: ForesightType,
  description: string,
  likelihood: number,
  impact: number,
  timestamp: number
): NarrativeForesightEngineState {
  const prediction: ForesightPrediction = { predictionId, scope, confidence, type, description, likelihood, impact, timestamp };
  const predictions = new Map(state.predictions).set(predictionId, prediction);
  return recomputeForesight({ ...state, predictions, totalPredictions: predictions.size });
}

// Validate
export function validateForesight(
  state: NarrativeForesightEngineState,
  validationId: string,
  predictionId: string,
  actualOutcome: number
): NarrativeForesightEngineState {
  const prediction = state.predictions.get(predictionId);
  const accuracy = prediction ? 1 - Math.abs(prediction.likelihood - actualOutcome) : 0.5;
  const surprise = prediction ? Math.abs(prediction.impact - actualOutcome) : 0;
  const validation: ForesightValidation = { validationId, predictionId, actualOutcome, accuracy, surprise };
  const validations = new Map(state.validations).set(validationId, validation);
  return recomputeForesight({ ...state, validations, totalValidations: validations.size });
}

// Get predictions by scope
export function getPredictionsByScope(state: NarrativeForesightEngineState, scope: ForesightScope): ForesightPrediction[] {
  return Array.from(state.predictions.values()).filter(p => p.scope === scope);
}

// Get foresight report
export function getForesightReport(state: NarrativeForesightEngineState): {
  totalPredictions: number;
  totalValidations: number;
  averageLikelihood: number;
  averageImpact: number;
  foresightMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPredictions === 0) recommendations.push('No predictions — add predictions');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — improve');
  if (state.foresightMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPredictions: state.totalPredictions,
    totalValidations: state.totalValidations,
    averageLikelihood: Math.round(state.averageLikelihood * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    foresightMastery: Math.round(state.foresightMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeForesight(state: NarrativeForesightEngineState): NarrativeForesightEngineState {
  const predictions = Array.from(state.predictions.values());
  const averageLikelihood = predictions.length === 0 ? 0.5
    : predictions.reduce((s, p) => s + p.likelihood, 0) / predictions.length;
  const averageImpact = predictions.length === 0 ? 0.5
    : predictions.reduce((s, p) => s + p.impact, 0) / predictions.length;

  const validations = Array.from(state.validations.values());
  const validationAccuracy = validations.length === 0 ? 0.5
    : validations.reduce((s, v) => s + v.accuracy, 0) / validations.length;

  const foresightMastery = (averageLikelihood * 0.3 + averageImpact * 0.3 + validationAccuracy * 0.4);

  return { ...state, averageLikelihood, averageImpact, validationAccuracy, foresightMastery };
}

// Reset
export function resetNarrativeForesightEngineState(): NarrativeForesightEngineState {
  return createNarrativeForesightEngineState();
}