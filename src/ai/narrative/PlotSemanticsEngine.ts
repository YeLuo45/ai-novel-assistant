/**
 * V1046 PlotSemanticsEngine — Direction C Iter 11/20 (Round 5)
 * Plot semantics engine: meaning of plot elements
 * Sources: ruflo semantics + nanobot + thunderbolt
 */

export type SemanticField = 'literal' | 'symbolic' | 'metaphoric' | 'allegoric' | 'mythic' | 'archetypal';
export type SemanticResonance = 'personal' | 'cultural' | 'universal' | 'timeless' | 'transcendent';
export type SemanticDensity = 'sparse' | 'moderate' | 'rich' | 'dense' | 'overwhelming';

export interface PlotSemantic {
  semanticId: string;
  field: SemanticField;
  resonance: SemanticResonance;
  density: SemanticDensity;
  description: string;
  meaning: number;
  richness: number;
  chapter: number;
}

export interface SemanticNetwork {
  networkId: string,
  name: string,
  semanticIds: string[],
  coherence: number,
  depth: number,
}

export interface PlotSemanticsEngineState {
  semantics: Map<string, PlotSemantic>;
  networks: Map<string, SemanticNetwork>;
  totalSemantics: number;
  totalNetworks: number;
  averageMeaning: number;
  averageRichness: number;
  networkDepth: number;
  semanticsMastery: number;
}

// Factory
export function createPlotSemanticsEngineState(): PlotSemanticsEngineState {
  return {
    semantics: new Map(),
    networks: new Map(),
    totalSemantics: 0,
    totalNetworks: 0,
    averageMeaning: 0.5,
    averageRichness: 0.5,
    networkDepth: 0.5,
    semanticsMastery: 0.5,
  };
}

// Add semantic
export function addPlotSemantic(
  state: PlotSemanticsEngineState,
  semanticId: string,
  field: SemanticField,
  resonance: SemanticResonance,
  density: SemanticDensity,
  description: string,
  meaning: number,
  richness: number,
  chapter: number
): PlotSemanticsEngineState {
  const semantic: PlotSemantic = { semanticId, field, resonance, density, description, meaning, richness, chapter };
  const semantics = new Map(state.semantics).set(semanticId, semantic);
  return recomputeSemantics({ ...state, semantics, totalSemantics: semantics.size });
}

// Add network
export function addSemanticNetwork(
  state: PlotSemanticsEngineState,
  networkId: string,
  name: string,
  semanticIds: string[]
): PlotSemanticsEngineState {
  const semantics = semanticIds.map(id => state.semantics.get(id)).filter((s): s is PlotSemantic => s !== undefined);
  const depth = semantics.length === 0 ? 0
    : semantics.reduce((s, sm) => s + sm.richness, 0) / semantics.length;
  const fieldSet = new Set(semantics.map(s => s.field));
  const coherence = Math.min(1, fieldSet.size / 6);
  const network: SemanticNetwork = { networkId, name, semanticIds, coherence, depth };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeSemantics({ ...state, networks, totalNetworks: networks.size });
}

// Get semantics by field
export function getSemanticsByField(state: PlotSemanticsEngineState, field: SemanticField): PlotSemantic[] {
  return Array.from(state.semantics.values()).filter(s => s.field === field);
}

// Get semantics report
export function getSemanticsReport(state: PlotSemanticsEngineState): {
  totalSemantics: number;
  totalNetworks: number;
  averageMeaning: number;
  averageRichness: number;
  semanticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSemantics === 0) recommendations.push('No semantics — add plot semantics');
  if (state.averageMeaning < 0.5) recommendations.push('Low meaning — strengthen');
  if (state.semanticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSemantics: state.totalSemantics,
    totalNetworks: state.totalNetworks,
    averageMeaning: Math.round(state.averageMeaning * 100) / 100,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    semanticsMastery: Math.round(state.semanticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSemantics(state: PlotSemanticsEngineState): PlotSemanticsEngineState {
  const semantics = Array.from(state.semantics.values());
  const averageMeaning = semantics.length === 0 ? 0.5
    : semantics.reduce((s, sm) => s + sm.meaning, 0) / semantics.length;
  const averageRichness = semantics.length === 0 ? 0.5
    : semantics.reduce((s, sm) => s + sm.richness, 0) / semantics.length;

  const networks = Array.from(state.networks.values());
  const networkDepth = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.depth, 0) / networks.length;

  const semanticsMastery = (averageMeaning * 0.4 + averageRichness * 0.3 + networkDepth * 0.3);

  return { ...state, averageMeaning, averageRichness, networkDepth, semanticsMastery };
}

// Reset
export function resetPlotSemanticsEngineState(): PlotSemanticsEngineState {
  return createPlotSemanticsEngineState();
}