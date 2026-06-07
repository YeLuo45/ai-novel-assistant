/**
 * V1586 NarrativeStyleDistanceEngine — Direction N Iter 21/30 (Round 5)
 */
export type StyleDistanceType = 'close' | 'middle' | 'far' | 'variable' | 'transcendent' | 'infinite';
export type StyleDistanceVariation = 'consistent' | 'shifting' | 'dynamic' | 'transcendent' | 'infinite';
export interface StyleDistanceEntry { entryId: string; type: StyleDistanceType; variation: StyleDistanceVariation; description: string; engagement: number; chapter: number; }
export interface StyleDistanceCluster { clusterId: string; entryIds: string[]; cumulativeEngagement: number; breadth: number; }
export interface NarrativeStyleDistanceEngineState { entries: Map<string, StyleDistanceEntry>; clusters: Map<string, StyleDistanceCluster>; totalEntries: number; totalClusters: number; averageEngagement: number; distanceComplexity: number; distanceMastery: number; }
export function createNarrativeStyleDistanceEngineState(): NarrativeStyleDistanceEngineState { return { entries: new Map(), clusters: new Map(), totalEntries: 0, totalClusters: 0, averageEngagement: 0.5, distanceComplexity: 0.5, distanceMastery: 0.5 }; }
export function addStyleDistanceEntry(state: NarrativeStyleDistanceEngineState, entryId: string, type: StyleDistanceType, variation: StyleDistanceVariation, description: string, engagement: number, chapter: number): NarrativeStyleDistanceEngineState {
  const entry: StyleDistanceEntry = { entryId, type, variation, description, engagement, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleDistanceCluster(state: NarrativeStyleDistanceEngineState, clusterId: string, entryIds: string[]): NarrativeStyleDistanceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleDistanceEntry => e !== undefined);
  const cumulativeEngagement = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.engagement, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const cluster: StyleDistanceCluster = { clusterId, entryIds, cumulativeEngagement, breadth };
  return recompute({ ...state, clusters: new Map(state.clusters).set(clusterId, cluster), totalClusters: state.clusters.size + 1 });
}
export function getStyleDistanceEntriesByType(state: NarrativeStyleDistanceEngineState, type: StyleDistanceType): StyleDistanceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleDistanceReport(state: NarrativeStyleDistanceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style distance entries');
  if (state.averageEngagement < 0.5) recommendations.push('Low engagement — strengthen');
  if (state.distanceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClusters: state.totalClusters, averageEngagement: Math.round(state.averageEngagement * 100) / 100, distanceComplexity: Math.round(state.distanceComplexity * 100) / 100, distanceMastery: Math.round(state.distanceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleDistanceEngineState): NarrativeStyleDistanceEngineState {
  const entries = Array.from(state.entries.values());
  const averageEngagement = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.engagement, 0) / entries.length;
  const clusters = Array.from(state.clusters.values());
  const distanceComplexity = clusters.length === 0 ? 0.5 : clusters.reduce((s, c) => s + c.breadth, 0) / clusters.length;
  return { ...state, averageEngagement, distanceComplexity, distanceMastery: averageEngagement * 0.5 + distanceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleDistanceEngineState(): NarrativeStyleDistanceEngineState { return createNarrativeStyleDistanceEngineState(); }