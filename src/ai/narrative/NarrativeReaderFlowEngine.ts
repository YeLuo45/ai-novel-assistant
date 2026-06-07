/**
 * V1698 NarrativeReaderFlowEngine — Direction P Iter 17/30 (Round 5)
 */
export type ReaderFlowType = 'narrative' | 'cognitive' | 'emotional' | 'aesthetic' | 'transcendent' | 'infinite';
export type ReaderFlowStage = 'struggle' | 'arousal' | 'control' | 'release' | 'transcendent' | 'infinite';
export interface ReaderFlowEntry { entryId: string; type: ReaderFlowType; stage: ReaderFlowStage; description: string; flow: number; chapter: number; }
export interface ReaderFlowChannel { channelId: string; entryIds: string[]; cumulativeFlow: number; breadth: number; }
export interface NarrativeReaderFlowEngineState { entries: Map<string, ReaderFlowEntry>; channels: Map<string, ReaderFlowChannel>; totalEntries: number; totalChannels: number; averageFlow: number; flowComplexity: number; flowMastery: number; }
export function createNarrativeReaderFlowEngineState(): NarrativeReaderFlowEngineState { return { entries: new Map(), channels: new Map(), totalEntries: 0, totalChannels: 0, averageFlow: 0.5, flowComplexity: 0.5, flowMastery: 0.5 }; }
export function addReaderFlowEntry(s: NarrativeReaderFlowEngineState, entryId: string, type: ReaderFlowType, stage: ReaderFlowStage, description: string, flow: number, chapter: number): NarrativeReaderFlowEngineState {
  const entry: ReaderFlowEntry = { entryId, type, stage, description, flow, chapter };
  return recompute({ ...s, entries: new Map(s.entries).set(entryId, entry), totalEntries: s.entries.size + 1 });
}
export function addReaderFlowChannel(s: NarrativeReaderFlowEngineState, channelId: string, entryIds: string[]): NarrativeReaderFlowEngineState {
  const entries = entryIds.map(id => s.entries.get(id)).filter((e): e is ReaderFlowEntry => e !== undefined);
  const cumulativeFlow = entries.length === 0 ? 0 : entries.reduce((sum, e) => sum + e.flow, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const channel: ReaderFlowChannel = { channelId, entryIds, cumulativeFlow, breadth };
  return recompute({ ...s, channels: new Map(s.channels).set(channelId, channel), totalChannels: s.channels.size + 1 });
}
export function getReaderFlowEntriesByType(s: NarrativeReaderFlowEngineState, type: ReaderFlowType): ReaderFlowEntry[] { return Array.from(s.entries.values()).filter(e => e.type === type); }
export function getReaderFlowReport(s: NarrativeReaderFlowEngineState) {
  const recommendations: string[] = [];
  if (s.totalEntries === 0) recommendations.push('No entries — add reader flow entries');
  if (s.averageFlow < 0.5) recommendations.push('Low flow — strengthen');
  if (s.flowMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: s.totalEntries, totalChannels: s.totalChannels, averageFlow: Math.round(s.averageFlow * 100) / 100, flowComplexity: Math.round(s.flowComplexity * 100) / 100, flowMastery: Math.round(s.flowMastery * 100) / 100, recommendations };
}
function recompute(s: NarrativeReaderFlowEngineState): NarrativeReaderFlowEngineState {
  const entries = Array.from(s.entries.values());
  const averageFlow = entries.length === 0 ? 0.5 : entries.reduce((sum, e) => sum + e.flow, 0) / entries.length;
  const channels = Array.from(s.channels.values());
  const flowComplexity = channels.length === 0 ? 0.5 : channels.reduce((sum, c) => sum + c.breadth, 0) / channels.length;
  return { ...s, averageFlow, flowComplexity, flowMastery: averageFlow * 0.5 + flowComplexity * 0.3 + Math.min(0.2, s.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderFlowEngineState(): NarrativeReaderFlowEngineState { return createNarrativeReaderFlowEngineState(); }