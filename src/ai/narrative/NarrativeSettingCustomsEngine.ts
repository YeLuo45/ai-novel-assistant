/**
 * V1658 NarrativeSettingCustomsEngine — Direction O Iter 27/30 (Round 5)
 */
export type SettingCustomsType = 'rituals' | 'ceremonies' | 'courtship' | 'mourning' | 'celebration' | 'transcendent' | 'infinite';
export type SettingCustomsFrequency = 'rare' | 'periodic' | 'common' | 'daily' | 'transcendent' | 'infinite';
export interface SettingCustomsEntry { entryId: string; type: SettingCustomsType; frequency: SettingCustomsFrequency; description: string; significance: number; chapter: number; }
export interface SettingCustomsCode { codeId: string; entryIds: string[]; cumulativeSignificance: number; breadth: number; }
export interface NarrativeSettingCustomsEngineState { entries: Map<string, SettingCustomsEntry>; codes: Map<string, SettingCustomsCode>; totalEntries: number; totalCodes: number; averageSignificance: number; customsComplexity: number; customsMastery: number; }
export function createNarrativeSettingCustomsEngineState(): NarrativeSettingCustomsEngineState { return { entries: new Map(), codes: new Map(), totalEntries: 0, totalCodes: 0, averageSignificance: 0.5, customsComplexity: 0.5, customsMastery: 0.5 }; }
export function addSettingCustomsEntry(state: NarrativeSettingCustomsEngineState, entryId: string, type: SettingCustomsType, frequency: SettingCustomsFrequency, description: string, significance: number, chapter: number): NarrativeSettingCustomsEngineState {
  const entry: SettingCustomsEntry = { entryId, type, frequency, description, significance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingCustomsCode(state: NarrativeSettingCustomsEngineState, codeId: string, entryIds: string[]): NarrativeSettingCustomsEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingCustomsEntry => e !== undefined);
  const cumulativeSignificance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.significance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const code: SettingCustomsCode = { codeId, entryIds, cumulativeSignificance, breadth };
  return recompute({ ...state, codes: new Map(state.codes).set(codeId, code), totalCodes: state.codes.size + 1 });
}
export function getSettingCustomsEntriesByType(state: NarrativeSettingCustomsEngineState, type: SettingCustomsType): SettingCustomsEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingCustomsReport(state: NarrativeSettingCustomsEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting customs entries');
  if (state.averageSignificance < 0.5) recommendations.push('Low significance — strengthen');
  if (state.customsMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCodes: state.totalCodes, averageSignificance: Math.round(state.averageSignificance * 100) / 100, customsComplexity: Math.round(state.customsComplexity * 100) / 100, customsMastery: Math.round(state.customsMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingCustomsEngineState): NarrativeSettingCustomsEngineState {
  const entries = Array.from(state.entries.values());
  const averageSignificance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.significance, 0) / entries.length;
  const codes = Array.from(state.codes.values());
  const customsComplexity = codes.length === 0 ? 0.5 : codes.reduce((s, c) => s + c.breadth, 0) / codes.length;
  return { ...state, averageSignificance, customsComplexity, customsMastery: averageSignificance * 0.5 + customsComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingCustomsEngineState(): NarrativeSettingCustomsEngineState { return createNarrativeSettingCustomsEngineState(); }