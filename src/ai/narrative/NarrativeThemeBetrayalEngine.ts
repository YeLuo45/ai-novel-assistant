/**
 * V1742 NarrativeThemeBetrayalEngine — Direction Q Iter 9/30 (Round 5)
 */
export type ThemeBetrayalType = 'personal' | 'familial' | 'professional' | 'ideological' | 'romantic' | 'transcendent' | 'infinite';
export type ThemeBetrayalDepth = 'minor' | 'significant' | 'severe' | 'total' | 'transcendent' | 'infinite';
export interface ThemeBetrayalEntry { entryId: string; type: ThemeBetrayalType; depth: ThemeBetrayalDepth; description: string; wound: number; chapter: number; }
export interface ThemeBetrayalWave { waveId: string; entryIds: string[]; cumulativeWound: number; breadth: number; }
export interface NarrativeThemeBetrayalEngineState { entries: Map<string, ThemeBetrayalEntry>; waves: Map<string, ThemeBetrayalWave>; totalEntries: number; totalWaves: number; averageWound: number; betrayalComplexity: number; betrayalMastery: number; }
export function createNarrativeThemeBetrayalEngineState(): NarrativeThemeBetrayalEngineState { return { entries: new Map(), waves: new Map(), totalEntries: 0, totalWaves: 0, averageWound: 0.5, betrayalComplexity: 0.5, betrayalMastery: 0.5 }; }
export function addThemeBetrayalEntry(state: NarrativeThemeBetrayalEngineState, entryId: string, type: ThemeBetrayalType, depth: ThemeBetrayalDepth, description: string, wound: number, chapter: number): NarrativeThemeBetrayalEngineState {
  const entry: ThemeBetrayalEntry = { entryId, type, depth, description, wound, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeBetrayalWave(state: NarrativeThemeBetrayalEngineState, waveId: string, entryIds: string[]): NarrativeThemeBetrayalEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeBetrayalEntry => e !== undefined);
  const cumulativeWound = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.wound, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const wave: ThemeBetrayalWave = { waveId, entryIds, cumulativeWound, breadth };
  return recompute({ ...state, waves: new Map(state.waves).set(waveId, wave), totalWaves: state.waves.size + 1 });
}
export function getThemeBetrayalEntriesByType(state: NarrativeThemeBetrayalEngineState, type: ThemeBetrayalType): ThemeBetrayalEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeBetrayalReport(state: NarrativeThemeBetrayalEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme betrayal entries');
  if (state.averageWound < 0.5) recommendations.push('Low wound — strengthen');
  if (state.betrayalMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWaves: state.totalWaves, averageWound: Math.round(state.averageWound * 100) / 100, betrayalComplexity: Math.round(state.betrayalComplexity * 100) / 100, betrayalMastery: Math.round(state.betrayalMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeBetrayalEngineState): NarrativeThemeBetrayalEngineState {
  const entries = Array.from(state.entries.values());
  const averageWound = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.wound, 0) / entries.length;
  const waves = Array.from(state.waves.values());
  const betrayalComplexity = waves.length === 0 ? 0.5 : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;
  return { ...state, averageWound, betrayalComplexity, betrayalMastery: averageWound * 0.5 + betrayalComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeBetrayalEngineState(): NarrativeThemeBetrayalEngineState { return createNarrativeThemeBetrayalEngineState(); }