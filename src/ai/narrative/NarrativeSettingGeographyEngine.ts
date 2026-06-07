/**
 * V1606 NarrativeSettingGeographyEngine — Direction O Iter 1/30 (Round 5)
 * Setting geography engine: physical geography of the world
 * Sources: nanobot geography + thunderbolt + ruflo
 */
export type SettingGeographyType = 'coastal' | 'mountain' | 'desert' | 'forest' | 'plains' | 'tundra' | 'island' | 'transcendent' | 'infinite';
export type SettingGeographyDetail = 'vague' | 'moderate' | 'specific' | 'exhaustive' | 'transcendent' | 'infinite';
export interface SettingGeographyEntry { entryId: string; type: SettingGeographyType; detail: SettingGeographyDetail; description: string; immersion: number; chapter: number; }
export interface SettingGeographyRegion { regionId: string; entryIds: string[]; cumulativeImmersion: number; breadth: number; }
export interface NarrativeSettingGeographyEngineState { entries: Map<string, SettingGeographyEntry>; regions: Map<string, SettingGeographyRegion>; totalEntries: number; totalRegions: number; averageImmersion: number; geographyComplexity: number; geographyMastery: number; }
export function createNarrativeSettingGeographyEngineState(): NarrativeSettingGeographyEngineState { return { entries: new Map(), regions: new Map(), totalEntries: 0, totalRegions: 0, averageImmersion: 0.5, geographyComplexity: 0.5, geographyMastery: 0.5 }; }
export function addSettingGeographyEntry(state: NarrativeSettingGeographyEngineState, entryId: string, type: SettingGeographyType, detail: SettingGeographyDetail, description: string, immersion: number, chapter: number): NarrativeSettingGeographyEngineState {
  const entry: SettingGeographyEntry = { entryId, type, detail, description, immersion, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingGeographyRegion(state: NarrativeSettingGeographyEngineState, regionId: string, entryIds: string[]): NarrativeSettingGeographyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingGeographyEntry => e !== undefined);
  const cumulativeImmersion = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.immersion, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 9);
  const region: SettingGeographyRegion = { regionId, entryIds, cumulativeImmersion, breadth };
  return recompute({ ...state, regions: new Map(state.regions).set(regionId, region), totalRegions: state.regions.size + 1 });
}
export function getSettingGeographyEntriesByType(state: NarrativeSettingGeographyEngineState, type: SettingGeographyType): SettingGeographyEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingGeographyReport(state: NarrativeSettingGeographyEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting geography entries');
  if (state.averageImmersion < 0.5) recommendations.push('Low immersion — strengthen');
  if (state.geographyMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalRegions: state.totalRegions, averageImmersion: Math.round(state.averageImmersion * 100) / 100, geographyComplexity: Math.round(state.geographyComplexity * 100) / 100, geographyMastery: Math.round(state.geographyMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingGeographyEngineState): NarrativeSettingGeographyEngineState {
  const entries = Array.from(state.entries.values());
  const averageImmersion = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.immersion, 0) / entries.length;
  const regions = Array.from(state.regions.values());
  const geographyComplexity = regions.length === 0 ? 0.5 : regions.reduce((s, r) => s + r.breadth, 0) / regions.length;
  return { ...state, averageImmersion, geographyComplexity, geographyMastery: averageImmersion * 0.5 + geographyComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingGeographyEngineState(): NarrativeSettingGeographyEngineState { return createNarrativeSettingGeographyEngineState(); }