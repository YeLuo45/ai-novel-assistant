/**
 * V1992 NarrativeKnowledgeAposterioriEngine — Direction U Iter 14/30 (Round 5)
 */
export type KnowledgeAposterioriType = 'empirical' | 'observational' | 'experimental' | 'historical' | 'testimonial' | 'transcendent' | 'infinite';
export type KnowledgeAposterioriSource = 'experience' | 'observation' | 'experiment' | 'memory' | 'transcendent' | 'infinite';
export interface KnowledgeAposterioriEntry { entryId: string; type: KnowledgeAposterioriType; source: KnowledgeAposterioriSource; description: string; resonance: number; chapter: number; }
export interface KnowledgeAposterioriRecord { recordId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeAposterioriEngineState { entries: Map<string, KnowledgeAposterioriEntry>; records: Map<string, KnowledgeAposterioriRecord>; totalEntries: number; totalRecords: number; averageResonance: number; aposterioriComplexity: number; aposterioriMastery: number; }
export function createNarrativeKnowledgeAposterioriEngineState(): NarrativeKnowledgeAposterioriEngineState { return { entries: new Map(), records: new Map(), totalEntries: 0, totalRecords: 0, averageResonance: 0.5, aposterioriComplexity: 0.5, aposterioriMastery: 0.5 }; }
export function addKnowledgeAposterioriEntry(state: NarrativeKnowledgeAposterioriEngineState, entryId: string, type: KnowledgeAposterioriType, source: KnowledgeAposterioriSource, description: string, resonance: number, chapter: number): NarrativeKnowledgeAposterioriEngineState {
  const entry: KnowledgeAposterioriEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeAposterioriRecord(state: NarrativeKnowledgeAposterioriEngineState, recordId: string, entryIds: string[]): NarrativeKnowledgeAposterioriEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeAposterioriEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const record: KnowledgeAposterioriRecord = { recordId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, records: new Map(state.records).set(recordId, record), totalRecords: state.records.size + 1 });
}
export function getKnowledgeAposterioriEntriesByType(state: NarrativeKnowledgeAposterioriEngineState, type: KnowledgeAposterioriType): KnowledgeAposterioriEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeAposterioriReport(state: NarrativeKnowledgeAposterioriEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge aposteriori entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.aposterioriMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalRecords: state.totalRecords, averageResonance: Math.round(state.averageResonance * 100) / 100, aposterioriComplexity: Math.round(state.aposterioriComplexity * 100) / 100, aposterioriMastery: Math.round(state.aposterioriMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeAposterioriEngineState): NarrativeKnowledgeAposterioriEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const records = Array.from(state.records.values());
  const aposterioriComplexity = records.length === 0 ? 0.5 : records.reduce((s, r) => s + r.breadth, 0) / records.length;
  return { ...state, averageResonance, aposterioriComplexity, aposterioriMastery: averageResonance * 0.5 + aposterioriComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeAposterioriEngineState(): NarrativeKnowledgeAposterioriEngineState { return createNarrativeKnowledgeAposterioriEngineState(); }