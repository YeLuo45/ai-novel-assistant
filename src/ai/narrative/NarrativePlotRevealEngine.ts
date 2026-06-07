/**
 * V1492 NarrativePlotRevealEngine — Direction M Iter 4/30 (Round 5)
 */
export type PlotRevealType = 'identity' | 'motive' | 'secret' | 'origin' | 'connection' | 'truth' | 'transcendent' | 'infinite';
export type PlotRevealManner = 'gradual' | 'sudden' | 'layered' | 'inferred' | 'dramatic' | 'transcendent' | 'infinite';
export interface PlotRevealEntry { entryId: string; type: PlotRevealType; manner: PlotRevealManner; description: string; impact: number; chapter: number; }
export interface PlotRevealSet { setId: string; entryIds: string[]; cumulativeImpact: number; breadth: number; }
export interface NarrativePlotRevealEngineState { entries: Map<string, PlotRevealEntry>; sets: Map<string, PlotRevealSet>; totalEntries: number; totalSets: number; averageImpact: number; revealComplexity: number; revealMastery: number; }
export function createNarrativePlotRevealEngineState(): NarrativePlotRevealEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageImpact: 0.5, revealComplexity: 0.5, revealMastery: 0.5 }; }
export function addPlotRevealEntry(state: NarrativePlotRevealEngineState, entryId: string, type: PlotRevealType, manner: PlotRevealManner, description: string, impact: number, chapter: number): NarrativePlotRevealEngineState {
  const entry: PlotRevealEntry = { entryId, type, manner, description, impact, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotRevealSet(state: NarrativePlotRevealEngineState, setId: string, entryIds: string[]): NarrativePlotRevealEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotRevealEntry => e !== undefined);
  const cumulativeImpact = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const set: PlotRevealSet = { setId, entryIds, cumulativeImpact, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getPlotRevealEntriesByType(state: NarrativePlotRevealEngineState, type: PlotRevealType): PlotRevealEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotRevealReport(state: NarrativePlotRevealEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot reveal entries');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.revealMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageImpact: Math.round(state.averageImpact * 100) / 100, revealComplexity: Math.round(state.revealComplexity * 100) / 100, revealMastery: Math.round(state.revealMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotRevealEngineState): NarrativePlotRevealEngineState {
  const entries = Array.from(state.entries.values());
  const averageImpact = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const revealComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageImpact, revealComplexity, revealMastery: averageImpact * 0.5 + revealComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotRevealEngineState(): NarrativePlotRevealEngineState { return createNarrativePlotRevealEngineState(); }