/**
 * V1674 NarrativeReaderCuriosityEngine — Direction P Iter 5/30 (Round 5)
 */
export type ReaderCuriosityType = 'mystery' | 'gap' | 'question' | 'promise' | 'secret' | 'transcendent' | 'infinite';
export type ReaderCuriosityDepth = 'surface' | 'moderate' | 'deep' | 'compelling' | 'transcendent' | 'infinite';
export interface ReaderCuriosityEntry { entryId: string; type: ReaderCuriosityType; depth: ReaderCuriosityDepth; description: string; inquisitiveness: number; chapter: number; }
export interface ReaderCuriosityLoop { loopId: string; entryIds: string[]; cumulativeInquisitiveness: number; breadth: number; }
export interface NarrativeReaderCuriosityEngineState { entries: Map<string, ReaderCuriosityEntry>; loops: Map<string, ReaderCuriosityLoop>; totalEntries: number; totalLoops: number; averageInquisitiveness: number; curiosityComplexity: number; curiosityMastery: number; }
export function createNarrativeReaderCuriosityEngineState(): NarrativeReaderCuriosityEngineState { return { entries: new Map(), loops: new Map(), totalEntries: 0, totalLoops: 0, averageInquisitiveness: 0.5, curiosityComplexity: 0.5, curiosityMastery: 0.5 }; }
export function addReaderCuriosityEntry(state: NarrativeReaderCuriosityEngineState, entryId: string, type: ReaderCuriosityType, depth: ReaderCuriosityDepth, description: string, inquisitiveness: number, chapter: number): NarrativeReaderCuriosityEngineState {
  const entry: ReaderCuriosityEntry = { entryId, type, depth, description, inquisitiveness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderCuriosityLoop(state: NarrativeReaderCuriosityEngineState, loopId: string, entryIds: string[]): NarrativeReaderCuriosityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderCuriosityEntry => e !== undefined);
  const cumulativeInquisitiveness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.inquisitiveness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const loop: ReaderCuriosityLoop = { loopId, entryIds, cumulativeInquisitiveness, breadth };
  return recompute({ ...state, loops: new Map(state.loops).set(loopId, loop), totalLoops: state.loops.size + 1 });
}
export function getReaderCuriosityEntriesByType(state: NarrativeReaderCuriosityEngineState, type: ReaderCuriosityType): ReaderCuriosityEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderCuriosityReport(state: NarrativeReaderCuriosityEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader curiosity entries');
  if (state.averageInquisitiveness < 0.5) recommendations.push('Low inquisitiveness — strengthen');
  if (state.curiosityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLoops: state.totalLoops, averageInquisitiveness: Math.round(state.averageInquisitiveness * 100) / 100, curiosityComplexity: Math.round(state.curiosityComplexity * 100) / 100, curiosityMastery: Math.round(state.curiosityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderCuriosityEngineState): NarrativeReaderCuriosityEngineState {
  const entries = Array.from(state.entries.values());
  const averageInquisitiveness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.inquisitiveness, 0) / entries.length;
  const loops = Array.from(state.loops.values());
  const curiosityComplexity = loops.length === 0 ? 0.5 : loops.reduce((s, l) => s + l.breadth, 0) / loops.length;
  return { ...state, averageInquisitiveness, curiosityComplexity, curiosityMastery: averageInquisitiveness * 0.5 + curiosityComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderCuriosityEngineState(): NarrativeReaderCuriosityEngineState { return createNarrativeReaderCuriosityEngineState(); }