/**
 * V1728 NarrativeThemePowerEngine — Direction Q Iter 2/30 (Round 5)
 */
export type ThemePowerType = 'physical' | 'political' | 'economic' | 'social' | 'psychological' | 'transcendent' | 'infinite';
export type ThemePowerCorruption = 'pure' | 'tempted' | 'corrupting' | 'corrupt' | 'transcendent' | 'infinite';
export interface ThemePowerEntry { entryId: string; type: ThemePowerType; corruption: ThemePowerCorruption; description: string; intensity: number; chapter: number; }
export interface ThemePowerDynamic { dynamicId: string; entryIds: string[]; cumulativeIntensity: number; breadth: number; }
export interface NarrativeThemePowerEngineState { entries: Map<string, ThemePowerEntry>; dynamics: Map<string, ThemePowerDynamic>; totalEntries: number; totalDynamics: number; averageIntensity: number; powerComplexity: number; powerMastery: number; }
export function createNarrativeThemePowerEngineState(): NarrativeThemePowerEngineState { return { entries: new Map(), dynamics: new Map(), totalEntries: 0, totalDynamics: 0, averageIntensity: 0.5, powerComplexity: 0.5, powerMastery: 0.5 }; }
export function addThemePowerEntry(state: NarrativeThemePowerEngineState, entryId: string, type: ThemePowerType, corruption: ThemePowerCorruption, description: string, intensity: number, chapter: number): NarrativeThemePowerEngineState {
  const entry: ThemePowerEntry = { entryId, type, corruption, description, intensity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemePowerDynamic(state: NarrativeThemePowerEngineState, dynamicId: string, entryIds: string[]): NarrativeThemePowerEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemePowerEntry => e !== undefined);
  const cumulativeIntensity = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.intensity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const dynamic: ThemePowerDynamic = { dynamicId, entryIds, cumulativeIntensity, breadth };
  return recompute({ ...state, dynamics: new Map(state.dynamics).set(dynamicId, dynamic), totalDynamics: state.dynamics.size + 1 });
}
export function getThemePowerEntriesByType(state: NarrativeThemePowerEngineState, type: ThemePowerType): ThemePowerEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemePowerReport(state: NarrativeThemePowerEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme power entries');
  if (state.averageIntensity < 0.5) recommendations.push('Low intensity — strengthen');
  if (state.powerMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalDynamics: state.totalDynamics, averageIntensity: Math.round(state.averageIntensity * 100) / 100, powerComplexity: Math.round(state.powerComplexity * 100) / 100, powerMastery: Math.round(state.powerMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemePowerEngineState): NarrativeThemePowerEngineState {
  const entries = Array.from(state.entries.values());
  const averageIntensity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.intensity, 0) / entries.length;
  const dynamics = Array.from(state.dynamics.values());
  const powerComplexity = dynamics.length === 0 ? 0.5 : dynamics.reduce((s, d) => s + d.breadth, 0) / dynamics.length;
  return { ...state, averageIntensity, powerComplexity, powerMastery: averageIntensity * 0.5 + powerComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemePowerEngineState(): NarrativeThemePowerEngineState { return createNarrativeThemePowerEngineState(); }