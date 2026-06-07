/**
 * V1890 NarrativeGenreFableEngine — Direction S Iter 23/30 (Round 5)
 */
export type GenreFableType = 'animal' | 'plant' | 'object' | 'allegorical' | 'transcendent' | 'infinite';
export type GenreFableMoral = 'explicit' | 'implicit' | 'ambiguous' | 'ironic' | 'transcendent' | 'infinite';
export interface GenreFableEntry { entryId: string; type: GenreFableType; moral: GenreFableMoral; description: string; resonance: number; chapter: number; }
export interface GenreFableMenagerie { menagerieId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeGenreFableEngineState { entries: Map<string, GenreFableEntry>; menageries: Map<string, GenreFableMenagerie>; totalEntries: number; totalMenageries: number; averageResonance: number; fableComplexity: number; fableMastery: number; }
export function createNarrativeGenreFableEngineState(): NarrativeGenreFableEngineState { return { entries: new Map(), menageries: new Map(), totalEntries: 0, totalMenageries: 0, averageResonance: 0.5, fableComplexity: 0.5, fableMastery: 0.5 }; }
export function addGenreFableEntry(state: NarrativeGenreFableEngineState, entryId: string, type: GenreFableType, moral: GenreFableMoral, description: string, resonance: number, chapter: number): NarrativeGenreFableEngineState {
  const entry: GenreFableEntry = { entryId, type, moral, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addGenreFableMenagerie(state: NarrativeGenreFableEngineState, menagerieId: string, entryIds: string[]): NarrativeGenreFableEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is GenreFableEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 5);
  const menagerie: GenreFableMenagerie = { menagerieId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, menageries: new Map(state.menageries).set(menagerieId, menagerie), totalMenageries: state.menageries.size + 1 });
}
export function getGenreFableEntriesByType(state: NarrativeGenreFableEngineState, type: GenreFableType): GenreFableEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getGenreFableReport(state: NarrativeGenreFableEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add genre fable entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.fableMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMenageries: state.totalMenageries, averageResonance: Math.round(state.averageResonance * 100) / 100, fableComplexity: Math.round(state.fableComplexity * 100) / 100, fableMastery: Math.round(state.fableMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeGenreFableEngineState): NarrativeGenreFableEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const menageries = Array.from(state.menageries.values());
  const fableComplexity = menageries.length === 0 ? 0.5 : menageries.reduce((s, m) => s + m.breadth, 0) / menageries.length;
  return { ...state, averageResonance, fableComplexity, fableMastery: averageResonance * 0.5 + fableComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeGenreFableEngineState(): NarrativeGenreFableEngineState { return createNarrativeGenreFableEngineState(); }