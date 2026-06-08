/**
 * V2004 NarrativeKnowledgeCertainEngine — Direction U Iter 20/30 (Round 5)
 */
export type KnowledgeCertainType = 'logical' | 'mathematical' | 'definitional' | 'intuitive' | 'self_evident' | 'transcendent' | 'infinite';
export type KnowledgeCertainDegree = 'absolute' | 'very_high' | 'high' | 'moderate' | 'transcendent' | 'infinite';
export interface KnowledgeCertainEntry { entryId: string; type: KnowledgeCertainType; degree: KnowledgeCertainDegree; description: string; resonance: number; chapter: number; }
export interface KnowledgeCertainConviction { convictionId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeCertainEngineState { entries: Map<string, KnowledgeCertainEntry>; convictions: Map<string, KnowledgeCertainConviction>; totalEntries: number; totalConvictions: number; averageResonance: number; certainComplexity: number; certainMastery: number; }
export function createNarrativeKnowledgeCertainEngineState(): NarrativeKnowledgeCertainEngineState { return { entries: new Map(), convictions: new Map(), totalEntries: 0, totalConvictions: 0, averageResonance: 0.5, certainComplexity: 0.5, certainMastery: 0.5 }; }
export function addKnowledgeCertainEntry(state: NarrativeKnowledgeCertainEngineState, entryId: string, type: KnowledgeCertainType, degree: KnowledgeCertainDegree, description: string, resonance: number, chapter: number): NarrativeKnowledgeCertainEngineState {
  const entry: KnowledgeCertainEntry = { entryId, type, degree, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeCertainConviction(state: NarrativeKnowledgeCertainEngineState, convictionId: string, entryIds: string[]): NarrativeKnowledgeCertainEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeCertainEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const conviction: KnowledgeCertainConviction = { convictionId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, convictions: new Map(state.convictions).set(convictionId, conviction), totalConvictions: state.convictions.size + 1 });
}
export function getKnowledgeCertainEntriesByType(state: NarrativeKnowledgeCertainEngineState, type: KnowledgeCertainType): KnowledgeCertainEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeCertainReport(state: NarrativeKnowledgeCertainEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge certain entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.certainMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalConvictions: state.totalConvictions, averageResonance: Math.round(state.averageResonance * 100) / 100, certainComplexity: Math.round(state.certainComplexity * 100) / 100, certainMastery: Math.round(state.certainMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeCertainEngineState): NarrativeKnowledgeCertainEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const convictions = Array.from(state.convictions.values());
  const certainComplexity = convictions.length === 0 ? 0.5 : convictions.reduce((s, c) => s + c.breadth, 0) / convictions.length;
  return { ...state, averageResonance, certainComplexity, certainMastery: averageResonance * 0.5 + certainComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeCertainEngineState(): NarrativeKnowledgeCertainEngineState { return createNarrativeKnowledgeCertainEngineState(); }