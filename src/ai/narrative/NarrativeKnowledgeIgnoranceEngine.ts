/**
 * V2018 NarrativeKnowledgeIgnoranceEngine — Direction U Iter 27/30 (Round 5)
 */
export type KnowledgeIgnoranceType = 'unknown' | 'unknown_unknown' | 'forgotten' | 'suppressed' | 'taboo' | 'transcendent' | 'infinite';
export type KnowledgeIgnoranceSource = 'epistemic' | 'social' | 'psychological' | 'political' | 'transcendent' | 'infinite';
export interface KnowledgeIgnoranceEntry { entryId: string; type: KnowledgeIgnoranceType; source: KnowledgeIgnoranceSource; description: string; resonance: number; chapter: number; }
export interface KnowledgeIgnoranceMap { mapId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeIgnoranceEngineState { entries: Map<string, KnowledgeIgnoranceEntry>; maps: Map<string, KnowledgeIgnoranceMap>; totalEntries: number; totalMaps: number; averageResonance: number; ignoranceComplexity: number; ignoranceMastery: number; }
export function createNarrativeKnowledgeIgnoranceEngineState(): NarrativeKnowledgeIgnoranceEngineState { return { entries: new Map(), maps: new Map(), totalEntries: 0, totalMaps: 0, averageResonance: 0.5, ignoranceComplexity: 0.5, ignoranceMastery: 0.5 }; }
export function addKnowledgeIgnoranceEntry(state: NarrativeKnowledgeIgnoranceEngineState, entryId: string, type: KnowledgeIgnoranceType, source: KnowledgeIgnoranceSource, description: string, resonance: number, chapter: number): NarrativeKnowledgeIgnoranceEngineState {
  const entry: KnowledgeIgnoranceEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeIgnoranceMap(state: NarrativeKnowledgeIgnoranceEngineState, mapId: string, entryIds: string[]): NarrativeKnowledgeIgnoranceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeIgnoranceEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const map: KnowledgeIgnoranceMap = { mapId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, maps: new Map(state.maps).set(mapId, map), totalMaps: state.maps.size + 1 });
}
export function getKnowledgeIgnoranceEntriesByType(state: NarrativeKnowledgeIgnoranceEngineState, type: KnowledgeIgnoranceType): KnowledgeIgnoranceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeIgnoranceReport(state: NarrativeKnowledgeIgnoranceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge ignorance entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.ignoranceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMaps: state.totalMaps, averageResonance: Math.round(state.averageResonance * 100) / 100, ignoranceComplexity: Math.round(state.ignoranceComplexity * 100) / 100, ignoranceMastery: Math.round(state.ignoranceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeIgnoranceEngineState): NarrativeKnowledgeIgnoranceEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const maps = Array.from(state.maps.values());
  const ignoranceComplexity = maps.length === 0 ? 0.5 : maps.reduce((s, m) => s + m.breadth, 0) / maps.length;
  return { ...state, averageResonance, ignoranceComplexity, ignoranceMastery: averageResonance * 0.5 + ignoranceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeIgnoranceEngineState(): NarrativeKnowledgeIgnoranceEngineState { return createNarrativeKnowledgeIgnoranceEngineState(); }