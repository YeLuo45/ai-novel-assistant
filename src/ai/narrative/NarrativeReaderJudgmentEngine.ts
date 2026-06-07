/**
 * V1688 NarrativeReaderJudgmentEngine — Direction P Iter 12/30 (Round 5)
 */
export type ReaderJudgmentType = 'moral' | 'aesthetic' | 'intellectual' | 'emotional' | 'cultural' | 'transcendent' | 'infinite';
export type ReaderJudgmentConfidence = 'tentative' | 'moderate' | 'firm' | 'absolute' | 'transcendent' | 'infinite';
export interface ReaderJudgmentEntry { entryId: string; type: ReaderJudgmentType; confidence: ReaderJudgmentConfidence; description: string; certainty: number; chapter: number; }
export interface ReaderJudgmentLayer { layerId: string; entryIds: string[]; cumulativeCertainty: number; breadth: number; }
export interface NarrativeReaderJudgmentEngineState { entries: Map<string, ReaderJudgmentEntry>; layers: Map<string, ReaderJudgmentLayer>; totalEntries: number; totalLayers: number; averageCertainty: number; judgmentComplexity: number; judgmentMastery: number; }
export function createNarrativeReaderJudgmentEngineState(): NarrativeReaderJudgmentEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageCertainty: 0.5, judgmentComplexity: 0.5, judgmentMastery: 0.5 }; }
export function addReaderJudgmentEntry(state: NarrativeReaderJudgmentEngineState, entryId: string, type: ReaderJudgmentType, confidence: ReaderJudgmentConfidence, description: string, certainty: number, chapter: number): NarrativeReaderJudgmentEngineState {
  const entry: ReaderJudgmentEntry = { entryId, type, confidence, description, certainty, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderJudgmentLayer(state: NarrativeReaderJudgmentEngineState, layerId: string, entryIds: string[]): NarrativeReaderJudgmentEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderJudgmentEntry => e !== undefined);
  const cumulativeCertainty = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.certainty, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: ReaderJudgmentLayer = { layerId, entryIds, cumulativeCertainty, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderJudgmentEntriesByType(state: NarrativeReaderJudgmentEngineState, type: ReaderJudgmentType): ReaderJudgmentEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderJudgmentReport(state: NarrativeReaderJudgmentEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader judgment entries');
  if (state.averageCertainty < 0.5) recommendations.push('Low certainty — strengthen');
  if (state.judgmentMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageCertainty: Math.round(state.averageCertainty * 100) / 100, judgmentComplexity: Math.round(state.judgmentComplexity * 100) / 100, judgmentMastery: Math.round(state.judgmentMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderJudgmentEngineState): NarrativeReaderJudgmentEngineState {
  const entries = Array.from(state.entries.values());
  const averageCertainty = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.certainty, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const judgmentComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageCertainty, judgmentComplexity, judgmentMastery: averageCertainty * 0.5 + judgmentComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderJudgmentEngineState(): NarrativeReaderJudgmentEngineState { return createNarrativeReaderJudgmentEngineState(); }