/**
 * V1798 NarrativeSymbolDirectionEngine — Direction R Iter 7/30 (Round 5)
 */
export type SymbolDirectionType = 'north' | 'south' | 'east' | 'west' | 'up' | 'down' | 'in' | 'out' | 'transcendent' | 'infinite';
export type SymbolDirectionMeaning = 'enlightenment' | 'depth' | 'aspiration' | 'mortality' | 'transcendent' | 'infinite';
export interface SymbolDirectionEntry { entryId: string; type: SymbolDirectionType; meaning: SymbolDirectionMeaning; description: string; resonance: number; chapter: number; }
export interface SymbolDirectionMap { mapId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolDirectionEngineState { entries: Map<string, SymbolDirectionEntry>; maps: Map<string, SymbolDirectionMap>; totalEntries: number; totalMaps: number; averageResonance: number; directionComplexity: number; directionMastery: number; }
export function createNarrativeSymbolDirectionEngineState(): NarrativeSymbolDirectionEngineState { return { entries: new Map(), maps: new Map(), totalEntries: 0, totalMaps: 0, averageResonance: 0.5, directionComplexity: 0.5, directionMastery: 0.5 }; }
export function addSymbolDirectionEntry(state: NarrativeSymbolDirectionEngineState, entryId: string, type: SymbolDirectionType, meaning: SymbolDirectionMeaning, description: string, resonance: number, chapter: number): NarrativeSymbolDirectionEngineState {
  const entry: SymbolDirectionEntry = { entryId, type, meaning, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolDirectionMap(state: NarrativeSymbolDirectionEngineState, mapId: string, entryIds: string[]): NarrativeSymbolDirectionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolDirectionEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 10);
  const map: SymbolDirectionMap = { mapId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, maps: new Map(state.maps).set(mapId, map), totalMaps: state.maps.size + 1 });
}
export function getSymbolDirectionEntriesByType(state: NarrativeSymbolDirectionEngineState, type: SymbolDirectionType): SymbolDirectionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolDirectionReport(state: NarrativeSymbolDirectionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol direction entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.directionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMaps: state.totalMaps, averageResonance: Math.round(state.averageResonance * 100) / 100, directionComplexity: Math.round(state.directionComplexity * 100) / 100, directionMastery: Math.round(state.directionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolDirectionEngineState): NarrativeSymbolDirectionEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const maps = Array.from(state.maps.values());
  const directionComplexity = maps.length === 0 ? 0.5 : maps.reduce((s, m) => s + m.breadth, 0) / maps.length;
  return { ...state, averageResonance, directionComplexity, directionMastery: averageResonance * 0.5 + directionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolDirectionEngineState(): NarrativeSymbolDirectionEngineState { return createNarrativeSymbolDirectionEngineState(); }