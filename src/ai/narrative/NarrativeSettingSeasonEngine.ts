/**
 * V1630 NarrativeSettingSeasonEngine — Direction O Iter 13/30 (Round 5)
 */
export type SettingSeasonType = 'spring' | 'summer' | 'autumn' | 'winter' | 'monsoon' | 'transcendent' | 'infinite';
export type SettingSeasonMood = 'hopeful' | 'vibrant' | 'melancholic' | 'harsh' | 'transcendent' | 'infinite';
export interface SettingSeasonEntry { entryId: string; type: SettingSeasonType; mood: SettingSeasonMood; description: string; atmosphere: number; chapter: number; }
export interface SettingSeasonCycle { cycleId: string; entryIds: string[]; cumulativeAtmosphere: number; breadth: number; }
export interface NarrativeSettingSeasonEngineState { entries: Map<string, SettingSeasonEntry>; cycles: Map<string, SettingSeasonCycle>; totalEntries: number; totalCycles: number; averageAtmosphere: number; seasonComplexity: number; seasonMastery: number; }
export function createNarrativeSettingSeasonEngineState(): NarrativeSettingSeasonEngineState { return { entries: new Map(), cycles: new Map(), totalEntries: 0, totalCycles: 0, averageAtmosphere: 0.5, seasonComplexity: 0.5, seasonMastery: 0.5 }; }
export function addSettingSeasonEntry(state: NarrativeSettingSeasonEngineState, entryId: string, type: SettingSeasonType, mood: SettingSeasonMood, description: string, atmosphere: number, chapter: number): NarrativeSettingSeasonEngineState {
  const entry: SettingSeasonEntry = { entryId, type, mood, description, atmosphere, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingSeasonCycle(state: NarrativeSettingSeasonEngineState, cycleId: string, entryIds: string[]): NarrativeSettingSeasonEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingSeasonEntry => e !== undefined);
  const cumulativeAtmosphere = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.atmosphere, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const cycle: SettingSeasonCycle = { cycleId, entryIds, cumulativeAtmosphere, breadth };
  return recompute({ ...state, cycles: new Map(state.cycles).set(cycleId, cycle), totalCycles: state.cycles.size + 1 });
}
export function getSettingSeasonEntriesByType(state: NarrativeSettingSeasonEngineState, type: SettingSeasonType): SettingSeasonEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingSeasonReport(state: NarrativeSettingSeasonEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting season entries');
  if (state.averageAtmosphere < 0.5) recommendations.push('Low atmosphere — strengthen');
  if (state.seasonMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCycles: state.totalCycles, averageAtmosphere: Math.round(state.averageAtmosphere * 100) / 100, seasonComplexity: Math.round(state.seasonComplexity * 100) / 100, seasonMastery: Math.round(state.seasonMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingSeasonEngineState): NarrativeSettingSeasonEngineState {
  const entries = Array.from(state.entries.values());
  const averageAtmosphere = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.atmosphere, 0) / entries.length;
  const cycles = Array.from(state.cycles.values());
  const seasonComplexity = cycles.length === 0 ? 0.5 : cycles.reduce((s, cy) => s + cy.breadth, 0) / cycles.length;
  return { ...state, averageAtmosphere, seasonComplexity, seasonMastery: averageAtmosphere * 0.5 + seasonComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingSeasonEngineState(): NarrativeSettingSeasonEngineState { return createNarrativeSettingSeasonEngineState(); }