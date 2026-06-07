/**
 * V1650 NarrativeSettingHistoryEngine — Direction O Iter 23/30 (Round 5)
 */
export type SettingHistoryType = 'recent' | 'documented' | 'legendary' | 'mythic' | 'lost' | 'transcendent' | 'infinite';
export type SettingHistoryInfluence = 'subtle' | 'moderate' | 'profound' | 'overwhelming' | 'transcendent' | 'infinite';
export interface SettingHistoryEntry { entryId: string; type: SettingHistoryType; influence: SettingHistoryInfluence; description: string; depth: number; chapter: number; }
export interface SettingHistoryPeriod { periodId: string; entryIds: string[]; cumulativeDepth: number; breadth: number; }
export interface NarrativeSettingHistoryEngineState { entries: Map<string, SettingHistoryEntry>; periods: Map<string, SettingHistoryPeriod>; totalEntries: number; totalPeriods: number; averageDepth: number; historyComplexity: number; historyMastery: number; }
export function createNarrativeSettingHistoryEngineState(): NarrativeSettingHistoryEngineState { return { entries: new Map(), periods: new Map(), totalEntries: 0, totalPeriods: 0, averageDepth: 0.5, historyComplexity: 0.5, historyMastery: 0.5 }; }
export function addSettingHistoryEntry(state: NarrativeSettingHistoryEngineState, entryId: string, type: SettingHistoryType, influence: SettingHistoryInfluence, description: string, depth: number, chapter: number): NarrativeSettingHistoryEngineState {
  const entry: SettingHistoryEntry = { entryId, type, influence, description, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingHistoryPeriod(state: NarrativeSettingHistoryEngineState, periodId: string, entryIds: string[]): NarrativeSettingHistoryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingHistoryEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const period: SettingHistoryPeriod = { periodId, entryIds, cumulativeDepth, breadth };
  return recompute({ ...state, periods: new Map(state.periods).set(periodId, period), totalPeriods: state.periods.size + 1 });
}
export function getSettingHistoryEntriesByType(state: NarrativeSettingHistoryEngineState, type: SettingHistoryType): SettingHistoryEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingHistoryReport(state: NarrativeSettingHistoryEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting history entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.historyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPeriods: state.totalPeriods, averageDepth: Math.round(state.averageDepth * 100) / 100, historyComplexity: Math.round(state.historyComplexity * 100) / 100, historyMastery: Math.round(state.historyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingHistoryEngineState): NarrativeSettingHistoryEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const periods = Array.from(state.periods.values());
  const historyComplexity = periods.length === 0 ? 0.5 : periods.reduce((s, p) => s + p.breadth, 0) / periods.length;
  return { ...state, averageDepth, historyComplexity, historyMastery: averageDepth * 0.5 + historyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingHistoryEngineState(): NarrativeSettingHistoryEngineState { return createNarrativeSettingHistoryEngineState(); }