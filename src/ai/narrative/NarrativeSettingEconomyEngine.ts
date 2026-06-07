/**
 * V1642 NarrativeSettingEconomyEngine — Direction O Iter 19/30 (Round 5)
 */
export type SettingEconomyType = 'agrarian' | 'mercantile' | 'industrial' | 'service' | 'information' | 'transcendent' | 'infinite';
export type SettingEconomyWealth = 'subsistence' | 'basic' | 'middle' | 'abundant' | 'transcendent' | 'infinite';
export interface SettingEconomyEntry { entryId: string; type: SettingEconomyType; wealth: SettingEconomyWealth; description: string; depth: number; chapter: number; }
export interface SettingEconomySector { sectorId: string; entryIds: string[]; cumulativeDepth: number; breadth: number; }
export interface NarrativeSettingEconomyEngineState { entries: Map<string, SettingEconomyEntry>; sectors: Map<string, SettingEconomySector>; totalEntries: number; totalSectors: number; averageDepth: number; economyComplexity: number; economyMastery: number; }
export function createNarrativeSettingEconomyEngineState(): NarrativeSettingEconomyEngineState { return { entries: new Map(), sectors: new Map(), totalEntries: 0, totalSectors: 0, averageDepth: 0.5, economyComplexity: 0.5, economyMastery: 0.5 }; }
export function addSettingEconomyEntry(state: NarrativeSettingEconomyEngineState, entryId: string, type: SettingEconomyType, wealth: SettingEconomyWealth, description: string, depth: number, chapter: number): NarrativeSettingEconomyEngineState {
  const entry: SettingEconomyEntry = { entryId, type, wealth, description, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingEconomySector(state: NarrativeSettingEconomyEngineState, sectorId: string, entryIds: string[]): NarrativeSettingEconomyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingEconomyEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const sector: SettingEconomySector = { sectorId, entryIds, cumulativeDepth, breadth };
  return recompute({ ...state, sectors: new Map(state.sectors).set(sectorId, sector), totalSectors: state.sectors.size + 1 });
}
export function getSettingEconomyEntriesByType(state: NarrativeSettingEconomyEngineState, type: SettingEconomyType): SettingEconomyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingEconomyReport(state: NarrativeSettingEconomyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting economy entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.economyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSectors: state.totalSectors, averageDepth: Math.round(state.averageDepth * 100) / 100, economyComplexity: Math.round(state.economyComplexity * 100) / 100, economyMastery: Math.round(state.economyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingEconomyEngineState): NarrativeSettingEconomyEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const sectors = Array.from(state.sectors.values());
  const economyComplexity = sectors.length === 0 ? 0.5 : sectors.reduce((s, sc) => s + sc.breadth, 0) / sectors.length;
  return { ...state, averageDepth, economyComplexity, economyMastery: averageDepth * 0.5 + economyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingEconomyEngineState(): NarrativeSettingEconomyEngineState { return createNarrativeSettingEconomyEngineState(); }