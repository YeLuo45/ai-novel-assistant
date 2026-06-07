/**
 * V1622 NarrativeSettingUndergroundEngine — Direction O Iter 9/30 (Round 5)
 */
export type SettingUndergroundType = 'cave' | 'tunnel' | 'mine' | 'catacomb' | 'dungeon' | 'subterranean' | 'transcendent' | 'infinite';
export type SettingUndergroundTone = 'claustrophobic' | 'mysterious' | 'sacred' | 'sinister' | 'transcendent' | 'infinite';
export interface SettingUndergroundEntry { entryId: string; type: SettingUndergroundType; tone: SettingUndergroundTone; description: string; depth: number; chapter: number; }
export interface SettingUndergroundLayer { layerId: string; entryIds: string[]; cumulativeDepth: number; breadth: number; }
export interface NarrativeSettingUndergroundEngineState { entries: Map<string, SettingUndergroundEntry>; layers: Map<string, SettingUndergroundLayer>; totalEntries: number; totalLayers: number; averageDepth: number; undergroundComplexity: number; undergroundMastery: number; }
export function createNarrativeSettingUndergroundEngineState(): NarrativeSettingUndergroundEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageDepth: 0.5, undergroundComplexity: 0.5, undergroundMastery: 0.5 }; }
export function addSettingUndergroundEntry(state: NarrativeSettingUndergroundEngineState, entryId: string, type: SettingUndergroundType, tone: SettingUndergroundTone, description: string, depth: number, chapter: number): NarrativeSettingUndergroundEngineState {
  const entry: SettingUndergroundEntry = { entryId, type, tone, description, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingUndergroundLayer(state: NarrativeSettingUndergroundEngineState, layerId: string, entryIds: string[]): NarrativeSettingUndergroundEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingUndergroundEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const layer: SettingUndergroundLayer = { layerId, entryIds, cumulativeDepth, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getSettingUndergroundEntriesByType(state: NarrativeSettingUndergroundEngineState, type: SettingUndergroundType): SettingUndergroundEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingUndergroundReport(state: NarrativeSettingUndergroundEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting underground entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.undergroundMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageDepth: Math.round(state.averageDepth * 100) / 100, undergroundComplexity: Math.round(state.undergroundComplexity * 100) / 100, undergroundMastery: Math.round(state.undergroundMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingUndergroundEngineState): NarrativeSettingUndergroundEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const undergroundComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageDepth, undergroundComplexity, undergroundMastery: averageDepth * 0.5 + undergroundComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingUndergroundEngineState(): NarrativeSettingUndergroundEngineState { return createNarrativeSettingUndergroundEngineState(); }