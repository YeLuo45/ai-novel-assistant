/**
 * V2014 NarrativeKnowledgeTruthEngine2 — Direction U Iter 25/30 (Round 5)
 */
export type KnowledgeTruth2Type = 'correspondence' | 'coherence' | 'pragmatic' | 'constructivist' | 'deflationary' | 'transcendent' | 'infinite';
export type KnowledgeTruth2Domain = 'factual' | 'moral' | 'aesthetic' | 'personal' | 'transcendent' | 'infinite';
export interface KnowledgeTruth2Entry { entryId: string; type: KnowledgeTruth2Type; domain: KnowledgeTruth2Domain; description: string; resonance: number; chapter: number; }
export interface KnowledgeTruth2Theory { theoryId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeTruth2EngineState { entries: Map<string, KnowledgeTruth2Entry>; theories: Map<string, KnowledgeTruth2Theory>; totalEntries: number; totalTheories: number; averageResonance: number; truthComplexity: number; truthMastery: number; }
export function createNarrativeKnowledgeTruth2EngineState(): NarrativeKnowledgeTruth2EngineState { return { entries: new Map(), theories: new Map(), totalEntries: 0, totalTheories: 0, averageResonance: 0.5, truthComplexity: 0.5, truthMastery: 0.5 }; }
export function addKnowledgeTruth2Entry(state: NarrativeKnowledgeTruth2EngineState, entryId: string, type: KnowledgeTruth2Type, domain: KnowledgeTruth2Domain, description: string, resonance: number, chapter: number): NarrativeKnowledgeTruth2EngineState {
  const entry: KnowledgeTruth2Entry = { entryId, type, domain, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeTruth2Theory(state: NarrativeKnowledgeTruth2EngineState, theoryId: string, entryIds: string[]): NarrativeKnowledgeTruth2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeTruth2Entry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const theory: KnowledgeTruth2Theory = { theoryId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, theories: new Map(state.theories).set(theoryId, theory), totalTheories: state.theories.size + 1 });
}
export function getKnowledgeTruth2EntriesByType(state: NarrativeKnowledgeTruth2EngineState, type: KnowledgeTruth2Type): KnowledgeTruth2Entry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeTruth2Report(state: NarrativeKnowledgeTruth2EngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge truth2 entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.truthMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTheories: state.totalTheories, averageResonance: Math.round(state.averageResonance * 100) / 100, truthComplexity: Math.round(state.truthComplexity * 100) / 100, truthMastery: Math.round(state.truthMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeTruth2EngineState): NarrativeKnowledgeTruth2EngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const theories = Array.from(state.theories.values());
  const truthComplexity = theories.length === 0 ? 0.5 : theories.reduce((s, t) => s + t.breadth, 0) / theories.length;
  return { ...state, averageResonance, truthComplexity, truthMastery: averageResonance * 0.5 + truthComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeTruth2EngineState(): NarrativeKnowledgeTruth2EngineState { return createNarrativeKnowledgeTruth2EngineState(); }