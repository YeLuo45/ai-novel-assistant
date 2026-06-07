/**
 * V1734 NarrativeThemeMeaningEngine — Direction Q Iter 5/30 (Round 5)
 */
export type ThemeMeaningType = 'existential' | 'cosmic' | 'personal' | 'collective' | 'spiritual' | 'transcendent' | 'infinite';
export type ThemeMeaningClarity = 'lost' | 'seeking' | 'glimpsed' | 'embodied' | 'transcendent' | 'infinite';
export interface ThemeMeaningEntry { entryId: string; type: ThemeMeaningType; clarity: ThemeMeaningClarity; description: string; depth: number; chapter: number; }
export interface ThemeMeaningQuest { questId: string; entryIds: string[]; cumulativeDepth: number; breadth: number; }
export interface NarrativeThemeMeaningEngineState { entries: Map<string, ThemeMeaningEntry>; quests: Map<string, ThemeMeaningQuest>; totalEntries: number; totalQuests: number; averageDepth: number; meaningComplexity: number; meaningMastery: number; }
export function createNarrativeThemeMeaningEngineState(): NarrativeThemeMeaningEngineState { return { entries: new Map(), quests: new Map(), totalEntries: 0, totalQuests: 0, averageDepth: 0.5, meaningComplexity: 0.5, meaningMastery: 0.5 }; }
export function addThemeMeaningEntry(state: NarrativeThemeMeaningEngineState, entryId: string, type: ThemeMeaningType, clarity: ThemeMeaningClarity, description: string, depth: number, chapter: number): NarrativeThemeMeaningEngineState {
  const entry: ThemeMeaningEntry = { entryId, type, clarity, description, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeMeaningQuest(state: NarrativeThemeMeaningEngineState, questId: string, entryIds: string[]): NarrativeThemeMeaningEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeMeaningEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const quest: ThemeMeaningQuest = { questId, entryIds, cumulativeDepth, breadth };
  return recompute({ ...state, quests: new Map(state.quests).set(questId, quest), totalQuests: state.quests.size + 1 });
}
export function getThemeMeaningEntriesByType(state: NarrativeThemeMeaningEngineState, type: ThemeMeaningType): ThemeMeaningEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeMeaningReport(state: NarrativeThemeMeaningEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme meaning entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.meaningMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalQuests: state.totalQuests, averageDepth: Math.round(state.averageDepth * 100) / 100, meaningComplexity: Math.round(state.meaningComplexity * 100) / 100, meaningMastery: Math.round(state.meaningMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeMeaningEngineState): NarrativeThemeMeaningEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const quests = Array.from(state.quests.values());
  const meaningComplexity = quests.length === 0 ? 0.5 : quests.reduce((s, q) => s + q.breadth, 0) / quests.length;
  return { ...state, averageDepth, meaningComplexity, meaningMastery: averageDepth * 0.5 + meaningComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeMeaningEngineState(): NarrativeThemeMeaningEngineState { return createNarrativeThemeMeaningEngineState(); }