/**
 * V1132 NarrativeMemorabilityEngine — Direction E Iter 14/20 (Round 5)
 * Memorability engine: what makes narrative memorable
 * Sources: thunderbolt memorability + nanobot + ruflo
 */

export type MemorabilityType = 'image' | 'phrase' | 'scene' | 'character' | 'moment' | 'theme';
export type MemorabilityStrength = 'forgettable' | 'faint' | 'vivid' | 'unforgettable' | 'haunting';
export type MemorabilityTrigger = 'novelty' | 'emotion' | 'repetition' | 'distinctiveness' | 'meaning' | 'surprise';

export interface Memorability {
  memorabilityId: string;
  type: MemorabilityType;
  strength: MemorabilityStrength;
  trigger: MemorabilityTrigger;
  description: string;
  retention: number;
  recall: number;
  chapter: number;
}

export interface MemorabilityTrace {
  traceId: string,
  memorabilityIds: string[],
  cumulativeRetention: number,
  longevity: number,
}

export interface NarrativeMemorabilityEngineState {
  memorabilities: Map<string, Memorability>;
  traces: Map<string, MemorabilityTrace>;
  totalMemorabilities: number;
  totalTraces: number;
  averageRetention: number;
  averageRecall: number;
  traceLongevity: number;
  memorabilityMastery: number;
}

// Factory
export function createNarrativeMemorabilityEngineState(): NarrativeMemorabilityEngineState {
  return {
    memorabilities: new Map(),
    traces: new Map(),
    totalMemorabilities: 0,
    totalTraces: 0,
    averageRetention: 0.5,
    averageRecall: 0.5,
    traceLongevity: 0.5,
    memorabilityMastery: 0.5,
  };
}

// Add memorability
export function addMemorability(
  state: NarrativeMemorabilityEngineState,
  memorabilityId: string,
  type: MemorabilityType,
  strength: MemorabilityStrength,
  trigger: MemorabilityTrigger,
  description: string,
  retention: number,
  recall: number,
  chapter: number
): NarrativeMemorabilityEngineState {
  const memorability: Memorability = { memorabilityId, type, strength, trigger, description, retention, recall, chapter };
  const memorabilities = new Map(state.memorabilities).set(memorabilityId, memorability);
  return recomputeMemorability({ ...state, memorabilities, totalMemorabilities: memorabilities.size });
}

// Add trace
export function addMemorabilityTrace(
  state: NarrativeMemorabilityEngineState,
  traceId: string,
  memorabilityIds: string[]
): NarrativeMemorabilityEngineState {
  const memorabilities = memorabilityIds.map(id => state.memorabilities.get(id)).filter((m): m is Memorability => m !== undefined);
  const cumulativeRetention = memorabilities.length === 0 ? 0
    : memorabilities.reduce((s, m) => s + m.retention, 0) / memorabilities.length;
  const longevity = memorabilities.length === 0 ? 0.5
    : memorabilities.reduce((s, m) => s + (m.strength === 'haunting' ? 1 : m.strength === 'unforgettable' ? 0.85 : m.strength === 'vivid' ? 0.7 : m.strength === 'faint' ? 0.5 : 0.3), 0) / memorabilities.length;
  const trace: MemorabilityTrace = { traceId, memorabilityIds, cumulativeRetention, longevity };
  const traces = new Map(state.traces).set(traceId, trace);
  return recomputeMemorability({ ...state, traces, totalTraces: traces.size });
}

// Get memorabilities by type
export function getMemorabilitiesByType(state: NarrativeMemorabilityEngineState, type: MemorabilityType): Memorability[] {
  return Array.from(state.memorabilities.values()).filter(m => m.type === type);
}

// Get memorability report
export function getMemorabilityReport(state: NarrativeMemorabilityEngineState): {
  totalMemorabilities: number;
  totalTraces: number;
  averageRetention: number;
  averageRecall: number;
  memorabilityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMemorabilities === 0) recommendations.push('No memorabilities — add memorabilities');
  if (state.averageRetention < 0.5) recommendations.push('Low retention — strengthen');
  if (state.memorabilityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalMemorabilities: state.totalMemorabilities,
    totalTraces: state.totalTraces,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    averageRecall: Math.round(state.averageRecall * 100) / 100,
    memorabilityMastery: Math.round(state.memorabilityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMemorability(state: NarrativeMemorabilityEngineState): NarrativeMemorabilityEngineState {
  const memorabilities = Array.from(state.memorabilities.values());
  const averageRetention = memorabilities.length === 0 ? 0.5
    : memorabilities.reduce((s, m) => s + m.retention, 0) / memorabilities.length;
  const averageRecall = memorabilities.length === 0 ? 0.5
    : memorabilities.reduce((s, m) => s + m.recall, 0) / memorabilities.length;

  const traces = Array.from(state.traces.values());
  const traceLongevity = traces.length === 0 ? 0.5
    : traces.reduce((s, t) => s + t.longevity, 0) / traces.length;

  const memorabilityMastery = (averageRetention * 0.4 + averageRecall * 0.3 + traceLongevity * 0.3);

  return { ...state, averageRetention, averageRecall, traceLongevity, memorabilityMastery };
}

// Reset
export function resetNarrativeMemorabilityEngineState(): NarrativeMemorabilityEngineState {
  return createNarrativeMemorabilityEngineState();
}