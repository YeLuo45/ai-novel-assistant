/**
 * V1608 NarrativeSettingClimateEngine — Direction O Iter 2/30 (Round 5)
 */
export type SettingClimateType = 'tropical' | 'temperate' | 'arid' | 'polar' | 'mediterranean' | 'continental' | 'transcendent' | 'infinite';
export type SettingClimateConsistency = 'consistent' | 'variable' | 'extreme' | 'transcendent' | 'infinite';
export interface SettingClimateEntry { entryId: string; type: SettingClimateType; consistency: SettingClimateConsistency; description: string; believability: number; chapter: number; }
export interface SettingClimateZone { zoneId: string; entryIds: string[]; cumulativeBelievability: number; breadth: number; }
export interface NarrativeSettingClimateEngineState { entries: Map<string, SettingClimateEntry>; zones: Map<string, SettingClimateZone>; totalEntries: number; totalZones: number; averageBelievability: number; climateComplexity: number; climateMastery: number; }
export function createNarrativeSettingClimateEngineState(): NarrativeSettingClimateEngineState { return { entries: new Map(), zones: new Map(), totalEntries: 0, totalZones: 0, averageBelievability: 0.5, climateComplexity: 0.5, climateMastery: 0.5 }; }
export function addSettingClimateEntry(state: NarrativeSettingClimateEngineState, entryId: string, type: SettingClimateType, consistency: SettingClimateConsistency, description: string, believability: number, chapter: number): NarrativeSettingClimateEngineState {
  const entry: SettingClimateEntry = { entryId, type, consistency, description, believability, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingClimateZone(state: NarrativeSettingClimateEngineState, zoneId: string, entryIds: string[]): NarrativeSettingClimateEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingClimateEntry => e !== undefined);
  const cumulativeBelievability = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.believability, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const zone: SettingClimateZone = { zoneId, entryIds, cumulativeBelievability, breadth };
  return recompute({ ...state, zones: new Map(state.zones).set(zoneId, zone), totalZones: state.zones.size + 1 });
}
export function getSettingClimateEntriesByType(state: NarrativeSettingClimateEngineState, type: SettingClimateType): SettingClimateEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingClimateReport(state: NarrativeSettingClimateEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting climate entries');
  if (state.averageBelievability < 0.5) recommendations.push('Low believability — strengthen');
  if (state.climateMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalZones: state.totalZones, averageBelievability: Math.round(state.averageBelievability * 100) / 100, climateComplexity: Math.round(state.climateComplexity * 100) / 100, climateMastery: Math.round(state.climateMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingClimateEngineState): NarrativeSettingClimateEngineState {
  const entries = Array.from(state.entries.values());
  const averageBelievability = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.believability, 0) / entries.length;
  const zones = Array.from(state.zones.values());
  const climateComplexity = zones.length === 0 ? 0.5 : zones.reduce((s, z) => s + z.breadth, 0) / zones.length;
  return { ...state, averageBelievability, climateComplexity, climateMastery: averageBelievability * 0.5 + climateComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingClimateEngineState(): NarrativeSettingClimateEngineState { return createNarrativeSettingClimateEngineState(); }