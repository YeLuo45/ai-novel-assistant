/**
 * V1612 NarrativeSettingUrbanismEngine — Direction O Iter 4/30 (Round 5)
 */
export type SettingUrbanismType = 'metropolis' | 'city' | 'town' | 'village' | 'hamlet' | 'arcology' | 'transcendent' | 'infinite';
export type SettingUrbanismActivity = 'sleepy' | 'moderate' | 'bustling' | 'chaotic' | 'transcendent' | 'infinite';
export interface SettingUrbanismEntry { entryId: string; type: SettingUrbanismType; activity: SettingUrbanismActivity; description: string; density: number; chapter: number; }
export interface SettingUrbanismDistrict { districtId: string; entryIds: string[]; cumulativeDensity: number; breadth: number; }
export interface NarrativeSettingUrbanismEngineState { entries: Map<string, SettingUrbanismEntry>; districts: Map<string, SettingUrbanismDistrict>; totalEntries: number; totalDistricts: number; averageDensity: number; urbanismComplexity: number; urbanismMastery: number; }
export function createNarrativeSettingUrbanismEngineState(): NarrativeSettingUrbanismEngineState { return { entries: new Map(), districts: new Map(), totalEntries: 0, totalDistricts: 0, averageDensity: 0.5, urbanismComplexity: 0.5, urbanismMastery: 0.5 }; }
export function addSettingUrbanismEntry(state: NarrativeSettingUrbanismEngineState, entryId: string, type: SettingUrbanismType, activity: SettingUrbanismActivity, description: string, density: number, chapter: number): NarrativeSettingUrbanismEngineState {
  const entry: SettingUrbanismEntry = { entryId, type, activity, description, density, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingUrbanismDistrict(state: NarrativeSettingUrbanismEngineState, districtId: string, entryIds: string[]): NarrativeSettingUrbanismEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingUrbanismEntry => e !== undefined);
  const cumulativeDensity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.density, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const district: SettingUrbanismDistrict = { districtId, entryIds, cumulativeDensity, breadth };
  return recompute({ ...state, districts: new Map(state.districts).set(districtId, district), totalDistricts: state.districts.size + 1 });
}
export function getSettingUrbanismEntriesByType(state: NarrativeSettingUrbanismEngineState, type: SettingUrbanismType): SettingUrbanismEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingUrbanismReport(state: NarrativeSettingUrbanismEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting urbanism entries');
  if (state.averageDensity < 0.5) recommendations.push('Low density — strengthen');
  if (state.urbanismMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalDistricts: state.totalDistricts, averageDensity: Math.round(state.averageDensity * 100) / 100, urbanismComplexity: Math.round(state.urbanismComplexity * 100) / 100, urbanismMastery: Math.round(state.urbanismMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingUrbanismEngineState): NarrativeSettingUrbanismEngineState {
  const entries = Array.from(state.entries.values());
  const averageDensity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.density, 0) / entries.length;
  const districts = Array.from(state.districts.values());
  const urbanismComplexity = districts.length === 0 ? 0.5 : districts.reduce((s, d) => s + d.breadth, 0) / districts.length;
  return { ...state, averageDensity, urbanismComplexity, urbanismMastery: averageDensity * 0.5 + urbanismComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingUrbanismEngineState(): NarrativeSettingUrbanismEngineState { return createNarrativeSettingUrbanismEngineState(); }