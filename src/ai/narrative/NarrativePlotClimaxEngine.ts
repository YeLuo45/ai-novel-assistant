/**
 * V1496 NarrativePlotClimaxEngine — Direction M Iter 6/30 (Round 5)
 */
export type PlotClimaxType = 'confrontation' | 'revelation' | 'decision' | 'transformation' | 'choice' | 'sacrifice' | 'transcendent' | 'infinite';
export type PlotClimaxIntensity = 'moderate' | 'strong' | 'peak' | 'explosive' | 'apocalyptic' | 'transcendent' | 'infinite';
export interface PlotClimaxEntry { entryId: string; type: PlotClimaxType; intensity: PlotClimaxIntensity; description: string; catharsis: number; chapter: number; }
export interface PlotClimaxSet { setId: string; entryIds: string[]; cumulativeCatharsis: number; breadth: number; }
export interface NarrativePlotClimaxEngineState { entries: Map<string, PlotClimaxEntry>; sets: Map<string, PlotClimaxSet>; totalEntries: number; totalSets: number; averageCatharsis: number; climaxComplexity: number; climaxMastery: number; }
export function createNarrativePlotClimaxEngineState(): NarrativePlotClimaxEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageCatharsis: 0.5, climaxComplexity: 0.5, climaxMastery: 0.5 }; }
export function addPlotClimaxEntry(state: NarrativePlotClimaxEngineState, entryId: string, type: PlotClimaxType, intensity: PlotClimaxIntensity, description: string, catharsis: number, chapter: number): NarrativePlotClimaxEngineState {
  const entry: PlotClimaxEntry = { entryId, type, intensity, description, catharsis, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotClimaxSet(state: NarrativePlotClimaxEngineState, setId: string, entryIds: string[]): NarrativePlotClimaxEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotClimaxEntry => e !== undefined);
  const cumulativeCatharsis = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.catharsis, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const set: PlotClimaxSet = { setId, entryIds, cumulativeCatharsis, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getPlotClimaxEntriesByType(state: NarrativePlotClimaxEngineState, type: PlotClimaxType): PlotClimaxEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotClimaxReport(state: NarrativePlotClimaxEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot climax entries');
  if (state.averageCatharsis < 0.5) recommendations.push('Low catharsis — strengthen');
  if (state.climaxMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageCatharsis: Math.round(state.averageCatharsis * 100) / 100, climaxComplexity: Math.round(state.climaxComplexity * 100) / 100, climaxMastery: Math.round(state.climaxMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotClimaxEngineState): NarrativePlotClimaxEngineState {
  const entries = Array.from(state.entries.values());
  const averageCatharsis = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.catharsis, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const climaxComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageCatharsis, climaxComplexity, climaxMastery: averageCatharsis * 0.5 + climaxComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotClimaxEngineState(): NarrativePlotClimaxEngineState { return createNarrativePlotClimaxEngineState(); }