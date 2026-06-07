/**
 * V1684 NarrativeReaderComprehensionEngine — Direction P Iter 10/30 (Round 5)
 */
export type ReaderComprehensionType = 'literal' | 'inferential' | 'evaluative' | 'integrative' | 'transcendent' | 'infinite';
export type ReaderComprehensionEase = 'difficult' | 'moderate' | 'easy' | 'effortless' | 'transcendent' | 'infinite';
export interface ReaderComprehensionEntry { entryId: string; type: ReaderComprehensionType; ease: ReaderComprehensionEase; description: string; clarity: number; chapter: number; }
export interface ReaderComprehensionLayer { layerId: string; entryIds: string[]; cumulativeClarity: number; breadth: number; }
export interface NarrativeReaderComprehensionEngineState { entries: Map<string, ReaderComprehensionEntry>; layers: Map<string, ReaderComprehensionLayer>; totalEntries: number; totalLayers: number; averageClarity: number; comprehensionComplexity: number; comprehensionMastery: number; }
export function createNarrativeReaderComprehensionEngineState(): NarrativeReaderComprehensionEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageClarity: 0.5, comprehensionComplexity: 0.5, comprehensionMastery: 0.5 }; }
export function addReaderComprehensionEntry(state: NarrativeReaderComprehensionEngineState, entryId: string, type: ReaderComprehensionType, ease: ReaderComprehensionEase, description: string, clarity: number, chapter: number): NarrativeReaderComprehensionEngineState {
  const entry: ReaderComprehensionEntry = { entryId, type, ease, description, clarity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderComprehensionLayer(state: NarrativeReaderComprehensionEngineState, layerId: string, entryIds: string[]): NarrativeReaderComprehensionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderComprehensionEntry => e !== undefined);
  const cumulativeClarity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const layer: ReaderComprehensionLayer = { layerId, entryIds, cumulativeClarity, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderComprehensionEntriesByType(state: NarrativeReaderComprehensionEngineState, type: ReaderComprehensionType): ReaderComprehensionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderComprehensionReport(state: NarrativeReaderComprehensionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader comprehension entries');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.comprehensionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageClarity: Math.round(state.averageClarity * 100) / 100, comprehensionComplexity: Math.round(state.comprehensionComplexity * 100) / 100, comprehensionMastery: Math.round(state.comprehensionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderComprehensionEngineState): NarrativeReaderComprehensionEngineState {
  const entries = Array.from(state.entries.values());
  const averageClarity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const comprehensionComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageClarity, comprehensionComplexity, comprehensionMastery: averageClarity * 0.5 + comprehensionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderComprehensionEngineState(): NarrativeReaderComprehensionEngineState { return createNarrativeReaderComprehensionEngineState(); }