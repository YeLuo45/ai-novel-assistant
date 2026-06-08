/**
 * V2030 NarrativeBodySightEngine — Direction V Iter 3/30 (Round 5)
 */
export type BodySightType = 'light' | 'color' | 'depth' | 'motion' | 'form' | 'transcendent' | 'infinite';
export type BodySightQuality = 'sharp' | 'clear' | 'blurred' | 'dim' | 'transcendent' | 'infinite';
export interface BodySightEntry { entryId: string; type: BodySightType; quality: BodySightQuality; description: string; resonance: number; chapter: number; }
export interface BodySightScene { sceneId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodySightEngineState { entries: Map<string, BodySightEntry>; scenes: Map<string, BodySightScene>; totalEntries: number; totalScenes: number; averageResonance: number; sightComplexity: number; sightMastery: number; }
export function createNarrativeBodySightEngineState(): NarrativeBodySightEngineState { return { entries: new Map(), scenes: new Map(), totalEntries: 0, totalScenes: 0, averageResonance: 0.5, sightComplexity: 0.5, sightMastery: 0.5 }; }
export function addBodySightEntry(state: NarrativeBodySightEngineState, entryId: string, type: BodySightType, quality: BodySightQuality, description: string, resonance: number, chapter: number): NarrativeBodySightEngineState {
  const entry: BodySightEntry = { entryId, type, quality, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodySightScene(state: NarrativeBodySightEngineState, sceneId: string, entryIds: string[]): NarrativeBodySightEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodySightEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const scene: BodySightScene = { sceneId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, scenes: new Map(state.scenes).set(sceneId, scene), totalScenes: state.scenes.size + 1 });
}
export function getBodySightEntriesByType(state: NarrativeBodySightEngineState, type: BodySightType): BodySightEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodySightReport(state: NarrativeBodySightEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body sight entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.sightMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalScenes: state.totalScenes, averageResonance: Math.round(state.averageResonance * 100) / 100, sightComplexity: Math.round(state.sightComplexity * 100) / 100, sightMastery: Math.round(state.sightMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodySightEngineState): NarrativeBodySightEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const scenes = Array.from(state.scenes.values());
  const sightComplexity = scenes.length === 0 ? 0.5 : scenes.reduce((s, sc) => s + sc.breadth, 0) / scenes.length;
  return { ...state, averageResonance, sightComplexity, sightMastery: averageResonance * 0.5 + sightComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodySightEngineState(): NarrativeBodySightEngineState { return createNarrativeBodySightEngineState(); }