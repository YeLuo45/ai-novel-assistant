/**
 * V1940 NarrativeCultureColonialismEngine — Direction T Iter 18/30 (Round 5)
 */
export type CultureColonialismType = 'settlement' | 'exploitation' | 'extraction' | 'cultural' | 'internal' | 'transcendent' | 'infinite';
export type CultureColonialismEffect = 'displacement' | 'resistance' | 'hybridization' | 'legacies' | 'transcendent' | 'infinite';
export interface CultureColonialismEntry { entryId: string; type: CultureColonialismType; effect: CultureColonialismEffect; description: string; resonance: number; chapter: number; }
export interface CultureColonialismLegacy { legacyId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeCultureColonialismEngineState { entries: Map<string, CultureColonialismEntry>; legacies: Map<string, CultureColonialismLegacy>; totalEntries: number; totalLegacies: number; averageResonance: number; colonialismComplexity: number; colonialismMastery: number; }
export function createNarrativeCultureColonialismEngineState(): NarrativeCultureColonialismEngineState { return { entries: new Map(), legacies: new Map(), totalEntries: 0, totalLegacies: 0, averageResonance: 0.5, colonialismComplexity: 0.5, colonialismMastery: 0.5 }; }
export function addCultureColonialismEntry(state: NarrativeCultureColonialismEngineState, entryId: string, type: CultureColonialismType, effect: CultureColonialismEffect, description: string, resonance: number, chapter: number): NarrativeCultureColonialismEngineState {
  const entry: CultureColonialismEntry = { entryId, type, effect, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addCultureColonialismLegacy(state: NarrativeCultureColonialismEngineState, legacyId: string, entryIds: string[]): NarrativeCultureColonialismEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CultureColonialismEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const legacy: CultureColonialismLegacy = { legacyId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, legacies: new Map(state.legacies).set(legacyId, legacy), totalLegacies: state.legacies.size + 1 });
}
export function getCultureColonialismEntriesByType(state: NarrativeCultureColonialismEngineState, type: CultureColonialismType): CultureColonialismEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getCultureColonialismReport(state: NarrativeCultureColonialismEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add culture colonialism entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.colonialismMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLegacies: state.totalLegacies, averageResonance: Math.round(state.averageResonance * 100) / 100, colonialismComplexity: Math.round(state.colonialismComplexity * 100) / 100, colonialismMastery: Math.round(state.colonialismMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeCultureColonialismEngineState): NarrativeCultureColonialismEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const legacies = Array.from(state.legacies.values());
  const colonialismComplexity = legacies.length === 0 ? 0.5 : legacies.reduce((s, l) => s + l.breadth, 0) / legacies.length;
  return { ...state, averageResonance, colonialismComplexity, colonialismMastery: averageResonance * 0.5 + colonialismComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeCultureColonialismEngineState(): NarrativeCultureColonialismEngineState { return createNarrativeCultureColonialismEngineState(); }