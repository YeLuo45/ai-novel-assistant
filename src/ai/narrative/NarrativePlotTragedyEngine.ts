/**
 * V1536 NarrativePlotTragedyEngine — Direction M Iter 26/30 (Round 5)
 */
export type PlotTragedyType = 'classic' | 'modern' | 'domestic' | 'cosmic' | 'ironic' | 'transcendent' | 'infinite';
export type PlotTragedyFlaw = 'hubris' | 'hamartia' | 'fate' | 'ignorance' | 'virtue' | 'transcendent' | 'infinite';
export interface PlotTragedyEntry { entryId: string; type: PlotTragedyType; flaw: PlotTragedyFlaw; description: string; catharsis: number; chapter: number; }
export interface PlotTragedyArc { arcId: string; entryIds: string[]; cumulativeCatharsis: number; breadth: number; }
export interface NarrativePlotTragedyEngineState { entries: Map<string, PlotTragedyEntry>; arcs: Map<string, PlotTragedyArc>; totalEntries: number; totalArcs: number; averageCatharsis: number; tragedyComplexity: number; tragedyMastery: number; }
export function createNarrativePlotTragedyEngineState(): NarrativePlotTragedyEngineState { return { entries: new Map(), arcs: new Map(), totalEntries: 0, totalArcs: 0, averageCatharsis: 0.5, tragedyComplexity: 0.5, tragedyMastery: 0.5 }; }
export function addPlotTragedyEntry(state: NarrativePlotTragedyEngineState, entryId: string, type: PlotTragedyType, flaw: PlotTragedyFlaw, description: string, catharsis: number, chapter: number): NarrativePlotTragedyEngineState {
  const entry: PlotTragedyEntry = { entryId, type, flaw, description, catharsis, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotTragedyArc(state: NarrativePlotTragedyEngineState, arcId: string, entryIds: string[]): NarrativePlotTragedyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotTragedyEntry => e !== undefined);
  const cumulativeCatharsis = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.catharsis, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const arc: PlotTragedyArc = { arcId, entryIds, cumulativeCatharsis, breadth };
  return recompute({ ...state, arcs: new Map(state.arcs).set(arcId, arc), totalArcs: state.arcs.size + 1 });
}
export function getPlotTragedyEntriesByType(state: NarrativePlotTragedyEngineState, type: PlotTragedyType): PlotTragedyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotTragedyReport(state: NarrativePlotTragedyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot tragedy entries');
  if (state.averageCatharsis < 0.5) recommendations.push('Low catharsis — strengthen');
  if (state.tragedyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalArcs: state.totalArcs, averageCatharsis: Math.round(state.averageCatharsis * 100) / 100, tragedyComplexity: Math.round(state.tragedyComplexity * 100) / 100, tragedyMastery: Math.round(state.tragedyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotTragedyEngineState): NarrativePlotTragedyEngineState {
  const entries = Array.from(state.entries.values());
  const averageCatharsis = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.catharsis, 0) / entries.length;
  const arcs = Array.from(state.arcs.values());
  const tragedyComplexity = arcs.length === 0 ? 0.5 : arcs.reduce((s, a) => s + a.breadth, 0) / arcs.length;
  return { ...state, averageCatharsis, tragedyComplexity, tragedyMastery: averageCatharsis * 0.5 + tragedyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotTragedyEngineState(): NarrativePlotTragedyEngineState { return createNarrativePlotTragedyEngineState(); }