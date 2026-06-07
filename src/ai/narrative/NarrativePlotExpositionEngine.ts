/**
 * V1502 NarrativePlotExpositionEngine — Direction M Iter 9/30 (Round 5)
 */
export type PlotExpositionType = 'backstory' | 'worldbuilding' | 'character_intro' | 'setting' | 'premise' | 'context' | 'transcendent' | 'infinite';
export type PlotExpositionMethod = 'narrative' | 'dialogue' | 'flashback' | 'aside' | 'inferred' | 'transcendent' | 'infinite';
export interface PlotExpositionEntry { entryId: string; type: PlotExpositionType; method: PlotExpositionMethod; description: string; clarity: number; chapter: number; }
export interface PlotExpositionChunk { chunkId: string; entryIds: string[]; cumulativeClarity: number; breadth: number; }
export interface NarrativePlotExpositionEngineState { entries: Map<string, PlotExpositionEntry>; chunks: Map<string, PlotExpositionChunk>; totalEntries: number; totalChunks: number; averageClarity: number; expositionComplexity: number; expositionMastery: number; }
export function createNarrativePlotExpositionEngineState(): NarrativePlotExpositionEngineState { return { entries: new Map(), chunks: new Map(), totalEntries: 0, totalChunks: 0, averageClarity: 0.5, expositionComplexity: 0.5, expositionMastery: 0.5 }; }
export function addPlotExpositionEntry(state: NarrativePlotExpositionEngineState, entryId: string, type: PlotExpositionType, method: PlotExpositionMethod, description: string, clarity: number, chapter: number): NarrativePlotExpositionEngineState {
  const entry: PlotExpositionEntry = { entryId, type, method, description, clarity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotExpositionChunk(state: NarrativePlotExpositionEngineState, chunkId: string, entryIds: string[]): NarrativePlotExpositionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotExpositionEntry => e !== undefined);
  const cumulativeClarity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const chunk: PlotExpositionChunk = { chunkId, entryIds, cumulativeClarity, breadth };
  return recompute({ ...state, chunks: new Map(state.chunks).set(chunkId, chunk), totalChunks: state.chunks.size + 1 });
}
export function getPlotExpositionEntriesByType(state: NarrativePlotExpositionEngineState, type: PlotExpositionType): PlotExpositionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotExpositionReport(state: NarrativePlotExpositionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot exposition entries');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.expositionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalChunks: state.totalChunks, averageClarity: Math.round(state.averageClarity * 100) / 100, expositionComplexity: Math.round(state.expositionComplexity * 100) / 100, expositionMastery: Math.round(state.expositionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotExpositionEngineState): NarrativePlotExpositionEngineState {
  const entries = Array.from(state.entries.values());
  const averageClarity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const chunks = Array.from(state.chunks.values());
  const expositionComplexity = chunks.length === 0 ? 0.5 : chunks.reduce((s, c) => s + c.breadth, 0) / chunks.length;
  return { ...state, averageClarity, expositionComplexity, expositionMastery: averageClarity * 0.5 + expositionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotExpositionEngineState(): NarrativePlotExpositionEngineState { return createNarrativePlotExpositionEngineState(); }