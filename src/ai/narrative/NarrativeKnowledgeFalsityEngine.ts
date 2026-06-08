/**
 * V2016 NarrativeKnowledgeFalsityEngine — Direction U Iter 26/30 (Round 5)
 */
export type KnowledgeFalsityType = 'error' | 'lie' | 'illusion' | 'bias' | 'delusion' | 'transcendent' | 'infinite';
export type KnowledgeFalsitySource = 'deception' | 'mistake' | 'self_deception' | 'ideology' | 'transcendent' | 'infinite';
export interface KnowledgeFalsityEntry { entryId: string; type: KnowledgeFalsityType; source: KnowledgeFalsitySource; description: string; resonance: number; chapter: number; }
export interface KnowledgeFalsityExposure { exposureId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeFalsityEngineState { entries: Map<string, KnowledgeFalsityEntry>; exposures: Map<string, KnowledgeFalsityExposure>; totalEntries: number; totalExposures: number; averageResonance: number; falsityComplexity: number; falsityMastery: number; }
export function createNarrativeKnowledgeFalsityEngineState(): NarrativeKnowledgeFalsityEngineState { return { entries: new Map(), exposures: new Map(), totalEntries: 0, totalExposures: 0, averageResonance: 0.5, falsityComplexity: 0.5, falsityMastery: 0.5 }; }
export function addKnowledgeFalsityEntry(state: NarrativeKnowledgeFalsityEngineState, entryId: string, type: KnowledgeFalsityType, source: KnowledgeFalsitySource, description: string, resonance: number, chapter: number): NarrativeKnowledgeFalsityEngineState {
  const entry: KnowledgeFalsityEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeFalsityExposure(state: NarrativeKnowledgeFalsityEngineState, exposureId: string, entryIds: string[]): NarrativeKnowledgeFalsityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeFalsityEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const exposure: KnowledgeFalsityExposure = { exposureId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, exposures: new Map(state.exposures).set(exposureId, exposure), totalExposures: state.exposures.size + 1 });
}
export function getKnowledgeFalsityEntriesByType(state: NarrativeKnowledgeFalsityEngineState, type: KnowledgeFalsityType): KnowledgeFalsityEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeFalsityReport(state: NarrativeKnowledgeFalsityEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge falsity entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.falsityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalExposures: state.totalExposures, averageResonance: Math.round(state.averageResonance * 100) / 100, falsityComplexity: Math.round(state.falsityComplexity * 100) / 100, falsityMastery: Math.round(state.falsityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeFalsityEngineState): NarrativeKnowledgeFalsityEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const exposures = Array.from(state.exposures.values());
  const falsityComplexity = exposures.length === 0 ? 0.5 : exposures.reduce((s, ex) => s + ex.breadth, 0) / exposures.length;
  return { ...state, averageResonance, falsityComplexity, falsityMastery: averageResonance * 0.5 + falsityComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeFalsityEngineState(): NarrativeKnowledgeFalsityEngineState { return createNarrativeKnowledgeFalsityEngineState(); }