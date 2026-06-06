/**
 * V1178 NarrativeEuphonyEngine — Direction F Iter 17/20 (Round 5)
 * Euphony engine: pleasing sound in narrative prose
 * Sources: nanobot euphony + thunderbolt + ruflo
 */

export type EuphonyType = 'liquid' | 'nasal' | 'sibilant' | 'plosive' | 'fricative' | 'vowel_rich';
export type EuphonyPleasingness = 'discordant' | 'rough' | 'pleasant' | 'melodious' | 'lush';
export type EuphonyTexture = 'thin' | 'smooth' | 'rich' | 'opulent' | 'sumptuous';

export interface Euphony {
  euphonyId: string;
  type: EuphonyType;
  pleasingness: EuphonyPleasingness;
  texture: EuphonyTexture;
  description: string;
  music: number;
  effect: number;
  chapter: number;
}

export interface EuphonyLayer {
  layerId: string,
  euphonyIds: string[],
  cumulativeMusic: number,
  richness: number,
}

export interface NarrativeEuphonyEngineState {
  euphonies: Map<string, Euphony>;
  layers: Map<string, EuphonyLayer>;
  totalEuphonies: number;
  totalLayers: number;
  averageMusic: number;
  averageEffect: number;
  layerRichness: number;
  euphonyMastery: number;
}

// Factory
export function createNarrativeEuphonyEngineState(): NarrativeEuphonyEngineState {
  return {
    euphonies: new Map(),
    layers: new Map(),
    totalEuphonies: 0,
    totalLayers: 0,
    averageMusic: 0.5,
    averageEffect: 0.5,
    layerRichness: 0.5,
    euphonyMastery: 0.5,
  };
}

// Add euphony
export function addEuphony(
  state: NarrativeEuphonyEngineState,
  euphonyId: string,
  type: EuphonyType,
  pleasingness: EuphonyPleasingness,
  texture: EuphonyTexture,
  description: string,
  music: number,
  effect: number,
  chapter: number
): NarrativeEuphonyEngineState {
  const euphony: Euphony = { euphonyId, type, pleasingness, texture, description, music, effect, chapter };
  const euphonies = new Map(state.euphonies).set(euphonyId, euphony);
  return recomputeEuphony({ ...state, euphonies, totalEuphonies: euphonies.size });
}

// Add layer
export function addEuphonyLayer(
  state: NarrativeEuphonyEngineState,
  layerId: string,
  euphonyIds: string[]
): NarrativeEuphonyEngineState {
  const euphonies = euphonyIds.map(id => state.euphonies.get(id)).filter((e): e is Euphony => e !== undefined);
  const cumulativeMusic = euphonies.length === 0 ? 0
    : euphonies.reduce((s, e) => s + e.music, 0) / euphonies.length;
  const typeSet = new Set(euphonies.map(e => e.type));
  const richness = Math.min(1, typeSet.size / 6);
  const layer: EuphonyLayer = { layerId, euphonyIds, cumulativeMusic, richness };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeEuphony({ ...state, layers, totalLayers: layers.size });
}

// Get euphonies by type
export function getEuphoniesByType(state: NarrativeEuphonyEngineState, type: EuphonyType): Euphony[] {
  return Array.from(state.euphonies.values()).filter(e => e.type === type);
}

// Get euphony report
export function getEuphonyReport(state: NarrativeEuphonyEngineState): {
  totalEuphonies: number;
  totalLayers: number;
  averageMusic: number;
  averageEffect: number;
  euphonyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEuphonies === 0) recommendations.push('No euphonies — add euphonies');
  if (state.averageMusic < 0.5) recommendations.push('Low music — strengthen');
  if (state.euphonyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEuphonies: state.totalEuphonies,
    totalLayers: state.totalLayers,
    averageMusic: Math.round(state.averageMusic * 100) / 100,
    averageEffect: Math.round(state.averageEffect * 100) / 100,
    euphonyMastery: Math.round(state.euphonyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEuphony(state: NarrativeEuphonyEngineState): NarrativeEuphonyEngineState {
  const euphonies = Array.from(state.euphonies.values());
  const averageMusic = euphonies.length === 0 ? 0.5
    : euphonies.reduce((s, e) => s + e.music, 0) / euphonies.length;
  const averageEffect = euphonies.length === 0 ? 0.5
    : euphonies.reduce((s, e) => s + e.effect, 0) / euphonies.length;

  const layers = Array.from(state.layers.values());
  const layerRichness = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.richness, 0) / layers.length;

  const euphonyMastery = (averageMusic * 0.4 + averageEffect * 0.3 + layerRichness * 0.3);

  return { ...state, averageMusic, averageEffect, layerRichness, euphonyMastery };
}

// Reset
export function resetNarrativeEuphonyEngineState(): NarrativeEuphonyEngineState {
  return createNarrativeEuphonyEngineState();
}