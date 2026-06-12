/**
 * V1356 NarrativeWorldReligionEngine — Direction J Iter 26/30 (Round 5)
 * World religion engine: religion of narrative world
 * Sources: thunderbolt religion + nanobot + ruflo
 */

export type WorldReligionType = 'monotheism' | 'polytheism' | 'pantheism' | 'animism' | 'spirituality' | 'transcendent' | 'infinite';
export type WorldReligionPractice = 'ritual' | 'prayer' | 'meditation' | 'sacrifice' | 'celebration' | 'pilgrimage' | 'transcendent';
export type WorldReligionInfluence = 'personal' | 'communal' | 'cultural' | 'civilizational' | 'universal' | 'transcendent' | 'absolute';

export interface WorldReligionEntry {
  entryId: string;
  type: WorldReligionType;
  practice: WorldReligionPractice;
  influence: WorldReligionInfluence;
  description: string;
  devotion: number;
  wisdom: number;
  chapter: number;
}

export interface WorldReligionPantheon {
  pantheonId: string,
  entryIds: string[],
  cumulativeDevotion: number,
  breadth: number,
}

export interface NarrativeWorldReligionEngineState {
  entries: Map<string, WorldReligionEntry>;
  pantheons: Map<string, WorldReligionPantheon>;
  totalEntries: number;
  totalPantheons: number;
  averageDevotion: number;
  averageWisdom: number;
  pantheonBreadth: number;
  worldReligionMastery: number;
}

// Factory
export function createNarrativeWorldReligionEngineState(): NarrativeWorldReligionEngineState {
  return {
    entries: new Map(),
    pantheons: new Map(),
    totalEntries: 0,
    totalPantheons: 0,
    averageDevotion: 0.5,
    averageWisdom: 0.5,
    pantheonBreadth: 0.5,
    worldReligionMastery: 0.5,
  };
}

// Add entry
export function addWorldReligionEntry(
  state: NarrativeWorldReligionEngineState,
  entryId: string,
  type: WorldReligionType,
  practice: WorldReligionPractice,
  influence: WorldReligionInfluence,
  description: string,
  devotion: number,
  wisdom: number,
  chapter: number
): NarrativeWorldReligionEngineState {
  const entry: WorldReligionEntry = { entryId, type, practice, influence, description, devotion, wisdom, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldReligion({ ...state, entries, totalEntries: entries.size });
}

// Add pantheon
export function addWorldReligionPantheon(
  state: NarrativeWorldReligionEngineState,
  pantheonId: string,
  entryIds: string[]
): NarrativeWorldReligionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldReligionEntry => e !== undefined);
  const cumulativeDevotion = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.devotion, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const pantheon: WorldReligionPantheon = { pantheonId, entryIds, cumulativeDevotion, breadth };
  const pantheons = new Map(state.pantheons).set(pantheonId, pantheon);
  return recomputeWorldReligion({ ...state, pantheons, totalPantheons: pantheons.size });
}

// Get entries by type
export function getWorldReligionEntriesByType(state: NarrativeWorldReligionEngineState, type: WorldReligionType): WorldReligionEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get world religion report
export function getWorldReligionReport(state: NarrativeWorldReligionEngineState): {
  totalEntries: number;
  totalPantheons: number;
  averageDevotion: number;
  averageWisdom: number;
  worldReligionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world religion entries');
  if (state.averageDevotion < 0.5) recommendations.push('Low devotion — strengthen');
  if (state.worldReligionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalPantheons: state.totalPantheons,
    averageDevotion: Math.round(state.averageDevotion * 100) / 100,
    averageWisdom: Math.round(state.averageWisdom * 100) / 100,
    worldReligionMastery: Math.round(state.worldReligionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldReligion(state: NarrativeWorldReligionEngineState): NarrativeWorldReligionEngineState {
  const entries = Array.from(state.entries.values());
  const averageDevotion = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.devotion, 0) / entries.length;
  const averageWisdom = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.wisdom, 0) / entries.length;

  const pantheons = Array.from(state.pantheons.values());
  const pantheonBreadth = pantheons.length === 0 ? 0.5
    : pantheons.reduce((s, p) => s + p.breadth, 0) / pantheons.length;

  const worldReligionMastery = (averageDevotion * 0.4 + averageWisdom * 0.3 + pantheonBreadth * 0.3);

  return { ...state, averageDevotion, averageWisdom, pantheonBreadth, worldReligionMastery };
}

// Reset
export function resetNarrativeWorldReligionEngineState(): NarrativeWorldReligionEngineState {
  return createNarrativeWorldReligionEngineState();
}