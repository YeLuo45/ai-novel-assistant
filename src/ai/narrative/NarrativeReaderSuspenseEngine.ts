/**
 * V1672 NarrativeReaderSuspenseEngine — Direction P Iter 4/30 (Round 5)
 */
export type ReaderSuspenseType = 'curiosity' | 'tension' | 'dramatic_irony' | 'cliffhanger' | 'anticipation' | 'transcendent' | 'infinite';
export type ReaderSuspenseIntensity = 'mild' | 'moderate' | 'high' | 'overwhelming' | 'transcendent' | 'infinite';
export interface ReaderSuspenseEntry { entryId: string; type: ReaderSuspenseType; intensity: ReaderSuspenseIntensity; description: string; anxiety: number; chapter: number; }
export interface ReaderSuspenseSet { setId: string; entryIds: string[]; cumulativeAnxiety: number; breadth: number; }
export interface NarrativeReaderSuspenseEngineState { entries: Map<string, ReaderSuspenseEntry>; sets: Map<string, ReaderSuspenseSet>; totalEntries: number; totalSets: number; averageAnxiety: number; suspenseComplexity: number; suspenseMastery: number; }
export function createNarrativeReaderSuspenseEngineState(): NarrativeReaderSuspenseEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageAnxiety: 0.5, suspenseComplexity: 0.5, suspenseMastery: 0.5 }; }
export function addReaderSuspenseEntry(state: NarrativeReaderSuspenseEngineState, entryId: string, type: ReaderSuspenseType, intensity: ReaderSuspenseIntensity, description: string, anxiety: number, chapter: number): NarrativeReaderSuspenseEngineState {
  const entry: ReaderSuspenseEntry = { entryId, type, intensity, description, anxiety, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderSuspenseSet(state: NarrativeReaderSuspenseEngineState, setId: string, entryIds: string[]): NarrativeReaderSuspenseEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderSuspenseEntry => e !== undefined);
  const cumulativeAnxiety = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.anxiety, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const set: ReaderSuspenseSet = { setId, entryIds, cumulativeAnxiety, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getReaderSuspenseEntriesByType(state: NarrativeReaderSuspenseEngineState, type: ReaderSuspenseType): ReaderSuspenseEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderSuspenseReport(state: NarrativeReaderSuspenseEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader suspense entries');
  if (state.averageAnxiety < 0.5) recommendations.push('Low anxiety — strengthen');
  if (state.suspenseMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageAnxiety: Math.round(state.averageAnxiety * 100) / 100, suspenseComplexity: Math.round(state.suspenseComplexity * 100) / 100, suspenseMastery: Math.round(state.suspenseMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderSuspenseEngineState): NarrativeReaderSuspenseEngineState {
  const entries = Array.from(state.entries.values());
  const averageAnxiety = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.anxiety, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const suspenseComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageAnxiety, suspenseComplexity, suspenseMastery: averageAnxiety * 0.5 + suspenseComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderSuspenseEngineState(): NarrativeReaderSuspenseEngineState { return createNarrativeReaderSuspenseEngineState(); }