/**
 * V1054 PlotPragmaticsEngine — Direction C Iter 15/20 (Round 5)
 * Plot pragmatics engine: practical effect + reader impact
 * Sources: thunderbolt pragmatics + nanobot + ruflo
 */

export type PragmaticEffect = 'entertain' | 'instruct' | 'move' | 'provoke' | 'comfort' | 'challenge';
export type PragmaticReach = 'individual' | 'small_group' | 'community' | 'society' | 'universal';
export type PragmaticIntensity = 'subtle' | 'moderate' | 'strong' | 'powerful' | 'life_changing';

export interface PlotPragmatic {
  pragmaticId: string;
  effect: PragmaticEffect;
  reach: PragmaticReach;
  intensity: PragmaticIntensity;
  description: string;
  impact: number;
  relevance: number;
  chapter: number;
}

export interface PragmaticOutcome {
  outcomeId: string,
  pragmaticIds: string[],
  cumulativeImpact: number,
  breadth: number,
}

export interface PlotPragmaticsEngineState {
  pragmatics: Map<string, PlotPragmatic>;
  outcomes: Map<string, PragmaticOutcome>;
  totalPragmatics: number;
  totalOutcomes: number;
  averageImpact: number;
  averageRelevance: number;
  outcomeBreadth: number;
  pragmaticsMastery: number;
}

// Factory
export function createPlotPragmaticsEngineState(): PlotPragmaticsEngineState {
  return {
    pragmatics: new Map(),
    outcomes: new Map(),
    totalPragmatics: 0,
    totalOutcomes: 0,
    averageImpact: 0.5,
    averageRelevance: 0.5,
    outcomeBreadth: 0.5,
    pragmaticsMastery: 0.5,
  };
}

// Add pragmatic
export function addPlotPragmatic(
  state: PlotPragmaticsEngineState,
  pragmaticId: string,
  effect: PragmaticEffect,
  reach: PragmaticReach,
  intensity: PragmaticIntensity,
  description: string,
  impact: number,
  relevance: number,
  chapter: number
): PlotPragmaticsEngineState {
  const pragmatic: PlotPragmatic = { pragmaticId, effect, reach, intensity, description, impact, relevance, chapter };
  const pragmatics = new Map(state.pragmatics).set(pragmaticId, pragmatic);
  return recomputePragmatics({ ...state, pragmatics, totalPragmatics: pragmatics.size });
}

// Add outcome
export function addPragmaticOutcome(
  state: PlotPragmaticsEngineState,
  outcomeId: string,
  pragmaticIds: string[]
): PlotPragmaticsEngineState {
  const pragmatics = pragmaticIds.map(id => state.pragmatics.get(id)).filter((p): p is PlotPragmatic => p !== undefined);
  const cumulativeImpact = pragmatics.length === 0 ? 0
    : pragmatics.reduce((s, p) => s + p.impact, 0) / pragmatics.length;
  const reachSet = new Set(pragmatics.map(p => p.reach));
  const breadth = Math.min(1, reachSet.size / 5);
  const outcome: PragmaticOutcome = { outcomeId, pragmaticIds, cumulativeImpact, breadth };
  const outcomes = new Map(state.outcomes).set(outcomeId, outcome);
  return recomputePragmatics({ ...state, outcomes, totalOutcomes: outcomes.size });
}

// Get pragmatics by effect
export function getPragmaticsByEffect(state: PlotPragmaticsEngineState, effect: PragmaticEffect): PlotPragmatic[] {
  return Array.from(state.pragmatics.values()).filter(p => p.effect === effect);
}

// Get pragmatics report
export function getPragmaticsReport(state: PlotPragmaticsEngineState): {
  totalPragmatics: number;
  totalOutcomes: number;
  averageImpact: number;
  averageRelevance: number;
  pragmaticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPragmatics === 0) recommendations.push('No pragmatics — add plot pragmatics');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.pragmaticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPragmatics: state.totalPragmatics,
    totalOutcomes: state.totalOutcomes,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageRelevance: Math.round(state.averageRelevance * 100) / 100,
    pragmaticsMastery: Math.round(state.pragmaticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePragmatics(state: PlotPragmaticsEngineState): PlotPragmaticsEngineState {
  const pragmatics = Array.from(state.pragmatics.values());
  const averageImpact = pragmatics.length === 0 ? 0.5
    : pragmatics.reduce((s, p) => s + p.impact, 0) / pragmatics.length;
  const averageRelevance = pragmatics.length === 0 ? 0.5
    : pragmatics.reduce((s, p) => s + p.relevance, 0) / pragmatics.length;

  const outcomes = Array.from(state.outcomes.values());
  const outcomeBreadth = outcomes.length === 0 ? 0.5
    : outcomes.reduce((s, o) => s + o.breadth, 0) / outcomes.length;

  const pragmaticsMastery = (averageImpact * 0.4 + averageRelevance * 0.3 + outcomeBreadth * 0.3);

  return { ...state, averageImpact, averageRelevance, outcomeBreadth, pragmaticsMastery };
}

// Reset
export function resetPlotPragmaticsEngineState(): PlotPragmaticsEngineState {
  return createPlotPragmaticsEngineState();
}