/**
 * V1738 NarrativeThemeDutyEngine — Direction Q Iter 7/30 (Round 5)
 */
export type ThemeDutyType = 'familial' | 'professional' | 'social' | 'moral' | 'spiritual' | 'transcendent' | 'infinite';
export type ThemeDutyBurden = 'light' | 'moderate' | 'heavy' | 'crushing' | 'transcendent' | 'infinite';
export interface ThemeDutyEntry { entryId: string; type: ThemeDutyType; burden: ThemeDutyBurden; description: string; weight: number; chapter: number; }
export interface ThemeDutyChain { chainId: string; entryIds: string[]; cumulativeWeight: number; breadth: number; }
export interface NarrativeThemeDutyEngineState { entries: Map<string, ThemeDutyEntry>; chains: Map<string, ThemeDutyChain>; totalEntries: number; totalChains: number; averageWeight: number; dutyComplexity: number; dutyMastery: number; }
export function createNarrativeThemeDutyEngineState(): NarrativeThemeDutyEngineState { return { entries: new Map(), chains: new Map(), totalEntries: 0, totalChains: 0, averageWeight: 0.5, dutyComplexity: 0.5, dutyMastery: 0.5 }; }
export function addThemeDutyEntry(state: NarrativeThemeDutyEngineState, entryId: string, type: ThemeDutyType, burden: ThemeDutyBurden, description: string, weight: number, chapter: number): NarrativeThemeDutyEngineState {
  const entry: ThemeDutyEntry = { entryId, type, burden, description, weight, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeDutyChain(state: NarrativeThemeDutyEngineState, chainId: string, entryIds: string[]): NarrativeThemeDutyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeDutyEntry => e !== undefined);
  const cumulativeWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const chain: ThemeDutyChain = { chainId, entryIds, cumulativeWeight, breadth };
  return recompute({ ...state, chains: new Map(state.chains).set(chainId, chain), totalChains: state.chains.size + 1 });
}
export function getThemeDutyEntriesByType(state: NarrativeThemeDutyEngineState, type: ThemeDutyType): ThemeDutyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeDutyReport(state: NarrativeThemeDutyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme duty entries');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.dutyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalChains: state.totalChains, averageWeight: Math.round(state.averageWeight * 100) / 100, dutyComplexity: Math.round(state.dutyComplexity * 100) / 100, dutyMastery: Math.round(state.dutyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeDutyEngineState): NarrativeThemeDutyEngineState {
  const entries = Array.from(state.entries.values());
  const averageWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const chains = Array.from(state.chains.values());
  const dutyComplexity = chains.length === 0 ? 0.5 : chains.reduce((s, c) => s + c.breadth, 0) / chains.length;
  return { ...state, averageWeight, dutyComplexity, dutyMastery: averageWeight * 0.5 + dutyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeDutyEngineState(): NarrativeThemeDutyEngineState { return createNarrativeThemeDutyEngineState(); }