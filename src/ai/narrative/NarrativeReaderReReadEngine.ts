/**
 * V1710 NarrativeReaderReReadEngine — Direction P Iter 23/30 (Round 5)
 */
export type ReaderReReadType = 'pleasure' | 'discovery' | 'analysis' | 'nostalgia' | 'study' | 'transcendent' | 'infinite';
export type ReaderReReadStage = 'first' | 'second' | 'multiple' | 'innumerable' | 'transcendent' | 'infinite';
export interface ReaderReReadEntry { entryId: string; type: ReaderReReadType; stage: ReaderReReadStage; description: string; reward: number; chapter: number; }
export interface ReaderReReadCycle { cycleId: string; entryIds: string[]; cumulativeReward: number; breadth: number; }
export interface NarrativeReaderReReadEngineState { entries: Map<string, ReaderReReadEntry>; cycles: Map<string, ReaderReReadCycle>; totalEntries: number; totalCycles: number; averageReward: number; reReadComplexity: number; reReadMastery: number; }
export function createNarrativeReaderReReadEngineState(): NarrativeReaderReReadEngineState { return { entries: new Map(), cycles: new Map(), totalEntries: 0, totalCycles: 0, averageReward: 0.5, reReadComplexity: 0.5, reReadMastery: 0.5 }; }
export function addReaderReReadEntry(state: NarrativeReaderReReadEngineState, entryId: string, type: ReaderReReadType, stage: ReaderReReadStage, description: string, reward: number, chapter: number): NarrativeReaderReReadEngineState {
  const entry: ReaderReReadEntry = { entryId, type, stage, description, reward, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderReReadCycle(state: NarrativeReaderReReadEngineState, cycleId: string, entryIds: string[]): NarrativeReaderReReadEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderReReadEntry => e !== undefined);
  const cumulativeReward = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.reward, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const cycle: ReaderReReadCycle = { cycleId, entryIds, cumulativeReward, breadth };
  return recompute({ ...state, cycles: new Map(state.cycles).set(cycleId, cycle), totalCycles: state.cycles.size + 1 });
}
export function getReaderReReadEntriesByType(state: NarrativeReaderReReadEngineState, type: ReaderReReadType): ReaderReReadEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderReReadReport(state: NarrativeReaderReReadEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader re-read entries');
  if (state.averageReward < 0.5) recommendations.push('Low reward — strengthen');
  if (state.reReadMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCycles: state.totalCycles, averageReward: Math.round(state.averageReward * 100) / 100, reReadComplexity: Math.round(state.reReadComplexity * 100) / 100, reReadMastery: Math.round(state.reReadMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderReReadEngineState): NarrativeReaderReReadEngineState {
  const entries = Array.from(state.entries.values());
  const averageReward = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.reward, 0) / entries.length;
  const cycles = Array.from(state.cycles.values());
  const reReadComplexity = cycles.length === 0 ? 0.5 : cycles.reduce((s, c) => s + c.breadth, 0) / cycles.length;
  return { ...state, averageReward, reReadComplexity, reReadMastery: averageReward * 0.5 + reReadComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderReReadEngineState(): NarrativeReaderReReadEngineState { return createNarrativeReaderReReadEngineState(); }