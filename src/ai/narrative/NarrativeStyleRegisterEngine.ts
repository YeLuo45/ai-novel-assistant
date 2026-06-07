/**
 * V1552 NarrativeStyleRegisterEngine — Direction N Iter 4/30 (Round 5)
 */
export type StyleRegisterType = 'formal' | 'casual' | 'slang' | 'archaic' | 'technical' | 'poetic' | 'transcendent' | 'infinite';
export type StyleRegisterContext = 'academic' | 'professional' | 'social' | 'intimate' | 'public' | 'transcendent' | 'infinite';
export interface StyleRegisterEntry { entryId: string; type: StyleRegisterType; context: StyleRegisterContext; description: string; appropriateness: number; chapter: number; }
export interface StyleRegisterCluster { clusterId: string; entryIds: string[]; cumulativeAppropriateness: number; breadth: number; }
export interface NarrativeStyleRegisterEngineState { entries: Map<string, StyleRegisterEntry>; clusters: Map<string, StyleRegisterCluster>; totalEntries: number; totalClusters: number; averageAppropriateness: number; registerComplexity: number; registerMastery: number; }
export function createNarrativeStyleRegisterEngineState(): NarrativeStyleRegisterEngineState { return { entries: new Map(), clusters: new Map(), totalEntries: 0, totalClusters: 0, averageAppropriateness: 0.5, registerComplexity: 0.5, registerMastery: 0.5 }; }
export function addStyleRegisterEntry(state: NarrativeStyleRegisterEngineState, entryId: string, type: StyleRegisterType, context: StyleRegisterContext, description: string, appropriateness: number, chapter: number): NarrativeStyleRegisterEngineState {
  const entry: StyleRegisterEntry = { entryId, type, context, description, appropriateness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleRegisterCluster(state: NarrativeStyleRegisterEngineState, clusterId: string, entryIds: string[]): NarrativeStyleRegisterEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleRegisterEntry => e !== undefined);
  const cumulativeAppropriateness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.appropriateness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const cluster: StyleRegisterCluster = { clusterId, entryIds, cumulativeAppropriateness, breadth };
  return recompute({ ...state, clusters: new Map(state.clusters).set(clusterId, cluster), totalClusters: state.clusters.size + 1 });
}
export function getStyleRegisterEntriesByType(state: NarrativeStyleRegisterEngineState, type: StyleRegisterType): StyleRegisterEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleRegisterReport(state: NarrativeStyleRegisterEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style register entries');
  if (state.averageAppropriateness < 0.5) recommendations.push('Low appropriateness — strengthen');
  if (state.registerMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClusters: state.totalClusters, averageAppropriateness: Math.round(state.averageAppropriateness * 100) / 100, registerComplexity: Math.round(state.registerComplexity * 100) / 100, registerMastery: Math.round(state.registerMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleRegisterEngineState): NarrativeStyleRegisterEngineState {
  const entries = Array.from(state.entries.values());
  const averageAppropriateness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.appropriateness, 0) / entries.length;
  const clusters = Array.from(state.clusters.values());
  const registerComplexity = clusters.length === 0 ? 0.5 : clusters.reduce((s, c) => s + c.breadth, 0) / clusters.length;
  return { ...state, averageAppropriateness, registerComplexity, registerMastery: averageAppropriateness * 0.5 + registerComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleRegisterEngineState(): NarrativeStyleRegisterEngineState { return createNarrativeStyleRegisterEngineState(); }