/**
 * V1978 NarrativeKnowledgeScientificEngine — Direction U Iter 7/30 (Round 5)
 */
export type KnowledgeScientificType = 'natural' | 'social' | 'formal' | 'applied' | 'interdisciplinary' | 'transcendent' | 'infinite';
export type KnowledgeScientificMethod = 'hypothesis' | 'experiment' | 'peer_review' | 'replication' | 'transcendent' | 'infinite';
export interface KnowledgeScientificEntry { entryId: string; type: KnowledgeScientificType; method: KnowledgeScientificMethod; description: string; resonance: number; chapter: number; }
export interface KnowledgeScientificTheory { theoryId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeScientificEngineState { entries: Map<string, KnowledgeScientificEntry>; theories: Map<string, KnowledgeScientificTheory>; totalEntries: number; totalTheories: number; averageResonance: number; scientificComplexity: number; scientificMastery: number; }
export function createNarrativeKnowledgeScientificEngineState(): NarrativeKnowledgeScientificEngineState { return { entries: new Map(), theories: new Map(), totalEntries: 0, totalTheories: 0, averageResonance: 0.5, scientificComplexity: 0.5, scientificMastery: 0.5 }; }
export function addKnowledgeScientificEntry(state: NarrativeKnowledgeScientificEngineState, entryId: string, type: KnowledgeScientificType, method: KnowledgeScientificMethod, description: string, resonance: number, chapter: number): NarrativeKnowledgeScientificEngineState {
  const entry: KnowledgeScientificEntry = { entryId, type, method, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeScientificTheory(state: NarrativeKnowledgeScientificEngineState, theoryId: string, entryIds: string[]): NarrativeKnowledgeScientificEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeScientificEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const theory: KnowledgeScientificTheory = { theoryId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, theories: new Map(state.theories).set(theoryId, theory), totalTheories: state.theories.size + 1 });
}
export function getKnowledgeScientificEntriesByType(state: NarrativeKnowledgeScientificEngineState, type: KnowledgeScientificType): KnowledgeScientificEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeScientificReport(state: NarrativeKnowledgeScientificEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge scientific entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.scientificMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTheories: state.totalTheories, averageResonance: Math.round(state.averageResonance * 100) / 100, scientificComplexity: Math.round(state.scientificComplexity * 100) / 100, scientificMastery: Math.round(state.scientificMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeScientificEngineState): NarrativeKnowledgeScientificEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const theories = Array.from(state.theories.values());
  const scientificComplexity = theories.length === 0 ? 0.5 : theories.reduce((s, t) => s + t.breadth, 0) / theories.length;
  return { ...state, averageResonance, scientificComplexity, scientificMastery: averageResonance * 0.5 + scientificComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeScientificEngineState(): NarrativeKnowledgeScientificEngineState { return createNarrativeKnowledgeScientificEngineState(); }