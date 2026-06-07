/**
 * V1402 NarrativeCharacterMaskEngine — Direction K Iter 19/30 (Round 5)
 * Character mask engine: public face of character
 * Sources: nanobot mask + thunderbolt + ruflo
 */

export type CharacterMaskType = 'social' | 'professional' | 'emotional' | 'spiritual' | 'romantic' | 'defensive' | 'transcendent';
export type CharacterMaskFit = 'ill_fitting' | 'loose' | 'moderate' | 'snug' | 'perfect' | 'seamless' | 'transcendent';
export type CharacterMaskAwareness = 'unconscious' | 'denied' | 'recognized' | 'embraced' | 'integrated' | 'shed' | 'transcendent';

export interface CharacterMaskEntry {
  entryId: string;
  type: CharacterMaskType;
  fit: CharacterMaskFit;
  awareness: CharacterMaskAwareness;
  description: string;
  performance: number;
  cost: number;
  chapter: number;
}

export interface CharacterMaskCollection {
  collectionId: string,
  entryIds: string[],
  cumulativePerformance: number,
  complexity: number,
}

export interface NarrativeCharacterMaskEngineState {
  entries: Map<string, CharacterMaskEntry>;
  collections: Map<string, CharacterMaskCollection>;
  totalEntries: number;
  totalCollections: number;
  averagePerformance: number;
  averageCost: number;
  collectionComplexity: number;
  characterMaskMastery: number;
}

export function createNarrativeCharacterMaskEngineState(): NarrativeCharacterMaskEngineState {
  return { entries: new Map(), collections: new Map(), totalEntries: 0, totalCollections: 0, averagePerformance: 0.5, averageCost: 0.5, collectionComplexity: 0.5, characterMaskMastery: 0.5 };
}

export function addCharacterMaskEntry(state: NarrativeCharacterMaskEngineState, entryId: string, type: CharacterMaskType, fit: CharacterMaskFit, awareness: CharacterMaskAwareness, description: string, performance: number, cost: number, chapter: number): NarrativeCharacterMaskEngineState {
  const entry: CharacterMaskEntry = { entryId, type, fit, awareness, description, performance, cost, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterMaskCollection(state: NarrativeCharacterMaskEngineState, collectionId: string, entryIds: string[]): NarrativeCharacterMaskEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterMaskEntry => e !== undefined);
  const cumulativePerformance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.performance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const complexity = Math.min(1, typeSet.size / 7);
  const collection: CharacterMaskCollection = { collectionId, entryIds, cumulativePerformance, complexity };
  return recompute({ ...state, collections: new Map(state.collections).set(collectionId, collection), totalCollections: state.collections.size + 1 });
}

export function getCharacterMaskEntriesByType(state: NarrativeCharacterMaskEngineState, type: CharacterMaskType): CharacterMaskEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterMaskReport(state: NarrativeCharacterMaskEngineState): { totalEntries: number; totalCollections: number; averagePerformance: number; averageCost: number; characterMaskMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character mask entries');
  if (state.averagePerformance < 0.5) recommendations.push('Low performance — strengthen');
  if (state.characterMaskMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCollections: state.totalCollections, averagePerformance: Math.round(state.averagePerformance * 100) / 100, averageCost: Math.round(state.averageCost * 100) / 100, characterMaskMastery: Math.round(state.characterMaskMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterMaskEngineState): NarrativeCharacterMaskEngineState {
  const entries = Array.from(state.entries.values());
  const averagePerformance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.performance, 0) / entries.length;
  const averageCost = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.cost, 0) / entries.length;
  const collections = Array.from(state.collections.values());
  const collectionComplexity = collections.length === 0 ? 0.5 : collections.reduce((s, c) => s + c.complexity, 0) / collections.length;
  const characterMaskMastery = (averagePerformance * 0.4 + averageCost * 0.3 + collectionComplexity * 0.3);
  return { ...state, averagePerformance, averageCost, collectionComplexity, characterMaskMastery };
}

export function resetNarrativeCharacterMaskEngineState(): NarrativeCharacterMaskEngineState {
  return createNarrativeCharacterMaskEngineState();
}