/**
 * V1598 NarrativeStyleLightEngine — Direction N Iter 27/30 (Round 5)
 */
export type StyleLightType = 'bright' | 'dim' | 'shadow' | 'natural' | 'artificial' | 'transcendent' | 'infinite';
export type StyleLightQuality = 'hard' | 'soft' | 'diffused' | 'transcendent' | 'infinite';
export interface StyleLightEntry { entryId: string; type: StyleLightType; quality: StyleLightQuality; description: string; illumination: number; chapter: number; }
export interface StyleLightScene { sceneId: string; entryIds: string[]; cumulativeIllumination: number; breadth: number; }
export interface NarrativeStyleLightEngineState { entries: Map<string, StyleLightEntry>; scenes: Map<string, StyleLightScene>; totalEntries: number; totalScenes: number; averageIllumination: number; lightComplexity: number; lightMastery: number; }
export function createNarrativeStyleLightEngineState(): NarrativeStyleLightEngineState { return { entries: new Map(), scenes: new Map(), totalEntries: 0, totalScenes: 0, averageIllumination: 0.5, lightComplexity: 0.5, lightMastery: 0.5 }; }
export function addStyleLightEntry(state: NarrativeStyleLightEngineState, entryId: string, type: StyleLightType, quality: StyleLightQuality, description: string, illumination: number, chapter: number): NarrativeStyleLightEngineState {
  const entry: StyleLightEntry = { entryId, type, quality, description, illumination, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleLightScene(state: NarrativeStyleLightEngineState, sceneId: string, entryIds: string[]): NarrativeStyleLightEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleLightEntry => e !== undefined);
  const cumulativeIllumination = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.illumination, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const scene: StyleLightScene = { sceneId, entryIds, cumulativeIllumination, breadth };
  return recompute({ ...state, scenes: new Map(state.scenes).set(sceneId, scene), totalScenes: state.scenes.size + 1 });
}
export function getStyleLightEntriesByType(state: NarrativeStyleLightEngineState, type: StyleLightType): StyleLightEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleLightReport(state: NarrativeStyleLightEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style light entries');
  if (state.averageIllumination < 0.5) recommendations.push('Low illumination — strengthen');
  if (state.lightMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalScenes: state.totalScenes, averageIllumination: Math.round(state.averageIllumination * 100) / 100, lightComplexity: Math.round(state.lightComplexity * 100) / 100, lightMastery: Math.round(state.lightMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleLightEngineState): NarrativeStyleLightEngineState {
  const entries = Array.from(state.entries.values());
  const averageIllumination = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.illumination, 0) / entries.length;
  const scenes = Array.from(state.scenes.values());
  const lightComplexity = scenes.length === 0 ? 0.5 : scenes.reduce((s, sc) => s + sc.breadth, 0) / scenes.length;
  return { ...state, averageIllumination, lightComplexity, lightMastery: averageIllumination * 0.5 + lightComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleLightEngineState(): NarrativeStyleLightEngineState { return createNarrativeStyleLightEngineState(); }