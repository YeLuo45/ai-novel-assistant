/**
 * V1998 NarrativeKnowledgeNecessaryEngine — Direction U Iter 17/30 (Round 5)
 */
export type KnowledgeNecessaryType = 'logical' | 'mathematical' | 'metaphysical' | 'conceptual' | 'essential' | 'transcendent' | 'infinite';
export type KnowledgeNecessaryStatus = 'necessarily_true' | 'necessarily_false' | 'contingent' | 'impossible' | 'transcendent' | 'infinite';
export interface KnowledgeNecessaryEntry { entryId: string; type: KnowledgeNecessaryType; status: KnowledgeNecessaryStatus; description: string; resonance: number; chapter: number; }
export interface KnowledgeNecessaryTruth { truthId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeNecessaryEngineState { entries: Map<string, KnowledgeNecessaryEntry>; truths: Map<string, KnowledgeNecessaryTruth>; totalEntries: number; totalTruths: number; averageResonance: number; necessaryComplexity: number; necessaryMastery: number; }
export function createNarrativeKnowledgeNecessaryEngineState(): NarrativeKnowledgeNecessaryEngineState { return { entries: new Map(), truths: new Map(), totalEntries: 0, totalTruths: 0, averageResonance: 0.5, necessaryComplexity: 0.5, necessaryMastery: 0.5 }; }
export function addKnowledgeNecessaryEntry(state: NarrativeKnowledgeNecessaryEngineState, entryId: string, type: KnowledgeNecessaryType, status: KnowledgeNecessaryStatus, description: string, resonance: number, chapter: number): NarrativeKnowledgeNecessaryEngineState {
  const entry: KnowledgeNecessaryEntry = { entryId, type, status, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeNecessaryTruth(state: NarrativeKnowledgeNecessaryEngineState, truthId: string, entryIds: string[]): NarrativeKnowledgeNecessaryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeNecessaryEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const truth: KnowledgeNecessaryTruth = { truthId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, truths: new Map(state.truths).set(truthId, truth), totalTruths: state.truths.size + 1 });
}
export function getKnowledgeNecessaryEntriesByType(state: NarrativeKnowledgeNecessaryEngineState, type: KnowledgeNecessaryType): KnowledgeNecessaryEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeNecessaryReport(state: NarrativeKnowledgeNecessaryEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge necessary entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.necessaryMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTruths: state.totalTruths, averageResonance: Math.round(state.averageResonance * 100) / 100, necessaryComplexity: Math.round(state.necessaryComplexity * 100) / 100, necessaryMastery: Math.round(state.necessaryMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeNecessaryEngineState): NarrativeKnowledgeNecessaryEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const truths = Array.from(state.truths.values());
  const necessaryComplexity = truths.length === 0 ? 0.5 : truths.reduce((s, t) => s + t.breadth, 0) / truths.length;
  return { ...state, averageResonance, necessaryComplexity, necessaryMastery: averageResonance * 0.5 + necessaryComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeNecessaryEngineState(): NarrativeKnowledgeNecessaryEngineState { return createNarrativeKnowledgeNecessaryEngineState(); }