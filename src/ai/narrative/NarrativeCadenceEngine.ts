/**
 * V1166 NarrativeCadenceEngine — Direction F Iter 11/20 (Round 5)
 * Cadence engine: cadence of prose
 * Sources: ruflo cadence + nanobot + thunderbolt
 */

export type CadenceType = 'rising' | 'falling' | 'balanced' | 'cumulative' | 'antithetical' | 'periodic';
export type CadenceSmoothness = 'rough' | 'uneven' | 'smooth' | 'polished' | 'effortless';
export type CadenceVariation = 'monotonous' | 'subtle' | 'varied' | 'dramatic' | 'arresting';

export interface Cadence {
  cadenceId: string;
  type: CadenceType;
  smoothness: CadenceSmoothness;
  variation: CadenceVariation;
  description: string;
  flow: number;
  music: number;
  chapter: number;
}

export interface CadencePattern {
  patternId: string,
  cadenceIds: string[],
  cumulativeFlow: number,
  variation: number,
}

export interface NarrativeCadenceEngineState {
  cadences: Map<string, Cadence>;
  patterns: Map<string, CadencePattern>;
  totalCadences: number;
  totalPatterns: number;
  averageFlow: number;
  averageMusic: number;
  patternVariation: number;
  cadenceMastery: number;
}

// Factory
export function createNarrativeCadenceEngineState(): NarrativeCadenceEngineState {
  return {
    cadences: new Map(),
    patterns: new Map(),
    totalCadences: 0,
    totalPatterns: 0,
    averageFlow: 0.5,
    averageMusic: 0.5,
    patternVariation: 0.5,
    cadenceMastery: 0.5,
  };
}

// Add cadence
export function addCadence(
  state: NarrativeCadenceEngineState,
  cadenceId: string,
  type: CadenceType,
  smoothness: CadenceSmoothness,
  variation: CadenceVariation,
  description: string,
  flow: number,
  music: number,
  chapter: number
): NarrativeCadenceEngineState {
  const cadence: Cadence = { cadenceId, type, smoothness, variation, description, flow, music, chapter };
  const cadences = new Map(state.cadences).set(cadenceId, cadence);
  return recomputeCadence({ ...state, cadences, totalCadences: cadences.size });
}

// Add pattern
export function addCadencePattern(
  state: NarrativeCadenceEngineState,
  patternId: string,
  cadenceIds: string[]
): NarrativeCadenceEngineState {
  const cadences = cadenceIds.map(id => state.cadences.get(id)).filter((c): c is Cadence => c !== undefined);
  const cumulativeFlow = cadences.length === 0 ? 0
    : cadences.reduce((s, c) => s + c.flow, 0) / cadences.length;
  const variation = cadences.length === 0 ? 0.5
    : cadences.reduce((s, c) => s + (c.variation === 'arresting' ? 1 : c.variation === 'dramatic' ? 0.85 : c.variation === 'varied' ? 0.7 : c.variation === 'subtle' ? 0.5 : 0.3), 0) / cadences.length;
  const pattern: CadencePattern = { patternId, cadenceIds, cumulativeFlow, variation };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeCadence({ ...state, patterns, totalPatterns: patterns.size });
}

// Get cadences by type
export function getCadencesByType(state: NarrativeCadenceEngineState, type: CadenceType): Cadence[] {
  return Array.from(state.cadences.values()).filter(c => c.type === type);
}

// Get cadence report
export function getCadenceReport(state: NarrativeCadenceEngineState): {
  totalCadences: number;
  totalPatterns: number;
  averageFlow: number;
  averageMusic: number;
  cadenceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCadences === 0) recommendations.push('No cadences — add cadences');
  if (state.averageFlow < 0.5) recommendations.push('Low flow — strengthen');
  if (state.cadenceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCadences: state.totalCadences,
    totalPatterns: state.totalPatterns,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    averageMusic: Math.round(state.averageMusic * 100) / 100,
    cadenceMastery: Math.round(state.cadenceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCadence(state: NarrativeCadenceEngineState): NarrativeCadenceEngineState {
  const cadences = Array.from(state.cadences.values());
  const averageFlow = cadences.length === 0 ? 0.5
    : cadences.reduce((s, c) => s + c.flow, 0) / cadences.length;
  const averageMusic = cadences.length === 0 ? 0.5
    : cadences.reduce((s, c) => s + c.music, 0) / cadences.length;

  const patterns = Array.from(state.patterns.values());
  const patternVariation = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.variation, 0) / patterns.length;

  const cadenceMastery = (averageFlow * 0.4 + averageMusic * 0.3 + patternVariation * 0.3);

  return { ...state, averageFlow, averageMusic, patternVariation, cadenceMastery };
}

// Reset
export function resetNarrativeCadenceEngineState(): NarrativeCadenceEngineState {
  return createNarrativeCadenceEngineState();
}