/**
 * V1996 NarrativeKnowledgeSyntheticEngine — Direction U Iter 16/30 (Round 5)
 */
export type KnowledgeSyntheticType = 'factual' | 'empirical' | 'observational' | 'contingent' | 'natural' | 'transcendent' | 'infinite';
export type KnowledgeSyntheticBasis = 'experience' | 'observation' | 'experiment' | 'history' | 'transcendent' | 'infinite';
export interface KnowledgeSyntheticEntry { entryId: string; type: KnowledgeSyntheticType; basis: KnowledgeSyntheticBasis; description: string; resonance: number; chapter: number; }
export interface KnowledgeSyntheticClaim { claimId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeSyntheticEngineState { entries: Map<string, KnowledgeSyntheticEntry>; claims: Map<string, KnowledgeSyntheticClaim>; totalEntries: number; totalClaims: number; averageResonance: number; syntheticComplexity: number; syntheticMastery: number; }
export function createNarrativeKnowledgeSyntheticEngineState(): NarrativeKnowledgeSyntheticEngineState { return { entries: new Map(), claims: new Map(), totalEntries: 0, totalClaims: 0, averageResonance: 0.5, syntheticComplexity: 0.5, syntheticMastery: 0.5 }; }
export function addKnowledgeSyntheticEntry(state: NarrativeKnowledgeSyntheticEngineState, entryId: string, type: KnowledgeSyntheticType, basis: KnowledgeSyntheticBasis, description: string, resonance: number, chapter: number): NarrativeKnowledgeSyntheticEngineState {
  const entry: KnowledgeSyntheticEntry = { entryId, type, basis, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeSyntheticClaim(state: NarrativeKnowledgeSyntheticEngineState, claimId: string, entryIds: string[]): NarrativeKnowledgeSyntheticEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeSyntheticEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const claim: KnowledgeSyntheticClaim = { claimId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, claims: new Map(state.claims).set(claimId, claim), totalClaims: state.claims.size + 1 });
}
export function getKnowledgeSyntheticEntriesByType(state: NarrativeKnowledgeSyntheticEngineState, type: KnowledgeSyntheticType): KnowledgeSyntheticEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeSyntheticReport(state: NarrativeKnowledgeSyntheticEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge synthetic entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.syntheticMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalClaims: state.totalClaims, averageResonance: Math.round(state.averageResonance * 100) / 100, syntheticComplexity: Math.round(state.syntheticComplexity * 100) / 100, syntheticMastery: Math.round(state.syntheticMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeSyntheticEngineState): NarrativeKnowledgeSyntheticEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const claims = Array.from(state.claims.values());
  const syntheticComplexity = claims.length === 0 ? 0.5 : claims.reduce((s, c) => s + c.breadth, 0) / claims.length;
  return { ...state, averageResonance, syntheticComplexity, syntheticMastery: averageResonance * 0.5 + syntheticComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeSyntheticEngineState(): NarrativeKnowledgeSyntheticEngineState { return createNarrativeKnowledgeSyntheticEngineState(); }