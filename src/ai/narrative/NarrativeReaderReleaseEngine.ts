/**
 * V1702 NarrativeReaderReleaseEngine — Direction P Iter 19/30 (Round 5)
 */
export type ReaderReleaseType = 'catharsis' | 'relief' | 'resolution' | 'joy' | 'peace' | 'transcendent' | 'infinite';
export type ReaderReleaseDepth = 'shallow' | 'moderate' | 'deep' | 'profound' | 'transcendent' | 'infinite';
export interface ReaderReleaseEntry { entryId: string; type: ReaderReleaseType; depth: ReaderReleaseDepth; description: string; release: number; chapter: number; }
export interface ReaderReleaseWave { waveId: string; entryIds: string[]; cumulativeRelease: number; breadth: number; }
export interface NarrativeReaderReleaseEngineState { entries: Map<string, ReaderReleaseEntry>; waves: Map<string, ReaderReleaseWave>; totalEntries: number; totalWaves: number; averageRelease: number; releaseComplexity: number; releaseMastery: number; }
export function createNarrativeReaderReleaseEngineState(): NarrativeReaderReleaseEngineState { return { entries: new Map(), waves: new Map(), totalEntries: 0, totalWaves: 0, averageRelease: 0.5, releaseComplexity: 0.5, releaseMastery: 0.5 }; }
export function addReaderReleaseEntry(state: NarrativeReaderReleaseEngineState, entryId: string, type: ReaderReleaseType, depth: ReaderReleaseDepth, description: string, release: number, chapter: number): NarrativeReaderReleaseEngineState {
  const entry: ReaderReleaseEntry = { entryId, type, depth, description, release, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderReleaseWave(state: NarrativeReaderReleaseEngineState, waveId: string, entryIds: string[]): NarrativeReaderReleaseEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderReleaseEntry => e !== undefined);
  const cumulativeRelease = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.release, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const wave: ReaderReleaseWave = { waveId, entryIds, cumulativeRelease, breadth };
  return recompute({ ...state, waves: new Map(state.waves).set(waveId, wave), totalWaves: state.waves.size + 1 });
}
export function getReaderReleaseEntriesByType(state: NarrativeReaderReleaseEngineState, type: ReaderReleaseType): ReaderReleaseEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderReleaseReport(state: NarrativeReaderReleaseEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader release entries');
  if (state.averageRelease < 0.5) recommendations.push('Low release — strengthen');
  if (state.releaseMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWaves: state.totalWaves, averageRelease: Math.round(state.averageRelease * 100) / 100, releaseComplexity: Math.round(state.releaseComplexity * 100) / 100, releaseMastery: Math.round(state.releaseMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderReleaseEngineState): NarrativeReaderReleaseEngineState {
  const entries = Array.from(state.entries.values());
  const averageRelease = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.release, 0) / entries.length;
  const waves = Array.from(state.waves.values());
  const releaseComplexity = waves.length === 0 ? 0.5 : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;
  return { ...state, averageRelease, releaseComplexity, releaseMastery: averageRelease * 0.5 + releaseComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderReleaseEngineState(): NarrativeReaderReleaseEngineState { return createNarrativeReaderReleaseEngineState(); }