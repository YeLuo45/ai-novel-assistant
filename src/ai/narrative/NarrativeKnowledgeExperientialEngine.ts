/**
 * V1984 NarrativeKnowledgeExperientialEngine — Direction U Iter 10/30 (Round 5)
 */
export type KnowledgeExperientialType = 'embodied' | 'situated' | 'practical' | 'lived' | 'phenomenal' | 'transcendent' | 'infinite';
export type KnowledgeExperientialContext = 'personal' | 'social' | 'environmental' | 'cultural' | 'historical' | 'transcendent' | 'infinite';
export interface KnowledgeExperientialEntry { entryId: string; type: KnowledgeExperientialType; context: KnowledgeExperientialContext; description: string; resonance: number; chapter: number; }
export interface KnowledgeExperientialPractice { practiceId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeExperientialEngineState { entries: Map<string, KnowledgeExperientialEntry>; practices: Map<string, KnowledgeExperientialPractice>; totalEntries: number; totalPractices: number; averageResonance: number; experientialComplexity: number; experientialMastery: number; }
export function createNarrativeKnowledgeExperientialEngineState(): NarrativeKnowledgeExperientialEngineState { return { entries: new Map(), practices: new Map(), totalEntries: 0, totalPractices: 0, averageResonance: 0.5, experientialComplexity: 0.5, experientialMastery: 0.5 }; }
export function addKnowledgeExperientialEntry(state: NarrativeKnowledgeExperientialEngineState, entryId: string, type: KnowledgeExperientialType, context: KnowledgeExperientialContext, description: string, resonance: number, chapter: number): NarrativeKnowledgeExperientialEngineState {
  const entry: KnowledgeExperientialEntry = { entryId, type, context, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeExperientialPractice(state: NarrativeKnowledgeExperientialEngineState, practiceId: string, entryIds: string[]): NarrativeKnowledgeExperientialEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeExperientialEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const practice: KnowledgeExperientialPractice = { practiceId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, practices: new Map(state.practices).set(practiceId, practice), totalPractices: state.practices.size + 1 });
}
export function getKnowledgeExperientialEntriesByType(state: NarrativeKnowledgeExperientialEngineState, type: KnowledgeExperientialType): KnowledgeExperientialEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeExperientialReport(state: NarrativeKnowledgeExperientialEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge experiential entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.experientialMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPractices: state.totalPractices, averageResonance: Math.round(state.averageResonance * 100) / 100, experientialComplexity: Math.round(state.experientialComplexity * 100) / 100, experientialMastery: Math.round(state.experientialMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeExperientialEngineState): NarrativeKnowledgeExperientialEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const practices = Array.from(state.practices.values());
  const experientialComplexity = practices.length === 0 ? 0.5 : practices.reduce((s, p) => s + p.breadth, 0) / practices.length;
  return { ...state, averageResonance, experientialComplexity, experientialMastery: averageResonance * 0.5 + experientialComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeExperientialEngineState(): NarrativeKnowledgeExperientialEngineState { return createNarrativeKnowledgeExperientialEngineState(); }