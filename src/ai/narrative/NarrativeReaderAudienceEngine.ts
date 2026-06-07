/**
 * V1722 NarrativeReaderAudienceEngine — Direction P Iter 29/30 (Round 5)
 */
export type ReaderAudienceType = 'mass' | 'niche' | 'expert' | 'youth' | 'mature' | 'transcendent' | 'infinite';
export type ReaderAudienceEngagement = 'casual' | 'moderate' | 'dedicated' | 'obsessive' | 'transcendent' | 'infinite';
export interface ReaderAudienceEntry { entryId: string; type: ReaderAudienceType; engagement: ReaderAudienceEngagement; description: string; reach: number; chapter: number; }
export interface ReaderAudienceSegment { segmentId: string; entryIds: string[]; cumulativeReach: number; breadth: number; }
export interface NarrativeReaderAudienceEngineState { entries: Map<string, ReaderAudienceEntry>; segments: Map<string, ReaderAudienceSegment>; totalEntries: number; totalSegments: number; averageReach: number; audienceComplexity: number; audienceMastery: number; }
export function createNarrativeReaderAudienceEngineState(): NarrativeReaderAudienceEngineState { return { entries: new Map(), segments: new Map(), totalEntries: 0, totalSegments: 0, averageReach: 0.5, audienceComplexity: 0.5, audienceMastery: 0.5 }; }
export function addReaderAudienceEntry(state: NarrativeReaderAudienceEngineState, entryId: string, type: ReaderAudienceType, engagement: ReaderAudienceEngagement, description: string, reach: number, chapter: number): NarrativeReaderAudienceEngineState {
  const entry: ReaderAudienceEntry = { entryId, type, engagement, description, reach, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderAudienceSegment(state: NarrativeReaderAudienceEngineState, segmentId: string, entryIds: string[]): NarrativeReaderAudienceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderAudienceEntry => e !== undefined);
  const cumulativeReach = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.reach, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const segment: ReaderAudienceSegment = { segmentId, entryIds, cumulativeReach, breadth };
  return recompute({ ...state, segments: new Map(state.segments).set(segmentId, segment), totalSegments: state.segments.size + 1 });
}
export function getReaderAudienceEntriesByType(state: NarrativeReaderAudienceEngineState, type: ReaderAudienceType): ReaderAudienceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderAudienceReport(state: NarrativeReaderAudienceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader audience entries');
  if (state.averageReach < 0.5) recommendations.push('Low reach — strengthen');
  if (state.audienceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSegments: state.totalSegments, averageReach: Math.round(state.averageReach * 100) / 100, audienceComplexity: Math.round(state.audienceComplexity * 100) / 100, audienceMastery: Math.round(state.audienceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderAudienceEngineState): NarrativeReaderAudienceEngineState {
  const entries = Array.from(state.entries.values());
  const averageReach = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.reach, 0) / entries.length;
  const segments = Array.from(state.segments.values());
  const audienceComplexity = segments.length === 0 ? 0.5 : segments.reduce((s, se) => s + se.breadth, 0) / segments.length;
  return { ...state, averageReach, audienceComplexity, audienceMastery: averageReach * 0.5 + audienceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderAudienceEngineState(): NarrativeReaderAudienceEngineState { return createNarrativeReaderAudienceEngineState(); }