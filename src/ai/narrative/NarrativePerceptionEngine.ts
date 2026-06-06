/**
 * V938 NarrativePerceptionEngine — Direction E Iter 2/15 (Round 4)
 * Narrative perception engine: perception of narrative elements
 * Sources: nanobot perception + chatdev + thunderbolt
 */

export type PerceptionMode = 'visual' | 'auditory' | 'kinesthetic' | 'emotional' | 'conceptual' | 'holistic';
export type PerceptionClarity = 'blurry' | 'fuzzy' | 'clear' | 'vivid' | 'crystalline';
export type PerceptionDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'profound';

export interface NarrativePercept {
  perceptId: string;
  mode: PerceptionMode;
  clarity: PerceptionClarity;
  depth: PerceptionDepth;
  content: string;
  richness: number;
  chapter: number;
}

export interface PerceptionLayer {
  layerId: string;
  perceptIds: string[];
  depth: PerceptionDepth;
  integration: number;
  coherence: number;
}

export interface NarrativePerceptionEngineState {
  percepts: Map<string, NarrativePercept>;
  layers: Map<string, PerceptionLayer>;
  totalPercepts: number;
  totalLayers: number;
  averageRichness: number;
  modeVersatility: number;
  perceptionCoherence: number;
  perceptionMastery: number;
}

// Factory
export function createNarrativePerceptionEngineState(): NarrativePerceptionEngineState {
  return {
    percepts: new Map(),
    layers: new Map(),
    totalPercepts: 0,
    totalLayers: 0,
    averageRichness: 0.5,
    modeVersatility: 0,
    perceptionCoherence: 0.5,
    perceptionMastery: 0.5,
  };
}

// Add percept
export function addNarrativePercept(
  state: NarrativePerceptionEngineState,
  perceptId: string,
  mode: PerceptionMode,
  clarity: PerceptionClarity,
  depth: PerceptionDepth,
  content: string,
  richness: number,
  chapter: number
): NarrativePerceptionEngineState {
  const percept: NarrativePercept = {
    perceptId, mode, clarity, depth, content,
    richness: Math.min(1, Math.max(0, richness)), chapter,
  };
  const percepts = new Map(state.percepts).set(perceptId, percept);
  return recomputeNarrativePerc({ ...state, percepts, totalPercepts: percepts.size });
}

// Create layer
export function createPerceptionLayer(
  state: NarrativePerceptionEngineState,
  layerId: string,
  perceptIds: string[],
  depth: PerceptionDepth
): NarrativePerceptionEngineState {
  const percepts = perceptIds.map(id => state.percepts.get(id)).filter((p): p is NarrativePercept => p !== undefined);
  const integration = percepts.length === 0 ? 0.5
    : percepts.reduce((s, p) => s + p.richness, 0) / percepts.length;
  const coherence = percepts.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(percepts[0].richness - percepts[percepts.length - 1].richness));
  const layer: PerceptionLayer = { layerId, perceptIds, depth, integration, coherence };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeNarrativePerc({ ...state, layers, totalLayers: layers.size });
}

// Get percepts by mode
export function getPerceptsByMode(state: NarrativePerceptionEngineState, mode: PerceptionMode): NarrativePercept[] {
  return Array.from(state.percepts.values()).filter(p => p.mode === mode);
}

// Get perception report
export function getPerceptionReport(state: NarrativePerceptionEngineState): {
  totalPercepts: number;
  totalLayers: number;
  averageRichness: number;
  modeVersatility: number;
  perceptionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPercepts === 0) recommendations.push('No percepts — add percepts');
  if (state.modeVersatility < 0.3) recommendations.push('Low versatility — diversify');
  if (state.perceptionMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalPercepts: state.totalPercepts,
    totalLayers: state.totalLayers,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    modeVersatility: Math.round(state.modeVersatility * 100) / 100,
    perceptionMastery: Math.round(state.perceptionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeNarrativePerc(state: NarrativePerceptionEngineState): NarrativePerceptionEngineState {
  const percepts = Array.from(state.percepts.values());
  const averageRichness = percepts.length === 0 ? 0.5
    : percepts.reduce((s, p) => s + p.richness, 0) / percepts.length;
  const modeSet = new Set(percepts.map(p => p.mode));
  const modeVersatility = Math.min(1, modeSet.size / 5);

  const layers = Array.from(state.layers.values());
  const avgCoherence = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.coherence, 0) / layers.length;
  const perceptionCoherence = avgCoherence;

  const perceptionMastery = (averageRichness * 0.4 + modeVersatility * 0.3 + perceptionCoherence * 0.3);

  return { ...state, averageRichness, modeVersatility, perceptionCoherence, perceptionMastery };
}

// Reset perception state
export function resetNarrativePerceptionEngineState(): NarrativePerceptionEngineState {
  return createNarrativePerceptionEngineState();
}