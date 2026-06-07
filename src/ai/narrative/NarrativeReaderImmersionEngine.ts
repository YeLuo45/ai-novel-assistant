/**
 * V1692 NarrativeReaderImmersionEngine — Direction P Iter 14/30 (Round 5)
 */
export type ReaderImmersionType = 'sensory' | 'emotional' | 'cognitive' | 'spatial' | 'temporal' | 'transcendent' | 'infinite';
export type ReaderImmersionDepth = 'shallow' | 'moderate' | 'deep' | 'total' | 'transcendent' | 'infinite';
export interface ReaderImmersionEntry { entryId: string; type: ReaderImmersionType; depth: ReaderImmersionDepth; description: string; absorbtion: number; chapter: number; }
export interface ReaderImmersionLayer { layerId: string; entryIds: string[]; cumulativeAbsorbtion: number; breadth: number; }
export interface NarrativeReaderImmersionEngineState { entries: Map<string, ReaderImmersionEntry>; layers: Map<string, ReaderImmersionLayer>; totalEntries: number; totalLayers: number; averageAbsorbtion: number; immersionComplexity: number; immersionMastery: number; }
export function createNarrativeReaderImmersionEngineState(): NarrativeReaderImmersionEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageAbsorbtion: 0.5, immersionComplexity: 0.5, immersionMastery: 0.5 }; }
export function addReaderImmersionEntry(state: NarrativeReaderImmersionEngineState, entryId: string, type: ReaderImmersionType, depth: ReaderImmersionDepth, description: string, absorbtion: number, chapter: number): NarrativeReaderImmersionEngineState {
  const entry: ReaderImmersionEntry = { entryId, type, depth, description, absorbtion, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderImmersionLayer(state: NarrativeReaderImmersionEngineState, layerId: string, entryIds: string[]): NarrativeReaderImmersionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderImmersionEntry => e !== undefined);
  const cumulativeAbsorbtion = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.absorbtion, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: ReaderImmersionLayer = { layerId, entryIds, cumulativeAbsorbtion, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderImmersionEntriesByType(state: NarrativeReaderImmersionEngineState, type: ReaderImmersionType): ReaderImmersionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderImmersionReport(state: NarrativeReaderImmersionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader immersion entries');
  if (state.averageAbsorbtion < 0.5) recommendations.push('Low absorbtion — strengthen');
  if (state.immersionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageAbsorbtion: Math.round(state.averageAbsorbtion * 100) / 100, immersionComplexity: Math.round(state.immersionComplexity * 100) / 100, immersionMastery: Math.round(state.immersionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderImmersionEngineState): NarrativeReaderImmersionEngineState {
  const entries = Array.from(state.entries.values());
  const averageAbsorbtion = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.absorbtion, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const immersionComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageAbsorbtion, immersionComplexity, immersionMastery: averageAbsorbtion * 0.5 + immersionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderImmersionEngineState(): NarrativeReaderImmersionEngineState { return createNarrativeReaderImmersionEngineState(); }