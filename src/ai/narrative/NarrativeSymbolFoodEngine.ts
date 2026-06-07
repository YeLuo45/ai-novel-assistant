/**
 * V1822 NarrativeSymbolFoodEngine — Direction R Iter 19/30 (Round 5)
 */
export type SymbolFoodType = 'bread' | 'fruit' | 'meat' | 'feast' | 'poison' | 'honey' | 'transcendent' | 'infinite';
export type SymbolFoodAssociation = 'sustenance' | 'temptation' | 'community' | 'transgression' | 'transcendent' | 'infinite';
export interface SymbolFoodEntry { entryId: string; type: SymbolFoodType; association: SymbolFoodAssociation; description: string; resonance: number; chapter: number; }
export interface SymbolFoodTable { tableId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolFoodEngineState { entries: Map<string, SymbolFoodEntry>; tables: Map<string, SymbolFoodTable>; totalEntries: number; totalTables: number; averageResonance: number; foodComplexity: number; foodMastery: number; }
export function createNarrativeSymbolFoodEngineState(): NarrativeSymbolFoodEngineState { return { entries: new Map(), tables: new Map(), totalEntries: 0, totalTables: 0, averageResonance: 0.5, foodComplexity: 0.5, foodMastery: 0.5 }; }
export function addSymbolFoodEntry(state: NarrativeSymbolFoodEngineState, entryId: string, type: SymbolFoodType, association: SymbolFoodAssociation, description: string, resonance: number, chapter: number): NarrativeSymbolFoodEngineState {
  const entry: SymbolFoodEntry = { entryId, type, association, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolFoodTable(state: NarrativeSymbolFoodEngineState, tableId: string, entryIds: string[]): NarrativeSymbolFoodEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolFoodEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const table: SymbolFoodTable = { tableId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, tables: new Map(state.tables).set(tableId, table), totalTables: state.tables.size + 1 });
}
export function getSymbolFoodEntriesByType(state: NarrativeSymbolFoodEngineState, type: SymbolFoodType): SymbolFoodEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolFoodReport(state: NarrativeSymbolFoodEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol food entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.foodMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTables: state.totalTables, averageResonance: Math.round(state.averageResonance * 100) / 100, foodComplexity: Math.round(state.foodComplexity * 100) / 100, foodMastery: Math.round(state.foodMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolFoodEngineState): NarrativeSymbolFoodEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const tables = Array.from(state.tables.values());
  const foodComplexity = tables.length === 0 ? 0.5 : tables.reduce((s, t) => s + t.breadth, 0) / tables.length;
  return { ...state, averageResonance, foodComplexity, foodMastery: averageResonance * 0.5 + foodComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolFoodEngineState(): NarrativeSymbolFoodEngineState { return createNarrativeSymbolFoodEngineState(); }