/**
 * V1690 NarrativeReaderEmotionEngine — Direction P Iter 13/30 (Round 5)
 */
export type ReaderEmotionType = 'joy' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'disgust' | 'transcendent' | 'infinite';
export type ReaderEmotionIntensity = 'mild' | 'moderate' | 'strong' | 'overwhelming' | 'transcendent' | 'infinite';
export interface ReaderEmotionEntry { entryId: string; type: ReaderEmotionType; intensity: ReaderEmotionIntensity; description: string; resonance: number; chapter: number; }
export interface ReaderEmotionArc { arcId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeReaderEmotionEngineState { entries: Map<string, ReaderEmotionEntry>; arcs: Map<string, ReaderEmotionArc>; totalEntries: number; totalArcs: number; averageResonance: number; emotionComplexity: number; emotionMastery: number; }
export function createNarrativeReaderEmotionEngineState(): NarrativeReaderEmotionEngineState { return { entries: new Map(), arcs: new Map(), totalEntries: 0, totalArcs: 0, averageResonance: 0.5, emotionComplexity: 0.5, emotionMastery: 0.5 }; }
export function addReaderEmotionEntry(state: NarrativeReaderEmotionEngineState, entryId: string, type: ReaderEmotionType, intensity: ReaderEmotionIntensity, description: string, resonance: number, chapter: number): NarrativeReaderEmotionEngineState {
  const entry: ReaderEmotionEntry = { entryId, type, intensity, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderEmotionArc(state: NarrativeReaderEmotionEngineState, arcId: string, entryIds: string[]): NarrativeReaderEmotionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderEmotionEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const arc: ReaderEmotionArc = { arcId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, arcs: new Map(state.arcs).set(arcId, arc), totalArcs: state.arcs.size + 1 });
}
export function getReaderEmotionEntriesByType(state: NarrativeReaderEmotionEngineState, type: ReaderEmotionType): ReaderEmotionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderEmotionReport(state: NarrativeReaderEmotionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader emotion entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.emotionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalArcs: state.totalArcs, averageResonance: Math.round(state.averageResonance * 100) / 100, emotionComplexity: Math.round(state.emotionComplexity * 100) / 100, emotionMastery: Math.round(state.emotionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderEmotionEngineState): NarrativeReaderEmotionEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const arcs = Array.from(state.arcs.values());
  const emotionComplexity = arcs.length === 0 ? 0.5 : arcs.reduce((s, a) => s + a.breadth, 0) / arcs.length;
  return { ...state, averageResonance, emotionComplexity, emotionMastery: averageResonance * 0.5 + emotionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderEmotionEngineState(): NarrativeReaderEmotionEngineState { return createNarrativeReaderEmotionEngineState(); }