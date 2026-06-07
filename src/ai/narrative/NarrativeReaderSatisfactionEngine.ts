/**
 * V1678 NarrativeReaderSatisfactionEngine — Direction P Iter 7/30 (Round 5)
 */
export type ReaderSatisfactionType = 'resolution' | 'payoff' | 'completion' | 'closure' | 'meaning' | 'transcendent' | 'infinite';
export type ReaderSatisfactionDepth = 'shallow' | 'moderate' | 'deep' | 'profound' | 'transcendent' | 'infinite';
export interface ReaderSatisfactionEntry { entryId: string; type: ReaderSatisfactionType; depth: ReaderSatisfactionDepth; description: string; fulfillment: number; chapter: number; }
export interface ReaderSatisfactionLayer { layerId: string; entryIds: string[]; cumulativeFulfillment: number; breadth: number; }
export interface NarrativeReaderSatisfactionEngineState { entries: Map<string, ReaderSatisfactionEntry>; layers: Map<string, ReaderSatisfactionLayer>; totalEntries: number; totalLayers: number; averageFulfillment: number; satisfactionComplexity: number; satisfactionMastery: number; }
export function createNarrativeReaderSatisfactionEngineState(): NarrativeReaderSatisfactionEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageFulfillment: 0.5, satisfactionComplexity: 0.5, satisfactionMastery: 0.5 }; }
export function addReaderSatisfactionEntry(state: NarrativeReaderSatisfactionEngineState, entryId: string, type: ReaderSatisfactionType, depth: ReaderSatisfactionDepth, description: string, fulfillment: number, chapter: number): NarrativeReaderSatisfactionEngineState {
  const entry: ReaderSatisfactionEntry = { entryId, type, depth, description, fulfillment, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderSatisfactionLayer(state: NarrativeReaderSatisfactionEngineState, layerId: string, entryIds: string[]): NarrativeReaderSatisfactionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderSatisfactionEntry => e !== undefined);
  const cumulativeFulfillment = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.fulfillment, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: ReaderSatisfactionLayer = { layerId, entryIds, cumulativeFulfillment, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderSatisfactionEntriesByType(state: NarrativeReaderSatisfactionEngineState, type: ReaderSatisfactionType): ReaderSatisfactionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderSatisfactionReport(state: NarrativeReaderSatisfactionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader satisfaction entries');
  if (state.averageFulfillment < 0.5) recommendations.push('Low fulfillment — strengthen');
  if (state.satisfactionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageFulfillment: Math.round(state.averageFulfillment * 100) / 100, satisfactionComplexity: Math.round(state.satisfactionComplexity * 100) / 100, satisfactionMastery: Math.round(state.satisfactionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderSatisfactionEngineState): NarrativeReaderSatisfactionEngineState {
  const entries = Array.from(state.entries.values());
  const averageFulfillment = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.fulfillment, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const satisfactionComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageFulfillment, satisfactionComplexity, satisfactionMastery: averageFulfillment * 0.5 + satisfactionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderSatisfactionEngineState(): NarrativeReaderSatisfactionEngineState { return createNarrativeReaderSatisfactionEngineState(); }