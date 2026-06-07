/**
 * V1640 NarrativeSettingPoliticsEngine — Direction O Iter 18/30 (Round 5)
 */
export type SettingPoliticsType = 'monarchy' | 'democracy' | 'oligarchy' | 'autocracy' | 'anarchy' | 'transcendent' | 'infinite';
export type SettingPoliticsStability = 'stable' | 'tension' | 'unrest' | 'revolution' | 'transcendent' | 'infinite';
export interface SettingPoliticsEntry { entryId: string; type: SettingPoliticsType; stability: SettingPoliticsStability; description: string; intricacy: number; chapter: number; }
export interface SettingPoliticsFaction { factionId: string; entryIds: string[]; cumulativeIntricacy: number; breadth: number; }
export interface NarrativeSettingPoliticsEngineState { entries: Map<string, SettingPoliticsEntry>; factions: Map<string, SettingPoliticsFaction>; totalEntries: number; totalFactions: number; averageIntricacy: number; politicsComplexity: number; politicsMastery: number; }
export function createNarrativeSettingPoliticsEngineState(): NarrativeSettingPoliticsEngineState { return { entries: new Map(), factions: new Map(), totalEntries: 0, totalFactions: 0, averageIntricacy: 0.5, politicsComplexity: 0.5, politicsMastery: 0.5 }; }
export function addSettingPoliticsEntry(state: NarrativeSettingPoliticsEngineState, entryId: string, type: SettingPoliticsType, stability: SettingPoliticsStability, description: string, intricacy: number, chapter: number): NarrativeSettingPoliticsEngineState {
  const entry: SettingPoliticsEntry = { entryId, type, stability, description, intricacy, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingPoliticsFaction(state: NarrativeSettingPoliticsEngineState, factionId: string, entryIds: string[]): NarrativeSettingPoliticsEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingPoliticsEntry => e !== undefined);
  const cumulativeIntricacy = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.intricacy, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const faction: SettingPoliticsFaction = { factionId, entryIds, cumulativeIntricacy, breadth };
  return recompute({ ...state, factions: new Map(state.factions).set(factionId, faction), totalFactions: state.factions.size + 1 });
}
export function getSettingPoliticsEntriesByType(state: NarrativeSettingPoliticsEngineState, type: SettingPoliticsType): SettingPoliticsEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingPoliticsReport(state: NarrativeSettingPoliticsEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting politics entries');
  if (state.averageIntricacy < 0.5) recommendations.push('Low intricacy — strengthen');
  if (state.politicsMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFactions: state.totalFactions, averageIntricacy: Math.round(state.averageIntricacy * 100) / 100, politicsComplexity: Math.round(state.politicsComplexity * 100) / 100, politicsMastery: Math.round(state.politicsMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingPoliticsEngineState): NarrativeSettingPoliticsEngineState {
  const entries = Array.from(state.entries.values());
  const averageIntricacy = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.intricacy, 0) / entries.length;
  const factions = Array.from(state.factions.values());
  const politicsComplexity = factions.length === 0 ? 0.5 : factions.reduce((s, f) => s + f.breadth, 0) / factions.length;
  return { ...state, averageIntricacy, politicsComplexity, politicsMastery: averageIntricacy * 0.5 + politicsComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingPoliticsEngineState(): NarrativeSettingPoliticsEngineState { return createNarrativeSettingPoliticsEngineState(); }