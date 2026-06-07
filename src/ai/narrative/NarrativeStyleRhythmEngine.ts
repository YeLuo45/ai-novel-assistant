/**
 * V1592 NarrativeStyleRhythmEngine — Direction N Iter 24/30 (Round 5)
 */
export type StyleRhythmType = 'staccato' | 'legato' | 'syncopated' | 'waltz' | 'free' | 'transcendent' | 'infinite';
export type StyleRhythmConsistency = 'steady' | 'flowing' | 'broken' | 'transcendent' | 'infinite';
export interface StyleRhythmEntry { entryId: string; type: StyleRhythmType; consistency: StyleRhythmConsistency; description: string; musicality: number; chapter: number; }
export interface StyleRhythmMeasure { measureId: string; entryIds: string[]; cumulativeMusicality: number; breadth: number; }
export interface NarrativeStyleRhythmEngineState { entries: Map<string, StyleRhythmEntry>; measures: Map<string, StyleRhythmMeasure>; totalEntries: number; totalMeasures: number; averageMusicality: number; rhythmComplexity: number; rhythmMastery: number; }
export function createNarrativeStyleRhythmEngineState(): NarrativeStyleRhythmEngineState { return { entries: new Map(), measures: new Map(), totalEntries: 0, totalMeasures: 0, averageMusicality: 0.5, rhythmComplexity: 0.5, rhythmMastery: 0.5 }; }
export function addStyleRhythmEntry(state: NarrativeStyleRhythmEngineState, entryId: string, type: StyleRhythmType, consistency: StyleRhythmConsistency, description: string, musicality: number, chapter: number): NarrativeStyleRhythmEngineState {
  const entry: StyleRhythmEntry = { entryId, type, consistency, description, musicality, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleRhythmMeasure(state: NarrativeStyleRhythmEngineState, measureId: string, entryIds: string[]): NarrativeStyleRhythmEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleRhythmEntry => e !== undefined);
  const cumulativeMusicality = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.musicality, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const measure: StyleRhythmMeasure = { measureId, entryIds, cumulativeMusicality, breadth };
  return recompute({ ...state, measures: new Map(state.measures).set(measureId, measure), totalMeasures: state.measures.size + 1 });
}
export function getStyleRhythmEntriesByType(state: NarrativeStyleRhythmEngineState, type: StyleRhythmType): StyleRhythmEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleRhythmReport(state: NarrativeStyleRhythmEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style rhythm entries');
  if (state.averageMusicality < 0.5) recommendations.push('Low musicality — strengthen');
  if (state.rhythmMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMeasures: state.totalMeasures, averageMusicality: Math.round(state.averageMusicality * 100) / 100, rhythmComplexity: Math.round(state.rhythmComplexity * 100) / 100, rhythmMastery: Math.round(state.rhythmMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleRhythmEngineState): NarrativeStyleRhythmEngineState {
  const entries = Array.from(state.entries.values());
  const averageMusicality = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.musicality, 0) / entries.length;
  const measures = Array.from(state.measures.values());
  const rhythmComplexity = measures.length === 0 ? 0.5 : measures.reduce((s, m) => s + m.breadth, 0) / measures.length;
  return { ...state, averageMusicality, rhythmComplexity, rhythmMastery: averageMusicality * 0.5 + rhythmComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleRhythmEngineState(): NarrativeStyleRhythmEngineState { return createNarrativeStyleRhythmEngineState(); }