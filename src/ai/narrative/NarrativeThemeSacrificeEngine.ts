/**
 * V1746 NarrativeThemeSacrificeEngine — Direction Q Iter 11/30 (Round 5)
 */
export type ThemeSacrificeType = 'personal' | 'familial' | 'heroic' | 'martyr' | 'quiet' | 'transcendent' | 'infinite';
export type ThemeSacrificeCost = 'small' | 'moderate' | 'great' | 'total' | 'transcendent' | 'infinite';
export interface ThemeSacrificeEntry { entryId: string; type: ThemeSacrificeType; cost: ThemeSacrificeCost; description: string; nobility: number; chapter: number; }
export interface ThemeSacrificeAct { actId: string; entryIds: string[]; cumulativeNobility: number; breadth: number; }
export interface NarrativeThemeSacrificeEngineState { entries: Map<string, ThemeSacrificeEntry>; acts: Map<string, ThemeSacrificeAct>; totalEntries: number; totalActs: number; averageNobility: number; sacrificeComplexity: number; sacrificeMastery: number; }
export function createNarrativeThemeSacrificeEngineState(): NarrativeThemeSacrificeEngineState { return { entries: new Map(), acts: new Map(), totalEntries: 0, totalActs: 0, averageNobility: 0.5, sacrificeComplexity: 0.5, sacrificeMastery: 0.5 }; }
export function addThemeSacrificeEntry(state: NarrativeThemeSacrificeEngineState, entryId: string, type: ThemeSacrificeType, cost: ThemeSacrificeCost, description: string, nobility: number, chapter: number): NarrativeThemeSacrificeEngineState {
  const entry: ThemeSacrificeEntry = { entryId, type, cost, description, nobility, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeSacrificeAct(state: NarrativeThemeSacrificeEngineState, actId: string, entryIds: string[]): NarrativeThemeSacrificeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeSacrificeEntry => e !== undefined);
  const cumulativeNobility = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.nobility, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const act: ThemeSacrificeAct = { actId, entryIds, cumulativeNobility, breadth };
  return recompute({ ...state, acts: new Map(state.acts).set(actId, act), totalActs: state.acts.size + 1 });
}
export function getThemeSacrificeEntriesByType(state: NarrativeThemeSacrificeEngineState, type: ThemeSacrificeType): ThemeSacrificeEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeSacrificeReport(state: NarrativeThemeSacrificeEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme sacrifice entries');
  if (state.averageNobility < 0.5) recommendations.push('Low nobility — strengthen');
  if (state.sacrificeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalActs: state.totalActs, averageNobility: Math.round(state.averageNobility * 100) / 100, sacrificeComplexity: Math.round(state.sacrificeComplexity * 100) / 100, sacrificeMastery: Math.round(state.sacrificeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeSacrificeEngineState): NarrativeThemeSacrificeEngineState {
  const entries = Array.from(state.entries.values());
  const averageNobility = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.nobility, 0) / entries.length;
  const acts = Array.from(state.acts.values());
  const sacrificeComplexity = acts.length === 0 ? 0.5 : acts.reduce((s, a) => s + a.breadth, 0) / acts.length;
  return { ...state, averageNobility, sacrificeComplexity, sacrificeMastery: averageNobility * 0.5 + sacrificeComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeSacrificeEngineState(): NarrativeThemeSacrificeEngineState { return createNarrativeThemeSacrificeEngineState(); }