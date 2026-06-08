/**
 * V2000 NarrativeKnowledgeContingentEngine — Direction U Iter 18/30 (Round 5)
 */
export type KnowledgeContingentType = 'empirical' | 'historical' | 'physical' | 'natural' | 'social' | 'transcendent' | 'infinite';
export type KnowledgeContingentStatus = 'contingently_true' | 'contingently_false' | 'variable' | 'contextual' | 'transcendent' | 'infinite';
export interface KnowledgeContingentEntry { entryId: string; type: KnowledgeContingentType; status: KnowledgeContingentStatus; description: string; resonance: number; chapter: number; }
export interface KnowledgeContingentFact { factId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeContingentEngineState { entries: Map<string, KnowledgeContingentEntry>; facts: Map<string, KnowledgeContingentFact>; totalEntries: number; totalFacts: number; averageResonance: number; contingentComplexity: number; contingentMastery: number; }
export function createNarrativeKnowledgeContingentEngineState(): NarrativeKnowledgeContingentEngineState { return { entries: new Map(), facts: new Map(), totalEntries: 0, totalFacts: 0, averageResonance: 0.5, contingentComplexity: 0.5, contingentMastery: 0.5 }; }
export function addKnowledgeContingentEntry(state: NarrativeKnowledgeContingentEngineState, entryId: string, type: KnowledgeContingentType, status: KnowledgeContingentStatus, description: string, resonance: number, chapter: number): NarrativeKnowledgeContingentEngineState {
  const entry: KnowledgeContingentEntry = { entryId, type, status, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeContingentFact(state: NarrativeKnowledgeContingentEngineState, factId: string, entryIds: string[]): NarrativeKnowledgeContingentEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeContingentEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const fact: KnowledgeContingentFact = { factId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, facts: new Map(state.facts).set(factId, fact), totalFacts: state.facts.size + 1 });
}
export function getKnowledgeContingentEntriesByType(state: NarrativeKnowledgeContingentEngineState, type: KnowledgeContingentType): KnowledgeContingentEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeContingentReport(state: NarrativeKnowledgeContingentEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge contingent entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.contingentMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFacts: state.totalFacts, averageResonance: Math.round(state.averageResonance * 100) / 100, contingentComplexity: Math.round(state.contingentComplexity * 100) / 100, contingentMastery: Math.round(state.contingentMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeContingentEngineState): NarrativeKnowledgeContingentEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const facts = Array.from(state.facts.values());
  const contingentComplexity = facts.length === 0 ? 0.5 : facts.reduce((s, f) => s + f.breadth, 0) / facts.length;
  return { ...state, averageResonance, contingentComplexity, contingentMastery: averageResonance * 0.5 + contingentComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeContingentEngineState(): NarrativeKnowledgeContingentEngineState { return createNarrativeKnowledgeContingentEngineState(); }