/**
 * V1188 NarrativeTimeStreamEngine — Direction G Iter 2/20 (Round 5)
 * Time stream engine: streaming time in narrative
 * Sources: thunderbolt stream + nanobot + ruflo
 */

export type TimeStreamType = 'linear' | 'branching' | 'merging' | 'splitting' | 'braided' | 'convergent';
export type TimeStreamFlow = 'stagnant' | 'trickling' | 'flowing' | 'rushing' | 'torrent';
export type TimeStreamContinuity = 'fragmented' | 'uneven' | 'continuous' | 'seamless' | 'boundless';

export interface TimeStream {
  streamId: string;
  type: TimeStreamType;
  flow: TimeStreamFlow;
  continuity: TimeStreamContinuity;
  description: string;
  flow_score: number;
  power: number;
  chapter: number;
}

export interface TimeStreamPattern {
  patternId: string,
  streamIds: string[],
  cumulativeFlow: number,
  depth: number,
}

export interface NarrativeTimeStreamEngineState {
  streams: Map<string, TimeStream>;
  patterns: Map<string, TimeStreamPattern>;
  totalStreams: number;
  totalPatterns: number;
  averageFlow: number;
  averagePower: number;
  patternDepth: number;
  timeStreamMastery: number;
}

// Factory
export function createNarrativeTimeStreamEngineState(): NarrativeTimeStreamEngineState {
  return {
    streams: new Map(),
    patterns: new Map(),
    totalStreams: 0,
    totalPatterns: 0,
    averageFlow: 0.5,
    averagePower: 0.5,
    patternDepth: 0.5,
    timeStreamMastery: 0.5,
  };
}

// Add stream
export function addTimeStream(
  state: NarrativeTimeStreamEngineState,
  streamId: string,
  type: TimeStreamType,
  flow: TimeStreamFlow,
  continuity: TimeStreamContinuity,
  description: string,
  flow_score: number,
  power: number,
  chapter: number
): NarrativeTimeStreamEngineState {
  const stream: TimeStream = { streamId, type, flow, continuity, description, flow_score, power, chapter };
  const streams = new Map(state.streams).set(streamId, stream);
  return recomputeTimeStream({ ...state, streams, totalStreams: streams.size });
}

// Add pattern
export function addTimeStreamPattern(
  state: NarrativeTimeStreamEngineState,
  patternId: string,
  streamIds: string[]
): NarrativeTimeStreamEngineState {
  const streams = streamIds.map(id => state.streams.get(id)).filter((s): s is TimeStream => s !== undefined);
  const cumulativeFlow = streams.length === 0 ? 0
    : streams.reduce((s, st) => s + st.flow_score, 0) / streams.length;
  const typeSet = new Set(streams.map(s => s.type));
  const depth = Math.min(1, typeSet.size / 6);
  const pattern: TimeStreamPattern = { patternId, streamIds, cumulativeFlow, depth };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeTimeStream({ ...state, patterns, totalPatterns: patterns.size });
}

// Get streams by type
export function getTimeStreamsByType(state: NarrativeTimeStreamEngineState, type: TimeStreamType): TimeStream[] {
  return Array.from(state.streams.values()).filter(s => s.type === type);
}

// Get time stream report
export function getTimeStreamReport(state: NarrativeTimeStreamEngineState): {
  totalStreams: number;
  totalPatterns: number;
  averageFlow: number;
  averagePower: number;
  timeStreamMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalStreams === 0) recommendations.push('No streams — add time streams');
  if (state.averageFlow < 0.5) recommendations.push('Low flow — strengthen');
  if (state.timeStreamMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalStreams: state.totalStreams,
    totalPatterns: state.totalPatterns,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    averagePower: Math.round(state.averagePower * 100) / 100,
    timeStreamMastery: Math.round(state.timeStreamMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeStream(state: NarrativeTimeStreamEngineState): NarrativeTimeStreamEngineState {
  const streams = Array.from(state.streams.values());
  const averageFlow = streams.length === 0 ? 0.5
    : streams.reduce((s, st) => s + st.flow_score, 0) / streams.length;
  const averagePower = streams.length === 0 ? 0.5
    : streams.reduce((s, st) => s + st.power, 0) / streams.length;

  const patterns = Array.from(state.patterns.values());
  const patternDepth = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.depth, 0) / patterns.length;

  const timeStreamMastery = (averageFlow * 0.4 + averagePower * 0.3 + patternDepth * 0.3);

  return { ...state, averageFlow, averagePower, patternDepth, timeStreamMastery };
}

// Reset
export function resetNarrativeTimeStreamEngineState(): NarrativeTimeStreamEngineState {
  return createNarrativeTimeStreamEngineState();
}