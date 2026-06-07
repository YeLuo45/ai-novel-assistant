/**
 * V1676 NarrativeReaderSurpriseEngine — Direction P Iter 6/30 (Round 5)
 */
export type ReaderSurpriseType = 'twist' | 'revelation' | 'inversion' | 'subversion' | 'recontextualization' | 'transcendent' | 'infinite';
export type ReaderSurpriseImpact = 'subtle' | 'moderate' | 'significant' | 'mind_blowing' | 'transcendent' | 'infinite';
export interface ReaderSurpriseEntry { entryId: string; type: ReaderSurpriseType; impact: ReaderSurpriseImpact; description: string; shock: number; chapter: number; }
export interface ReaderSurpriseSet { setId: string; entryIds: string[]; cumulativeShock: number; breadth: number; }
export interface NarrativeReaderSurpriseEngineState { entries: Map<string, ReaderSurpriseEntry>; sets: Map<string, ReaderSurpriseSet>; totalEntries: number; totalSets: number; averageShock: number; surpriseComplexity: number; surpriseMastery: number; }
export function createNarrativeReaderSurpriseEngineState(): NarrativeReaderSurpriseEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageShock: 0.5, surpriseComplexity: 0.5, surpriseMastery: 0.5 }; }
export function addReaderSurpriseEntry(state: NarrativeReaderSurpriseEngineState, entryId: string, type: ReaderSurpriseType, impact: ReaderSurpriseImpact, description: string, shock: number, chapter: number): NarrativeReaderSurpriseEngineState {
  const entry: ReaderSurpriseEntry = { entryId, type, impact, description, shock, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderSurpriseSet(state: NarrativeReaderSurpriseEngineState, setId: string, entryIds: string[]): NarrativeReaderSurpriseEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderSurpriseEntry => e !== undefined);
  const cumulativeShock = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.shock, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const set: ReaderSurpriseSet = { setId, entryIds, cumulativeShock, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getReaderSurpriseEntriesByType(state: NarrativeReaderSurpriseEngineState, type: ReaderSurpriseType): ReaderSurpriseEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderSurpriseReport(state: NarrativeReaderSurpriseEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader surprise entries');
  if (state.averageShock < 0.5) recommendations.push('Low shock — strengthen');
  if (state.surpriseMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageShock: Math.round(state.averageShock * 100) / 100, surpriseComplexity: Math.round(state.surpriseComplexity * 100) / 100, surpriseMastery: Math.round(state.surpriseMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderSurpriseEngineState): NarrativeReaderSurpriseEngineState {
  const entries = Array.from(state.entries.values());
  const averageShock = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.shock, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const surpriseComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageShock, surpriseComplexity, surpriseMastery: averageShock * 0.5 + surpriseComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderSurpriseEngineState(): NarrativeReaderSurpriseEngineState { return createNarrativeReaderSurpriseEngineState(); }