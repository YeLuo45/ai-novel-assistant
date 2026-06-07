/**
 * V1954 NarrativeCultureResistanceEngine — Direction T Iter 25/30 (Round 5)
 */
export type CultureResistanceType = 'political' | 'cultural' | 'everyday' | 'aesthetic' | 'religious' | 'transcendent' | 'infinite';
export type CultureResistanceForm = 'protest' | 'subversion' | 'preservation' | 're_imagination' | 'transcendent' | 'infinite';
export interface CultureResistanceEntry { entryId: string; type: CultureResistanceType; form: CultureResistanceForm; description: string; resonance: number; chapter: number; }
export interface CultureResistanceMovement { movementId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeCultureResistanceEngineState { entries: Map<string, CultureResistanceEntry>; movements: Map<string, CultureResistanceMovement>; totalEntries: number; totalMovements: number; averageResonance: number; resistanceComplexity: number; resistanceMastery: number; }
export function createNarrativeCultureResistanceEngineState(): NarrativeCultureResistanceEngineState { return { entries: new Map(), movements: new Map(), totalEntries: 0, totalMovements: 0, averageResonance: 0.5, resistanceComplexity: 0.5, resistanceMastery: 0.5 }; }
export function addCultureResistanceEntry(state: NarrativeCultureResistanceEngineState, entryId: string, type: CultureResistanceType, form: CultureResistanceForm, description: string, resonance: number, chapter: number): NarrativeCultureResistanceEngineState {
  const entry: CultureResistanceEntry = { entryId, type, form, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addCultureResistanceMovement(state: NarrativeCultureResistanceEngineState, movementId: string, entryIds: string[]): NarrativeCultureResistanceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CultureResistanceEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const movement: CultureResistanceMovement = { movementId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, movements: new Map(state.movements).set(movementId, movement), totalMovements: state.movements.size + 1 });
}
export function getCultureResistanceEntriesByType(state: NarrativeCultureResistanceEngineState, type: CultureResistanceType): CultureResistanceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getCultureResistanceReport(state: NarrativeCultureResistanceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add culture resistance entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.resistanceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMovements: state.totalMovements, averageResonance: Math.round(state.averageResonance * 100) / 100, resistanceComplexity: Math.round(state.resistanceComplexity * 100) / 100, resistanceMastery: Math.round(state.resistanceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeCultureResistanceEngineState): NarrativeCultureResistanceEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const movements = Array.from(state.movements.values());
  const resistanceComplexity = movements.length === 0 ? 0.5 : movements.reduce((s, m) => s + m.breadth, 0) / movements.length;
  return { ...state, averageResonance, resistanceComplexity, resistanceMastery: averageResonance * 0.5 + resistanceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeCultureResistanceEngineState(): NarrativeCultureResistanceEngineState { return createNarrativeCultureResistanceEngineState(); }