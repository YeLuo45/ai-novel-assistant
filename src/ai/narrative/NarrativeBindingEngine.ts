/**
 * V1080 NarrativeBindingEngine — Direction D Iter 8/20 (Round 6)
 * Narrative binding engine: bind elements together in narrative
 * Sources: ruflo binding + thunderbolt + nanobot
 */

export type BindingType = 'thematic' | 'symbolic' | 'motivic' | 'narrative' | 'causal' | 'mystical';
export type BindingStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'unbreakable';
export type BindingScope = 'local' | 'sectional' | 'arc' | 'narrative' | 'meta';

export interface Binding {
  bindingId: string;
  type: BindingType;
  strength: BindingStrength;
  scope: BindingScope;
  description: string;
  cohesion: number;
  resonance: number;
  chapter: number;
}

export interface BindingNetwork {
  networkId: string,
  name: string,
  bindingIds: string[],
  cumulativeResonance: number,
  depth: number,
}

export interface NarrativeBindingEngineState {
  bindings: Map<string, Binding>;
  networks: Map<string, BindingNetwork>;
  totalBindings: number;
  totalNetworks: number;
  averageCohesion: number;
  averageResonance: number;
  networkDepth: number;
  bindingMastery: number;
}

// Factory
export function createNarrativeBindingEngineState(): NarrativeBindingEngineState {
  return {
    bindings: new Map(),
    networks: new Map(),
    totalBindings: 0,
    totalNetworks: 0,
    averageCohesion: 0.5,
    averageResonance: 0.5,
    networkDepth: 0.5,
    bindingMastery: 0.5,
  };
}

// Add binding
export function addBinding(
  state: NarrativeBindingEngineState,
  bindingId: string,
  type: BindingType,
  strength: BindingStrength,
  scope: BindingScope,
  description: string,
  cohesion: number,
  resonance: number,
  chapter: number
): NarrativeBindingEngineState {
  const binding: Binding = { bindingId, type, strength, scope, description, cohesion, resonance, chapter };
  const bindings = new Map(state.bindings).set(bindingId, binding);
  return recomputeBinding({ ...state, bindings, totalBindings: bindings.size });
}

// Add network
export function addBindingNetwork(
  state: NarrativeBindingEngineState,
  networkId: string,
  name: string,
  bindingIds: string[]
): NarrativeBindingEngineState {
  const bindings = bindingIds.map(id => state.bindings.get(id)).filter((b): b is Binding => b !== undefined);
  const cumulativeResonance = bindings.length === 0 ? 0
    : bindings.reduce((s, b) => s + b.resonance, 0) / bindings.length;
  const typeSet = new Set(bindings.map(b => b.type));
  const depth = Math.min(1, typeSet.size / 6);
  const network: BindingNetwork = { networkId, name, bindingIds, cumulativeResonance, depth };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeBinding({ ...state, networks, totalNetworks: networks.size });
}

// Get bindings by type
export function getBindingsByType(state: NarrativeBindingEngineState, type: BindingType): Binding[] {
  return Array.from(state.bindings.values()).filter(b => b.type === type);
}

// Get binding report
export function getBindingReport(state: NarrativeBindingEngineState): {
  totalBindings: number;
  totalNetworks: number;
  averageCohesion: number;
  averageResonance: number;
  bindingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBindings === 0) recommendations.push('No bindings — add bindings');
  if (state.averageCohesion < 0.5) recommendations.push('Low cohesion — strengthen');
  if (state.bindingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalBindings: state.totalBindings,
    totalNetworks: state.totalNetworks,
    averageCohesion: Math.round(state.averageCohesion * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    bindingMastery: Math.round(state.bindingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeBinding(state: NarrativeBindingEngineState): NarrativeBindingEngineState {
  const bindings = Array.from(state.bindings.values());
  const averageCohesion = bindings.length === 0 ? 0.5
    : bindings.reduce((s, b) => s + b.cohesion, 0) / bindings.length;
  const averageResonance = bindings.length === 0 ? 0.5
    : bindings.reduce((s, b) => s + b.resonance, 0) / bindings.length;

  const networks = Array.from(state.networks.values());
  const networkDepth = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.depth, 0) / networks.length;

  const bindingMastery = (averageCohesion * 0.4 + averageResonance * 0.3 + networkDepth * 0.3);

  return { ...state, averageCohesion, averageResonance, networkDepth, bindingMastery };
}

// Reset
export function resetNarrativeBindingEngineState(): NarrativeBindingEngineState {
  return createNarrativeBindingEngineState();
}