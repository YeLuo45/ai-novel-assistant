/**
 * V1842 NarrativeSymbolThresholdEngine — Direction R Iter 29/30 (Round 5)
 */
export type SymbolThresholdType = 'door' | 'gate' | 'bridge' | 'cave_entrance' | 'river_crossing' | 'boundary' | 'transcendent' | 'infinite';
export type SymbolThresholdStage = 'before' | 'crossing' | 'after' | 'return' | 'transcendent' | 'infinite';
export interface SymbolThresholdEntry { entryId: string; type: SymbolThresholdType; stage: SymbolThresholdStage; description: string; resonance: number; chapter: number; }
export interface SymbolThresholdGate { gateId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolThresholdEngineState { entries: Map<string, SymbolThresholdEntry>; gates: Map<string, SymbolThresholdGate>; totalEntries: number; totalGates: number; averageResonance: number; thresholdComplexity: number; thresholdMastery: number; }
export function createNarrativeSymbolThresholdEngineState(): NarrativeSymbolThresholdEngineState { return { entries: new Map(), gates: new Map(), totalEntries: 0, totalGates: 0, averageResonance: 0.5, thresholdComplexity: 0.5, thresholdMastery: 0.5 }; }
export function addSymbolThresholdEntry(state: NarrativeSymbolThresholdEngineState, entryId: string, type: SymbolThresholdType, stage: SymbolThresholdStage, description: string, resonance: number, chapter: number): NarrativeSymbolThresholdEngineState {
  const entry: SymbolThresholdEntry = { entryId, type, stage, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolThresholdGate(state: NarrativeSymbolThresholdEngineState, gateId: string, entryIds: string[]): NarrativeSymbolThresholdEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolThresholdEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const gate: SymbolThresholdGate = { gateId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, gates: new Map(state.gates).set(gateId, gate), totalGates: state.gates.size + 1 });
}
export function getSymbolThresholdEntriesByType(state: NarrativeSymbolThresholdEngineState, type: SymbolThresholdType): SymbolThresholdEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolThresholdReport(state: NarrativeSymbolThresholdEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol threshold entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.thresholdMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalGates: state.totalGates, averageResonance: Math.round(state.averageResonance * 100) / 100, thresholdComplexity: Math.round(state.thresholdComplexity * 100) / 100, thresholdMastery: Math.round(state.thresholdMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolThresholdEngineState): NarrativeSymbolThresholdEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const gates = Array.from(state.gates.values());
  const thresholdComplexity = gates.length === 0 ? 0.5 : gates.reduce((s, g) => s + g.breadth, 0) / gates.length;
  return { ...state, averageResonance, thresholdComplexity, thresholdMastery: averageResonance * 0.5 + thresholdComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolThresholdEngineState(): NarrativeSymbolThresholdEngineState { return createNarrativeSymbolThresholdEngineState(); }