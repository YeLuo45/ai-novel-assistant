/**
 * V1748 NarrativeThemeLossEngine — Direction Q Iter 12/30 (Round 5)
 */
export type ThemeLossType = 'person' | 'possession' | 'self' | 'potential' | 'world' | 'transcendent' | 'infinite';
export type ThemeLossGrief = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance' | 'transcendent' | 'infinite';
export interface ThemeLossEntry { entryId: string; type: ThemeLossType; grief: ThemeLossGrief; description: string; voidScore: number; chapter: number; }
export interface ThemeLossWave { waveId: string; entryIds: string[]; cumulativeVoid: number; breadth: number; }
export interface NarrativeThemeLossEngineState { entries: Map<string, ThemeLossEntry>; waves: Map<string, ThemeLossWave>; totalEntries: number; totalWaves: number; averageVoid: number; lossComplexity: number; lossMastery: number; }
export function createNarrativeThemeLossEngineState(): NarrativeThemeLossEngineState { return { entries: new Map(), waves: new Map(), totalEntries: 0, totalWaves: 0, averageVoid: 0.5, lossComplexity: 0.5, lossMastery: 0.5 }; }
export function addThemeLossEntry(state: NarrativeThemeLossEngineState, entryId: string, type: ThemeLossType, grief: ThemeLossGrief, description: string, voidScore: number, chapter: number): NarrativeThemeLossEngineState {
  const entry: ThemeLossEntry = { entryId, type, grief, description, voidScore, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeLossWave(state: NarrativeThemeLossEngineState, waveId: string, entryIds: string[]): NarrativeThemeLossEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeLossEntry => e !== undefined);
  const cumulativeVoid = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.voidScore, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const wave: ThemeLossWave = { waveId, entryIds, cumulativeVoid, breadth };
  return recompute({ ...state, waves: new Map(state.waves).set(waveId, wave), totalWaves: state.waves.size + 1 });
}
export function getThemeLossEntriesByType(state: NarrativeThemeLossEngineState, type: ThemeLossType): ThemeLossEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeLossReport(state: NarrativeThemeLossEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme loss entries');
  if (state.averageVoid < 0.5) recommendations.push('Low void — strengthen');
  if (state.lossMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWaves: state.totalWaves, averageVoid: Math.round(state.averageVoid * 100) / 100, lossComplexity: Math.round(state.lossComplexity * 100) / 100, lossMastery: Math.round(state.lossMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeLossEngineState): NarrativeThemeLossEngineState {
  const entries = Array.from(state.entries.values());
  const averageVoid = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.voidScore, 0) / entries.length;
  const waves = Array.from(state.waves.values());
  const lossComplexity = waves.length === 0 ? 0.5 : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;
  return { ...state, averageVoid, lossComplexity, lossMastery: averageVoid * 0.5 + lossComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeLossEngineState(): NarrativeThemeLossEngineState { return createNarrativeThemeLossEngineState(); }