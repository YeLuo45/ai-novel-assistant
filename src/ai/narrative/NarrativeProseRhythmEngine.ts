/**
 * V1146 NarrativeProseRhythmEngine — Direction F Iter 1/20 (Round 5)
 * Prose rhythm engine: rhythm of prose sentences
 * Sources: thunderbolt rhythm + nanobot + ruflo
 */

export type ProseRhythmType = 'staccato' | 'legato' | 'syncopated' | 'flowing' | 'staccato_legato' | 'syncopated_flowing';
export type ProseRhythmPace = 'glacial' | 'slow' | 'moderate' | 'brisk' | 'rapid';
export type ProseRhythmVariation = 'monotonous' | 'subtle' | 'varied' | 'dramatic' | 'wild';

export interface ProseRhythm {
  rhythmId: string;
  type: ProseRhythmType;
  pace: ProseRhythmPace;
  variation: ProseRhythmVariation;
  description: string;
  pulse: number;
  flow: number;
  chapter: number;
}

export interface ProseRhythmPattern {
  patternId: string,
  rhythmIds: string[],
  cumulativePulse: number,
  variation: number,
}

export interface NarrativeProseRhythmEngineState {
  rhythms: Map<string, ProseRhythm>;
  patterns: Map<string, ProseRhythmPattern>;
  totalRhythms: number;
  totalPatterns: number;
  averagePulse: number;
  averageFlow: number;
  patternVariation: number;
  proseRhythmMastery: number;
}

// Factory
export function createNarrativeProseRhythmEngineState(): NarrativeProseRhythmEngineState {
  return {
    rhythms: new Map(),
    patterns: new Map(),
    totalRhythms: 0,
    totalPatterns: 0,
    averagePulse: 0.5,
    averageFlow: 0.5,
    patternVariation: 0.5,
    proseRhythmMastery: 0.5,
  };
}

// Add rhythm
export function addProseRhythm(
  state: NarrativeProseRhythmEngineState,
  rhythmId: string,
  type: ProseRhythmType,
  pace: ProseRhythmPace,
  variation: ProseRhythmVariation,
  description: string,
  pulse: number,
  flow: number,
  chapter: number
): NarrativeProseRhythmEngineState {
  const rhythm: ProseRhythm = { rhythmId, type, pace, variation, description, pulse, flow, chapter };
  const rhythms = new Map(state.rhythms).set(rhythmId, rhythm);
  return recomputeProseRhythm({ ...state, rhythms, totalRhythms: rhythms.size });
}

// Add pattern
export function addProseRhythmPattern(
  state: NarrativeProseRhythmEngineState,
  patternId: string,
  rhythmIds: string[]
): NarrativeProseRhythmEngineState {
  const rhythms = rhythmIds.map(id => state.rhythms.get(id)).filter((r): r is ProseRhythm => r !== undefined);
  const cumulativePulse = rhythms.length === 0 ? 0
    : rhythms.reduce((s, r) => s + r.pulse, 0) / rhythms.length;
  const variation = rhythms.length === 0 ? 0.5
    : rhythms.reduce((s, r) => s + (r.variation === 'wild' ? 1 : r.variation === 'dramatic' ? 0.85 : r.variation === 'varied' ? 0.7 : r.variation === 'subtle' ? 0.5 : 0.3), 0) / rhythms.length;
  const pattern: ProseRhythmPattern = { patternId, rhythmIds, cumulativePulse, variation };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeProseRhythm({ ...state, patterns, totalPatterns: patterns.size });
}

// Get rhythms by type
export function getProseRhythmsByType(state: NarrativeProseRhythmEngineState, type: ProseRhythmType): ProseRhythm[] {
  return Array.from(state.rhythms.values()).filter(r => r.type === type);
}

// Get prose rhythm report
export function getProseRhythmReport(state: NarrativeProseRhythmEngineState): {
  totalRhythms: number;
  totalPatterns: number;
  averagePulse: number;
  averageFlow: number;
  proseRhythmMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRhythms === 0) recommendations.push('No rhythms — add prose rhythms');
  if (state.averagePulse < 0.5) recommendations.push('Low pulse — strengthen');
  if (state.proseRhythmMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRhythms: state.totalRhythms,
    totalPatterns: state.totalPatterns,
    averagePulse: Math.round(state.averagePulse * 100) / 100,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    proseRhythmMastery: Math.round(state.proseRhythmMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeProseRhythm(state: NarrativeProseRhythmEngineState): NarrativeProseRhythmEngineState {
  const rhythms = Array.from(state.rhythms.values());
  const averagePulse = rhythms.length === 0 ? 0.5
    : rhythms.reduce((s, r) => s + r.pulse, 0) / rhythms.length;
  const averageFlow = rhythms.length === 0 ? 0.5
    : rhythms.reduce((s, r) => s + r.flow, 0) / rhythms.length;

  const patterns = Array.from(state.patterns.values());
  const patternVariation = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.variation, 0) / patterns.length;

  const proseRhythmMastery = (averagePulse * 0.4 + averageFlow * 0.3 + patternVariation * 0.3);

  return { ...state, averagePulse, averageFlow, patternVariation, proseRhythmMastery };
}

// Reset
export function resetNarrativeProseRhythmEngineState(): NarrativeProseRhythmEngineState {
  return createNarrativeProseRhythmEngineState();
}