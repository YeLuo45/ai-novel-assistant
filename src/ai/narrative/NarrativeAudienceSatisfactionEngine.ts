/**
 * V1230 NarrativeAudienceSatisfactionEngine — Direction H Iter 3/20 (Round 5)
 * Audience satisfaction engine: satisfaction of audience
 * Sources: ruflo satisfaction + nanobot + thunderbolt
 */

export type AudienceSatisfactionType = 'emotional' | 'intellectual' | 'aesthetic' | 'narrative' | 'thematic' | 'experiential';
export type AudienceSatisfactionDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'transformative';
export type AudienceSatisfactionDuration = 'instant' | 'brief' | 'moderate' | 'lasting' | 'permanent';

export interface AudienceSatisfaction {
  satisfactionId: string;
  type: AudienceSatisfactionType;
  depth: AudienceSatisfactionDepth;
  duration: AudienceSatisfactionDuration;
  description: string;
  fulfillment: number;
  resonance: number;
  chapter: number;
}

export interface AudienceSatisfactionLayer {
  layerId: string,
  satisfactionIds: string[],
  cumulativeFulfillment: number,
  richness: number,
}

export interface NarrativeAudienceSatisfactionEngineState {
  satisfactions: Map<string, AudienceSatisfaction>;
  layers: Map<string, AudienceSatisfactionLayer>;
  totalSatisfactions: number;
  totalLayers: number;
  averageFulfillment: number;
  averageResonance: number;
  layerRichness: number;
  audienceSatisfactionMastery: number;
}

// Factory
export function createNarrativeAudienceSatisfactionEngineState(): NarrativeAudienceSatisfactionEngineState {
  return {
    satisfactions: new Map(),
    layers: new Map(),
    totalSatisfactions: 0,
    totalLayers: 0,
    averageFulfillment: 0.5,
    averageResonance: 0.5,
    layerRichness: 0.5,
    audienceSatisfactionMastery: 0.5,
  };
}

// Add satisfaction
export function addAudienceSatisfaction(
  state: NarrativeAudienceSatisfactionEngineState,
  satisfactionId: string,
  type: AudienceSatisfactionType,
  depth: AudienceSatisfactionDepth,
  duration: AudienceSatisfactionDuration,
  description: string,
  fulfillment: number,
  resonance: number,
  chapter: number
): NarrativeAudienceSatisfactionEngineState {
  const satisfaction: AudienceSatisfaction = { satisfactionId, type, depth, duration, description, fulfillment, resonance, chapter };
  const satisfactions = new Map(state.satisfactions).set(satisfactionId, satisfaction);
  return recomputeAudienceSatisfaction({ ...state, satisfactions, totalSatisfactions: satisfactions.size });
}

// Add layer
export function addAudienceSatisfactionLayer(
  state: NarrativeAudienceSatisfactionEngineState,
  layerId: string,
  satisfactionIds: string[]
): NarrativeAudienceSatisfactionEngineState {
  const satisfactions = satisfactionIds.map(id => state.satisfactions.get(id)).filter((s): s is AudienceSatisfaction => s !== undefined);
  const cumulativeFulfillment = satisfactions.length === 0 ? 0
    : satisfactions.reduce((s, sa) => s + sa.fulfillment, 0) / satisfactions.length;
  const typeSet = new Set(satisfactions.map(s => s.type));
  const richness = Math.min(1, typeSet.size / 6);
  const layer: AudienceSatisfactionLayer = { layerId, satisfactionIds, cumulativeFulfillment, richness };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeAudienceSatisfaction({ ...state, layers, totalLayers: layers.size });
}

// Get satisfactions by type
export function getAudienceSatisfactionsByType(state: NarrativeAudienceSatisfactionEngineState, type: AudienceSatisfactionType): AudienceSatisfaction[] {
  return Array.from(state.satisfactions.values()).filter(s => s.type === type);
}

// Get audience satisfaction report
export function getAudienceSatisfactionReport(state: NarrativeAudienceSatisfactionEngineState): {
  totalSatisfactions: number;
  totalLayers: number;
  averageFulfillment: number;
  averageResonance: number;
  audienceSatisfactionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSatisfactions === 0) recommendations.push('No satisfactions — add audience satisfactions');
  if (state.averageFulfillment < 0.5) recommendations.push('Low fulfillment — strengthen');
  if (state.audienceSatisfactionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSatisfactions: state.totalSatisfactions,
    totalLayers: state.totalLayers,
    averageFulfillment: Math.round(state.averageFulfillment * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    audienceSatisfactionMastery: Math.round(state.audienceSatisfactionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceSatisfaction(state: NarrativeAudienceSatisfactionEngineState): NarrativeAudienceSatisfactionEngineState {
  const satisfactions = Array.from(state.satisfactions.values());
  const averageFulfillment = satisfactions.length === 0 ? 0.5
    : satisfactions.reduce((s, sa) => s + sa.fulfillment, 0) / satisfactions.length;
  const averageResonance = satisfactions.length === 0 ? 0.5
    : satisfactions.reduce((s, sa) => s + sa.resonance, 0) / satisfactions.length;

  const layers = Array.from(state.layers.values());
  const layerRichness = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.richness, 0) / layers.length;

  const audienceSatisfactionMastery = (averageFulfillment * 0.4 + averageResonance * 0.3 + layerRichness * 0.3);

  return { ...state, averageFulfillment, averageResonance, layerRichness, audienceSatisfactionMastery };
}

// Reset
export function resetNarrativeAudienceSatisfactionEngineState(): NarrativeAudienceSatisfactionEngineState {
  return createNarrativeAudienceSatisfactionEngineState();
}