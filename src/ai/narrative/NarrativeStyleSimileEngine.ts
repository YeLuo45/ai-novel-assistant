/**
 * V1562 NarrativeStyleSimileEngine — Direction N Iter 9/30 (Round 5)
 */
export type StyleSimileType = 'basic' | 'elaborate' | 'conceit' | 'epic' | 'homely' | 'scientific' | 'transcendent' | 'infinite';
export type StyleSimileOriginality = 'cliched' | 'common' | 'fresh' | 'novel' | 'transcendent' | 'infinite';
export interface StyleSimileEntry { entryId: string; type: StyleSimileType; originality: StyleSimileOriginality; description: string; vividness: number; chapter: number; }
export interface StyleSimileCluster { clusterId: string; entryIds: string[]; cumulativeVividness: number; breadth: number; }
export interface NarrativeStyleSimileEngineState { entries: Map<string, StyleSimileEntry>; clusters: Map<string, StyleSimileCluster>; totalEntries: number; totalClusters: number; averageVividness: number; simileComplexity: number; simileMastery: number; }
export function createNarrativeStyleSimileEngineState(): NarrativeStyleSimileEngineState { return { entries: new Map(), clusters: new Map(), totalEntries: 0, totalClusters: 0, averageVividness: 0.5, simileComplexity: 0.5, simileMastery: 0.5 }; }
export function addStyleSimileEntry(state: NarrativeStyleSimileEngineState, entryId: string, type: StyleSimileType, originality: StyleSimileOriginality, description: string, vividness: number, chapter: number): NarrativeStyleSimileEngineState {
  const entry: StyleSimileEntry = { entryId, type, originality, description, vividness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleSimileCluster(state: NarrativeStyleSimileEngineState, clusterId: string, entryIds: string[]): NarrativeStyleSimileEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleSimileEntry => e !== undefined);
  const cumulativeVividness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.vividness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const cluster: StyleSimileCluster = { clusterId, entryIds, cumulativeVividness, breadth };
  return recompute({ ...state, clusters: new Map(state.clusters).set(clusterId, cluster), totalClusters: state.clusters.size + 1 });
}
export function getStyleSimileEntriesByType(state: NarrativeStyleSimileEngineState, type: StyleSimileType): StyleSimileEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleSimileReport(state: NarrativeStyleSimileEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style simile entries');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.simileMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClusters: state.totalClusters, averageVividness: Math.round(state.averageVividness * 100) / 100, simileComplexity: Math.round(state.simileComplexity * 100) / 100, simileMastery: Math.round(state.simileMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleSimileEngineState): NarrativeStyleSimileEngineState {
  const entries = Array.from(state.entries.values());
  const averageVividness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.vividness, 0) / entries.length;
  const clusters = Array.from(state.clusters.values());
  const simileComplexity = clusters.length === 0 ? 0.5 : clusters.reduce((s, c) => s + c.breadth, 0) / clusters.length;
  return { ...state, averageVividness, simileComplexity, simileMastery: averageVividness * 0.5 + simileComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleSimileEngineState(): NarrativeStyleSimileEngineState { return createNarrativeStyleSimileEngineState(); }