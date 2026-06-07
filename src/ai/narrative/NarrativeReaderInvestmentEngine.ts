/**
 * V1680 NarrativeReaderInvestmentEngine — Direction P Iter 8/30 (Round 5)
 */
export type ReaderInvestmentType = 'emotional' | 'cognitive' | 'financial' | 'temporal' | 'social' | 'transcendent' | 'infinite';
export type ReaderInvestmentStage = 'initial' | 'building' | 'peak' | 'sustained' | 'transcendent' | 'infinite';
export interface ReaderInvestmentEntry { entryId: string; type: ReaderInvestmentType; stage: ReaderInvestmentStage; description: string; commitment: number; chapter: number; }
export interface ReaderInvestmentTrack { trackId: string; entryIds: string[]; cumulativeCommitment: number; breadth: number; }
export interface NarrativeReaderInvestmentEngineState { entries: Map<string, ReaderInvestmentEntry>; tracks: Map<string, ReaderInvestmentTrack>; totalEntries: number; totalTracks: number; averageCommitment: number; investmentComplexity: number; investmentMastery: number; }
export function createNarrativeReaderInvestmentEngineState(): NarrativeReaderInvestmentEngineState { return { entries: new Map(), tracks: new Map(), totalEntries: 0, totalTracks: 0, averageCommitment: 0.5, investmentComplexity: 0.5, investmentMastery: 0.5 }; }
export function addReaderInvestmentEntry(state: NarrativeReaderInvestmentEngineState, entryId: string, type: ReaderInvestmentType, stage: ReaderInvestmentStage, description: string, commitment: number, chapter: number): NarrativeReaderInvestmentEngineState {
  const entry: ReaderInvestmentEntry = { entryId, type, stage, description, commitment, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderInvestmentTrack(state: NarrativeReaderInvestmentEngineState, trackId: string, entryIds: string[]): NarrativeReaderInvestmentEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderInvestmentEntry => e !== undefined);
  const cumulativeCommitment = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.commitment, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const track: ReaderInvestmentTrack = { trackId, entryIds, cumulativeCommitment, breadth };
  return recompute({ ...state, tracks: new Map(state.tracks).set(trackId, track), totalTracks: state.tracks.size + 1 });
}
export function getReaderInvestmentEntriesByType(state: NarrativeReaderInvestmentEngineState, type: ReaderInvestmentType): ReaderInvestmentEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderInvestmentReport(state: NarrativeReaderInvestmentEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader investment entries');
  if (state.averageCommitment < 0.5) recommendations.push('Low commitment — strengthen');
  if (state.investmentMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTracks: state.totalTracks, averageCommitment: Math.round(state.averageCommitment * 100) / 100, investmentComplexity: Math.round(state.investmentComplexity * 100) / 100, investmentMastery: Math.round(state.investmentMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderInvestmentEngineState): NarrativeReaderInvestmentEngineState {
  const entries = Array.from(state.entries.values());
  const averageCommitment = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.commitment, 0) / entries.length;
  const tracks = Array.from(state.tracks.values());
  const investmentComplexity = tracks.length === 0 ? 0.5 : tracks.reduce((s, t) => s + t.breadth, 0) / tracks.length;
  return { ...state, averageCommitment, investmentComplexity, investmentMastery: averageCommitment * 0.5 + investmentComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderInvestmentEngineState(): NarrativeReaderInvestmentEngineState { return createNarrativeReaderInvestmentEngineState(); }