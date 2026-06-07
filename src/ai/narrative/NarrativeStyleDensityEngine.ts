/**
 * V1590 NarrativeStyleDensityEngine — Direction N Iter 23/30 (Round 5)
 */
export type StyleDensityType = 'sparse' | 'moderate' | 'dense' | 'maximalist' | 'transcendent' | 'infinite';
export type StyleDensityConsistency = 'consistent' | 'variable' | 'breathing' | 'transcendent' | 'infinite';
export interface StyleDensityEntry { entryId: string; type: StyleDensityType; consistency: StyleDensityConsistency; description: string; information: number; chapter: number; }
export interface StyleDensityLayer { layerId: string; entryIds: string[]; cumulativeInformation: number; breadth: number; }
export interface NarrativeStyleDensityEngineState { entries: Map<string, StyleDensityEntry>; layers: Map<string, StyleDensityLayer>; totalEntries: number; totalLayers: number; averageInformation: number; densityComplexity: number; densityMastery: number; }
export function createNarrativeStyleDensityEngineState(): NarrativeStyleDensityEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageInformation: 0.5, densityComplexity: 0.5, densityMastery: 0.5 }; }
export function addStyleDensityEntry(state: NarrativeStyleDensityEngineState, entryId: string, type: StyleDensityType, consistency: StyleDensityConsistency, description: string, information: number, chapter: number): NarrativeStyleDensityEngineState {
  const entry: StyleDensityEntry = { entryId, type, consistency, description, information, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleDensityLayer(state: NarrativeStyleDensityEngineState, layerId: string, entryIds: string[]): NarrativeStyleDensityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleDensityEntry => e !== undefined);
  const cumulativeInformation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.information, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const layer: StyleDensityLayer = { layerId, entryIds, cumulativeInformation, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getStyleDensityEntriesByType(state: NarrativeStyleDensityEngineState, type: StyleDensityType): StyleDensityEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleDensityReport(state: NarrativeStyleDensityEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style density entries');
  if (state.averageInformation < 0.5) recommendations.push('Low information — strengthen');
  if (state.densityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageInformation: Math.round(state.averageInformation * 100) / 100, densityComplexity: Math.round(state.densityComplexity * 100) / 100, densityMastery: Math.round(state.densityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleDensityEngineState): NarrativeStyleDensityEngineState {
  const entries = Array.from(state.entries.values());
  const averageInformation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.information, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const densityComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageInformation, densityComplexity, densityMastery: averageInformation * 0.5 + densityComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleDensityEngineState(): NarrativeStyleDensityEngineState { return createNarrativeStyleDensityEngineState(); }