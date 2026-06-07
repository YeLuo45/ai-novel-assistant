/**
 * V1812 NarrativeSymbolPlaceEngine — Direction R Iter 14/30 (Round 5)
 */
export type SymbolPlaceType = 'home' | 'threshold' | 'tower' | 'garden' | 'wilderness' | 'temple' | 'transcendent' | 'infinite';
export type SymbolPlaceEnergy = 'safe' | 'transitional' | 'isolating' | 'paradisiacal' | 'transcendent' | 'infinite';
export interface SymbolPlaceEntry { entryId: string; type: SymbolPlaceType; energy: SymbolPlaceEnergy; description: string; resonance: number; chapter: number; }
export interface SymbolPlaceAtlas { atlasId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolPlaceEngineState { entries: Map<string, SymbolPlaceEntry>; atlases: Map<string, SymbolPlaceAtlas>; totalEntries: number; totalAtlases: number; averageResonance: number; placeComplexity: number; placeMastery: number; }
export function createNarrativeSymbolPlaceEngineState(): NarrativeSymbolPlaceEngineState { return { entries: new Map(), atlases: new Map(), totalEntries: 0, totalAtlases: 0, averageResonance: 0.5, placeComplexity: 0.5, placeMastery: 0.5 }; }
export function addSymbolPlaceEntry(state: NarrativeSymbolPlaceEngineState, entryId: string, type: SymbolPlaceType, energy: SymbolPlaceEnergy, description: string, resonance: number, chapter: number): NarrativeSymbolPlaceEngineState {
  const entry: SymbolPlaceEntry = { entryId, type, energy, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolPlaceAtlas(state: NarrativeSymbolPlaceEngineState, atlasId: string, entryIds: string[]): NarrativeSymbolPlaceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolPlaceEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const atlas: SymbolPlaceAtlas = { atlasId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, atlases: new Map(state.atlases).set(atlasId, atlas), totalAtlases: state.atlases.size + 1 });
}
export function getSymbolPlaceEntriesByType(state: NarrativeSymbolPlaceEngineState, type: SymbolPlaceType): SymbolPlaceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolPlaceReport(state: NarrativeSymbolPlaceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol place entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.placeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalAtlases: state.totalAtlases, averageResonance: Math.round(state.averageResonance * 100) / 100, placeComplexity: Math.round(state.placeComplexity * 100) / 100, placeMastery: Math.round(state.placeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolPlaceEngineState): NarrativeSymbolPlaceEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const atlases = Array.from(state.atlases.values());
  const placeComplexity = atlases.length === 0 ? 0.5 : atlases.reduce((s, a) => s + a.breadth, 0) / atlases.length;
  return { ...state, averageResonance, placeComplexity, placeMastery: averageResonance * 0.5 + placeComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolPlaceEngineState(): NarrativeSymbolPlaceEngineState { return createNarrativeSymbolPlaceEngineState(); }