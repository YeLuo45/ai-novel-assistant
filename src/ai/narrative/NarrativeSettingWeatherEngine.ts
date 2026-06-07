/**
 * V1634 NarrativeSettingWeatherEngine — Direction O Iter 15/30 (Round 5)
 */
export type SettingWeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'transcendent' | 'infinite';
export type SettingWeatherIntensity = 'gentle' | 'moderate' | 'strong' | 'severe' | 'transcendent' | 'infinite';
export interface SettingWeatherEntry { entryId: string; type: SettingWeatherType; intensity: SettingWeatherIntensity; description: string; moodiness: number; chapter: number; }
export interface SettingWeatherFront { frontId: string; entryIds: string[]; cumulativeMoodiness: number; breadth: number; }
export interface NarrativeSettingWeatherEngineState { entries: Map<string, SettingWeatherEntry>; fronts: Map<string, SettingWeatherFront>; totalEntries: number; totalFronts: number; averageMoodiness: number; weatherComplexity: number; weatherMastery: number; }
export function createNarrativeSettingWeatherEngineState(): NarrativeSettingWeatherEngineState { return { entries: new Map(), fronts: new Map(), totalEntries: 0, totalFronts: 0, averageMoodiness: 0.5, weatherComplexity: 0.5, weatherMastery: 0.5 }; }
export function addSettingWeatherEntry(state: NarrativeSettingWeatherEngineState, entryId: string, type: SettingWeatherType, intensity: SettingWeatherIntensity, description: string, moodiness: number, chapter: number): NarrativeSettingWeatherEngineState {
  const entry: SettingWeatherEntry = { entryId, type, intensity, description, moodiness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingWeatherFront(state: NarrativeSettingWeatherEngineState, frontId: string, entryIds: string[]): NarrativeSettingWeatherEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingWeatherEntry => e !== undefined);
  const cumulativeMoodiness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.moodiness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const front: SettingWeatherFront = { frontId, entryIds, cumulativeMoodiness, breadth };
  return recompute({ ...state, fronts: new Map(state.fronts).set(frontId, front), totalFronts: state.fronts.size + 1 });
}
export function getSettingWeatherEntriesByType(state: NarrativeSettingWeatherEngineState, type: SettingWeatherType): SettingWeatherEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingWeatherReport(state: NarrativeSettingWeatherEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting weather entries');
  if (state.averageMoodiness < 0.5) recommendations.push('Low moodiness — strengthen');
  if (state.weatherMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFronts: state.totalFronts, averageMoodiness: Math.round(state.averageMoodiness * 100) / 100, weatherComplexity: Math.round(state.weatherComplexity * 100) / 100, weatherMastery: Math.round(state.weatherMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingWeatherEngineState): NarrativeSettingWeatherEngineState {
  const entries = Array.from(state.entries.values());
  const averageMoodiness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.moodiness, 0) / entries.length;
  const fronts = Array.from(state.fronts.values());
  const weatherComplexity = fronts.length === 0 ? 0.5 : fronts.reduce((s, f) => s + f.breadth, 0) / fronts.length;
  return { ...state, averageMoodiness, weatherComplexity, weatherMastery: averageMoodiness * 0.5 + weatherComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingWeatherEngineState(): NarrativeSettingWeatherEngineState { return createNarrativeSettingWeatherEngineState(); }