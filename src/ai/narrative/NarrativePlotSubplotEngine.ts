/**
 * V1516 NarrativePlotSubplotEngine — Direction M Iter 16/30 (Round 5)
 */
export type PlotSubplotType = 'parallel' | 'interwoven' | 'mirror' | 'contrast' | 'supporting' | 'transcendent' | 'infinite';
export type PlotSubplotIndependence = 'dependent' | 'semi_independent' | 'independent' | 'transcendent' | 'infinite';
export interface PlotSubplotEntry { entryId: string; type: PlotSubplotType; independence: PlotSubplotIndependence; description: string; integration: number; chapter: number; }
export interface PlotSubplotThread { threadId: string; entryIds: string[]; cumulativeIntegration: number; breadth: number; }
export interface NarrativePlotSubplotEngineState { entries: Map<string, PlotSubplotEntry>; threads: Map<string, PlotSubplotThread>; totalEntries: number; totalThreads: number; averageIntegration: number; subplotComplexity: number; subplotMastery: number; }
export function createNarrativePlotSubplotEngineState(): NarrativePlotSubplotEngineState { return { entries: new Map(), threads: new Map(), totalEntries: 0, totalThreads: 0, averageIntegration: 0.5, subplotComplexity: 0.5, subplotMastery: 0.5 }; }
export function addPlotSubplotEntry(state: NarrativePlotSubplotEngineState, entryId: string, type: PlotSubplotType, independence: PlotSubplotIndependence, description: string, integration: number, chapter: number): NarrativePlotSubplotEngineState {
  const entry: PlotSubplotEntry = { entryId, type, independence, description, integration, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotSubplotThread(state: NarrativePlotSubplotEngineState, threadId: string, entryIds: string[]): NarrativePlotSubplotEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotSubplotEntry => e !== undefined);
  const cumulativeIntegration = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.integration, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const thread: PlotSubplotThread = { threadId, entryIds, cumulativeIntegration, breadth };
  return recompute({ ...state, threads: new Map(state.threads).set(threadId, thread), totalThreads: state.threads.size + 1 });
}
export function getPlotSubplotEntriesByType(state: NarrativePlotSubplotEngineState, type: PlotSubplotType): PlotSubplotEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotSubplotReport(state: NarrativePlotSubplotEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot subplot entries');
  if (state.averageIntegration < 0.5) recommendations.push('Low integration — strengthen');
  if (state.subplotMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalThreads: state.totalThreads, averageIntegration: Math.round(state.averageIntegration * 100) / 100, subplotComplexity: Math.round(state.subplotComplexity * 100) / 100, subplotMastery: Math.round(state.subplotMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotSubplotEngineState): NarrativePlotSubplotEngineState {
  const entries = Array.from(state.entries.values());
  const averageIntegration = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.integration, 0) / entries.length;
  const threads = Array.from(state.threads.values());
  const subplotComplexity = threads.length === 0 ? 0.5 : threads.reduce((s, t) => s + t.breadth, 0) / threads.length;
  return { ...state, averageIntegration, subplotComplexity, subplotMastery: averageIntegration * 0.5 + subplotComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotSubplotEngineState(): NarrativePlotSubplotEngineState { return createNarrativePlotSubplotEngineState(); }