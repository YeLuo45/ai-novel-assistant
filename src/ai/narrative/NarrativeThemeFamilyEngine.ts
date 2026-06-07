/**
 * V1736 NarrativeThemeFamilyEngine — Direction Q Iter 6/30 (Round 5)
 */
export type ThemeFamilyType = 'nuclear' | 'extended' | 'chosen' | 'broken' | 'legacy' | 'transcendent' | 'infinite';
export type ThemeFamilyBond = 'strained' | 'repairing' | 'strong' | 'unbreakable' | 'transcendent' | 'infinite';
export interface ThemeFamilyEntry { entryId: string; type: ThemeFamilyType; bond: ThemeFamilyBond; description: string; warmth: number; chapter: number; }
export interface ThemeFamilyLineage { lineageId: string; entryIds: string[]; cumulativeWarmth: number; breadth: number; }
export interface NarrativeThemeFamilyEngineState { entries: Map<string, ThemeFamilyEntry>; lineages: Map<string, ThemeFamilyLineage>; totalEntries: number; totalLineages: number; averageWarmth: number; familyComplexity: number; familyMastery: number; }
export function createNarrativeThemeFamilyEngineState(): NarrativeThemeFamilyEngineState { return { entries: new Map(), lineages: new Map(), totalEntries: 0, totalLineages: 0, averageWarmth: 0.5, familyComplexity: 0.5, familyMastery: 0.5 }; }
export function addThemeFamilyEntry(state: NarrativeThemeFamilyEngineState, entryId: string, type: ThemeFamilyType, bond: ThemeFamilyBond, description: string, warmth: number, chapter: number): NarrativeThemeFamilyEngineState {
  const entry: ThemeFamilyEntry = { entryId, type, bond, description, warmth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeFamilyLineage(state: NarrativeThemeFamilyEngineState, lineageId: string, entryIds: string[]): NarrativeThemeFamilyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeFamilyEntry => e !== undefined);
  const cumulativeWarmth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.warmth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const lineage: ThemeFamilyLineage = { lineageId, entryIds, cumulativeWarmth, breadth };
  return recompute({ ...state, lineages: new Map(state.lineages).set(lineageId, lineage), totalLineages: state.lineages.size + 1 });
}
export function getThemeFamilyEntriesByType(state: NarrativeThemeFamilyEngineState, type: ThemeFamilyType): ThemeFamilyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeFamilyReport(state: NarrativeThemeFamilyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme family entries');
  if (state.averageWarmth < 0.5) recommendations.push('Low warmth — strengthen');
  if (state.familyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLineages: state.totalLineages, averageWarmth: Math.round(state.averageWarmth * 100) / 100, familyComplexity: Math.round(state.familyComplexity * 100) / 100, familyMastery: Math.round(state.familyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeFamilyEngineState): NarrativeThemeFamilyEngineState {
  const entries = Array.from(state.entries.values());
  const averageWarmth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.warmth, 0) / entries.length;
  const lineages = Array.from(state.lineages.values());
  const familyComplexity = lineages.length === 0 ? 0.5 : lineages.reduce((s, l) => s + l.breadth, 0) / lineages.length;
  return { ...state, averageWarmth, familyComplexity, familyMastery: averageWarmth * 0.5 + familyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeFamilyEngineState(): NarrativeThemeFamilyEngineState { return createNarrativeThemeFamilyEngineState(); }