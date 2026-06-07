/**
 * V1546 NarrativeStyleVoiceEngine — Direction N Iter 1/30 (Round 5)
 * Style voice engine: unique narrative voice
 * Sources: thunderbolt voice + nanobot + ruflo
 */

export type StyleVoiceType = 'lyrical' | 'sparse' | 'verbose' | 'formal' | 'casual' | 'archaic' | 'modern' | 'transcendent' | 'infinite';
export type StyleVoiceConsistency = 'inconsistent' | 'developing' | 'consistent' | 'masterful' | 'transcendent' | 'infinite';
export interface StyleVoiceEntry { entryId: string; type: StyleVoiceType; consistency: StyleVoiceConsistency; description: string; distinctiveness: number; chapter: number; }
export interface StyleVoiceSample { sampleId: string; entryIds: string[]; cumulativeDistinctiveness: number; breadth: number; }
export interface NarrativeStyleVoiceEngineState { entries: Map<string, StyleVoiceEntry>; samples: Map<string, StyleVoiceSample>; totalEntries: number; totalSamples: number; averageDistinctiveness: number; voiceComplexity: number; voiceMastery: number; }
export function createNarrativeStyleVoiceEngineState(): NarrativeStyleVoiceEngineState { return { entries: new Map(), samples: new Map(), totalEntries: 0, totalSamples: 0, averageDistinctiveness: 0.5, voiceComplexity: 0.5, voiceMastery: 0.5 }; }
export function addStyleVoiceEntry(state: NarrativeStyleVoiceEngineState, entryId: string, type: StyleVoiceType, consistency: StyleVoiceConsistency, description: string, distinctiveness: number, chapter: number): NarrativeStyleVoiceEngineState {
  const entry: StyleVoiceEntry = { entryId, type, consistency, description, distinctiveness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleVoiceSample(state: NarrativeStyleVoiceEngineState, sampleId: string, entryIds: string[]): NarrativeStyleVoiceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleVoiceEntry => e !== undefined);
  const cumulativeDistinctiveness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.distinctiveness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 9);
  const sample: StyleVoiceSample = { sampleId, entryIds, cumulativeDistinctiveness, breadth };
  return recompute({ ...state, samples: new Map(state.samples).set(sampleId, sample), totalSamples: state.samples.size + 1 });
}
export function getStyleVoiceEntriesByType(state: NarrativeStyleVoiceEngineState, type: StyleVoiceType): StyleVoiceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleVoiceReport(state: NarrativeStyleVoiceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style voice entries');
  if (state.averageDistinctiveness < 0.5) recommendations.push('Low distinctiveness — strengthen');
  if (state.voiceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSamples: state.totalSamples, averageDistinctiveness: Math.round(state.averageDistinctiveness * 100) / 100, voiceComplexity: Math.round(state.voiceComplexity * 100) / 100, voiceMastery: Math.round(state.voiceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleVoiceEngineState): NarrativeStyleVoiceEngineState {
  const entries = Array.from(state.entries.values());
  const averageDistinctiveness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.distinctiveness, 0) / entries.length;
  const samples = Array.from(state.samples.values());
  const voiceComplexity = samples.length === 0 ? 0.5 : samples.reduce((s, sm) => s + sm.breadth, 0) / samples.length;
  return { ...state, averageDistinctiveness, voiceComplexity, voiceMastery: averageDistinctiveness * 0.5 + voiceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleVoiceEngineState(): NarrativeStyleVoiceEngineState { return createNarrativeStyleVoiceEngineState(); }