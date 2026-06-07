/**
 * V1806 NarrativeSymbolEarthEngine — Direction R Iter 11/30 (Round 5)
 */
export type SymbolEarthType = 'mountain' | 'forest' | 'desert' | 'cave' | 'field' | 'swamp' | 'transcendent' | 'infinite';
export type SymbolEarthForce = 'grounding' | 'obstructing' | 'nurturing' | 'revealing' | 'transcendent' | 'infinite';
export interface SymbolEarthEntry { entryId: string; type: SymbolEarthType; force: SymbolEarthForce; description: string; resonance: number; chapter: number; }
export interface SymbolEarthLayer { layerId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolEarthEngineState { entries: Map<string, SymbolEarthEntry>; layers: Map<string, SymbolEarthLayer>; totalEntries: number; totalLayers: number; averageResonance: number; earthComplexity: number; earthMastery: number; }
export function createNarrativeSymbolEarthEngineState(): NarrativeSymbolEarthEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageResonance: 0.5, earthComplexity: 0.5, earthMastery: 0.5 }; }
export function addSymbolEarthEntry(state: NarrativeSymbolEarthEngineState, entryId: string, type: SymbolEarthType, force: SymbolEarthForce, description: string, resonance: number, chapter: number): NarrativeSymbolEarthEngineState {
  const entry: SymbolEarthEntry = { entryId, type, force, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolEarthLayer(state: NarrativeSymbolEarthEngineState, layerId: string, entryIds: string[]): NarrativeSymbolEarthEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolEarthEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const layer: SymbolEarthLayer = { layerId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getSymbolEarthEntriesByType(state: NarrativeSymbolEarthEngineState, type: SymbolEarthType): SymbolEarthEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolEarthReport(state: NarrativeSymbolEarthEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol earth entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.earthMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageResonance: Math.round(state.averageResonance * 100) / 100, earthComplexity: Math.round(state.earthComplexity * 100) / 100, earthMastery: Math.round(state.earthMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolEarthEngineState): NarrativeSymbolEarthEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const earthComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageResonance, earthComplexity, earthMastery: averageResonance * 0.5 + earthComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolEarthEngineState(): NarrativeSymbolEarthEngineState { return createNarrativeSymbolEarthEngineState(); }