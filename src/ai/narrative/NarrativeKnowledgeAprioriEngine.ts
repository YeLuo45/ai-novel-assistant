/**
 * V1990 NarrativeKnowledgeAprioriEngine — Direction U Iter 13/30 (Round 5)
 */
export type KnowledgeAprioriType = 'analytic' | 'logical' | 'mathematical' | 'conceptual' | 'necessary' | 'transcendent' | 'infinite';
export type KnowledgeAprioriSource = 'reason' | 'intuition' | 'convention' | 'definition' | 'transcendent' | 'infinite';
export interface KnowledgeAprioriEntry { entryId: string; type: KnowledgeAprioriType; source: KnowledgeAprioriSource; description: string; resonance: number; chapter: number; }
export interface KnowledgeAprioriFoundation { foundationId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeAprioriEngineState { entries: Map<string, KnowledgeAprioriEntry>; foundations: Map<string, KnowledgeAprioriFoundation>; totalEntries: number; totalFoundations: number; averageResonance: number; aprioriComplexity: number; aprioriMastery: number; }
export function createNarrativeKnowledgeAprioriEngineState(): NarrativeKnowledgeAprioriEngineState { return { entries: new Map(), foundations: new Map(), totalEntries: 0, totalFoundations: 0, averageResonance: 0.5, aprioriComplexity: 0.5, aprioriMastery: 0.5 }; }
export function addKnowledgeAprioriEntry(state: NarrativeKnowledgeAprioriEngineState, entryId: string, type: KnowledgeAprioriType, source: KnowledgeAprioriSource, description: string, resonance: number, chapter: number): NarrativeKnowledgeAprioriEngineState {
  const entry: KnowledgeAprioriEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeAprioriFoundation(state: NarrativeKnowledgeAprioriEngineState, foundationId: string, entryIds: string[]): NarrativeKnowledgeAprioriEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeAprioriEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const foundation: KnowledgeAprioriFoundation = { foundationId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, foundations: new Map(state.foundations).set(foundationId, foundation), totalFoundations: state.foundations.size + 1 });
}
export function getKnowledgeAprioriEntriesByType(state: NarrativeKnowledgeAprioriEngineState, type: KnowledgeAprioriType): KnowledgeAprioriEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeAprioriReport(state: NarrativeKnowledgeAprioriEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge apriori entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.aprioriMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFoundations: state.totalFoundations, averageResonance: Math.round(state.averageResonance * 100) / 100, aprioriComplexity: Math.round(state.aprioriComplexity * 100) / 100, aprioriMastery: Math.round(state.aprioriMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeAprioriEngineState): NarrativeKnowledgeAprioriEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const foundations = Array.from(state.foundations.values());
  const aprioriComplexity = foundations.length === 0 ? 0.5 : foundations.reduce((s, f) => s + f.breadth, 0) / foundations.length;
  return { ...state, averageResonance, aprioriComplexity, aprioriMastery: averageResonance * 0.5 + aprioriComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeAprioriEngineState(): NarrativeKnowledgeAprioriEngineState { return createNarrativeKnowledgeAprioriEngineState(); }