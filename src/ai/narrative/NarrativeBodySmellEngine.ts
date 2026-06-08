/**
 * V2038 NarrativeBodySmellEngine — Direction V Iter 7/30 (Round 5)
 */
export type BodySmellType = 'floral' | 'earthy' | 'spicy' | 'rotten' | 'chemical' | 'transcendent' | 'infinite';
export type BodySmellIntensity = 'faint' | 'mild' | 'strong' | 'overpowering' | 'transcendent' | 'infinite';
export interface BodySmellEntry { entryId: string; type: BodySmellType; intensity: BodySmellIntensity; description: string; resonance: number; chapter: number; }
export interface BodySmellBouquet { bouquetId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodySmellEngineState { entries: Map<string, BodySmellEntry>; bouquets: Map<string, BodySmellBouquet>; totalEntries: number; totalBouquets: number; averageResonance: number; smellComplexity: number; smellMastery: number; }
export function createNarrativeBodySmellEngineState(): NarrativeBodySmellEngineState { return { entries: new Map(), bouquets: new Map(), totalEntries: 0, totalBouquets: 0, averageResonance: 0.5, smellComplexity: 0.5, smellMastery: 0.5 }; }
export function addBodySmellEntry(state: NarrativeBodySmellEngineState, entryId: string, type: BodySmellType, intensity: BodySmellIntensity, description: string, resonance: number, chapter: number): NarrativeBodySmellEngineState {
  const entry: BodySmellEntry = { entryId, type, intensity, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodySmellBouquet(state: NarrativeBodySmellEngineState, bouquetId: string, entryIds: string[]): NarrativeBodySmellEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodySmellEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const bouquet: BodySmellBouquet = { bouquetId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, bouquets: new Map(state.bouquets).set(bouquetId, bouquet), totalBouquets: state.bouquets.size + 1 });
}
export function getBodySmellEntriesByType(state: NarrativeBodySmellEngineState, type: BodySmellType): BodySmellEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodySmellReport(state: NarrativeBodySmellEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body smell entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.smellMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBouquets: state.totalBouquets, averageResonance: Math.round(state.averageResonance * 100) / 100, smellComplexity: Math.round(state.smellComplexity * 100) / 100, smellMastery: Math.round(state.smellMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodySmellEngineState): NarrativeBodySmellEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const bouquets = Array.from(state.bouquets.values());
  const smellComplexity = bouquets.length === 0 ? 0.5 : bouquets.reduce((s, b) => s + b.breadth, 0) / bouquets.length;
  return { ...state, averageResonance, smellComplexity, smellMastery: averageResonance * 0.5 + smellComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodySmellEngineState(): NarrativeBodySmellEngineState { return createNarrativeBodySmellEngineState(); }