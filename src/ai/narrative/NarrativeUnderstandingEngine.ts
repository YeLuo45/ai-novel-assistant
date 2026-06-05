/**
 * V818 NarrativeUnderstandingEngine — Direction E Iter 5/9 (Round 3)
 * Narrative understanding engine: deep understanding + meaning extraction
 * Sources: nanobot understanding + chatdev + thunderbolt
 */

export type UnderstandingDepth = 'surface' | 'functional' | 'intentional' | 'cultural' | 'philosophical';
export type UnderstandingAspect = 'meaning' | 'purpose' | 'value' | 'beauty' | 'truth' | 'emotion';
export type UnderstandingConfidence = 'tentative' | 'probable' | 'confident' | 'certain';

export interface Understanding {
  understandingId: string;
  aspect: UnderstandingAspect;
  depth: UnderstandingDepth;
  confidence: UnderstandingConfidence;
  subject: string;
  interpretation: string;
  evidence: string[];
  counterEvidence: string[];
  timestamp: number;
}

export interface Interpretation {
  interpretationId: string;
  understandingId: string;
  text: string;
  alternativeText: string;
  chosen: boolean;
  rationale: string;
  quality: number;
}

export interface NarrativeUnderstandingEngineState {
  understandings: Map<string, Understanding>;
  interpretations: Map<string, Interpretation>;
  totalUnderstandings: number;
  totalInterpretations: number;
  chosenInterpretations: number;
  averageQuality: number;
  depthDistribution: Map<UnderstandingDepth, number>;
  understandingBreadth: number;
  certaintyLevel: number;
}

// Factory
export function createNarrativeUnderstandingEngineState(): NarrativeUnderstandingEngineState {
  return {
    understandings: new Map(),
    interpretations: new Map(),
    totalUnderstandings: 0,
    totalInterpretations: 0,
    chosenInterpretations: 0,
    averageQuality: 0.5,
    depthDistribution: new Map(),
    understandingBreadth: 0,
    certaintyLevel: 0.5,
  };
}

// Add understanding
export function addUnderstanding(
  state: NarrativeUnderstandingEngineState,
  understandingId: string,
  aspect: UnderstandingAspect,
  depth: UnderstandingDepth,
  subject: string,
  interpretation: string,
  confidence: UnderstandingConfidence = 'probable',
  evidence: string[] = [],
  counterEvidence: string[] = []
): NarrativeUnderstandingEngineState {
  const understanding: Understanding = {
    understandingId, aspect, depth, confidence,
    subject, interpretation, evidence, counterEvidence, timestamp: Date.now(),
  };
  const understandings = new Map(state.understandings).set(understandingId, understanding);
  const depthDistribution = new Map(state.depthDistribution);
  depthDistribution.set(depth, (depthDistribution.get(depth) || 0) + 1);
  return recomputeUnderstanding({ ...state, understandings, depthDistribution, totalUnderstandings: understandings.size });
}

// Add interpretation
export function addInterpretation(
  state: NarrativeUnderstandingEngineState,
  interpretationId: string,
  understandingId: string,
  text: string,
  quality: number,
  rationale: string = '',
  alternativeText: string = ''
): NarrativeUnderstandingEngineState {
  const interpretation: Interpretation = {
    interpretationId, understandingId, text, alternativeText,
    chosen: false, rationale, quality: Math.min(1, Math.max(0, quality)),
  };
  const interpretations = new Map(state.interpretations).set(interpretationId, interpretation);
  return recomputeUnderstanding({ ...state, interpretations, totalInterpretations: interpretations.size });
}

// Choose interpretation
export function chooseInterpretation(state: NarrativeUnderstandingEngineState, interpretationId: string): NarrativeUnderstandingEngineState {
  const interpretation = state.interpretations.get(interpretationId);
  if (!interpretation) return state;

  const updated: Interpretation = { ...interpretation, chosen: true };
  const interpretations = new Map(state.interpretations).set(interpretationId, updated);
  const chosenInterpretations = state.chosenInterpretations + 1;
  return recomputeUnderstanding({ ...state, interpretations, chosenInterpretations });
}

// Get understandings by aspect
export function getUnderstandingsByAspect(state: NarrativeUnderstandingEngineState, aspect: UnderstandingAspect): Understanding[] {
  return Array.from(state.understandings.values()).filter(u => u.aspect === aspect);
}

// Get understanding report
export function getUnderstandingReport(state: NarrativeUnderstandingEngineState): {
  totalUnderstandings: number;
  totalInterpretations: number;
  chosenInterpretations: number;
  averageQuality: number;
  understandingBreadth: number;
  certaintyLevel: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalUnderstandings === 0) recommendations.push('No understandings — add them');
  if (state.chosenInterpretations < state.totalInterpretations / 2) recommendations.push('Few chosen — commit to interpretations');
  if (state.certaintyLevel < 0.5) recommendations.push('Low certainty — gather evidence');

  return {
    totalUnderstandings: state.totalUnderstandings,
    totalInterpretations: state.totalInterpretations,
    chosenInterpretations: state.chosenInterpretations,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    understandingBreadth: Math.round(state.understandingBreadth * 100) / 100,
    certaintyLevel: Math.round(state.certaintyLevel * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeUnderstanding(state: NarrativeUnderstandingEngineState): NarrativeUnderstandingEngineState {
  const interpretations = Array.from(state.interpretations.values());
  const averageQuality = interpretations.length === 0 ? 0.5
    : interpretations.reduce((s, i) => s + i.quality, 0) / interpretations.length;

  const aspectSet = new Set(Array.from(state.understandings.values()).map(u => u.aspect));
  const understandingBreadth = Math.min(1, aspectSet.size / 5);

  const confidenceMap: Record<UnderstandingConfidence, number> = { tentative: 0.2, probable: 0.5, confident: 0.8, certain: 1.0 };
  const certainties = Array.from(state.understandings.values()).map(u => confidenceMap[u.confidence]);
  const certaintyLevel = certainties.length === 0 ? 0.5
    : certainties.reduce((s, c) => s + c, 0) / certainties.length;

  return { ...state, averageQuality, understandingBreadth, certaintyLevel };
}

// Reset understanding state
export function resetNarrativeUnderstandingEngineState(): NarrativeUnderstandingEngineState {
  return createNarrativeUnderstandingEngineState();
}