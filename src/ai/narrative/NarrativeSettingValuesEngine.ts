/**
 * V1660 NarrativeSettingValuesEngine — Direction O Iter 28/30 (Round 5)
 */
export type SettingValuesType = 'individual' | 'familial' | 'social' | 'universal' | 'transcendent' | 'infinite';
export type SettingValuesAdherence = 'loose' | 'moderate' | 'strict' | 'absolute' | 'transcendent' | 'infinite';
export interface SettingValuesEntry { entryId: string; type: SettingValuesType; adherence: SettingValuesAdherence; description: string; depth: number; chapter: number; }
export interface SettingValuesSystem { systemId: string; entryIds: string[]; cumulativeDepth: number; breadth: number; }
export interface NarrativeSettingValuesEngineState { entries: Map<string, SettingValuesEntry>; systems: Map<string, SettingValuesSystem>; totalEntries: number; totalSystems: number; averageDepth: number; valuesComplexity: number; valuesMastery: number; }
export function createNarrativeSettingValuesEngineState(): NarrativeSettingValuesEngineState { return { entries: new Map(), systems: new Map(), totalEntries: 0, totalSystems: 0, averageDepth: 0.5, valuesComplexity: 0.5, valuesMastery: 0.5 }; }
export function addSettingValuesEntry(state: NarrativeSettingValuesEngineState, entryId: string, type: SettingValuesType, adherence: SettingValuesAdherence, description: string, depth: number, chapter: number): NarrativeSettingValuesEngineState {
  const entry: SettingValuesEntry = { entryId, type, adherence, description, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingValuesSystem(state: NarrativeSettingValuesEngineState, systemId: string, entryIds: string[]): NarrativeSettingValuesEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingValuesEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const system: SettingValuesSystem = { systemId, entryIds, cumulativeDepth, breadth };
  return recompute({ ...state, systems: new Map(state.systems).set(systemId, system), totalSystems: state.systems.size + 1 });
}
export function getSettingValuesEntriesByType(state: NarrativeSettingValuesEngineState, type: SettingValuesType): SettingValuesEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingValuesReport(state: NarrativeSettingValuesEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting values entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.valuesMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSystems: state.totalSystems, averageDepth: Math.round(state.averageDepth * 100) / 100, valuesComplexity: Math.round(state.valuesComplexity * 100) / 100, valuesMastery: Math.round(state.valuesMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingValuesEngineState): NarrativeSettingValuesEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const systems = Array.from(state.systems.values());
  const valuesComplexity = systems.length === 0 ? 0.5 : systems.reduce((s, sy) => s + sy.breadth, 0) / systems.length;
  return { ...state, averageDepth, valuesComplexity, valuesMastery: averageDepth * 0.5 + valuesComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingValuesEngineState(): NarrativeSettingValuesEngineState { return createNarrativeSettingValuesEngineState(); }