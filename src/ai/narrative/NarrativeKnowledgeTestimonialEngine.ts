/**
 * V1986 NarrativeKnowledgeTestimonialEngine — Direction U Iter 11/30 (Round 5)
 */
export type KnowledgeTestimonialType = 'first_hand' | 'second_hand' | 'expert' | 'community' | 'institutional' | 'transcendent' | 'infinite';
export type KnowledgeTestimonialReliability = 'credible' | 'corroborated' | 'uncorroborated' | 'questionable' | 'transcendent' | 'infinite';
export interface KnowledgeTestimonialEntry { entryId: string; type: KnowledgeTestimonialType; reliability: KnowledgeTestimonialReliability; description: string; resonance: number; chapter: number; }
export interface KnowledgeTestimonialNetwork { networkId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeKnowledgeTestimonialEngineState { entries: Map<string, KnowledgeTestimonialEntry>; networks: Map<string, KnowledgeTestimonialNetwork>; totalEntries: number; totalNetworks: number; averageResonance: number; testimonialComplexity: number; testimonialMastery: number; }
export function createNarrativeKnowledgeTestimonialEngineState(): NarrativeKnowledgeTestimonialEngineState { return { entries: new Map(), networks: new Map(), totalEntries: 0, totalNetworks: 0, averageResonance: 0.5, testimonialComplexity: 0.5, testimonialMastery: 0.5 }; }
export function addKnowledgeTestimonialEntry(state: NarrativeKnowledgeTestimonialEngineState, entryId: string, type: KnowledgeTestimonialType, reliability: KnowledgeTestimonialReliability, description: string, resonance: number, chapter: number): NarrativeKnowledgeTestimonialEngineState {
  const entry: KnowledgeTestimonialEntry = { entryId, type, reliability, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addKnowledgeTestimonialNetwork(state: NarrativeKnowledgeTestimonialEngineState, networkId: string, entryIds: string[]): NarrativeKnowledgeTestimonialEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is KnowledgeTestimonialEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const network: KnowledgeTestimonialNetwork = { networkId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, networks: new Map(state.networks).set(networkId, network), totalNetworks: state.networks.size + 1 });
}
export function getKnowledgeTestimonialEntriesByType(state: NarrativeKnowledgeTestimonialEngineState, type: KnowledgeTestimonialType): KnowledgeTestimonialEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getKnowledgeTestimonialReport(state: NarrativeKnowledgeTestimonialEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add knowledge testimonial entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.testimonialMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalNetworks: state.totalNetworks, averageResonance: Math.round(state.averageResonance * 100) / 100, testimonialComplexity: Math.round(state.testimonialComplexity * 100) / 100, testimonialMastery: Math.round(state.testimonialMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeKnowledgeTestimonialEngineState): NarrativeKnowledgeTestimonialEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const networks = Array.from(state.networks.values());
  const testimonialComplexity = networks.length === 0 ? 0.5 : networks.reduce((s, n) => s + n.breadth, 0) / networks.length;
  return { ...state, averageResonance, testimonialComplexity, testimonialMastery: averageResonance * 0.5 + testimonialComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeKnowledgeTestimonialEngineState(): NarrativeKnowledgeTestimonialEngineState { return createNarrativeKnowledgeTestimonialEngineState(); }