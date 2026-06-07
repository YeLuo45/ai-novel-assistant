/**
 * V1558 NarrativeStyleImageryEngine — Direction N Iter 7/30 (Round 5)
 */
export type StyleImageryType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'kinesthetic' | 'transcendent' | 'infinite';
export type StyleImageryVividness = 'flat' | 'moderate' | 'vivid' | 'striking' | 'transcendent' | 'infinite';
export interface StyleImageryEntry { entryId: string; type: StyleImageryType; vividness: StyleImageryVividness; description: string; evocative: number; chapter: number; }
export interface StyleImageryLayer { layerId: string; entryIds: string[]; cumulativeEvocative: number; breadth: number; }
export interface NarrativeStyleImageryEngineState { entries: Map<string, StyleImageryEntry>; layers: Map<string, StyleImageryLayer>; totalEntries: number; totalLayers: number; averageEvocative: number; imageryComplexity: number; imageryMastery: number; }
export function createNarrativeStyleImageryEngineState(): NarrativeStyleImageryEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageEvocative: 0.5, imageryComplexity: 0.5, imageryMastery: 0.5 }; }
export function addStyleImageryEntry(state: NarrativeStyleImageryEngineState, entryId: string, type: StyleImageryType, vividness: StyleImageryVividness, description: string, evocative: number, chapter: number): NarrativeStyleImageryEngineState {
  const entry: StyleImageryEntry = { entryId, type, vividness, description, evocative, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleImageryLayer(state: NarrativeStyleImageryEngineState, layerId: string, entryIds: string[]): NarrativeStyleImageryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleImageryEntry => e !== undefined);
  const cumulativeEvocative = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.evocative, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: StyleImageryLayer = { layerId, entryIds, cumulativeEvocative, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getStyleImageryEntriesByType(state: NarrativeStyleImageryEngineState, type: StyleImageryType): StyleImageryEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleImageryReport(state: NarrativeStyleImageryEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style imagery entries');
  if (state.averageEvocative < 0.5) recommendations.push('Low evocative — strengthen');
  if (state.imageryMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageEvocative: Math.round(state.averageEvocative * 100) / 100, imageryComplexity: Math.round(state.imageryComplexity * 100) / 100, imageryMastery: Math.round(state.imageryMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleImageryEngineState): NarrativeStyleImageryEngineState {
  const entries = Array.from(state.entries.values());
  const averageEvocative = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.evocative, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const imageryComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageEvocative, imageryComplexity, imageryMastery: averageEvocative * 0.5 + imageryComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleImageryEngineState(): NarrativeStyleImageryEngineState { return createNarrativeStyleImageryEngineState(); }