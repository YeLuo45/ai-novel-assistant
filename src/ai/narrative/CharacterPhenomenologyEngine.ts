/**
 * V1036 CharacterPhenomenologyEngine — Direction C Iter 6/20 (Round 5)
 * Character phenomenology engine: lived experience + perception
 * Sources: ruflo phenomenology + nanobot + chatdev
 */

export type PhenomenologicalMode = 'perception' | 'thought' | 'emotion' | 'sensation' | 'imagination' | 'memory';
export type PhenomenologicalDepth = 'surface' | 'shallow' | 'medium' | 'deep' | 'profound';
export type PhenomenologicalIntent = 'reveal' | 'conceal' | 'connect' | 'alienate' | 'intensify' | 'meditate';

export interface CharacterPhenomenon {
  phenomenonId: string;
  mode: PhenomenologicalMode;
  depth: PhenomenologicalDepth;
  intent: PhenomenologicalIntent;
  characterId: string;
  description: string;
  vividness: number;
  immersion: number;
  chapter: number;
}

export interface PhenomenologicalLayer {
  layerId: string,
  phenomenonIds: string[],
  depth: number,
  continuity: number,
}

export interface CharacterPhenomenologyEngineState {
  phenomena: Map<string, CharacterPhenomenon>;
  layers: Map<string, PhenomenologicalLayer>;
  totalPhenomena: number;
  totalLayers: number;
  averageVividness: number;
  averageImmersion: number;
  layerContinuity: number;
  phenomenologyMastery: number;
}

// Factory
export function createCharacterPhenomenologyEngineState(): CharacterPhenomenologyEngineState {
  return {
    phenomena: new Map(),
    layers: new Map(),
    totalPhenomena: 0,
    totalLayers: 0,
    averageVividness: 0.5,
    averageImmersion: 0.5,
    layerContinuity: 0.5,
    phenomenologyMastery: 0.5,
  };
}

// Add phenomenon
export function addPhenomenon(
  state: CharacterPhenomenologyEngineState,
  phenomenonId: string,
  mode: PhenomenologicalMode,
  depth: PhenomenologicalDepth,
  intent: PhenomenologicalIntent,
  characterId: string,
  description: string,
  vividness: number,
  immersion: number,
  chapter: number
): CharacterPhenomenologyEngineState {
  const phenomenon: CharacterPhenomenon = { phenomenonId, mode, depth, intent, characterId, description, vividness, immersion, chapter };
  const phenomena = new Map(state.phenomena).set(phenomenonId, phenomenon);
  return recomputePhenomenology({ ...state, phenomena, totalPhenomena: phenomena.size });
}

// Add layer
export function addPhenomenologicalLayer(
  state: CharacterPhenomenologyEngineState,
  layerId: string,
  phenomenonIds: string[]
): CharacterPhenomenologyEngineState {
  const phenomena = phenomenonIds.map(id => state.phenomena.get(id)).filter((p): p is CharacterPhenomenon => p !== undefined);
  const depth = phenomena.length === 0 ? 0
    : phenomena.reduce((s, p) => s + p.immersion, 0) / phenomena.length;
  const continuity = phenomena.length < 2 ? 0.5
    : 1 - Math.abs(phenomena[0].vividness - phenomena[phenomena.length - 1].vividness);
  const layer: PhenomenologicalLayer = { layerId, phenomenonIds, depth, continuity };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputePhenomenology({ ...state, layers, totalLayers: layers.size });
}

// Get phenomena by mode
export function getPhenomenaByMode(state: CharacterPhenomenologyEngineState, mode: PhenomenologicalMode): CharacterPhenomenon[] {
  return Array.from(state.phenomena.values()).filter(p => p.mode === mode);
}

// Get phenomenology report
export function getPhenomenologyReport(state: CharacterPhenomenologyEngineState): {
  totalPhenomena: number;
  totalLayers: number;
  averageVividness: number;
  averageImmersion: number;
  phenomenologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPhenomena === 0) recommendations.push('No phenomena — add character phenomena');
  if (state.averageImmersion < 0.5) recommendations.push('Low immersion — strengthen');
  if (state.phenomenologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPhenomena: state.totalPhenomena,
    totalLayers: state.totalLayers,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    averageImmersion: Math.round(state.averageImmersion * 100) / 100,
    phenomenologyMastery: Math.round(state.phenomenologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePhenomenology(state: CharacterPhenomenologyEngineState): CharacterPhenomenologyEngineState {
  const phenomena = Array.from(state.phenomena.values());
  const averageVividness = phenomena.length === 0 ? 0.5
    : phenomena.reduce((s, p) => s + p.vividness, 0) / phenomena.length;
  const averageImmersion = phenomena.length === 0 ? 0.5
    : phenomena.reduce((s, p) => s + p.immersion, 0) / phenomena.length;

  const layers = Array.from(state.layers.values());
  const layerContinuity = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.continuity, 0) / layers.length;

  const phenomenologyMastery = (averageVividness * 0.4 + averageImmersion * 0.4 + layerContinuity * 0.2);

  return { ...state, averageVividness, averageImmersion, layerContinuity, phenomenologyMastery };
}

// Reset
export function resetCharacterPhenomenologyEngineState(): CharacterPhenomenologyEngineState {
  return createCharacterPhenomenologyEngineState();
}