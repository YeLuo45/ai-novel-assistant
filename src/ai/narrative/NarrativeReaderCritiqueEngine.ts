/**
 * V1718 NarrativeReaderCritiqueEngine — Direction P Iter 27/30 (Round 5)
 */
export type ReaderCritiqueType = 'formal' | 'thematic' | 'character' | 'plot' | 'stylistic' | 'transcendent' | 'infinite';
export type ReaderCritiqueSeverity = 'gentle' | 'balanced' | 'rigorous' | 'devastating' | 'transcendent' | 'infinite';
export interface ReaderCritiqueEntry { entryId: string; type: ReaderCritiqueType; severity: ReaderCritiqueSeverity; description: string; precision: number; chapter: number; }
export interface ReaderCritiqueDocument { documentId: string; entryIds: string[]; cumulativePrecision: number; breadth: number; }
export interface NarrativeReaderCritiqueEngineState { entries: Map<string, ReaderCritiqueEntry>; documents: Map<string, ReaderCritiqueDocument>; totalEntries: number; totalDocuments: number; averagePrecision: number; critiqueComplexity: number; critiqueMastery: number; }
export function createNarrativeReaderCritiqueEngineState(): NarrativeReaderCritiqueEngineState { return { entries: new Map(), documents: new Map(), totalEntries: 0, totalDocuments: 0, averagePrecision: 0.5, critiqueComplexity: 0.5, critiqueMastery: 0.5 }; }
export function addReaderCritiqueEntry(state: NarrativeReaderCritiqueEngineState, entryId: string, type: ReaderCritiqueType, severity: ReaderCritiqueSeverity, description: string, precision: number, chapter: number): NarrativeReaderCritiqueEngineState {
  const entry: ReaderCritiqueEntry = { entryId, type, severity, description, precision, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderCritiqueDocument(state: NarrativeReaderCritiqueEngineState, documentId: string, entryIds: string[]): NarrativeReaderCritiqueEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderCritiqueEntry => e !== undefined);
  const cumulativePrecision = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.precision, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const document: ReaderCritiqueDocument = { documentId, entryIds, cumulativePrecision, breadth };
  return recompute({ ...state, documents: new Map(state.documents).set(documentId, document), totalDocuments: state.documents.size + 1 });
}
export function getReaderCritiqueEntriesByType(state: NarrativeReaderCritiqueEngineState, type: ReaderCritiqueType): ReaderCritiqueEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderCritiqueReport(state: NarrativeReaderCritiqueEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader critique entries');
  if (state.averagePrecision < 0.5) recommendations.push('Low precision — strengthen');
  if (state.critiqueMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalDocuments: state.totalDocuments, averagePrecision: Math.round(state.averagePrecision * 100) / 100, critiqueComplexity: Math.round(state.critiqueComplexity * 100) / 100, critiqueMastery: Math.round(state.critiqueMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderCritiqueEngineState): NarrativeReaderCritiqueEngineState {
  const entries = Array.from(state.entries.values());
  const averagePrecision = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.precision, 0) / entries.length;
  const documents = Array.from(state.documents.values());
  const critiqueComplexity = documents.length === 0 ? 0.5 : documents.reduce((s, d) => s + d.breadth, 0) / documents.length;
  return { ...state, averagePrecision, critiqueComplexity, critiqueMastery: averagePrecision * 0.5 + critiqueComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderCritiqueEngineState(): NarrativeReaderCritiqueEngineState { return createNarrativeReaderCritiqueEngineState(); }