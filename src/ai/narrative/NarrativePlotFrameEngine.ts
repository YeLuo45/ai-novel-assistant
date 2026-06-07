/**
 * V1540 NarrativePlotFrameEngine — Direction M Iter 28/30 (Round 5)
 */
export type PlotFrameType = 'frame_narrative' | 'narrator' | 'unreliable' | 'omniscient' | 'limited' | 'stream' | 'transcendent' | 'infinite';
export type PlotFrameVoice = 'first' | 'second' | 'third' | 'omniscient' | 'transcendent' | 'infinite';
export interface PlotFrameEntry { entryId: string; type: PlotFrameType; voice: PlotFrameVoice; description: string; immersion: number; chapter: number; }
export interface PlotFrameLayer { layerId: string; entryIds: string[]; cumulativeImmersion: number; breadth: number; }
export interface NarrativePlotFrameEngineState { entries: Map<string, PlotFrameEntry>; layers: Map<string, PlotFrameLayer>; totalEntries: number; totalLayers: number; averageImmersion: number; frameComplexity: number; frameMastery: number; }
export function createNarrativePlotFrameEngineState(): NarrativePlotFrameEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageImmersion: 0.5, frameComplexity: 0.5, frameMastery: 0.5 }; }
export function addPlotFrameEntry(state: NarrativePlotFrameEngineState, entryId: string, type: PlotFrameType, voice: PlotFrameVoice, description: string, immersion: number, chapter: number): NarrativePlotFrameEngineState {
  const entry: PlotFrameEntry = { entryId, type, voice, description, immersion, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotFrameLayer(state: NarrativePlotFrameEngineState, layerId: string, entryIds: string[]): NarrativePlotFrameEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotFrameEntry => e !== undefined);
  const cumulativeImmersion = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.immersion, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: PlotFrameLayer = { layerId, entryIds, cumulativeImmersion, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getPlotFrameEntriesByType(state: NarrativePlotFrameEngineState, type: PlotFrameType): PlotFrameEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotFrameReport(state: NarrativePlotFrameEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot frame entries');
  if (state.averageImmersion < 0.5) recommendations.push('Low immersion — strengthen');
  if (state.frameMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageImmersion: Math.round(state.averageImmersion * 100) / 100, frameComplexity: Math.round(state.frameComplexity * 100) / 100, frameMastery: Math.round(state.frameMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotFrameEngineState): NarrativePlotFrameEngineState {
  const entries = Array.from(state.entries.values());
  const averageImmersion = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.immersion, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const frameComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageImmersion, frameComplexity, frameMastery: averageImmersion * 0.5 + frameComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotFrameEngineState(): NarrativePlotFrameEngineState { return createNarrativePlotFrameEngineState(); }