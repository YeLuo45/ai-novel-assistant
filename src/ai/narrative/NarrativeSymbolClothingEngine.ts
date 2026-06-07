/**
 * V1824 NarrativeSymbolClothingEngine — Direction R Iter 20/30 (Round 5)
 */
export type SymbolClothingType = 'armor' | 'robe' | 'crown' | 'mask' | 'veil' | 'nakedness' | 'transcendent' | 'infinite';
export type SymbolClothingMeaning = 'protection' | 'status' | 'concealment' | 'transformation' | 'transcendent' | 'infinite';
export interface SymbolClothingEntry { entryId: string; type: SymbolClothingType; meaning: SymbolClothingMeaning; description: string; resonance: number; chapter: number; }
export interface SymbolClothingWardrobe { wardrobeId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolClothingEngineState { entries: Map<string, SymbolClothingEntry>; wardrobes: Map<string, SymbolClothingWardrobe>; totalEntries: number; totalWardrobes: number; averageResonance: number; clothingComplexity: number; clothingMastery: number; }
export function createNarrativeSymbolClothingEngineState(): NarrativeSymbolClothingEngineState { return { entries: new Map(), wardrobes: new Map(), totalEntries: 0, totalWardrobes: 0, averageResonance: 0.5, clothingComplexity: 0.5, clothingMastery: 0.5 }; }
export function addSymbolClothingEntry(state: NarrativeSymbolClothingEngineState, entryId: string, type: SymbolClothingType, meaning: SymbolClothingMeaning, description: string, resonance: number, chapter: number): NarrativeSymbolClothingEngineState {
  const entry: SymbolClothingEntry = { entryId, type, meaning, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolClothingWardrobe(state: NarrativeSymbolClothingEngineState, wardrobeId: string, entryIds: string[]): NarrativeSymbolClothingEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolClothingEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const wardrobe: SymbolClothingWardrobe = { wardrobeId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, wardrobes: new Map(state.wardrobes).set(wardrobeId, wardrobe), totalWardrobes: state.wardrobes.size + 1 });
}
export function getSymbolClothingEntriesByType(state: NarrativeSymbolClothingEngineState, type: SymbolClothingType): SymbolClothingEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolClothingReport(state: NarrativeSymbolClothingEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol clothing entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.clothingMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWardrobes: state.totalWardrobes, averageResonance: Math.round(state.averageResonance * 100) / 100, clothingComplexity: Math.round(state.clothingComplexity * 100) / 100, clothingMastery: Math.round(state.clothingMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolClothingEngineState): NarrativeSymbolClothingEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const wardrobes = Array.from(state.wardrobes.values());
  const clothingComplexity = wardrobes.length === 0 ? 0.5 : wardrobes.reduce((s, w) => s + w.breadth, 0) / wardrobes.length;
  return { ...state, averageResonance, clothingComplexity, clothingMastery: averageResonance * 0.5 + clothingComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolClothingEngineState(): NarrativeSymbolClothingEngineState { return createNarrativeSymbolClothingEngineState(); }