/**
 * V2048 NarrativeBodyThermoceptionEngine — Direction V Iter 12/30 (Round 5)
 */
export type BodyThermoceptionType = 'hot' | 'cold' | 'warm' | 'cool' | 'ambient' | 'transcendent' | 'infinite';
export type BodyThermoceptionTolerance = 'low' | 'moderate' | 'high' | 'extreme' | 'transcendent' | 'infinite';
export interface BodyThermoceptionEntry { entryId: string; type: BodyThermoceptionType; tolerance: BodyThermoceptionTolerance; description: string; resonance: number; chapter: number; }
export interface BodyThermoceptionClimate { climateId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodyThermoceptionEngineState { entries: Map<string, BodyThermoceptionEntry>; climates: Map<string, BodyThermoceptionClimate>; totalEntries: number; totalClimates: number; averageResonance: number; thermoceptionComplexity: number; thermoceptionMastery: number; }
export function createNarrativeBodyThermoceptionEngineState(): NarrativeBodyThermoceptionEngineState { return { entries: new Map(), climates: new Map(), totalEntries: 0, totalClimates: 0, averageResonance: 0.5, thermoceptionComplexity: 0.5, thermoceptionMastery: 0.5 }; }
export function addBodyThermoceptionEntry(state: NarrativeBodyThermoceptionEngineState, entryId: string, type: BodyThermoceptionType, tolerance: BodyThermoceptionTolerance, description: string, resonance: number, chapter: number): NarrativeBodyThermoceptionEngineState {
  const entry: BodyThermoceptionEntry = { entryId, type, tolerance, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodyThermoceptionClimate(state: NarrativeBodyThermoceptionEngineState, climateId: string, entryIds: string[]): NarrativeBodyThermoceptionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodyThermoceptionEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const climate: BodyThermoceptionClimate = { climateId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, climates: new Map(state.climates).set(climateId, climate), totalClimates: state.climates.size + 1 });
}
export function getBodyThermoceptionEntriesByType(state: NarrativeBodyThermoceptionEngineState, type: BodyThermoceptionType): BodyThermoceptionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodyThermoceptionReport(state: NarrativeBodyThermoceptionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body thermoception entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.thermoceptionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClimates: state.totalClimates, averageResonance: Math.round(state.averageResonance * 100) / 100, thermoceptionComplexity: Math.round(state.thermoceptionComplexity * 100) / 100, thermoceptionMastery: Math.round(state.thermoceptionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodyThermoceptionEngineState): NarrativeBodyThermoceptionEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const climates = Array.from(state.climates.values());
  const thermoceptionComplexity = climates.length === 0 ? 0.5 : climates.reduce((s, c) => s + c.breadth, 0) / climates.length;
  return { ...state, averageResonance, thermoceptionComplexity, thermoceptionMastery: averageResonance * 0.5 + thermoceptionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodyThermoceptionEngineState(): NarrativeBodyThermoceptionEngineState { return createNarrativeBodyThermoceptionEngineState(); }