/**
 * V1624 NarrativeSettingSkyEngine — Direction O Iter 10/30 (Round 5)
 */
export type SettingSkyType = 'ground_level' | 'low_altitude' | 'high_altitude' | 'stratosphere' | 'ethereal' | 'transcendent' | 'infinite';
export type SettingSkyFeeling = 'grounded' | 'floating' | 'soaring' | 'transcendent' | 'infinite';
export interface SettingSkyEntry { entryId: string; type: SettingSkyType; feeling: SettingSkyFeeling; description: string; elevation: number; chapter: number; }
export interface SettingSkyTier { tierId: string; entryIds: string[]; cumulativeElevation: number; breadth: number; }
export interface NarrativeSettingSkyEngineState { entries: Map<string, SettingSkyEntry>; tiers: Map<string, SettingSkyTier>; totalEntries: number; totalTiers: number; averageElevation: number; skyComplexity: number; skyMastery: number; }
export function createNarrativeSettingSkyEngineState(): NarrativeSettingSkyEngineState { return { entries: new Map(), tiers: new Map(), totalEntries: 0, totalTiers: 0, averageElevation: 0.5, skyComplexity: 0.5, skyMastery: 0.5 }; }
export function addSettingSkyEntry(state: NarrativeSettingSkyEngineState, entryId: string, type: SettingSkyType, feeling: SettingSkyFeeling, description: string, elevation: number, chapter: number): NarrativeSettingSkyEngineState {
  const entry: SettingSkyEntry = { entryId, type, feeling, description, elevation, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingSkyTier(state: NarrativeSettingSkyEngineState, tierId: string, entryIds: string[]): NarrativeSettingSkyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingSkyEntry => e !== undefined);
  const cumulativeElevation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.elevation, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const tier: SettingSkyTier = { tierId, entryIds, cumulativeElevation, breadth };
  return recompute({ ...state, tiers: new Map(state.tiers).set(tierId, tier), totalTiers: state.tiers.size + 1 });
}
export function getSettingSkyEntriesByType(state: NarrativeSettingSkyEngineState, type: SettingSkyType): SettingSkyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingSkyReport(state: NarrativeSettingSkyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting sky entries');
  if (state.averageElevation < 0.5) recommendations.push('Low elevation — strengthen');
  if (state.skyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTiers: state.totalTiers, averageElevation: Math.round(state.averageElevation * 100) / 100, skyComplexity: Math.round(state.skyComplexity * 100) / 100, skyMastery: Math.round(state.skyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingSkyEngineState): NarrativeSettingSkyEngineState {
  const entries = Array.from(state.entries.values());
  const averageElevation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.elevation, 0) / entries.length;
  const tiers = Array.from(state.tiers.values());
  const skyComplexity = tiers.length === 0 ? 0.5 : tiers.reduce((s, t) => s + t.breadth, 0) / tiers.length;
  return { ...state, averageElevation, skyComplexity, skyMastery: averageElevation * 0.5 + skyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingSkyEngineState(): NarrativeSettingSkyEngineState { return createNarrativeSettingSkyEngineState(); }