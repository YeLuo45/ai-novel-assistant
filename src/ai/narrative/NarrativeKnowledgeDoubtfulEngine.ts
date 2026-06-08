/**
 * V2006 NarrativeKnowledgeDoubtfulEngine — Direction U Iter 21/30 (Round 5)
 */
export type KnowledgeDoubtfulType = 'unverified' | 'unreliable' | 'conflicting' | 'speculative' | 'pseudoscientific' | 'transcendent' | 'infinite';
export type KnowledgeDoubtfulSource = 'lack_evidence' | 'conflicting_evidence' | 'bias' | 'error' | 'transcendent' | 'infinite';
export interface KnowledgeDoubtfulEntry { entryId: string; type: KnowledgeDoubtfulType; source: KnowledgeDoubtfulSource; description: string; resonance: number; chapter: number; }
export interface KnowledgeDoubtfulInquiry { inquiryId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeDoubtfulEngineState { entries: Map<string, KnowledgeDoubtfulEntry>; inquiries: Map<string, KnowledgeDoubtfulInquiry>; totalEntries: number; totalInquiries: number; averageResonance: number; doubtfulComplexity: number; doubtfulMastery: number; }
export function createNarrativeKnowledgeDoubtfulEngineState(): NarrativeKnowledgeDoubtfulEngineState { return { entries: new Map(), inquiries: new Map(), totalEntries: 0, totalInquiries: 0, averageResonance: 0.5, doubtfulComplexity: 0.5, doubtfulMastery: 0.5 }; }
export function addKnowledgeDoubtfulEntry(state: NarrativeKnowledgeDoubtfulEngineState, entryId: string, type: KnowledgeDoubtfulType, source: KnowledgeDoubtfulSource, description: string, resonance: number, chapter: number): NarrativeKnowledgeDoubtfulEngineState {
  const entry: KnowledgeDoubtfulEntry = { entryId, type, source, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeDoubtfulInquiry(state: NarrativeKnowledgeDoubtfulEngineState, inquiryId: string, entryIds: string[]): NarrativeKnowledgeDoubtfulEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeDoubtfulEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const inquiry: KnowledgeDoubtfulInquiry = { inquiryId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, inquiries: new Map(state.inquiries).set(inquiryId, inquiry), totalInquiries: state.inquiries.size + 1 });
}
export function getKnowledgeDoubtfulEntriesByType(state: NarrativeKnowledgeDoubtfulEngineState, type: KnowledgeDoubtfulType): KnowledgeDoubtfulEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeDoubtfulReport(state: NarrativeKnowledgeDoubtfulEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge doubtful entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.doubtfulMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalInquiries: state.totalInquiries, averageResonance: Math.round(state.averageResonance * 100) / 100, doubtfulComplexity: Math.round(state.doubtfulComplexity * 100) / 100, doubtfulMastery: Math.round(state.doubtfulMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeDoubtfulEngineState): NarrativeKnowledgeDoubtfulEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const inquiries = Array.from(state.inquiries.values());
  const doubtfulComplexity = inquiries.length === 0 ? 0.5 : inquiries.reduce((s, i) => s + i.breadth, 0) / inquiries.length;
  return { ...state, averageResonance, doubtfulComplexity, doubtfulMastery: averageResonance * 0.5 + doubtfulComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeDoubtfulEngineState(): NarrativeKnowledgeDoubtfulEngineState { return createNarrativeKnowledgeDoubtfulEngineState(); }