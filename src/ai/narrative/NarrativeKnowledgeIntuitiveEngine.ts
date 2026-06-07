/**
 * V1970 NarrativeKnowledgeIntuitiveEngine — Direction U Iter 3/30 (Round 5)
 */
export type KnowledgeIntuitiveType = 'gut' | 'flash' | 'pattern' | 'empathy' | 'instinct' | 'transcendent' | 'infinite';
export type KnowledgeIntuitiveSource = 'embodied' | 'unconscious' | 'collective' | 'transpersonal' | 'transcendent' | 'infinite';
export interface KnowledgeIntuitiveEntry { entryId: string; type: KnowledgeIntuitiveType; source: KnowledgeIntuitiveSource; description: string; resonance: number; chapter: number; }
export interface KnowledgeIntuitiveInsight { insightId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeIntuitiveEngineState { entries: Map<string, KnowledgeIntuitiveEntry>; insights: Map<string, KnowledgeIntuitiveInsight>; totalEntries: number; totalInsights: number; averageResonance: number; intuitiveComplexity: number; intuitiveMastery: number; }
export function createNarrativeKnowledgeIntuitiveEngineState(): NarrativeKnowledgeIntuitiveEngineState { return { entries: new Map(), insights: new Map(), totalEntries: 0, totalInsights: 0, averageResonance: 0.5, intuitiveComplexity: 0.5, intuitiveMastery: 0.5 }; }
export function addKnowledgeIntuitiveEntry(state: NarrativeKnowledgeIntuitiveEngineState, entryId: string, type: KnowledgeIntuitiveType, source: KnowledgeIntuitiveSource, description: string, resonance: number, chapter: number): NarrativeKnowledgeIntuitiveEngineState {
  const entry: KnowledgeIntuitiveEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeIntuitiveInsight(state: NarrativeKnowledgeIntuitiveEngineState, insightId: string, entryIds: string[]): NarrativeKnowledgeIntuitiveEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeIntuitiveEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const insight: KnowledgeIntuitiveInsight = { insightId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, insights: new Map(state.insights).set(insightId, insight), totalInsights: state.insights.size + 1 });
}
export function getKnowledgeIntuitiveEntriesByType(state: NarrativeKnowledgeIntuitiveEngineState, type: KnowledgeIntuitiveType): KnowledgeIntuitiveEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeIntuitiveReport(state: NarrativeKnowledgeIntuitiveEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge intuitive entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.intuitiveMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalInsights: state.totalInsights, averageResonance: Math.round(state.averageResonance * 100) / 100, intuitiveComplexity: Math.round(state.intuitiveComplexity * 100) / 100, intuitiveMastery: Math.round(state.intuitiveMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeIntuitiveEngineState): NarrativeKnowledgeIntuitiveEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const insights = Array.from(state.insights.values());
  const intuitiveComplexity = insights.length === 0 ? 0.5 : insights.reduce((s, i) => s + i.breadth, 0) / insights.length;
  return { ...state, averageResonance, intuitiveComplexity, intuitiveMastery: averageResonance * 0.5 + intuitiveComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeIntuitiveEngineState(): NarrativeKnowledgeIntuitiveEngineState { return createNarrativeKnowledgeIntuitiveEngineState(); }