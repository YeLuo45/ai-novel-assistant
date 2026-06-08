/**
 * V2062 NarrativeBodyVoiceEngine — Direction V Iter 19/30 (Round 5)
 */
export type BodyVoiceType = 'whisper' | 'speech' | 'song' | 'cry' | 'laugh' | 'transcendent' | 'infinite';
export type BodyVoiceQuality = 'soft' | 'loud' | 'rough' | 'smooth' | 'transcendent' | 'infinite';
export interface BodyVoiceEntry { entryId: string; type: BodyVoiceType; quality: BodyVoiceQuality; description: string; resonance: number; chapter: number; }
export interface BodyVoiceUtterance { utteranceId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeBodyVoiceEngineState { entries: Map<string, BodyVoiceEntry>; utterances: Map<string, BodyVoiceUtterance>; totalEntries: number; totalUtterances: number; averageResonance: number; voiceComplexity: number; voiceMastery: number; }
export function createNarrativeBodyVoiceEngineState(): NarrativeBodyVoiceEngineState { return { entries: new Map(), utterances: new Map(), totalEntries: 0, totalUtterances: 0, averageResonance: 0.5, voiceComplexity: 0.5, voiceMastery: 0.5 }; }
export function addBodyVoiceEntry(state: NarrativeBodyVoiceEngineState, entryId: string, type: BodyVoiceType, quality: BodyVoiceQuality, description: string, resonance: number, chapter: number): NarrativeBodyVoiceEngineState {
  const entry: BodyVoiceEntry = { entryId, type, quality, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addBodyVoiceUtterance(state: NarrativeBodyVoiceEngineState, utteranceId: string, entryIds: string[]): NarrativeBodyVoiceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is BodyVoiceEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const utterance: BodyVoiceUtterance = { utteranceId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, utterances: new Map(state.utterances).set(utteranceId, utterance), totalUtterances: state.utterances.size + 1 });
}
export function getBodyVoiceEntriesByType(state: NarrativeBodyVoiceEngineState, type: BodyVoiceType): BodyVoiceEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getBodyVoiceReport(state: NarrativeBodyVoiceEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add body voice entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.voiceMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalUtterances: state.totalUtterances, averageResonance: Math.round(state.averageResonance * 100) / 100, voiceComplexity: Math.round(state.voiceComplexity * 100) / 100, voiceMastery: Math.round(state.voiceMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeBodyVoiceEngineState): NarrativeBodyVoiceEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const utterances = Array.from(state.utterances.values());
  const voiceComplexity = utterances.length === 0 ? 0.5 : utterances.reduce((s, u) => s + u.breadth, 0) / utterances.length;
  return { ...state, averageResonance, voiceComplexity, voiceMastery: averageResonance * 0.5 + voiceComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeBodyVoiceEngineState(): NarrativeBodyVoiceEngineState { return createNarrativeBodyVoiceEngineState(); }