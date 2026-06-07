/**
 * V1616 NarrativeSettingWildernessEngine — Direction O Iter 6/30 (Round 5)
 */
export type SettingWildernessType = 'forest' | 'jungle' | 'desert' | 'tundra' | 'mountain' | 'swamp' | 'transcendent' | 'infinite';
export type SettingWildernessHostility = 'safe' | 'moderate' | 'dangerous' | 'lethal' | 'transcendent' | 'infinite';
export interface SettingWildernessEntry { entryId: string; type: SettingWildernessType; hostility: SettingWildernessHostility; description: string; wildness: number; chapter: number; }
export interface SettingWildernessZone { zoneId: string; entryIds: string[]; cumulativeWildness: number; breadth: number; }
export interface NarrativeSettingWildernessEngineState { entries: Map<string, SettingWildernessEntry>; zones: Map<string, SettingWildernessZone>; totalEntries: number; totalZones: number; averageWildness: number; wildernessComplexity: number; wildernessMastery: number; }
export function createNarrativeSettingWildernessEngineState(): NarrativeSettingWildernessEngineState { return { entries: new Map(), zones: new Map(), totalEntries: 0, totalZones: 0, averageWildness: 0.5, wildernessComplexity: 0.5, wildernessMastery: 0.5 }; }
export function addSettingWildernessEntry(state: NarrativeSettingWildernessEngineState, entryId: string, type: SettingWildernessType, hostility: SettingWildernessHostility, description: string, wildness: number, chapter: number): NarrativeSettingWildernessEngineState {
  const entry: SettingWildernessEntry = { entryId, type, hostility, description, wildness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingWildernessZone(state: NarrativeSettingWildernessEngineState, zoneId: string, entryIds: string[]): NarrativeSettingWildernessEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingWildernessEntry => e !== undefined);
  const cumulativeWildness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.wildness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const zone: SettingWildernessZone = { zoneId, entryIds, cumulativeWildness, breadth };
  return recompute({ ...state, zones: new Map(state.zones).set(zoneId, zone), totalZones: state.zones.size + 1 });
}
export function getSettingWildernessEntriesByType(state: NarrativeSettingWildernessEngineState, type: SettingWildernessType): SettingWildernessEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingWildernessReport(state: NarrativeSettingWildernessEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting wilderness entries');
  if (state.averageWildness < 0.5) recommendations.push('Low wildness — strengthen');
  if (state.wildernessMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalZones: state.totalZones, averageWildness: Math.round(state.averageWildness * 100) / 100, wildernessComplexity: Math.round(state.wildernessComplexity * 100) / 100, wildernessMastery: Math.round(state.wildernessMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingWildernessEngineState): NarrativeSettingWildernessEngineState {
  const entries = Array.from(state.entries.values());
  const averageWildness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.wildness, 0) / entries.length;
  const zones = Array.from(state.zones.values());
  const wildernessComplexity = zones.length === 0 ? 0.5 : zones.reduce((s, z) => s + z.breadth, 0) / zones.length;
  return { ...state, averageWildness, wildernessComplexity, wildernessMastery: averageWildness * 0.5 + wildernessComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingWildernessEngineState(): NarrativeSettingWildernessEngineState { return createNarrativeSettingWildernessEngineState(); }