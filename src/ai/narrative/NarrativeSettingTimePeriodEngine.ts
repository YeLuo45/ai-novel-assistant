/**
 * V1626 NarrativeSettingTimePeriodEngine — Direction O Iter 11/30 (Round 5)
 */
export type SettingTimePeriodType = 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'future' | 'transcendent' | 'infinite';
export type SettingTimePeriodResearch = 'impressionistic' | 'moderate' | 'rigorous' | 'exhaustive' | 'transcendent' | 'infinite';
export interface SettingTimePeriodEntry { entryId: string; type: SettingTimePeriodType; research: SettingTimePeriodResearch; description: string; authenticity: number; chapter: number; }
export interface SettingTimePeriodEra { eraId: string; entryIds: string[]; cumulativeAuthenticity: number; breadth: number; }
export interface NarrativeSettingTimePeriodEngineState { entries: Map<string, SettingTimePeriodEntry>; eras: Map<string, SettingTimePeriodEra>; totalEntries: number; totalEras: number; averageAuthenticity: number; timePeriodComplexity: number; timePeriodMastery: number; }
export function createNarrativeSettingTimePeriodEngineState(): NarrativeSettingTimePeriodEngineState { return { entries: new Map(), eras: new Map(), totalEntries: 0, totalEras: 0, averageAuthenticity: 0.5, timePeriodComplexity: 0.5, timePeriodMastery: 0.5 }; }
export function addSettingTimePeriodEntry(state: NarrativeSettingTimePeriodEngineState, entryId: string, type: SettingTimePeriodType, research: SettingTimePeriodResearch, description: string, authenticity: number, chapter: number): NarrativeSettingTimePeriodEngineState {
  const entry: SettingTimePeriodEntry = { entryId, type, research, description, authenticity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingTimePeriodEra(state: NarrativeSettingTimePeriodEngineState, eraId: string, entryIds: string[]): NarrativeSettingTimePeriodEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingTimePeriodEntry => e !== undefined);
  const cumulativeAuthenticity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const era: SettingTimePeriodEra = { eraId, entryIds, cumulativeAuthenticity, breadth };
  return recompute({ ...state, eras: new Map(state.eras).set(eraId, era), totalEras: state.eras.size + 1 });
}
export function getSettingTimePeriodEntriesByType(state: NarrativeSettingTimePeriodEngineState, type: SettingTimePeriodType): SettingTimePeriodEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingTimePeriodReport(state: NarrativeSettingTimePeriodEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting time period entries');
  if (state.averageAuthenticity < 0.5) recommendations.push('Low authenticity — strengthen');
  if (state.timePeriodMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalEras: state.totalEras, averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100, timePeriodComplexity: Math.round(state.timePeriodComplexity * 100) / 100, timePeriodMastery: Math.round(state.timePeriodMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingTimePeriodEngineState): NarrativeSettingTimePeriodEngineState {
  const entries = Array.from(state.entries.values());
  const averageAuthenticity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const eras = Array.from(state.eras.values());
  const timePeriodComplexity = eras.length === 0 ? 0.5 : eras.reduce((s, er) => s + er.breadth, 0) / eras.length;
  return { ...state, averageAuthenticity, timePeriodComplexity, timePeriodMastery: averageAuthenticity * 0.5 + timePeriodComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingTimePeriodEngineState(): NarrativeSettingTimePeriodEngineState { return createNarrativeSettingTimePeriodEngineState(); }