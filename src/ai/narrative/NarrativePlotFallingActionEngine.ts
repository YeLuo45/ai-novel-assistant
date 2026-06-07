/**
 * V1506 NarrativePlotFallingActionEngine — Direction M Iter 11/30 (Round 5)
 */
export type PlotFallingActionType = 'aftermath' | 'consequence' | 'rebuilding' | 'processing' | 'transition' | 'transcendent' | 'infinite';
export type PlotFallingActionPacing = 'glacial' | 'slow' | 'moderate' | 'brisk' | 'rapid' | 'transcendent' | 'infinite';
export interface PlotFallingActionEntry { entryId: string; type: PlotFallingActionType; pacing: PlotFallingActionPacing; description: string; release: number; chapter: number; }
export interface PlotFallingActionWave { waveId: string; entryIds: string[]; cumulativeRelease: number; breadth: number; }
export interface NarrativePlotFallingActionEngineState { entries: Map<string, PlotFallingActionEntry>; waves: Map<string, PlotFallingActionWave>; totalEntries: number; totalWaves: number; averageRelease: number; fallingComplexity: number; fallingMastery: number; }
export function createNarrativePlotFallingActionEngineState(): NarrativePlotFallingActionEngineState { return { entries: new Map(), waves: new Map(), totalEntries: 0, totalWaves: 0, averageRelease: 0.5, fallingComplexity: 0.5, fallingMastery: 0.5 }; }
export function addPlotFallingActionEntry(state: NarrativePlotFallingActionEngineState, entryId: string, type: PlotFallingActionType, pacing: PlotFallingActionPacing, description: string, release: number, chapter: number): NarrativePlotFallingActionEngineState {
  const entry: PlotFallingActionEntry = { entryId, type, pacing, description, release, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotFallingActionWave(state: NarrativePlotFallingActionEngineState, waveId: string, entryIds: string[]): NarrativePlotFallingActionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotFallingActionEntry => e !== undefined);
  const cumulativeRelease = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.release, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const wave: PlotFallingActionWave = { waveId, entryIds, cumulativeRelease, breadth };
  return recompute({ ...state, waves: new Map(state.waves).set(waveId, wave), totalWaves: state.waves.size + 1 });
}
export function getPlotFallingActionEntriesByType(state: NarrativePlotFallingActionEngineState, type: PlotFallingActionType): PlotFallingActionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotFallingActionReport(state: NarrativePlotFallingActionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot falling action entries');
  if (state.averageRelease < 0.5) recommendations.push('Low release — strengthen');
  if (state.fallingMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWaves: state.totalWaves, averageRelease: Math.round(state.averageRelease * 100) / 100, fallingComplexity: Math.round(state.fallingComplexity * 100) / 100, fallingMastery: Math.round(state.fallingMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotFallingActionEngineState): NarrativePlotFallingActionEngineState {
  const entries = Array.from(state.entries.values());
  const averageRelease = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.release, 0) / entries.length;
  const waves = Array.from(state.waves.values());
  const fallingComplexity = waves.length === 0 ? 0.5 : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;
  return { ...state, averageRelease, fallingComplexity, fallingMastery: averageRelease * 0.5 + fallingComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotFallingActionEngineState(): NarrativePlotFallingActionEngineState { return createNarrativePlotFallingActionEngineState(); }