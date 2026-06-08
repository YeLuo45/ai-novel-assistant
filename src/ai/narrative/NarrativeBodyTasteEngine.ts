/**
 * V2036 NarrativeBodyTasteEngine — Direction V Iter 6/30 (Round 5)
 */
export type BodyTasteType = 'sweet' | 'sour' | 'bitter' | 'salty' | 'umami' | 'transcendent' | 'infinite';
export type BodyTasteIntensity = 'subtle' | 'mild' | 'bold' | 'overpowering' | 'transcendent' | 'infinite';
export interface BodyTasteEntry { entryId: string; type: BodyTasteType; intensity: BodyTasteIntensity; description: string; resonance: number; chapter: number; }
export interface BodyTasteFlavor { flavorId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodyTasteEngineState { entries: Map<string, BodyTasteEntry>; flavors: Map<string, BodyTasteFlavor>; totalEntries: number; totalFlavors: number; averageResonance: number; tasteComplexity: number; tasteMastery: number; }
export function createNarrativeBodyTasteEngineState(): NarrativeBodyTasteEngineState { return { entries: new Map(), flavors: new Map(), totalEntries: 0, totalFlavors: 0, averageResonance: 0.5, tasteComplexity: 0.5, tasteMastery: 0.5 }; }
export function addBodyTasteEntry(state: NarrativeBodyTasteEngineState, entryId: string, type: BodyTasteType, intensity: BodyTasteIntensity, description: string, resonance: number, chapter: number): NarrativeBodyTasteEngineState {
  const entry: BodyTasteEntry = { entryId, type, intensity, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodyTasteFlavor(state: NarrativeBodyTasteEngineState, flavorId: string, entryIds: string[]): NarrativeBodyTasteEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodyTasteEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const flavor: BodyTasteFlavor = { flavorId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, flavors: new Map(state.flavors).set(flavorId, flavor), totalFlavors: state.flavors.size + 1 });
}
export function getBodyTasteEntriesByType(state: NarrativeBodyTasteEngineState, type: BodyTasteType): BodyTasteEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodyTasteReport(state: NarrativeBodyTasteEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body taste entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.tasteMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFlavors: state.totalFlavors, averageResonance: Math.round(state.averageResonance * 100) / 100, tasteComplexity: Math.round(state.tasteComplexity * 100) / 100, tasteMastery: Math.round(state.tasteMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodyTasteEngineState): NarrativeBodyTasteEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const flavors = Array.from(state.flavors.values());
  const tasteComplexity = flavors.length === 0 ? 0.5 : flavors.reduce((s, f) => s + f.breadth, 0) / flavors.length;
  return { ...state, averageResonance, tasteComplexity, tasteMastery: averageResonance * 0.5 + tasteComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodyTasteEngineState(): NarrativeBodyTasteEngineState { return createNarrativeBodyTasteEngineState(); }