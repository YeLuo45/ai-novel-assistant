/**
 * V1368 NarrativeCharacterAgencyEngine — Direction K Iter 2/30 (Round 5)
 * Character agency engine: agency of character
 * Sources: thunderbolt agency + nanobot + ruflo
 */

export type CharacterAgencyLevel = 'passive' | 'reactive' | 'active' | 'proactive' | 'transformative' | 'transcendent' | 'absolute';
export type CharacterAgencyScope = 'personal' | 'interpersonal' | 'social' | 'global' | 'cosmic' | 'universal' | 'transcendent';
export type CharacterAgencyImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';

export interface CharacterAgencyEntry {
  entryId: string;
  level: CharacterAgencyLevel;
  scope: CharacterAgencyScope;
  impact: CharacterAgencyImpact;
  description: string;
  autonomy: number;
  efficacy: number;
  chapter: number;
}

export interface CharacterAgencyGroup {
  groupId: string,
  entryIds: string[],
  cumulativeAutonomy: number,
  range: number,
}

export interface NarrativeCharacterAgencyEngineState {
  entries: Map<string, CharacterAgencyEntry>;
  groups: Map<string, CharacterAgencyGroup>;
  totalEntries: number;
  totalGroups: number;
  averageAutonomy: number;
  averageEfficacy: number;
  groupRange: number;
  characterAgencyMastery: number;
}

// Factory
export function createNarrativeCharacterAgencyEngineState(): NarrativeCharacterAgencyEngineState {
  return {
    entries: new Map(),
    groups: new Map(),
    totalEntries: 0,
    totalGroups: 0,
    averageAutonomy: 0.5,
    averageEfficacy: 0.5,
    groupRange: 0.5,
    characterAgencyMastery: 0.5,
  };
}

// Add entry
export function addCharacterAgencyEntry(
  state: NarrativeCharacterAgencyEngineState,
  entryId: string,
  level: CharacterAgencyLevel,
  scope: CharacterAgencyScope,
  impact: CharacterAgencyImpact,
  description: string,
  autonomy: number,
  efficacy: number,
  chapter: number
): NarrativeCharacterAgencyEngineState {
  const entry: CharacterAgencyEntry = { entryId, level, scope, impact, description, autonomy, efficacy, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterAgency({ ...state, entries, totalEntries: entries.size });
}

// Add group
export function addCharacterAgencyGroup(
  state: NarrativeCharacterAgencyEngineState,
  groupId: string,
  entryIds: string[]
): NarrativeCharacterAgencyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterAgencyEntry => e !== undefined);
  const cumulativeAutonomy = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.autonomy, 0) / entries.length;
  const levelSet = new Set(entries.map(e => e.level));
  const range = Math.min(1, levelSet.size / 7);
  const group: CharacterAgencyGroup = { groupId, entryIds, cumulativeAutonomy, range };
  const groups = new Map(state.groups).set(groupId, group);
  return recomputeCharacterAgency({ ...state, groups, totalGroups: groups.size });
}

// Get entries by level
export function getCharacterAgencyEntriesByLevel(state: NarrativeCharacterAgencyEngineState, level: CharacterAgencyLevel): CharacterAgencyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.level === level);
}

// Get character agency report
export function getCharacterAgencyReport(state: NarrativeCharacterAgencyEngineState): {
  totalEntries: number;
  totalGroups: number;
  averageAutonomy: number;
  averageEfficacy: number;
  characterAgencyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character agency entries');
  if (state.averageAutonomy < 0.5) recommendations.push('Low autonomy — strengthen');
  if (state.characterAgencyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalGroups: state.totalGroups,
    averageAutonomy: Math.round(state.averageAutonomy * 100) / 100,
    averageEfficacy: Math.round(state.averageEfficacy * 100) / 100,
    characterAgencyMastery: Math.round(state.characterAgencyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterAgency(state: NarrativeCharacterAgencyEngineState): NarrativeCharacterAgencyEngineState {
  const entries = Array.from(state.entries.values());
  const averageAutonomy = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.autonomy, 0) / entries.length;
  const averageEfficacy = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.efficacy, 0) / entries.length;

  const groups = Array.from(state.groups.values());
  const groupRange = groups.length === 0 ? 0.5
    : groups.reduce((s, g) => s + g.range, 0) / groups.length;

  const characterAgencyMastery = (averageAutonomy * 0.4 + averageEfficacy * 0.3 + groupRange * 0.3);

  return { ...state, averageAutonomy, averageEfficacy, groupRange, characterAgencyMastery };
}

// Reset
export function resetNarrativeCharacterAgencyEngineState(): NarrativeCharacterAgencyEngineState {
  return createNarrativeCharacterAgencyEngineState();
}