/**
 * V1518 NarrativePlotFlashbackEngine — Direction M Iter 17/30 (Round 5)
 */
export type PlotFlashbackType = 'memory' | 'history' | 'prequel' | 'vision' | 'dream' | 'transcendent' | 'infinite';
export type PlotFlashbackDepth = 'recent' | 'years_ago' | 'decades' | 'generational' | 'archaeological' | 'transcendent' | 'infinite';
export interface PlotFlashbackEntry { entryId: string; type: PlotFlashbackType; depth: PlotFlashbackDepth; description: string; emotionalImpact: number; chapter: number; }
export interface PlotFlashbackSet { setId: string; entryIds: string[]; cumulativeEmotionalImpact: number; breadth: number; }
export interface NarrativePlotFlashbackEngineState { entries: Map<string, PlotFlashbackEntry>; sets: Map<string, PlotFlashbackSet>; totalEntries: number; totalSets: number; averageEmotionalImpact: number; flashbackComplexity: number; flashbackMastery: number; }
export function createNarrativePlotFlashbackEngineState(): NarrativePlotFlashbackEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageEmotionalImpact: 0.5, flashbackComplexity: 0.5, flashbackMastery: 0.5 }; }
export function addPlotFlashbackEntry(state: NarrativePlotFlashbackEngineState, entryId: string, type: PlotFlashbackType, depth: PlotFlashbackDepth, description: string, emotionalImpact: number, chapter: number): NarrativePlotFlashbackEngineState {
  const entry: PlotFlashbackEntry = { entryId, type, depth, description, emotionalImpact, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotFlashbackSet(state: NarrativePlotFlashbackEngineState, setId: string, entryIds: string[]): NarrativePlotFlashbackEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotFlashbackEntry => e !== undefined);
  const cumulativeEmotionalImpact = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.emotionalImpact, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const set: PlotFlashbackSet = { setId, entryIds, cumulativeEmotionalImpact, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getPlotFlashbackEntriesByType(state: NarrativePlotFlashbackEngineState, type: PlotFlashbackType): PlotFlashbackEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotFlashbackReport(state: NarrativePlotFlashbackEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot flashback entries');
  if (state.averageEmotionalImpact < 0.5) recommendations.push('Low emotional impact — strengthen');
  if (state.flashbackMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageEmotionalImpact: Math.round(state.averageEmotionalImpact * 100) / 100, flashbackComplexity: Math.round(state.flashbackComplexity * 100) / 100, flashbackMastery: Math.round(state.flashbackMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotFlashbackEngineState): NarrativePlotFlashbackEngineState {
  const entries = Array.from(state.entries.values());
  const averageEmotionalImpact = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.emotionalImpact, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const flashbackComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageEmotionalImpact, flashbackComplexity, flashbackMastery: averageEmotionalImpact * 0.5 + flashbackComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotFlashbackEngineState(): NarrativePlotFlashbackEngineState { return createNarrativePlotFlashbackEngineState(); }