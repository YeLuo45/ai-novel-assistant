/**
 * V1110 NarrativeCuriosityGapEngine — Direction E Iter 3/20 (Round 5)
 * Curiosity gap engine: gap that drives reader curiosity
 * Sources: thunderbolt curiosity + generic-agent + nanobot
 */

export type CuriosityGapType = 'factual' | 'emotional' | 'relational' | 'plot' | 'mystery' | 'metaphysical';
export type CuriosityGapSize = 'micro' | 'small' | 'medium' | 'large' | 'epic';
export type CuriosityGapTension = 'low' | 'moderate' | 'high' | 'extreme' | 'overwhelming';

export interface CuriosityGap {
  gapId: string;
  type: CuriosityGapType;
  size: CuriosityGapSize;
  tension: CuriosityGapTension;
  description: string;
  pullStrength: number;
  frustration: number;
  chapter: number;
}

export interface CuriosityArc {
  arcId: string,
  gapIds: string[],
  cumulativePull: number,
  satisfaction: number,
}

export interface NarrativeCuriosityGapEngineState {
  gaps: Map<string, CuriosityGap>;
  arcs: Map<string, CuriosityArc>;
  totalGaps: number;
  totalArcs: number;
  averagePull: number;
  averageFrustration: number;
  arcSatisfaction: number;
  curiosityMastery: number;
}

// Factory
export function createNarrativeCuriosityGapEngineState(): NarrativeCuriosityGapEngineState {
  return {
    gaps: new Map(),
    arcs: new Map(),
    totalGaps: 0,
    totalArcs: 0,
    averagePull: 0.5,
    averageFrustration: 0.5,
    arcSatisfaction: 0.5,
    curiosityMastery: 0.5,
  };
}

// Add gap
export function addCuriosityGap(
  state: NarrativeCuriosityGapEngineState,
  gapId: string,
  type: CuriosityGapType,
  size: CuriosityGapSize,
  tension: CuriosityGapTension,
  description: string,
  pullStrength: number,
  frustration: number,
  chapter: number
): NarrativeCuriosityGapEngineState {
  const gap: CuriosityGap = { gapId, type, size, tension, description, pullStrength, frustration, chapter };
  const gaps = new Map(state.gaps).set(gapId, gap);
  return recomputeCuriosity({ ...state, gaps, totalGaps: gaps.size });
}

// Add arc
export function addCuriosityArc(
  state: NarrativeCuriosityGapEngineState,
  arcId: string,
  gapIds: string[]
): NarrativeCuriosityGapEngineState {
  const gaps = gapIds.map(id => state.gaps.get(id)).filter((g): g is CuriosityGap => g !== undefined);
  const cumulativePull = gaps.length === 0 ? 0
    : gaps.reduce((s, g) => s + g.pullStrength, 0) / gaps.length;
  const avgFrustration = gaps.length === 0 ? 0
    : gaps.reduce((s, g) => s + g.frustration, 0) / gaps.length;
  // Satisfaction: inverse of average frustration, scaled by pull
  const satisfaction = cumulativePull > 0 ? Math.min(1, cumulativePull - 0.3 * avgFrustration) : 0.5;
  const arc: CuriosityArc = { arcId, gapIds, cumulativePull, satisfaction };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeCuriosity({ ...state, arcs, totalArcs: arcs.size });
}

// Get gaps by type
export function getCuriosityGapsByType(state: NarrativeCuriosityGapEngineState, type: CuriosityGapType): CuriosityGap[] {
  return Array.from(state.gaps.values()).filter(g => g.type === type);
}

// Get curiosity report
export function getCuriosityGapReport(state: NarrativeCuriosityGapEngineState): {
  totalGaps: number;
  totalArcs: number;
  averagePull: number;
  averageFrustration: number;
  curiosityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGaps === 0) recommendations.push('No gaps — add curiosity gaps');
  if (state.averageFrustration > 0.7) recommendations.push('High frustration — relieve some gaps');
  if (state.curiosityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalGaps: state.totalGaps,
    totalArcs: state.totalArcs,
    averagePull: Math.round(state.averagePull * 100) / 100,
    averageFrustration: Math.round(state.averageFrustration * 100) / 100,
    curiosityMastery: Math.round(state.curiosityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCuriosity(state: NarrativeCuriosityGapEngineState): NarrativeCuriosityGapEngineState {
  const gaps = Array.from(state.gaps.values());
  const averagePull = gaps.length === 0 ? 0.5
    : gaps.reduce((s, g) => s + g.pullStrength, 0) / gaps.length;
  const averageFrustration = gaps.length === 0 ? 0.5
    : gaps.reduce((s, g) => s + g.frustration, 0) / gaps.length;

  const arcs = Array.from(state.arcs.values());
  const arcSatisfaction = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.satisfaction, 0) / arcs.length;

  const curiosityMastery = (averagePull * 0.4 + arcSatisfaction * 0.4 + (1 - averageFrustration) * 0.2);

  return { ...state, averagePull, averageFrustration, arcSatisfaction, curiosityMastery };
}

// Reset
export function resetNarrativeCuriosityGapEngineState(): NarrativeCuriosityGapEngineState {
  return createNarrativeCuriosityGapEngineState();
}