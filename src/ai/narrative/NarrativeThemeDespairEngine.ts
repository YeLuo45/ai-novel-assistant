/**
 * V1754 NarrativeThemeDespairEngine — Direction Q Iter 15/30 (Round 5)
 */
export type ThemeDespairType = 'existential' | 'situational' | 'chronic' | 'acute' | 'cosmic' | 'transcendent' | 'infinite';
export type ThemeDespairDepth = 'shallow' | 'moderate' | 'deep' | 'abyssal' | 'transcendent' | 'infinite';
export interface ThemeDespairEntry { entryId: string; type: ThemeDespairType; depth: ThemeDespairDepth; description: string; weight: number; chapter: number; }
export interface ThemeDespairAbyss { abyssId: string; entryIds: string[]; cumulativeWeight: number; breadth: number; }
export interface NarrativeThemeDespairEngineState { entries: Map<string, ThemeDespairEntry>; abysses: Map<string, ThemeDespairAbyss>; totalEntries: number; totalAbysses: number; averageWeight: number; despairComplexity: number; despairMastery: number; }
export function createNarrativeThemeDespairEngineState(): NarrativeThemeDespairEngineState { return { entries: new Map(), abysses: new Map(), totalEntries: 0, totalAbysses: 0, averageWeight: 0.5, despairComplexity: 0.5, despairMastery: 0.5 }; }
export function addThemeDespairEntry(state: NarrativeThemeDespairEngineState, entryId: string, type: ThemeDespairType, depth: ThemeDespairDepth, description: string, weight: number, chapter: number): NarrativeThemeDespairEngineState {
  const entry: ThemeDespairEntry = { entryId, type, depth, description, weight, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeDespairAbyss(state: NarrativeThemeDespairEngineState, abyssId: string, entryIds: string[]): NarrativeThemeDespairEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeDespairEntry => e !== undefined);
  const cumulativeWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const abyss: ThemeDespairAbyss = { abyssId, entryIds, cumulativeWeight, breadth };
  return recompute({ ...state, abysses: new Map(state.abysses).set(abyssId, abyss), totalAbysses: state.abysses.size + 1 });
}
export function getThemeDespairEntriesByType(state: NarrativeThemeDespairEngineState, type: ThemeDespairType): ThemeDespairEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeDespairReport(state: NarrativeThemeDespairEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme despair entries');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.despairMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalAbysses: state.totalAbysses, averageWeight: Math.round(state.averageWeight * 100) / 100, despairComplexity: Math.round(state.despairComplexity * 100) / 100, despairMastery: Math.round(state.despairMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeDespairEngineState): NarrativeThemeDespairEngineState {
  const entries = Array.from(state.entries.values());
  const averageWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const abysses = Array.from(state.abysses.values());
  const despairComplexity = abysses.length === 0 ? 0.5 : abysses.reduce((s, a) => s + a.breadth, 0) / abysses.length;
  return { ...state, averageWeight, despairComplexity, despairMastery: averageWeight * 0.5 + despairComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeDespairEngineState(): NarrativeThemeDespairEngineState { return createNarrativeThemeDespairEngineState(); }