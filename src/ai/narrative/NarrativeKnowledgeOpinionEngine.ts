/**
 * V2012 NarrativeKnowledgeOpinionEngine — Direction U Iter 24/30 (Round 5)
 */
export type KnowledgeOpinionType = 'personal' | 'public' | 'expert' | 'amateur' | 'informed' | 'transcendent' | 'infinite';
export type KnowledgeOpinionJustification = 'reasoned' | 'intuitive' | 'emotional' | 'self_interested' | 'transcendent' | 'infinite';
export interface KnowledgeOpinionEntry { entryId: string; type: KnowledgeOpinionType; justification: KnowledgeOpinionJustification; description: string; resonance: number; chapter: number; }
export interface KnowledgeOpinionPoll { pollId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeOpinionEngineState { entries: Map<string, KnowledgeOpinionEntry>; polls: Map<string, KnowledgeOpinionPoll>; totalEntries: number; totalPolls: number; averageResonance: number; opinionComplexity: number; opinionMastery: number; }
export function createNarrativeKnowledgeOpinionEngineState(): NarrativeKnowledgeOpinionEngineState { return { entries: new Map(), polls: new Map(), totalEntries: 0, totalPolls: 0, averageResonance: 0.5, opinionComplexity: 0.5, opinionMastery: 0.5 }; }
export function addKnowledgeOpinionEntry(state: NarrativeKnowledgeOpinionEngineState, entryId: string, type: KnowledgeOpinionType, justification: KnowledgeOpinionJustification, description: string, resonance: number, chapter: number): NarrativeKnowledgeOpinionEngineState {
  const entry: KnowledgeOpinionEntry = { entryId, type, justification, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeOpinionPoll(state: NarrativeKnowledgeOpinionEngineState, pollId: string, entryIds: string[]): NarrativeKnowledgeOpinionEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeOpinionEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const poll: KnowledgeOpinionPoll = { pollId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, polls: new Map(state.polls).set(pollId, poll), totalPolls: state.polls.size + 1 });
}
export function getKnowledgeOpinionEntriesByType(state: NarrativeKnowledgeOpinionEngineState, type: KnowledgeOpinionType): KnowledgeOpinionEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeOpinionReport(state: NarrativeKnowledgeOpinionEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge opinion entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.opinionMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPolls: state.totalPolls, averageResonance: Math.round(state.averageResonance * 100) / 100, opinionComplexity: Math.round(state.opinionComplexity * 100) / 100, opinionMastery: Math.round(state.opinionMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeOpinionEngineState): NarrativeKnowledgeOpinionEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const polls = Array.from(state.polls.values());
  const opinionComplexity = polls.length === 0 ? 0.5 : polls.reduce((s, p) => s + p.breadth, 0) / polls.length;
  return { ...state, averageResonance, opinionComplexity, opinionMastery: averageResonance * 0.5 + opinionComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeOpinionEngineState(): NarrativeKnowledgeOpinionEngineState { return createNarrativeKnowledgeOpinionEngineState(); }