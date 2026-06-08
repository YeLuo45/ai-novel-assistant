/**
 * V1994 NarrativeKnowledgeAnalyticEngine — Direction U Iter 15/30 (Round 5)
 */
export type KnowledgeAnalyticType = 'tautology' | 'definition' | 'logic' | 'math' | 'concept' | 'transcendent' | 'infinite';
export type KnowledgeAnalyticForm = 'identity' | 'implication' | 'equivalence' | 'necessity' | 'transcendent' | 'infinite';
export interface KnowledgeAnalyticEntry { entryId: string; type: KnowledgeAnalyticType; form: KnowledgeAnalyticForm; description: string; resonance: number; chapter: number; }
export interface KnowledgeAnalyticProposition { propositionId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeAnalyticEngineState { entries: Map<string, KnowledgeAnalyticEntry>; propositions: Map<string, KnowledgeAnalyticProposition>; totalEntries: number; totalPropositions: number; averageResonance: number; analyticComplexity: number; analyticMastery: number; }
export function createNarrativeKnowledgeAnalyticEngineState(): NarrativeKnowledgeAnalyticEngineState { return { entries: new Map(), propositions: new Map(), totalEntries: 0, totalPropositions: 0, averageResonance: 0.5, analyticComplexity: 0.5, analyticMastery: 0.5 }; }
export function addKnowledgeAnalyticEntry(state: NarrativeKnowledgeAnalyticEngineState, entryId: string, type: KnowledgeAnalyticType, form: KnowledgeAnalyticForm, description: string, resonance: number, chapter: number): NarrativeKnowledgeAnalyticEngineState {
  const entry: KnowledgeAnalyticEntry = { entryId, type, form, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeAnalyticProposition(state: NarrativeKnowledgeAnalyticEngineState, propositionId: string, entryIds: string[]): NarrativeKnowledgeAnalyticEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeAnalyticEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const proposition: KnowledgeAnalyticProposition = { propositionId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, propositions: new Map(state.propositions).set(propositionId, proposition), totalPropositions: state.propositions.size + 1 });
}
export function getKnowledgeAnalyticEntriesByType(state: NarrativeKnowledgeAnalyticEngineState, type: KnowledgeAnalyticType): KnowledgeAnalyticEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeAnalyticReport(state: NarrativeKnowledgeAnalyticEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge analytic entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.analyticMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPropositions: state.totalPropositions, averageResonance: Math.round(state.averageResonance * 100) / 100, analyticComplexity: Math.round(state.analyticComplexity * 100) / 100, analyticMastery: Math.round(state.analyticMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeAnalyticEngineState): NarrativeKnowledgeAnalyticEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const propositions = Array.from(state.propositions.values());
  const analyticComplexity = propositions.length === 0 ? 0.5 : propositions.reduce((s, p) => s + p.breadth, 0) / propositions.length;
  return { ...state, averageResonance, analyticComplexity, analyticMastery: averageResonance * 0.5 + analyticComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeAnalyticEngineState(): NarrativeKnowledgeAnalyticEngineState { return createNarrativeKnowledgeAnalyticEngineState(); }