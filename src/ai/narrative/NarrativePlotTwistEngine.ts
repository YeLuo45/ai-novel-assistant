/**
 * V1490 NarrativePlotTwistEngine — Direction M Iter 3/30 (Round 5)
 */
export type PlotTwistType = 'reversal' | 'revelation' | 'recontextualization' | 'deception' | 'coincidence' | 'irony' | 'transcendent' | 'infinite';
export type PlotTwistImpact = 'minor' | 'moderate' | 'major' | 'shocking' | 'paradigm' | 'transcendent' | 'infinite';
export interface PlotTwistEntry { entryId: string; type: PlotTwistType; impact: PlotTwistImpact; description: string; surprise: number; chapter: number; }
export interface PlotTwistSet { setId: string; entryIds: string[]; cumulativeSurprise: number; breadth: number; }
export interface NarrativePlotTwistEngineState { entries: Map<string, PlotTwistEntry>; sets: Map<string, PlotTwistSet>; totalEntries: number; totalSets: number; averageSurprise: number; twistComplexity: number; twistMastery: number; }
export function createNarrativePlotTwistEngineState(): NarrativePlotTwistEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageSurprise: 0.5, twistComplexity: 0.5, twistMastery: 0.5 }; }
export function addPlotTwistEntry(state: NarrativePlotTwistEngineState, entryId: string, type: PlotTwistType, impact: PlotTwistImpact, description: string, surprise: number, chapter: number): NarrativePlotTwistEngineState {
  const entry: PlotTwistEntry = { entryId, type, impact, description, surprise, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotTwistSet(state: NarrativePlotTwistEngineState, setId: string, entryIds: string[]): NarrativePlotTwistEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotTwistEntry => e !== undefined);
  const cumulativeSurprise = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.surprise, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const set: PlotTwistSet = { setId, entryIds, cumulativeSurprise, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getPlotTwistEntriesByType(state: NarrativePlotTwistEngineState, type: PlotTwistType): PlotTwistEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotTwistReport(state: NarrativePlotTwistEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot twist entries');
  if (state.averageSurprise < 0.5) recommendations.push('Low surprise — strengthen');
  if (state.twistMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageSurprise: Math.round(state.averageSurprise * 100) / 100, twistComplexity: Math.round(state.twistComplexity * 100) / 100, twistMastery: Math.round(state.twistMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotTwistEngineState): NarrativePlotTwistEngineState {
  const entries = Array.from(state.entries.values());
  const averageSurprise = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.surprise, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const twistComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageSurprise, twistComplexity, twistMastery: averageSurprise * 0.5 + twistComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotTwistEngineState(): NarrativePlotTwistEngineState { return createNarrativePlotTwistEngineState(); }