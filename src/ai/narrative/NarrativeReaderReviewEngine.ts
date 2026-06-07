/**
 * V1720 NarrativeReaderReviewEngine — Direction P Iter 28/30 (Round 5)
 */
export type ReaderReviewType = 'professional' | 'amateur' | 'user' | 'aggregated' | 'meta' | 'transcendent' | 'infinite';
export type ReaderReviewScope = 'comprehensive' | 'focused' | 'thematic' | 'comparative' | 'transcendent' | 'infinite';
export interface ReaderReviewEntry { entryId: string; type: ReaderReviewType; scope: ReaderReviewScope; description: string; informativeness: number; chapter: number; }
export interface ReaderReviewDocument { documentId: string; entryIds: string[]; cumulativeInformativeness: number; breadth: number; }
export interface NarrativeReaderReviewEngineState { entries: Map<string, ReaderReviewEntry>; documents: Map<string, ReaderReviewDocument>; totalEntries: number; totalDocuments: number; averageInformativeness: number; reviewComplexity: number; reviewMastery: number; }
export function createNarrativeReaderReviewEngineState(): NarrativeReaderReviewEngineState { return { entries: new Map(), documents: new Map(), totalEntries: 0, totalDocuments: 0, averageInformativeness: 0.5, reviewComplexity: 0.5, reviewMastery: 0.5 }; }
export function addReaderReviewEntry(state: NarrativeReaderReviewEngineState, entryId: string, type: ReaderReviewType, scope: ReaderReviewScope, description: string, informativeness: number, chapter: number): NarrativeReaderReviewEngineState {
  const entry: ReaderReviewEntry = { entryId, type, scope, description, informativeness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderReviewDocument(state: NarrativeReaderReviewEngineState, documentId: string, entryIds: string[]): NarrativeReaderReviewEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderReviewEntry => e !== undefined);
  const cumulativeInformativeness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.informativeness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const document: ReaderReviewDocument = { documentId, entryIds, cumulativeInformativeness, breadth };
  return recompute({ ...state, documents: new Map(state.documents).set(documentId, document), totalDocuments: state.documents.size + 1 });
}
export function getReaderReviewEntriesByType(state: NarrativeReaderReviewEngineState, type: ReaderReviewType): ReaderReviewEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderReviewReport(state: NarrativeReaderReviewEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader review entries');
  if (state.averageInformativeness < 0.5) recommendations.push('Low informativeness — strengthen');
  if (state.reviewMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalDocuments: state.totalDocuments, averageInformativeness: Math.round(state.averageInformativeness * 100) / 100, reviewComplexity: Math.round(state.reviewComplexity * 100) / 100, reviewMastery: Math.round(state.reviewMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderReviewEngineState): NarrativeReaderReviewEngineState {
  const entries = Array.from(state.entries.values());
  const averageInformativeness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.informativeness, 0) / entries.length;
  const documents = Array.from(state.documents.values());
  const reviewComplexity = documents.length === 0 ? 0.5 : documents.reduce((s, d) => s + d.breadth, 0) / documents.length;
  return { ...state, averageInformativeness, reviewComplexity, reviewMastery: averageInformativeness * 0.5 + reviewComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderReviewEngineState(): NarrativeReaderReviewEngineState { return createNarrativeReaderReviewEngineState(); }