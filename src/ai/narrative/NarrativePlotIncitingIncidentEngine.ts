/**
 * V1508 NarrativePlotIncitingIncidentEngine — Direction M Iter 12/30 (Round 5)
 */
export type PlotIncitingIncidentType = 'event' | 'arrival' | 'discovery' | 'decision' | 'call' | 'transcendent' | 'infinite';
export type PlotIncitingIncidentTrigger = 'external' | 'internal' | 'coincidence' | 'choice' | 'destiny' | 'transcendent' | 'infinite';
export interface PlotIncitingIncidentEntry { entryId: string; type: PlotIncitingIncidentType; trigger: PlotIncitingIncidentTrigger; description: string; disruption: number; chapter: number; }
export interface PlotIncitingIncidentCluster { clusterId: string; entryIds: string[]; cumulativeDisruption: number; breadth: number; }
export interface NarrativePlotIncitingIncidentEngineState { entries: Map<string, PlotIncitingIncidentEntry>; clusters: Map<string, PlotIncitingIncidentCluster>; totalEntries: number; totalClusters: number; averageDisruption: number; incitingComplexity: number; incitingMastery: number; }
export function createNarrativePlotIncitingIncidentEngineState(): NarrativePlotIncitingIncidentEngineState { return { entries: new Map(), clusters: new Map(), totalEntries: 0, totalClusters: 0, averageDisruption: 0.5, incitingComplexity: 0.5, incitingMastery: 0.5 }; }
export function addPlotIncitingIncidentEntry(state: NarrativePlotIncitingIncidentEngineState, entryId: string, type: PlotIncitingIncidentType, trigger: PlotIncitingIncidentTrigger, description: string, disruption: number, chapter: number): NarrativePlotIncitingIncidentEngineState {
  const entry: PlotIncitingIncidentEntry = { entryId, type, trigger, description, disruption, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotIncitingIncidentCluster(state: NarrativePlotIncitingIncidentEngineState, clusterId: string, entryIds: string[]): NarrativePlotIncitingIncidentEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotIncitingIncidentEntry => e !== undefined);
  const cumulativeDisruption = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.disruption, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const cluster: PlotIncitingIncidentCluster = { clusterId, entryIds, cumulativeDisruption, breadth };
  return recompute({ ...state, clusters: new Map(state.clusters).set(clusterId, cluster), totalClusters: state.clusters.size + 1 });
}
export function getPlotIncitingIncidentEntriesByType(state: NarrativePlotIncitingIncidentEngineState, type: PlotIncitingIncidentType): PlotIncitingIncidentEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotIncitingIncidentReport(state: NarrativePlotIncitingIncidentEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot inciting incident entries');
  if (state.averageDisruption < 0.5) recommendations.push('Low disruption — strengthen');
  if (state.incitingMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClusters: state.totalClusters, averageDisruption: Math.round(state.averageDisruption * 100) / 100, incitingComplexity: Math.round(state.incitingComplexity * 100) / 100, incitingMastery: Math.round(state.incitingMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotIncitingIncidentEngineState): NarrativePlotIncitingIncidentEngineState {
  const entries = Array.from(state.entries.values());
  const averageDisruption = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.disruption, 0) / entries.length;
  const clusters = Array.from(state.clusters.values());
  const incitingComplexity = clusters.length === 0 ? 0.5 : clusters.reduce((s, c) => s + c.breadth, 0) / clusters.length;
  return { ...state, averageDisruption, incitingComplexity, incitingMastery: averageDisruption * 0.5 + incitingComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotIncitingIncidentEngineState(): NarrativePlotIncitingIncidentEngineState { return createNarrativePlotIncitingIncidentEngineState(); }