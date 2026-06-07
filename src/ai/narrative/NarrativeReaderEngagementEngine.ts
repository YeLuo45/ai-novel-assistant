/**
 * V1666 NarrativeReaderEngagementEngine — Direction P Iter 1/30 (Round 5)
 * Reader engagement engine: keeps reader engaged
 * Sources: nanobot engagement + thunderbolt + ruflo
 */
export type ReaderEngagementType = 'physical' | 'cognitive' | 'emotional' | 'social' | 'aesthetic' | 'transcendent' | 'infinite';
export type ReaderEngagementDepth = 'surface' | 'moderate' | 'deep' | 'profound' | 'transcendent' | 'infinite';
export interface ReaderEngagementEntry { entryId: string; type: ReaderEngagementType; depth: ReaderEngagementDepth; description: string; captivation: number; chapter: number; }
export interface ReaderEngagementLayer { layerId: string; entryIds: string[]; cumulativeCaptivation: number; breadth: number; }
export interface NarrativeReaderEngagementEngineState { entries: Map<string, ReaderEngagementEntry>; layers: Map<string, ReaderEngagementLayer>; totalEntries: number; totalLayers: number; averageCaptivation: number; engagementComplexity: number; engagementMastery: number; }
export function createNarrativeReaderEngagementEngineState(): NarrativeReaderEngagementEngineState { return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageCaptivation: 0.5, engagementComplexity: 0.5, engagementMastery: 0.5 }; }
export function addReaderEngagementEntry(state: NarrativeReaderEngagementEngineState, entryId: string, type: ReaderEngagementType, depth: ReaderEngagementDepth, description: string, captivation: number, chapter: number): NarrativeReaderEngagementEngineState {
  const entry: ReaderEngagementEntry = { entryId, type, depth, description, captivation, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderEngagementLayer(state: NarrativeReaderEngagementEngineState, layerId: string, entryIds: string[]): NarrativeReaderEngagementEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderEngagementEntry => e !== undefined);
  const cumulativeCaptivation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.captivation, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const layer: ReaderEngagementLayer = { layerId, entryIds, cumulativeCaptivation, breadth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}
export function getReaderEngagementEntriesByType(state: NarrativeReaderEngagementEngineState, type: ReaderEngagementType): ReaderEngagementEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderEngagementReport(state: NarrativeReaderEngagementEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader engagement entries');
  if (state.averageCaptivation < 0.5) recommendations.push('Low captivation — strengthen');
  if (state.engagementMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageCaptivation: Math.round(state.averageCaptivation * 100) / 100, engagementComplexity: Math.round(state.engagementComplexity * 100) / 100, engagementMastery: Math.round(state.engagementMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderEngagementEngineState): NarrativeReaderEngagementEngineState {
  const entries = Array.from(state.entries.values());
  const averageCaptivation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.captivation, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const engagementComplexity = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;
  return { ...state, averageCaptivation, engagementComplexity, engagementMastery: averageCaptivation * 0.5 + engagementComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderEngagementEngineState(): NarrativeReaderEngagementEngineState { return createNarrativeReaderEngagementEngineState(); }