/**
 * V1770 NarrativeThemeTruthEngine — Direction Q Iter 23/30 (Round 5)
 */
export type ThemeTruthType = 'factual' | 'emotional' | 'philosophical' | 'experiential' | 'spiritual' | 'transcendent' | 'infinite';
export type ThemeTruthReveal = 'gradual' | 'sudden' | 'implied' | 'hidden' | 'transcendent' | 'infinite';
export interface ThemeTruthEntry { entryId: string; type: ThemeTruthType; reveal: ThemeTruthReveal; description: string; clarity: number; chapter: number; }
export interface ThemeTruthLadder { ladderId: string; entryIds: string[]; cumulativeClarity: number; breadth: number; }
export interface NarrativeThemeTruthEngineState { entries: Map<string, ThemeTruthEntry>; ladders: Map<string, ThemeTruthLadder>; totalEntries: number; totalLadders: number; averageClarity: number; truthComplexity: number; truthMastery: number; }
export function createNarrativeThemeTruthEngineState(): NarrativeThemeTruthEngineState { return { entries: new Map(), ladders: new Map(), totalEntries: 0, totalLadders: 0, averageClarity: 0.5, truthComplexity: 0.5, truthMastery: 0.5 }; }
export function addThemeTruthEntry(state: NarrativeThemeTruthEngineState, entryId: string, type: ThemeTruthType, reveal: ThemeTruthReveal, description: string, clarity: number, chapter: number): NarrativeThemeTruthEngineState {
  const entry: ThemeTruthEntry = { entryId, type, reveal, description, clarity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeTruthLadder(state: NarrativeThemeTruthEngineState, ladderId: string, entryIds: string[]): NarrativeThemeTruthEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeTruthEntry => e !== undefined);
  const cumulativeClarity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const ladder: ThemeTruthLadder = { ladderId, entryIds, cumulativeClarity, breadth };
  return recompute({ ...state, ladders: new Map(state.ladders).set(ladderId, ladder), totalLadders: state.ladders.size + 1 });
}
export function getThemeTruthEntriesByType(state: NarrativeThemeTruthEngineState, type: ThemeTruthType): ThemeTruthEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeTruthReport(state: NarrativeThemeTruthEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme truth entries');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.truthMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLadders: state.totalLadders, averageClarity: Math.round(state.averageClarity * 100) / 100, truthComplexity: Math.round(state.truthComplexity * 100) / 100, truthMastery: Math.round(state.truthMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeTruthEngineState): NarrativeThemeTruthEngineState {
  const entries = Array.from(state.entries.values());
  const averageClarity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;
  const ladders = Array.from(state.ladders.values());
  const truthComplexity = ladders.length === 0 ? 0.5 : ladders.reduce((s, l) => s + l.breadth, 0) / ladders.length;
  return { ...state, averageClarity, truthComplexity, truthMastery: averageClarity * 0.5 + truthComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeTruthEngineState(): NarrativeThemeTruthEngineState { return createNarrativeThemeTruthEngineState(); }