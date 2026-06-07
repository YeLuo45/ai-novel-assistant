/**
 * V1960 NarrativeCultureDevianceEngine — Direction T Iter 28/30 (Round 5)
 */
export type CultureDevianceType = 'criminal' | 'subcultural' | 'psychiatric' | 'moral' | 'creative' | 'transcendent' | 'infinite';
export type CultureDevianceResponse = 'punishment' | 'treatment' | 'rehabilitation' | 'celebration' | 'transcendent' | 'infinite';
export interface CultureDevianceEntry { entryId: string; type: CultureDevianceType; response: CultureDevianceResponse; description: string; resonance: number; chapter: number; }
export interface CultureDevianceLabel { labelId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeCultureDevianceEngineState { entries: Map<string, CultureDevianceEntry>; labels: Map<string, CultureDevianceLabel>; totalEntries: number; totalLabels: number; averageResonance: number; devianceComplexity: number; devianceMastery: number; }
export function createNarrativeCultureDevianceEngineState(): NarrativeCultureDevianceEngineState { return { entries: new Map(), labels: new Map(), totalEntries: 0, totalLabels: 0, averageResonance: 0.5, devianceComplexity: 0.5, devianceMastery: 0.5 }; }
export function addCultureDevianceEntry(state: NarrativeCultureDevianceEngineState, entryId: string, type: CultureDevianceType, response: CultureDevianceResponse, description: string, resonance: number, chapter: number): NarrativeCultureDevianceEngineState {
  const entry: CultureDevianceEntry = { entryId, type, response, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addCultureDevianceLabel(state: NarrativeCultureDevianceEngineState, labelId: string, entryIds: string[]): NarrativeCultureDevianceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CultureDevianceEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const label: CultureDevianceLabel = { labelId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, labels: new Map(state.labels).set(labelId, label), totalLabels: state.labels.size + 1 });
}
export function getCultureDevianceEntriesByType(state: NarrativeCultureDevianceEngineState, type: CultureDevianceType): CultureDevianceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getCultureDevianceReport(state: NarrativeCultureDevianceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add culture deviance entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.devianceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLabels: state.totalLabels, averageResonance: Math.round(state.averageResonance * 100) / 100, devianceComplexity: Math.round(state.devianceComplexity * 100) / 100, devianceMastery: Math.round(state.devianceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeCultureDevianceEngineState): NarrativeCultureDevianceEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const labels = Array.from(state.labels.values());
  const devianceComplexity = labels.length === 0 ? 0.5 : labels.reduce((s, l) => s + l.breadth, 0) / labels.length;
  return { ...state, averageResonance, devianceComplexity, devianceMastery: averageResonance * 0.5 + devianceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeCultureDevianceEngineState(): NarrativeCultureDevianceEngineState { return createNarrativeCultureDevianceEngineState(); }