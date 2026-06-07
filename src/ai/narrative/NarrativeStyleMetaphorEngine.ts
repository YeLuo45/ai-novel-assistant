/**
 * V1560 NarrativeStyleMetaphorEngine — Direction N Iter 8/30 (Round 5)
 */
export type StyleMetaphorType = 'direct' | 'implicit' | 'extended' | 'mixed' | 'dead' | 'original' | 'transcendent' | 'infinite';
export type StyleMetaphorOriginality = 'cliched' | 'common' | 'fresh' | 'novel' | 'transcendent' | 'infinite';
export interface StyleMetaphorEntry { entryId: string; type: StyleMetaphorType; originality: StyleMetaphorOriginality; description: string; resonance: number; chapter: number; }
export interface StyleMetaphorCluster { clusterId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeStyleMetaphorEngineState { entries: Map<string, StyleMetaphorEntry>; clusters: Map<string, StyleMetaphorCluster>; totalEntries: number; totalClusters: number; averageResonance: number; metaphorComplexity: number; metaphorMastery: number; }
export function createNarrativeStyleMetaphorEngineState(): NarrativeStyleMetaphorEngineState { return { entries: new Map(), clusters: new Map(), totalEntries: 0, totalClusters: 0, averageResonance: 0.5, metaphorComplexity: 0.5, metaphorMastery: 0.5 }; }
export function addStyleMetaphorEntry(state: NarrativeStyleMetaphorEngineState, entryId: string, type: StyleMetaphorType, originality: StyleMetaphorOriginality, description: string, resonance: number, chapter: number): NarrativeStyleMetaphorEngineState {
  const entry: StyleMetaphorEntry = { entryId, type, originality, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleMetaphorCluster(state: NarrativeStyleMetaphorEngineState, clusterId: string, entryIds: string[]): NarrativeStyleMetaphorEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleMetaphorEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const cluster: StyleMetaphorCluster = { clusterId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, clusters: new Map(state.clusters).set(clusterId, cluster), totalClusters: state.clusters.size + 1 });
}
export function getStyleMetaphorEntriesByType(state: NarrativeStyleMetaphorEngineState, type: StyleMetaphorType): StyleMetaphorEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleMetaphorReport(state: NarrativeStyleMetaphorEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style metaphor entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.metaphorMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClusters: state.totalClusters, averageResonance: Math.round(state.averageResonance * 100) / 100, metaphorComplexity: Math.round(state.metaphorComplexity * 100) / 100, metaphorMastery: Math.round(state.metaphorMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleMetaphorEngineState): NarrativeStyleMetaphorEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const clusters = Array.from(state.clusters.values());
  const metaphorComplexity = clusters.length === 0 ? 0.5 : clusters.reduce((s, c) => s + c.breadth, 0) / clusters.length;
  return { ...state, averageResonance, metaphorComplexity, metaphorMastery: averageResonance * 0.5 + metaphorComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleMetaphorEngineState(): NarrativeStyleMetaphorEngineState { return createNarrativeStyleMetaphorEngineState(); }