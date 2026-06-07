/**
 * V1662 NarrativeSettingTaboosEngine — Direction O Iter 29/30 (Round 5)
 */
export type SettingTaboosType = 'food' | 'body' | 'speech' | 'behavior' | 'sacred' | 'transcendent' | 'infinite';
export type SettingTaboosSeverity = 'minor' | 'moderate' | 'serious' | 'taboo' | 'transcendent' | 'infinite';
export interface SettingTaboosEntry { entryId: string; type: SettingTaboosType; severity: SettingTaboosSeverity; description: string; weight: number; chapter: number; }
export interface SettingTaboosCode { codeId: string; entryIds: string[]; cumulativeWeight: number; breadth: number; }
export interface NarrativeSettingTaboosEngineState { entries: Map<string, SettingTaboosEntry>; codes: Map<string, SettingTaboosCode>; totalEntries: number; totalCodes: number; averageWeight: number; taboosComplexity: number; taboosMastery: number; }
export function createNarrativeSettingTaboosEngineState(): NarrativeSettingTaboosEngineState { return { entries: new Map(), codes: new Map(), totalEntries: 0, totalCodes: 0, averageWeight: 0.5, taboosComplexity: 0.5, taboosMastery: 0.5 }; }
export function addSettingTaboosEntry(state: NarrativeSettingTaboosEngineState, entryId: string, type: SettingTaboosType, severity: SettingTaboosSeverity, description: string, weight: number, chapter: number): NarrativeSettingTaboosEngineState {
  const entry: SettingTaboosEntry = { entryId, type, severity, description, weight, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingTaboosCode(state: NarrativeSettingTaboosEngineState, codeId: string, entryIds: string[]): NarrativeSettingTaboosEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingTaboosEntry => e !== undefined);
  const cumulativeWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const code: SettingTaboosCode = { codeId, entryIds, cumulativeWeight, breadth };
  return recompute({ ...state, codes: new Map(state.codes).set(codeId, code), totalCodes: state.codes.size + 1 });
}
export function getSettingTaboosEntriesByType(state: NarrativeSettingTaboosEngineState, type: SettingTaboosType): SettingTaboosEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingTaboosReport(state: NarrativeSettingTaboosEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting taboos entries');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.taboosMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCodes: state.totalCodes, averageWeight: Math.round(state.averageWeight * 100) / 100, taboosComplexity: Math.round(state.taboosComplexity * 100) / 100, taboosMastery: Math.round(state.taboosMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingTaboosEngineState): NarrativeSettingTaboosEngineState {
  const entries = Array.from(state.entries.values());
  const averageWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const codes = Array.from(state.codes.values());
  const taboosComplexity = codes.length === 0 ? 0.5 : codes.reduce((s, c) => s + c.breadth, 0) / codes.length;
  return { ...state, averageWeight, taboosComplexity, taboosMastery: averageWeight * 0.5 + taboosComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingTaboosEngineState(): NarrativeSettingTaboosEngineState { return createNarrativeSettingTaboosEngineState(); }