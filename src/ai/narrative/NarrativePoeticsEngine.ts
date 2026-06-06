/**
 * V1056 NarrativePoeticsEngine — Direction C Iter 16/20 (Round 5)
 * Narrative poetics engine: poetic devices in narrative
 * Sources: ruflo poetics + nanobot + chatdev
 */

export type PoeticDevice = 'imagery' | 'symbol' | 'alliteration' | 'rhythm' | 'sound' | 'structure';
export type PoeticForm = 'sonnet' | 'free_verse' | 'lyric' | 'epic' | 'ode' | 'elegy';
export type PoeticDepth = 'surface' | 'layered' | 'multivalent' | 'archetypal' | 'transcendent';

export interface NarrativePoetic {
  poeticId: string;
  device: PoeticDevice;
  form: PoeticForm;
  depth: PoeticDepth;
  description: string;
  music: number;
  meaning: number;
  chapter: number;
}

export interface PoeticLayer {
  layerId: string,
  poeticIds: string[],
  cumulativeMeaning: number,
  musicality: number,
}

export interface NarrativePoeticsEngineState {
  poetics: Map<string, NarrativePoetic>;
  layers: Map<string, PoeticLayer>;
  totalPoetics: number;
  totalLayers: number;
  averageMusic: number;
  averageMeaning: number;
  layerMusicality: number;
  poeticsMastery: number;
}

// Factory
export function createNarrativePoeticsEngineState(): NarrativePoeticsEngineState {
  return {
    poetics: new Map(),
    layers: new Map(),
    totalPoetics: 0,
    totalLayers: 0,
    averageMusic: 0.5,
    averageMeaning: 0.5,
    layerMusicality: 0.5,
    poeticsMastery: 0.5,
  };
}

// Add poetic
export function addNarrativePoetic(
  state: NarrativePoeticsEngineState,
  poeticId: string,
  device: PoeticDevice,
  form: PoeticForm,
  depth: PoeticDepth,
  description: string,
  music: number,
  meaning: number,
  chapter: number
): NarrativePoeticsEngineState {
  const poetic: NarrativePoetic = { poeticId, device, form, depth, description, music, meaning, chapter };
  const poetics = new Map(state.poetics).set(poeticId, poetic);
  return recomputePoetics({ ...state, poetics, totalPoetics: poetics.size });
}

// Add layer
export function addPoeticLayer(
  state: NarrativePoeticsEngineState,
  layerId: string,
  poeticIds: string[]
): NarrativePoeticsEngineState {
  const poetics = poeticIds.map(id => state.poetics.get(id)).filter((p): p is NarrativePoetic => p !== undefined);
  const cumulativeMeaning = poetics.length === 0 ? 0
    : poetics.reduce((s, p) => s + p.meaning, 0) / poetics.length;
  const musicality = poetics.length === 0 ? 0
    : poetics.reduce((s, p) => s + p.music, 0) / poetics.length;
  const layer: PoeticLayer = { layerId, poeticIds, cumulativeMeaning, musicality };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputePoetics({ ...state, layers, totalLayers: layers.size });
}

// Get poetics by device
export function getPoeticsByDevice(state: NarrativePoeticsEngineState, device: PoeticDevice): NarrativePoetic[] {
  return Array.from(state.poetics.values()).filter(p => p.device === device);
}

// Get poetics report
export function getPoeticsReport(state: NarrativePoeticsEngineState): {
  totalPoetics: number;
  totalLayers: number;
  averageMusic: number;
  averageMeaning: number;
  poeticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPoetics === 0) recommendations.push('No poetics — add narrative poetics');
  if (state.averageMusic < 0.5) recommendations.push('Low music — strengthen');
  if (state.poeticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPoetics: state.totalPoetics,
    totalLayers: state.totalLayers,
    averageMusic: Math.round(state.averageMusic * 100) / 100,
    averageMeaning: Math.round(state.averageMeaning * 100) / 100,
    poeticsMastery: Math.round(state.poeticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePoetics(state: NarrativePoeticsEngineState): NarrativePoeticsEngineState {
  const poetics = Array.from(state.poetics.values());
  const averageMusic = poetics.length === 0 ? 0.5
    : poetics.reduce((s, p) => s + p.music, 0) / poetics.length;
  const averageMeaning = poetics.length === 0 ? 0.5
    : poetics.reduce((s, p) => s + p.meaning, 0) / poetics.length;

  const layers = Array.from(state.layers.values());
  const layerMusicality = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.musicality, 0) / layers.length;

  const poeticsMastery = (averageMusic * 0.4 + averageMeaning * 0.4 + layerMusicality * 0.2);

  return { ...state, averageMusic, averageMeaning, layerMusicality, poeticsMastery };
}

// Reset
export function resetNarrativePoeticsEngineState(): NarrativePoeticsEngineState {
  return createNarrativePoeticsEngineState();
}