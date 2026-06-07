/**
 * V1390 NarrativeCharacterIdentityEngine — Direction K Iter 13/30 (Round 5)
 * Character identity engine: identity of character
 * Sources: nanobot identity + thunderbolt + ruflo
 */

export type CharacterIdentityCore = 'name' | 'role' | 'belief' | 'value' | 'purpose' | 'essence' | 'transcendent';
export type CharacterIdentityStability = 'fluid' | 'shifting' | 'stable' | 'firm' | 'unshakeable' | 'absolute' | 'transcendent';
export type CharacterIdentityExpression = 'hidden' | 'internal' | 'selective' | 'open' | 'transparent' | 'radiant' | 'transcendent';

export interface CharacterIdentityEntry {
  entryId: string;
  core: CharacterIdentityCore;
  stability: CharacterIdentityStability;
  expression: CharacterIdentityExpression;
  description: string;
  coherence: number;
  authenticity: number;
  chapter: number;
}

export interface CharacterIdentityLayer {
  layerId: string,
  entryIds: string[],
  cumulativeCoherence: number,
  depth: number,
}

export interface NarrativeCharacterIdentityEngineState {
  entries: Map<string, CharacterIdentityEntry>;
  layers: Map<string, CharacterIdentityLayer>;
  totalEntries: number;
  totalLayers: number;
  averageCoherence: number;
  averageAuthenticity: number;
  layerDepth: number;
  characterIdentityMastery: number;
}

export function createNarrativeCharacterIdentityEngineState(): NarrativeCharacterIdentityEngineState {
  return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageCoherence: 0.5, averageAuthenticity: 0.5, layerDepth: 0.5, characterIdentityMastery: 0.5 };
}

export function addCharacterIdentityEntry(state: NarrativeCharacterIdentityEngineState, entryId: string, core: CharacterIdentityCore, stability: CharacterIdentityStability, expression: CharacterIdentityExpression, description: string, coherence: number, authenticity: number, chapter: number): NarrativeCharacterIdentityEngineState {
  const entry: CharacterIdentityEntry = { entryId, core, stability, expression, description, coherence, authenticity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterIdentityLayer(state: NarrativeCharacterIdentityEngineState, layerId: string, entryIds: string[]): NarrativeCharacterIdentityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterIdentityEntry => e !== undefined);
  const cumulativeCoherence = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.coherence, 0) / entries.length;
  const coreSet = new Set(entries.map(e => e.core));
  const depth = Math.min(1, coreSet.size / 7);
  const layer: CharacterIdentityLayer = { layerId, entryIds, cumulativeCoherence, depth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}

export function getCharacterIdentityEntriesByCore(state: NarrativeCharacterIdentityEngineState, core: CharacterIdentityCore): CharacterIdentityEntry[] {
  return Array.from(state.entries.values()).filter(e => e.core === core);
}

export function getCharacterIdentityReport(state: NarrativeCharacterIdentityEngineState): { totalEntries: number; totalLayers: number; averageCoherence: number; averageAuthenticity: number; characterIdentityMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character identity entries');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — strengthen');
  if (state.characterIdentityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageCoherence: Math.round(state.averageCoherence * 100) / 100, averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100, characterIdentityMastery: Math.round(state.characterIdentityMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterIdentityEngineState): NarrativeCharacterIdentityEngineState {
  const entries = Array.from(state.entries.values());
  const averageCoherence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.coherence, 0) / entries.length;
  const averageAuthenticity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.depth, 0) / layers.length;
  const characterIdentityMastery = (averageCoherence * 0.4 + averageAuthenticity * 0.3 + layerDepth * 0.3);
  return { ...state, averageCoherence, averageAuthenticity, layerDepth, characterIdentityMastery };
}

export function resetNarrativeCharacterIdentityEngineState(): NarrativeCharacterIdentityEngineState {
  return createNarrativeCharacterIdentityEngineState();
}