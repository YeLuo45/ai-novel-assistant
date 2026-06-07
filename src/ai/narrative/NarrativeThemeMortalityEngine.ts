/**
 * V1732 NarrativeThemeMortalityEngine — Direction Q Iter 4/30 (Round 5)
 */
export type ThemeMortalityType = 'physical' | 'psychological' | 'spiritual' | 'generational' | 'cosmic' | 'transcendent' | 'infinite';
export type ThemeMortalityAcceptance = 'denial' | 'rebellion' | 'bargaining' | 'acceptance' | 'transcendent' | 'infinite';
export interface ThemeMortalityEntry { entryId: string; type: ThemeMortalityType; acceptance: ThemeMortalityAcceptance; description: string; profundity: number; chapter: number; }
export interface ThemeMortalityContemplation { contemplationId: string; entryIds: string[]; cumulativeProfundity: number; breadth: number; }
export interface NarrativeThemeMortalityEngineState { entries: Map<string, ThemeMortalityEntry>; contemplations: Map<string, ThemeMortalityContemplation>; totalEntries: number; totalContemplations: number; averageProfundity: number; mortalityComplexity: number; mortalityMastery: number; }
export function createNarrativeThemeMortalityEngineState(): NarrativeThemeMortalityEngineState { return { entries: new Map(), contemplations: new Map(), totalEntries: 0, totalContemplations: 0, averageProfundity: 0.5, mortalityComplexity: 0.5, mortalityMastery: 0.5 }; }
export function addThemeMortalityEntry(state: NarrativeThemeMortalityEngineState, entryId: string, type: ThemeMortalityType, acceptance: ThemeMortalityAcceptance, description: string, profundity: number, chapter: number): NarrativeThemeMortalityEngineState {
  const entry: ThemeMortalityEntry = { entryId, type, acceptance, description, profundity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeMortalityContemplation(state: NarrativeThemeMortalityEngineState, contemplationId: string, entryIds: string[]): NarrativeThemeMortalityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeMortalityEntry => e !== undefined);
  const cumulativeProfundity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.profundity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const contemplation: ThemeMortalityContemplation = { contemplationId, entryIds, cumulativeProfundity, breadth };
  return recompute({ ...state, contemplations: new Map(state.contemplations).set(contemplationId, contemplation), totalContemplations: state.contemplations.size + 1 });
}
export function getThemeMortalityEntriesByType(state: NarrativeThemeMortalityEngineState, type: ThemeMortalityType): ThemeMortalityEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeMortalityReport(state: NarrativeThemeMortalityEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme mortality entries');
  if (state.averageProfundity < 0.5) recommendations.push('Low profundity — strengthen');
  if (state.mortalityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalContemplations: state.totalContemplations, averageProfundity: Math.round(state.averageProfundity * 100) / 100, mortalityComplexity: Math.round(state.mortalityComplexity * 100) / 100, mortalityMastery: Math.round(state.mortalityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeMortalityEngineState): NarrativeThemeMortalityEngineState {
  const entries = Array.from(state.entries.values());
  const averageProfundity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.profundity, 0) / entries.length;
  const contemplations = Array.from(state.contemplations.values());
  const mortalityComplexity = contemplations.length === 0 ? 0.5 : contemplations.reduce((s, c) => s + c.breadth, 0) / contemplations.length;
  return { ...state, averageProfundity, mortalityComplexity, mortalityMastery: averageProfundity * 0.5 + mortalityComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeMortalityEngineState(): NarrativeThemeMortalityEngineState { return createNarrativeThemeMortalityEngineState(); }