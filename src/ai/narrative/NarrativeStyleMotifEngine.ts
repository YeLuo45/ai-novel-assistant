/**
 * V1566 NarrativeStyleMotifEngine — Direction N Iter 11/30 (Round 5)
 */
export type StyleMotifType = 'visual' | 'verbal' | 'situational' | 'character' | 'thematic' | 'transcendent' | 'infinite';
export type StyleMotifFrequency = 'rare' | 'occasional' | 'recurring' | 'constant' | 'transcendent' | 'infinite';
export interface StyleMotifEntry { entryId: string; type: StyleMotifType; frequency: StyleMotifFrequency; description: string; reinforcement: number; chapter: number; }
export interface StyleMotifSet { setId: string; entryIds: string[]; cumulativeReinforcement: number; breadth: number; }
export interface NarrativeStyleMotifEngineState { entries: Map<string, StyleMotifEntry>; sets: Map<string, StyleMotifSet>; totalEntries: number; totalSets: number; averageReinforcement: number; motifComplexity: number; motifMastery: number; }
export function createNarrativeStyleMotifEngineState(): NarrativeStyleMotifEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageReinforcement: 0.5, motifComplexity: 0.5, motifMastery: 0.5 }; }
export function addStyleMotifEntry(state: NarrativeStyleMotifEngineState, entryId: string, type: StyleMotifType, frequency: StyleMotifFrequency, description: string, reinforcement: number, chapter: number): NarrativeStyleMotifEngineState {
  const entry: StyleMotifEntry = { entryId, type, frequency, description, reinforcement, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleMotifSet(state: NarrativeStyleMotifEngineState, setId: string, entryIds: string[]): NarrativeStyleMotifEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleMotifEntry => e !== undefined);
  const cumulativeReinforcement = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.reinforcement, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const set: StyleMotifSet = { setId, entryIds, cumulativeReinforcement, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getStyleMotifEntriesByType(state: NarrativeStyleMotifEngineState, type: StyleMotifType): StyleMotifEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleMotifReport(state: NarrativeStyleMotifEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style motif entries');
  if (state.averageReinforcement < 0.5) recommendations.push('Low reinforcement — strengthen');
  if (state.motifMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageReinforcement: Math.round(state.averageReinforcement * 100) / 100, motifComplexity: Math.round(state.motifComplexity * 100) / 100, motifMastery: Math.round(state.motifMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleMotifEngineState): NarrativeStyleMotifEngineState {
  const entries = Array.from(state.entries.values());
  const averageReinforcement = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.reinforcement, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const motifComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageReinforcement, motifComplexity, motifMastery: averageReinforcement * 0.5 + motifComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleMotifEngineState(): NarrativeStyleMotifEngineState { return createNarrativeStyleMotifEngineState(); }