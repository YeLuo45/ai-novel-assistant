/**
 * V2028 NarrativeBodyPerceptionEngine — Direction V Iter 2/30 (Round 5)
 */
export type BodyPerceptionType = 'visual' | 'auditory' | 'tactile' | 'gustatory' | 'olfactory' | 'transcendent' | 'infinite';
export type BodyPerceptionMode = 'passive' | 'active' | 'selective' | 'attentive' | 'transcendent' | 'infinite';
export interface BodyPerceptionEntry { entryId: string; type: BodyPerceptionType; mode: BodyPerceptionMode; description: string; resonance: number; chapter: number; }
export interface BodyPerceptionLayer { layerId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodyPerceptionEngineState { entries: Map<string, BodyPerceptionEntry>; layers: Map<string, BodyPerceptionLayer>; totalEntries: number; totalLayers: number; averageResonance: number; perceptionComplexity: number; perceptionMastery: number; }
export function createNarrativeBodyPerceptionEngineState(): NarrativeBodyPerceptionEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageResonance: 0.5, perceptionComplexity: 0.5, perceptionMastery: 0.5 }; }
export function addBodyPerceptionEntry(state: NarrativeBodyPerceptionEngineState, entryId: string, type: BodyPerceptionType, mode: BodyPerceptionMode, description: string, resonance: number, chapter: number): NarrativeBodyPerceptionEngineState {
  const entry: BodyPerceptionEntry = { entryId, type, mode, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodyPerceptionLayer(state: NarrativeBodyPerceptionEngineState, layerId: string, entryIds: string[]): NarrativeBodyPerceptionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodyPerceptionEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: BodyPerceptionLayer = { layerId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getBodyPerceptionEntriesByType(state: NarrativeBodyPerceptionEngineState, type: BodyPerceptionType): BodyPerceptionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodyPerceptionReport(state: NarrativeBodyPerceptionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body perception entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.perceptionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageResonance: Math.round(state.averageResonance * 100) / 100, perceptionComplexity: Math.round(state.perceptionComplexity * 100) / 100, perceptionMastery: Math.round(state.perceptionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodyPerceptionEngineState): NarrativeBodyPerceptionEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const perceptionComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageResonance, perceptionComplexity, perceptionMastery: averageResonance * 0.5 + perceptionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodyPerceptionEngineState(): NarrativeBodyPerceptionEngineState { return createNarrativeBodyPerceptionEngineState(); }