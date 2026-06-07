/**
 * V1344 NarrativeWorldAnthropologyEngine — Direction J Iter 20/30 (Round 5)
 * World anthropology engine: anthropology of narrative world
 * Sources: thunderbolt anthropology + nanobot + ruflo
 */

export type WorldAnthropologyCulture = 'tribal' | 'civilized' | 'industrial' | 'magical' | 'transcendent' | 'posthuman' | 'transcendent';
export type WorldAnthropologyPractice = 'subsistence' | 'agricultural' | 'industrial' | 'service' | 'creative' | 'philosophical' | 'transcendent';
export type WorldAnthropologyEvolution = 'static' | 'slow' | 'moderate' | 'fast' | 'accelerating' | 'exponential' | 'transcendent';

export interface WorldAnthropologyEntry {
  entryId: string;
  culture: WorldAnthropologyCulture;
  practice: WorldAnthropologyPractice;
  evolution: WorldAnthropologyEvolution;
  description: string;
  richness: number;
  wisdom: number;
  chapter: number;
}

export interface WorldAnthropologyGroup {
  groupId: string,
  entryIds: string[],
  cumulativeRichness: number,
  diversity: number,
}

export interface NarrativeWorldAnthropologyEngineState {
  entries: Map<string, WorldAnthropologyEntry>;
  groups: Map<string, WorldAnthropologyGroup>;
  totalEntries: number;
  totalGroups: number;
  averageRichness: number;
  averageWisdom: number;
  groupDiversity: number;
  worldAnthropologyMastery: number;
}

// Factory
export function createNarrativeWorldAnthropologyEngineState(): NarrativeWorldAnthropologyEngineState {
  return {
    entries: new Map(),
    groups: new Map(),
    totalEntries: 0,
    totalGroups: 0,
    averageRichness: 0.5,
    averageWisdom: 0.5,
    groupDiversity: 0.5,
    worldAnthropologyMastery: 0.5,
  };
}

// Add entry
export function addWorldAnthropologyEntry(
  state: NarrativeWorldAnthropologyEngineState,
  entryId: string,
  culture: WorldAnthropologyCulture,
  practice: WorldAnthropologyPractice,
  evolution: WorldAnthropologyEvolution,
  description: string,
  richness: number,
  wisdom: number,
  chapter: number
): NarrativeWorldAnthropologyEngineState {
  const entry: WorldAnthropologyEntry = { entryId, culture, practice, evolution, description, richness, wisdom, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldAnthropology({ ...state, entries, totalEntries: entries.size });
}

// Add group
export function addWorldAnthropologyGroup(
  state: NarrativeWorldAnthropologyEngineState,
  groupId: string,
  entryIds: string[]
): NarrativeWorldAnthropologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldAnthropologyEntry => e !== undefined);
  const cumulativeRichness = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.richness, 0) / entries.length;
  const cultureSet = new Set(entries.map(e => e.culture));
  const diversity = Math.min(1, cultureSet.size / 7);
  const group: WorldAnthropologyGroup = { groupId, entryIds, cumulativeRichness, diversity };
  const groups = new Map(state.groups).set(groupId, group);
  return recomputeWorldAnthropology({ ...state, groups, totalGroups: groups.size });
}

// Get entries by culture
export function getWorldAnthropologyEntriesByCulture(state: NarrativeWorldAnthropologyEngineState, culture: WorldAnthropologyCulture): WorldAnthropologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.culture === culture);
}

// Get world anthropology report
export function getWorldAnthropologyReport(state: NarrativeWorldAnthropologyEngineState): {
  totalEntries: number;
  totalGroups: number;
  averageRichness: number;
  averageWisdom: number;
  worldAnthropologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world anthropology entries');
  if (state.averageRichness < 0.5) recommendations.push('Low richness — strengthen');
  if (state.worldAnthropologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalGroups: state.totalGroups,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    averageWisdom: Math.round(state.averageWisdom * 100) / 100,
    worldAnthropologyMastery: Math.round(state.worldAnthropologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldAnthropology(state: NarrativeWorldAnthropologyEngineState): NarrativeWorldAnthropologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageRichness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.richness, 0) / entries.length;
  const averageWisdom = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.wisdom, 0) / entries.length;

  const groups = Array.from(state.groups.values());
  const groupDiversity = groups.length === 0 ? 0.5
    : groups.reduce((s, g) => s + g.diversity, 0) / groups.length;

  const worldAnthropologyMastery = (averageRichness * 0.4 + averageWisdom * 0.3 + groupDiversity * 0.3);

  return { ...state, averageRichness, averageWisdom, groupDiversity, worldAnthropologyMastery };
}

// Reset
export function resetNarrativeWorldAnthropologyEngineState(): NarrativeWorldAnthropologyEngineState {
  return createNarrativeWorldAnthropologyEngineState();
}