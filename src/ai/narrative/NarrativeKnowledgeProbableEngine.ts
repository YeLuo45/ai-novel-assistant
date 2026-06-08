/**
 * V2002 NarrativeKnowledgeProbableEngine — Direction U Iter 19/30 (Round 5)
 */
export type KnowledgeProbableType = 'statistical' | 'subjective' | 'inductive' | 'predictive' | 'frequentist' | 'transcendent' | 'infinite';
export type KnowledgeProbableConfidence = 'high' | 'medium' | 'low' | 'minimal' | 'unknown' | 'transcendent' | 'infinite';
export interface KnowledgeProbableEntry { entryId: string; type: KnowledgeProbableType; confidence: KnowledgeProbableConfidence; description: string; resonance: number; chapter: number; }
export interface KnowledgeProbableEstimate { estimateId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeProbableEngineState { entries: Map<string, KnowledgeProbableEntry>; estimates: Map<string, KnowledgeProbableEstimate>; totalEntries: number; totalEstimates: number; averageResonance: number; probableComplexity: number; probableMastery: number; }
export function createNarrativeKnowledgeProbableEngineState(): NarrativeKnowledgeProbableEngineState { return { entries: new Map(), estimates: new Map(), totalEntries: 0, totalEstimates: 0, averageResonance: 0.5, probableComplexity: 0.5, probableMastery: 0.5 }; }
export function addKnowledgeProbableEntry(state: NarrativeKnowledgeProbableEngineState, entryId: string, type: KnowledgeProbableType, confidence: KnowledgeProbableConfidence, description: string, resonance: number, chapter: number): NarrativeKnowledgeProbableEngineState {
  const entry: KnowledgeProbableEntry = { entryId, type, confidence, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeProbableEstimate(state: NarrativeKnowledgeProbableEngineState, estimateId: string, entryIds: string[]): NarrativeKnowledgeProbableEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeProbableEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const estimate: KnowledgeProbableEstimate = { estimateId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, estimates: new Map(state.estimates).set(estimateId, estimate), totalEstimates: state.estimates.size + 1 });
}
export function getKnowledgeProbableEntriesByType(state: NarrativeKnowledgeProbableEngineState, type: KnowledgeProbableType): KnowledgeProbableEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeProbableReport(state: NarrativeKnowledgeProbableEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge probable entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.probableMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalEstimates: state.totalEstimates, averageResonance: Math.round(state.averageResonance * 100) / 100, probableComplexity: Math.round(state.probableComplexity * 100) / 100, probableMastery: Math.round(state.probableMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeProbableEngineState): NarrativeKnowledgeProbableEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const estimates = Array.from(state.estimates.values());
  const probableComplexity = estimates.length === 0 ? 0.5 : estimates.reduce((s, e) => s + e.breadth, 0) / estimates.length;
  return { ...state, averageResonance, probableComplexity, probableMastery: averageResonance * 0.5 + probableComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeProbableEngineState(): NarrativeKnowledgeProbableEngineState { return createNarrativeKnowledgeProbableEngineState(); }