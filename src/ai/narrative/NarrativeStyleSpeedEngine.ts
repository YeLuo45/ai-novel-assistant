/**
 * V1588 NarrativeStyleSpeedEngine — Direction N Iter 22/30 (Round 5)
 */
export type StyleSpeedType = 'glacial' | 'slow' | 'moderate' | 'fast' | 'breakneck' | 'transcendent' | 'infinite';
export type StyleSpeedVariation = 'steady' | 'variable' | 'accelerating' | 'transcendent' | 'infinite';
export interface StyleSpeedEntry { entryId: string; type: StyleSpeedType; variation: StyleSpeedVariation; description: string; momentum: number; chapter: number; }
export interface StyleSpeedBeat { beatId: string; entryIds: string[]; cumulativeMomentum: number; breadth: number; }
export interface NarrativeStyleSpeedEngineState { entries: Map<string, StyleSpeedEntry>; beats: Map<string, StyleSpeedBeat>; totalEntries: number; totalBeats: number; averageMomentum: number; speedComplexity: number; speedMastery: number; }
export function createNarrativeStyleSpeedEngineState(): NarrativeStyleSpeedEngineState { return { entries: new Map(), beats: new Map(), totalEntries: 0, totalBeats: 0, averageMomentum: 0.5, speedComplexity: 0.5, speedMastery: 0.5 }; }
export function addStyleSpeedEntry(state: NarrativeStyleSpeedEngineState, entryId: string, type: StyleSpeedType, variation: StyleSpeedVariation, description: string, momentum: number, chapter: number): NarrativeStyleSpeedEngineState {
  const entry: StyleSpeedEntry = { entryId, type, variation, description, momentum, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleSpeedBeat(state: NarrativeStyleSpeedEngineState, beatId: string, entryIds: string[]): NarrativeStyleSpeedEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleSpeedEntry => e !== undefined);
  const cumulativeMomentum = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.momentum, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const beat: StyleSpeedBeat = { beatId, entryIds, cumulativeMomentum, breadth };
  return recompute({ ...state, beats: new Map(state.beats).set(beatId, beat), totalBeats: state.beats.size + 1 });
}
export function getStyleSpeedEntriesByType(state: NarrativeStyleSpeedEngineState, type: StyleSpeedType): StyleSpeedEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleSpeedReport(state: NarrativeStyleSpeedEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style speed entries');
  if (state.averageMomentum < 0.5) recommendations.push('Low momentum — strengthen');
  if (state.speedMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBeats: state.totalBeats, averageMomentum: Math.round(state.averageMomentum * 100) / 100, speedComplexity: Math.round(state.speedComplexity * 100) / 100, speedMastery: Math.round(state.speedMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleSpeedEngineState): NarrativeStyleSpeedEngineState {
  const entries = Array.from(state.entries.values());
  const averageMomentum = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.momentum, 0) / entries.length;
  const beats = Array.from(state.beats.values());
  const speedComplexity = beats.length === 0 ? 0.5 : beats.reduce((s, b) => s + b.breadth, 0) / beats.length;
  return { ...state, averageMomentum, speedComplexity, speedMastery: averageMomentum * 0.5 + speedComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleSpeedEngineState(): NarrativeStyleSpeedEngineState { return createNarrativeStyleSpeedEngineState(); }