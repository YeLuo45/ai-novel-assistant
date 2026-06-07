/**
 * V1504 NarrativePlotRisingActionEngine — Direction M Iter 10/30 (Round 5)
 */
export type PlotRisingActionType = 'complication' | 'obstacle' | 'discovery' | 'revelation' | 'decision' | 'transcendent' | 'infinite';
export type PlotRisingActionPacing = 'glacial' | 'slow' | 'moderate' | 'brisk' | 'rapid' | 'transcendent' | 'infinite';
export interface PlotRisingActionEntry { entryId: string; type: PlotRisingActionType; pacing: PlotRisingActionPacing; description: string; tension: number; chapter: number; }
export interface PlotRisingActionWave { waveId: string; entryIds: string[]; cumulativeTension: number; breadth: number; }
export interface NarrativePlotRisingActionEngineState { entries: Map<string, PlotRisingActionEntry>; waves: Map<string, PlotRisingActionWave>; totalEntries: number; totalWaves: number; averageTension: number; risingComplexity: number; risingMastery: number; }
export function createNarrativePlotRisingActionEngineState(): NarrativePlotRisingActionEngineState { return { entries: new Map(), waves: new Map(), totalEntries: 0, totalWaves: 0, averageTension: 0.5, risingComplexity: 0.5, risingMastery: 0.5 }; }
export function addPlotRisingActionEntry(state: NarrativePlotRisingActionEngineState, entryId: string, type: PlotRisingActionType, pacing: PlotRisingActionPacing, description: string, tension: number, chapter: number): NarrativePlotRisingActionEngineState {
  const entry: PlotRisingActionEntry = { entryId, type, pacing, description, tension, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotRisingActionWave(state: NarrativePlotRisingActionEngineState, waveId: string, entryIds: string[]): NarrativePlotRisingActionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotRisingActionEntry => e !== undefined);
  const cumulativeTension = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const wave: PlotRisingActionWave = { waveId, entryIds, cumulativeTension, breadth };
  return recompute({ ...state, waves: new Map(state.waves).set(waveId, wave), totalWaves: state.waves.size + 1 });
}
export function getPlotRisingActionEntriesByType(state: NarrativePlotRisingActionEngineState, type: PlotRisingActionType): PlotRisingActionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotRisingActionReport(state: NarrativePlotRisingActionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot rising action entries');
  if (state.averageTension < 0.5) recommendations.push('Low tension — strengthen');
  if (state.risingMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWaves: state.totalWaves, averageTension: Math.round(state.averageTension * 100) / 100, risingComplexity: Math.round(state.risingComplexity * 100) / 100, risingMastery: Math.round(state.risingMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotRisingActionEngineState): NarrativePlotRisingActionEngineState {
  const entries = Array.from(state.entries.values());
  const averageTension = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const waves = Array.from(state.waves.values());
  const risingComplexity = waves.length === 0 ? 0.5 : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;
  return { ...state, averageTension, risingComplexity, risingMastery: averageTension * 0.5 + risingComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotRisingActionEngineState(): NarrativePlotRisingActionEngineState { return createNarrativePlotRisingActionEngineState(); }