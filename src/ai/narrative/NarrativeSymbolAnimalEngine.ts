/**
 * V1788 NarrativeSymbolAnimalEngine — Direction R Iter 2/30 (Round 5)
 */
export type SymbolAnimalType = 'mammal' | 'bird' | 'reptile' | 'fish' | 'insect' | 'mythical' | 'transcendent' | 'infinite';
export type SymbolAnimalTrait = 'wise' | 'fierce' | 'gentle' | 'cunning' | 'majestic' | 'transcendent' | 'infinite';
export interface SymbolAnimalEntry { entryId: string; type: SymbolAnimalType; trait: SymbolAnimalTrait; description: string; resonance: number; chapter: number; }
export interface SymbolAnimalZoo { zooId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolAnimalEngineState { entries: Map<string, SymbolAnimalEntry>; zoos: Map<string, SymbolAnimalZoo>; totalEntries: number; totalZoos: number; averageResonance: number; animalComplexity: number; animalMastery: number; }
export function createNarrativeSymbolAnimalEngineState(): NarrativeSymbolAnimalEngineState { return { entries: new Map(), zoos: new Map(), totalEntries: 0, totalZoos: 0, averageResonance: 0.5, animalComplexity: 0.5, animalMastery: 0.5 }; }
export function addSymbolAnimalEntry(state: NarrativeSymbolAnimalEngineState, entryId: string, type: SymbolAnimalType, trait: SymbolAnimalTrait, description: string, resonance: number, chapter: number): NarrativeSymbolAnimalEngineState {
  const entry: SymbolAnimalEntry = { entryId, type, trait, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolAnimalZoo(state: NarrativeSymbolAnimalEngineState, zooId: string, entryIds: string[]): NarrativeSymbolAnimalEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolAnimalEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const zoo: SymbolAnimalZoo = { zooId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, zoos: new Map(state.zoos).set(zooId, zoo), totalZoos: state.zoos.size + 1 });
}
export function getSymbolAnimalEntriesByType(state: NarrativeSymbolAnimalEngineState, type: SymbolAnimalType): SymbolAnimalEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolAnimalReport(state: NarrativeSymbolAnimalEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol animal entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.animalMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalZoos: state.totalZoos, averageResonance: Math.round(state.averageResonance * 100) / 100, animalComplexity: Math.round(state.animalComplexity * 100) / 100, animalMastery: Math.round(state.animalMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolAnimalEngineState): NarrativeSymbolAnimalEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const zoos = Array.from(state.zoos.values());
  const animalComplexity = zoos.length === 0 ? 0.5 : zoos.reduce((s, z) => s + z.breadth, 0) / zoos.length;
  return { ...state, averageResonance, animalComplexity, animalMastery: averageResonance * 0.5 + animalComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolAnimalEngineState(): NarrativeSymbolAnimalEngineState { return createNarrativeSymbolAnimalEngineState(); }