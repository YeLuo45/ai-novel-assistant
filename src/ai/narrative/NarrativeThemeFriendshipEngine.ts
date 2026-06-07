/**
 * V1762 NarrativeThemeFriendshipEngine — Direction Q Iter 19/30 (Round 5)
 */
export type ThemeFriendshipType = 'childhood' | 'school' | 'work' | 'adventure' | 'tested' | 'transcendent' | 'infinite';
export type ThemeFriendshipStage = 'new' | 'comfortable' | 'deep' | 'tested' | 'transcendent' | 'infinite';
export interface ThemeFriendshipEntry { entryId: string; type: ThemeFriendshipType; stage: ThemeFriendshipStage; description: string; closeness: number; chapter: number; }
export interface ThemeFriendshipBond { bondId: string; entryIds: string[]; cumulativeCloseness: number; breadth: number; }
export interface NarrativeThemeFriendshipEngineState { entries: Map<string, ThemeFriendshipEntry>; bonds: Map<string, ThemeFriendshipBond>; totalEntries: number; totalBonds: number; averageCloseness: number; friendshipComplexity: number; friendshipMastery: number; }
export function createNarrativeThemeFriendshipEngineState(): NarrativeThemeFriendshipEngineState { return { entries: new Map(), bonds: new Map(), totalEntries: 0, totalBonds: 0, averageCloseness: 0.5, friendshipComplexity: 0.5, friendshipMastery: 0.5 }; }
export function addThemeFriendshipEntry(state: NarrativeThemeFriendshipEngineState, entryId: string, type: ThemeFriendshipType, stage: ThemeFriendshipStage, description: string, closeness: number, chapter: number): NarrativeThemeFriendshipEngineState {
  const entry: ThemeFriendshipEntry = { entryId, type, stage, description, closeness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeFriendshipBond(state: NarrativeThemeFriendshipEngineState, bondId: string, entryIds: string[]): NarrativeThemeFriendshipEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeFriendshipEntry => e !== undefined);
  const cumulativeCloseness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.closeness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const bond: ThemeFriendshipBond = { bondId, entryIds, cumulativeCloseness, breadth };
  return recompute({ ...state, bonds: new Map(state.bonds).set(bondId, bond), totalBonds: state.bonds.size + 1 });
}
export function getThemeFriendshipEntriesByType(state: NarrativeThemeFriendshipEngineState, type: ThemeFriendshipType): ThemeFriendshipEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeFriendshipReport(state: NarrativeThemeFriendshipEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme friendship entries');
  if (state.averageCloseness < 0.5) recommendations.push('Low closeness — strengthen');
  if (state.friendshipMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBonds: state.totalBonds, averageCloseness: Math.round(state.averageCloseness * 100) / 100, friendshipComplexity: Math.round(state.friendshipComplexity * 100) / 100, friendshipMastery: Math.round(state.friendshipMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeFriendshipEngineState): NarrativeThemeFriendshipEngineState {
  const entries = Array.from(state.entries.values());
  const averageCloseness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.closeness, 0) / entries.length;
  const bonds = Array.from(state.bonds.values());
  const friendshipComplexity = bonds.length === 0 ? 0.5 : bonds.reduce((s, b) => s + b.breadth, 0) / bonds.length;
  return { ...state, averageCloseness, friendshipComplexity, friendshipMastery: averageCloseness * 0.5 + friendshipComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeFriendshipEngineState(): NarrativeThemeFriendshipEngineState { return createNarrativeThemeFriendshipEngineState(); }