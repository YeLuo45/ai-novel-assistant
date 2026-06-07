/**
 * V1682 NarrativeReaderMemoryEngine2 — Direction P Iter 9/30 (Round 5)
 */
export type ReaderMemoryType = 'short_term' | 'working' | 'long_term' | 'emotional' | 'transcendent' | 'infinite';
export type ReaderMemoryStrength = 'faint' | 'moderate' | 'strong' | 'permanent' | 'transcendent' | 'infinite';
export interface ReaderMemory2Entry { entryId: string; type: ReaderMemoryType; strength: ReaderMemoryStrength; description: string; retention: number; chapter: number; }
export interface ReaderMemory2Trace { traceId: string; entryIds: string[]; cumulativeRetention: number; breadth: number; }
export interface NarrativeReaderMemory2EngineState { entries: Map<string, ReaderMemory2Entry>; traces: Map<string, ReaderMemory2Trace>; totalEntries: number; totalTraces: number; averageRetention: number; memoryComplexity: number; memoryMastery: number; }
export function createNarrativeReaderMemory2EngineState(): NarrativeReaderMemory2EngineState { return { entries: new Map(), traces: new Map(), totalEntries: 0, totalTraces: 0, averageRetention: 0.5, memoryComplexity: 0.5, memoryMastery: 0.5 }; }
export function addReaderMemoryEntry(state: NarrativeReaderMemory2EngineState, entryId: string, type: ReaderMemoryType, strength: ReaderMemoryStrength, description: string, retention: number, chapter: number): NarrativeReaderMemory2EngineState {
  const entry: ReaderMemory2Entry = { entryId, type, strength, description, retention, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderMemoryTrace(state: NarrativeReaderMemory2EngineState, traceId: string, entryIds: string[]): NarrativeReaderMemory2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderMemory2Entry => e !== undefined);
  const cumulativeRetention = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.retention, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const trace: ReaderMemory2Trace = { traceId, entryIds, cumulativeRetention, breadth };
  return recompute({ ...state, traces: new Map(state.traces).set(traceId, trace), totalTraces: state.traces.size + 1 });
}
export function getReaderMemoryEntriesByType(state: NarrativeReaderMemory2EngineState, type: ReaderMemoryType): ReaderMemory2Entry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderMemoryReport(state: NarrativeReaderMemory2EngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader memory entries');
  if (state.averageRetention < 0.5) recommendations.push('Low retention — strengthen');
  if (state.memoryMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTraces: state.totalTraces, averageRetention: Math.round(state.averageRetention * 100) / 100, memoryComplexity: Math.round(state.memoryComplexity * 100) / 100, memoryMastery: Math.round(state.memoryMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderMemory2EngineState): NarrativeReaderMemory2EngineState {
  const entries = Array.from(state.entries.values());
  const averageRetention = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.retention, 0) / entries.length;
  const traces = Array.from(state.traces.values());
  const memoryComplexity = traces.length === 0 ? 0.5 : traces.reduce((s, t) => s + t.breadth, 0) / traces.length;
  return { ...state, averageRetention, memoryComplexity, memoryMastery: averageRetention * 0.5 + memoryComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderMemory2EngineState(): NarrativeReaderMemory2EngineState { return createNarrativeReaderMemory2EngineState(); }