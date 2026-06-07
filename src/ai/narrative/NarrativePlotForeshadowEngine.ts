/**
 * V1520 NarrativePlotForeshadowEngine — Direction M Iter 18/30 (Round 5)
 */
export type PlotForeshadowType = 'plant' | 'hint' | 'symbol' | 'prophecy' | 'callback_setup' | 'transcendent' | 'infinite';
export type PlotForeshadowSubtlety = 'obvious' | 'moderate' | 'subtle' | 'hidden' | 'invisible' | 'transcendent' | 'infinite';
export interface PlotForeshadowEntry { entryId: string; type: PlotForeshadowType; subtlety: PlotForeshadowSubtlety; description: string; payoffWeight: number; chapter: number; }
export interface PlotForeshadowArc { arcId: string; entryIds: string[]; cumulativePayoffWeight: number; breadth: number; }
export interface NarrativePlotForeshadowEngineState { entries: Map<string, PlotForeshadowEntry>; arcs: Map<string, PlotForeshadowArc>; totalEntries: number; totalArcs: number; averagePayoffWeight: number; foreshadowComplexity: number; foreshadowMastery: number; }
export function createNarrativePlotForeshadowEngineState(): NarrativePlotForeshadowEngineState { return { entries: new Map(), arcs: new Map(), totalEntries: 0, totalArcs: 0, averagePayoffWeight: 0.5, foreshadowComplexity: 0.5, foreshadowMastery: 0.5 }; }
export function addPlotForeshadowEntry(state: NarrativePlotForeshadowEngineState, entryId: string, type: PlotForeshadowType, subtlety: PlotForeshadowSubtlety, description: string, payoffWeight: number, chapter: number): NarrativePlotForeshadowEngineState {
  const entry: PlotForeshadowEntry = { entryId, type, subtlety, description, payoffWeight, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotForeshadowArc(state: NarrativePlotForeshadowEngineState, arcId: string, entryIds: string[]): NarrativePlotForeshadowEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotForeshadowEntry => e !== undefined);
  const cumulativePayoffWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.payoffWeight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const arc: PlotForeshadowArc = { arcId, entryIds, cumulativePayoffWeight, breadth };
  return recompute({ ...state, arcs: new Map(state.arcs).set(arcId, arc), totalArcs: state.arcs.size + 1 });
}
export function getPlotForeshadowEntriesByType(state: NarrativePlotForeshadowEngineState, type: PlotForeshadowType): PlotForeshadowEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotForeshadowReport(state: NarrativePlotForeshadowEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot foreshadow entries');
  if (state.averagePayoffWeight < 0.5) recommendations.push('Low payoff weight — strengthen');
  if (state.foreshadowMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalArcs: state.totalArcs, averagePayoffWeight: Math.round(state.averagePayoffWeight * 100) / 100, foreshadowComplexity: Math.round(state.foreshadowComplexity * 100) / 100, foreshadowMastery: Math.round(state.foreshadowMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotForeshadowEngineState): NarrativePlotForeshadowEngineState {
  const entries = Array.from(state.entries.values());
  const averagePayoffWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.payoffWeight, 0) / entries.length;
  const arcs = Array.from(state.arcs.values());
  const foreshadowComplexity = arcs.length === 0 ? 0.5 : arcs.reduce((s, a) => s + a.breadth, 0) / arcs.length;
  return { ...state, averagePayoffWeight, foreshadowComplexity, foreshadowMastery: averagePayoffWeight * 0.5 + foreshadowComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotForeshadowEngineState(): NarrativePlotForeshadowEngineState { return createNarrativePlotForeshadowEngineState(); }