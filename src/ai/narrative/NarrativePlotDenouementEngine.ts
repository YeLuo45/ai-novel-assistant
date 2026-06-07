/**
 * V1500 NarrativePlotDenouementEngine — Direction M Iter 8/30 (Round 5)
 */
export type PlotDenouementType = 'falling_action' | 'new_normal' | 'aftermath' | 'reflection' | 'epilogue' | 'coda' | 'transcendent' | 'infinite';
export type PlotDenouementTone = 'peaceful' | 'contemplative' | 'hopeful' | 'melancholic' | 'transcendent' | 'infinite';
export interface PlotDenouementEntry { entryId: string; type: PlotDenouementType; tone: PlotDenouementTone; description: string; settling: number; chapter: number; }
export interface PlotDenouementBeat { beatId: string; entryIds: string[]; cumulativeSettling: number; breadth: number; }
export interface NarrativePlotDenouementEngineState { entries: Map<string, PlotDenouementEntry>; beats: Map<string, PlotDenouementBeat>; totalEntries: number; totalBeats: number; averageSettling: number; denouementComplexity: number; denouementMastery: number; }
export function createNarrativePlotDenouementEngineState(): NarrativePlotDenouementEngineState { return { entries: new Map(), beats: new Map(), totalEntries: 0, totalBeats: 0, averageSettling: 0.5, denouementComplexity: 0.5, denouementMastery: 0.5 }; }
export function addPlotDenouementEntry(state: NarrativePlotDenouementEngineState, entryId: string, type: PlotDenouementType, tone: PlotDenouementTone, description: string, settling: number, chapter: number): NarrativePlotDenouementEngineState {
  const entry: PlotDenouementEntry = { entryId, type, tone, description, settling, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotDenouementBeat(state: NarrativePlotDenouementEngineState, beatId: string, entryIds: string[]): NarrativePlotDenouementEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotDenouementEntry => e !== undefined);
  const cumulativeSettling = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.settling, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const beat: PlotDenouementBeat = { beatId, entryIds, cumulativeSettling, breadth };
  return recompute({ ...state, beats: new Map(state.beats).set(beatId, beat), totalBeats: state.beats.size + 1 });
}
export function getPlotDenouementEntriesByType(state: NarrativePlotDenouementEngineState, type: PlotDenouementType): PlotDenouementEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotDenouementReport(state: NarrativePlotDenouementEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot denouement entries');
  if (state.averageSettling < 0.5) recommendations.push('Low settling — strengthen');
  if (state.denouementMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBeats: state.totalBeats, averageSettling: Math.round(state.averageSettling * 100) / 100, denouementComplexity: Math.round(state.denouementComplexity * 100) / 100, denouementMastery: Math.round(state.denouementMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotDenouementEngineState): NarrativePlotDenouementEngineState {
  const entries = Array.from(state.entries.values());
  const averageSettling = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.settling, 0) / entries.length;
  const beats = Array.from(state.beats.values());
  const denouementComplexity = beats.length === 0 ? 0.5 : beats.reduce((s, b) => s + b.breadth, 0) / beats.length;
  return { ...state, averageSettling, denouementComplexity, denouementMastery: averageSettling * 0.5 + denouementComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotDenouementEngineState(): NarrativePlotDenouementEngineState { return createNarrativePlotDenouementEngineState(); }