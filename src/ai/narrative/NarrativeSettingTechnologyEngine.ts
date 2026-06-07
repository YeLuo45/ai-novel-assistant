/**
 * V1644 NarrativeSettingTechnologyEngine — Direction O Iter 20/30 (Round 5)
 */
export type SettingTechnologyType = 'primitive' | 'pre_industrial' | 'industrial' | 'modern' | 'futuristic' | 'transcendent' | 'infinite';
export type SettingTechnologyAccessibility = 'rare' | 'limited' | 'common' | 'ubiquitous' | 'transcendent' | 'infinite';
export interface SettingTechnologyEntry { entryId: string; type: SettingTechnologyType; accessibility: SettingTechnologyAccessibility; description: string; innovation: number; chapter: number; }
export interface SettingTechnologyTier { tierId: string; entryIds: string[]; cumulativeInnovation: number; breadth: number; }
export interface NarrativeSettingTechnologyEngineState { entries: Map<string, SettingTechnologyEntry>; tiers: Map<string, SettingTechnologyTier>; totalEntries: number; totalTiers: number; averageInnovation: number; technologyComplexity: number; technologyMastery: number; }
export function createNarrativeSettingTechnologyEngineState(): NarrativeSettingTechnologyEngineState { return { entries: new Map(), tiers: new Map(), totalEntries: 0, totalTiers: 0, averageInnovation: 0.5, technologyComplexity: 0.5, technologyMastery: 0.5 }; }
export function addSettingTechnologyEntry(state: NarrativeSettingTechnologyEngineState, entryId: string, type: SettingTechnologyType, accessibility: SettingTechnologyAccessibility, description: string, innovation: number, chapter: number): NarrativeSettingTechnologyEngineState {
  const entry: SettingTechnologyEntry = { entryId, type, accessibility, description, innovation, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingTechnologyTier(state: NarrativeSettingTechnologyEngineState, tierId: string, entryIds: string[]): NarrativeSettingTechnologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingTechnologyEntry => e !== undefined);
  const cumulativeInnovation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.innovation, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const tier: SettingTechnologyTier = { tierId, entryIds, cumulativeInnovation, breadth };
  return recompute({ ...state, tiers: new Map(state.tiers).set(tierId, tier), totalTiers: state.tiers.size + 1 });
}
export function getSettingTechnologyEntriesByType(state: NarrativeSettingTechnologyEngineState, type: SettingTechnologyType): SettingTechnologyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingTechnologyReport(state: NarrativeSettingTechnologyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting technology entries');
  if (state.averageInnovation < 0.5) recommendations.push('Low innovation — strengthen');
  if (state.technologyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTiers: state.totalTiers, averageInnovation: Math.round(state.averageInnovation * 100) / 100, technologyComplexity: Math.round(state.technologyComplexity * 100) / 100, technologyMastery: Math.round(state.technologyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingTechnologyEngineState): NarrativeSettingTechnologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageInnovation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.innovation, 0) / entries.length;
  const tiers = Array.from(state.tiers.values());
  const technologyComplexity = tiers.length === 0 ? 0.5 : tiers.reduce((s, t) => s + t.breadth, 0) / tiers.length;
  return { ...state, averageInnovation, technologyComplexity, technologyMastery: averageInnovation * 0.5 + technologyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingTechnologyEngineState(): NarrativeSettingTechnologyEngineState { return createNarrativeSettingTechnologyEngineState(); }