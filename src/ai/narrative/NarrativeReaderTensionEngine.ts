/**
 * V1700 NarrativeReaderTensionEngine — Direction P Iter 18/30 (Round 5)
 */
export type ReaderTensionType = 'anticipatory' | 'present' | 'remembered' | 'social' | 'existential' | 'transcendent' | 'infinite';
export type ReaderTensionIntensity = 'subtle' | 'moderate' | 'high' | 'extreme' | 'transcendent' | 'infinite';
export interface ReaderTensionEntry { entryId: string; type: ReaderTensionType; intensity: ReaderTensionIntensity; description: string; stress: number; chapter: number; }
export interface ReaderTensionLayer { layerId: string; entryIds: string[]; cumulativeStress: number; breadth: number; }
export interface NarrativeReaderTensionEngineState { entries: Map<string, ReaderTensionEntry>; layers: Map<string, ReaderTensionLayer>; totalEntries: number; totalLayers: number; averageStress: number; tensionComplexity: number; tensionMastery: number; }
export function createNarrativeReaderTensionEngineState(): NarrativeReaderTensionEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageStress: 0.5, tensionComplexity: 0.5, tensionMastery: 0.5 }; }
export function addReaderTensionEntry(state: NarrativeReaderTensionEngineState, entryId: string, type: ReaderTensionType, intensity: ReaderTensionIntensity, description: string, stress: number, chapter: number): NarrativeReaderTensionEngineState {
  const entry: ReaderTensionEntry = { entryId, type, intensity, description, stress, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderTensionLayer(state: NarrativeReaderTensionEngineState, layerId: string, entryIds: string[]): NarrativeReaderTensionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderTensionEntry => e !== undefined);
  const cumulativeStress = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.stress, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: ReaderTensionLayer = { layerId, entryIds, cumulativeStress, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderTensionEntriesByType(state: NarrativeReaderTensionEngineState, type: ReaderTensionType): ReaderTensionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderTensionReport(state: NarrativeReaderTensionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader tension entries');
  if (state.averageStress < 0.5) recommendations.push('Low stress — strengthen');
  if (state.tensionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageStress: Math.round(state.averageStress * 100) / 100, tensionComplexity: Math.round(state.tensionComplexity * 100) / 100, tensionMastery: Math.round(state.tensionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderTensionEngineState): NarrativeReaderTensionEngineState {
  const entries = Array.from(state.entries.values());
  const averageStress = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.stress, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const tensionComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageStress, tensionComplexity, tensionMastery: averageStress * 0.5 + tensionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderTensionEngineState(): NarrativeReaderTensionEngineState { return createNarrativeReaderTensionEngineState(); }