/**
 * V1320 NarrativeWorldCartographyEngine — Direction J Iter 8/30 (Round 5)
 * World cartography engine: art of mapping narrative world
 * Sources: thunderbolt cartography + nanobot + ruflo
 */

export type WorldCartographyStyle = 'flat' | 'perspective' | 'isometric' | 'topographic' | 'artistic' | 'magical' | 'transcendent';
export type WorldCartographySymbolism = 'literal' | 'metaphorical' | 'symbolic' | 'mythic' | 'transcendent' | 'sublime' | 'infinite';
export type WorldCartographyLegend = 'minimal' | 'standard' | 'rich' | 'comprehensive' | 'encyclopedic' | 'mythological' | 'transcendent';

export interface WorldCartographyEntry {
  entryId: string;
  style: WorldCartographyStyle;
  symbolism: WorldCartographySymbolism;
  legend: WorldCartographyLegend;
  description: string;
  craft: number;
  beauty: number;
  chapter: number;
}

export interface WorldCartographyCollection {
  collectionId: string,
  entryIds: string[],
  cumulativeCraft: number,
  range: number,
}

export interface NarrativeWorldCartographyEngineState {
  entries: Map<string, WorldCartographyEntry>;
  collections: Map<string, WorldCartographyCollection>;
  totalEntries: number;
  totalCollections: number;
  averageCraft: number;
  averageBeauty: number;
  collectionRange: number;
  worldCartographyMastery: number;
}

// Factory
export function createNarrativeWorldCartographyEngineState(): NarrativeWorldCartographyEngineState {
  return {
    entries: new Map(),
    collections: new Map(),
    totalEntries: 0,
    totalCollections: 0,
    averageCraft: 0.5,
    averageBeauty: 0.5,
    collectionRange: 0.5,
    worldCartographyMastery: 0.5,
  };
}

// Add entry
export function addWorldCartographyEntry(
  state: NarrativeWorldCartographyEngineState,
  entryId: string,
  style: WorldCartographyStyle,
  symbolism: WorldCartographySymbolism,
  legend: WorldCartographyLegend,
  description: string,
  craft: number,
  beauty: number,
  chapter: number
): NarrativeWorldCartographyEngineState {
  const entry: WorldCartographyEntry = { entryId, style, symbolism, legend, description, craft, beauty, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldCartography({ ...state, entries, totalEntries: entries.size });
}

// Add collection
export function addWorldCartographyCollection(
  state: NarrativeWorldCartographyEngineState,
  collectionId: string,
  entryIds: string[]
): NarrativeWorldCartographyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldCartographyEntry => e !== undefined);
  const cumulativeCraft = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.craft, 0) / entries.length;
  const styleSet = new Set(entries.map(e => e.style));
  const range = Math.min(1, styleSet.size / 7);
  const collection: WorldCartographyCollection = { collectionId, entryIds, cumulativeCraft, range };
  const collections = new Map(state.collections).set(collectionId, collection);
  return recomputeWorldCartography({ ...state, collections, totalCollections: collections.size });
}

// Get entries by style
export function getWorldCartographyEntriesByStyle(state: NarrativeWorldCartographyEngineState, style: WorldCartographyStyle): WorldCartographyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.style === style);
}

// Get world cartography report
export function getWorldCartographyReport(state: NarrativeWorldCartographyEngineState): {
  totalEntries: number;
  totalCollections: number;
  averageCraft: number;
  averageBeauty: number;
  worldCartographyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world cartography entries');
  if (state.averageCraft < 0.5) recommendations.push('Low craft — strengthen');
  if (state.worldCartographyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalCollections: state.totalCollections,
    averageCraft: Math.round(state.averageCraft * 100) / 100,
    averageBeauty: Math.round(state.averageBeauty * 100) / 100,
    worldCartographyMastery: Math.round(state.worldCartographyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldCartography(state: NarrativeWorldCartographyEngineState): NarrativeWorldCartographyEngineState {
  const entries = Array.from(state.entries.values());
  const averageCraft = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.craft, 0) / entries.length;
  const averageBeauty = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.beauty, 0) / entries.length;

  const collections = Array.from(state.collections.values());
  const collectionRange = collections.length === 0 ? 0.5
    : collections.reduce((s, c) => s + c.range, 0) / collections.length;

  const worldCartographyMastery = (averageCraft * 0.4 + averageBeauty * 0.3 + collectionRange * 0.3);

  return { ...state, averageCraft, averageBeauty, collectionRange, worldCartographyMastery };
}

// Reset
export function resetNarrativeWorldCartographyEngineState(): NarrativeWorldCartographyEngineState {
  return createNarrativeWorldCartographyEngineState();
}