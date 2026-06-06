/**
 * V1016 NarrativeOpeningEngine — Direction B Iter 11/15 (Round 5)
 * Opening engine: story openings + first impressions
 * Sources: thunderbolt opening + nanobot + chatdev
 */

export type OpeningType = 'in_medias_res' | 'in_anticipation' | 'flashback' | 'flash_forward' | 'establishing' | 'mysterious';
export type OpeningStrength = 'weak' | 'adequate' | 'good' | 'strong' | 'captivating';
export type OpeningStyle = 'lyrical' | 'sparse' | 'detailed' | 'action' | 'dialogue' | 'description';

export interface Opening {
  openingId: string;
  type: OpeningType;
  strength: OpeningStrength;
  style: OpeningStyle;
  description: string;
  immediate_impact: number;
  lastingImpression: number;
  chapter: number;
}

export interface OpeningStrategy {
  strategyId: string,
  name: string,
  openingId: string,
  effectiveness: number,
  reuse: number,
}

export interface NarrativeOpeningEngineState {
  openings: Map<string, Opening>;
  strategies: Map<string, OpeningStrategy>;
  totalOpenings: number;
  totalStrategies: number;
  averageImpact: number;
  averageImpression: number;
  strategyReuse: number;
  openingMastery: number;
}

// Factory
export function createNarrativeOpeningEngineState(): NarrativeOpeningEngineState {
  return {
    openings: new Map(),
    strategies: new Map(),
    totalOpenings: 0,
    totalStrategies: 0,
    averageImpact: 0.5,
    averageImpression: 0.5,
    strategyReuse: 0,
    openingMastery: 0.5,
  };
}

// Add opening
export function addOpening(
  state: NarrativeOpeningEngineState,
  openingId: string,
  type: OpeningType,
  strength: OpeningStrength,
  style: OpeningStyle,
  description: string,
  immediateImpact: number,
  lastingImpression: number,
  chapter: number
): NarrativeOpeningEngineState {
  const opening: Opening = { openingId, type, strength, style, description, immediate_impact: immediateImpact, lastingImpression, chapter };
  const openings = new Map(state.openings).set(openingId, opening);
  return recomputeOpening({ ...state, openings, totalOpenings: openings.size });
}

// Add strategy
export function addOpeningStrategy(
  state: NarrativeOpeningEngineState,
  strategyId: string,
  name: string,
  openingId: string
): NarrativeOpeningEngineState {
  const opening = state.openings.get(openingId);
  const effectiveness = opening ? opening.lastingImpression : 0.5;
  const strategy: OpeningStrategy = { strategyId, name, openingId, effectiveness, reuse: 0 };
  const strategies = new Map(state.strategies).set(strategyId, strategy);
  return recomputeOpening({ ...state, strategies, totalStrategies: strategies.size });
}

// Use strategy
export function useOpeningStrategy(state: NarrativeOpeningEngineState, strategyId: string): NarrativeOpeningEngineState {
  const strategy = state.strategies.get(strategyId);
  if (!strategy) return state;

  const updated: OpeningStrategy = { ...strategy, reuse: strategy.reuse + 1 };
  const strategies = new Map(state.strategies).set(strategyId, updated);
  return recomputeOpening({ ...state, strategies });
}

// Get openings by type
export function getOpeningsByType(state: NarrativeOpeningEngineState, type: OpeningType): Opening[] {
  return Array.from(state.openings.values()).filter(o => o.type === type);
}

// Get opening report
export function getOpeningReport(state: NarrativeOpeningEngineState): {
  totalOpenings: number;
  totalStrategies: number;
  averageImpact: number;
  averageImpression: number;
  openingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalOpenings === 0) recommendations.push('No openings — add openings');
  if (state.averageImpression < 0.5) recommendations.push('Low impression — strengthen');
  if (state.openingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalOpenings: state.totalOpenings,
    totalStrategies: state.totalStrategies,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageImpression: Math.round(state.averageImpression * 100) / 100,
    openingMastery: Math.round(state.openingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeOpening(state: NarrativeOpeningEngineState): NarrativeOpeningEngineState {
  const openings = Array.from(state.openings.values());
  const averageImpact = openings.length === 0 ? 0.5
    : openings.reduce((s, o) => s + o.immediate_impact, 0) / openings.length;
  const averageImpression = openings.length === 0 ? 0.5
    : openings.reduce((s, o) => s + o.lastingImpression, 0) / openings.length;

  const strategies = Array.from(state.strategies.values());
  const totalReuse = strategies.reduce((s, st) => s + st.reuse, 0);
  const strategyReuse = strategies.length === 0 ? 0
    : Math.min(1, totalReuse / Math.max(1, strategies.length * 3));

  const openingMastery = (averageImpact * 0.4 + averageImpression * 0.4 + strategyReuse * 0.2);

  return { ...state, averageImpact, averageImpression, strategyReuse, openingMastery };
}

// Reset
export function resetNarrativeOpeningEngineState(): NarrativeOpeningEngineState {
  return createNarrativeOpeningEngineState();
}