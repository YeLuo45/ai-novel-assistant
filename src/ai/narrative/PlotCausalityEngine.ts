/**
 * V780 PlotCausalityEngine — Direction C Iter 4/9 (Round 3)
 * Plot causality engine: cause-effect chains + plot consistency
 * Sources: thunderbolt causality + nanobot reasoning + ruflo
 */

export type CauseType = 'action' | 'decision' | 'event' | 'coincidence' | 'inevitable' | 'butterfly';
export type EffectStrength = 'trivial' | 'minor' | 'moderate' | 'major' | 'transformative';
export type CausalChainType = 'linear' | 'branching' | 'convergent' | 'cyclical' | 'parallel';

export interface CausalEvent {
  eventId: string;
  description: string;
  causeEventIds: string[];
  effectEventIds: string[];
  type: CauseType;
  strength: EffectStrength;
  chapter: number;
  preventable: boolean;
}

export interface CausalChain {
  chainId: string;
  events: string[];
  type: CausalChainType;
  totalImpact: number;
  consistency: number;
  completed: boolean;
}

export interface PlotCausalityEngineState {
  events: Map<string, CausalEvent>;
  chains: Map<string, CausalChain>;
  totalEvents: number;
  totalChains: number;
  orphanEvents: number;
  averageImpact: number;
  causalConsistency: number;
  typeDistribution: Map<CausalChainType, number>;
  depthScore: number;
}

// Factory
export function createPlotCausalityEngineState(): PlotCausalityEngineState {
  return {
    events: new Map(),
    chains: new Map(),
    totalEvents: 0,
    totalChains: 0,
    orphanEvents: 0,
    averageImpact: 0,
    causalConsistency: 0.7,
    typeDistribution: new Map(),
    depthScore: 0.5,
  };
}

// Add causal event
export function addCausalEvent(
  state: PlotCausalityEngineState,
  eventId: string,
  description: string,
  type: CauseType,
  chapter: number,
  strength: EffectStrength = 'moderate',
  causeEventIds: string[] = [],
  preventable: boolean = true
): PlotCausalityEngineState {
  const event: CausalEvent = { eventId, description, causeEventIds, effectEventIds: [], type, strength, chapter, preventable };
  const events = new Map(state.events).set(eventId, event);

  // Update cause events' effect lists
  causeEventIds.forEach(causeId => {
    const cause = state.events.get(causeId);
    if (cause) {
      const updated: CausalEvent = { ...cause, effectEventIds: [...cause.effectEventIds, eventId] };
      events.set(causeId, updated);
    }
  });

  const orphanEvents = state.orphanEvents + (causeEventIds.length === 0 && state.totalEvents === 0 ? 0 : causeEventIds.length === 0 ? 1 : 0);
  return recomputeCausality({ ...state, events, totalEvents: events.size, orphanEvents });
}

// Create chain
export function createCausalChain(
  state: PlotCausalityEngineState,
  chainId: string,
  events: string[],
  type: CausalChainType = 'linear'
): PlotCausalityEngineState {
  const strengthMap: Record<EffectStrength, number> = { trivial: 0.2, minor: 0.4, moderate: 0.6, major: 0.8, transformative: 1.0 };
  const totalImpact = events.reduce((s, eid) => {
    const event = state.events.get(eid);
    return s + (event ? strengthMap[event.strength] : 0);
  }, 0);

  // Calculate consistency based on valid event links
  let validLinks = 0;
  let totalLinks = Math.max(0, events.length - 1);
  for (let i = 0; i < events.length - 1; i++) {
    const current = state.events.get(events[i]);
    const next = state.events.get(events[i + 1]);
    if (current && next && (current.effectEventIds.includes(next.eventId) || next.causeEventIds.includes(current.eventId))) {
      validLinks++;
    }
  }
  const consistency = totalLinks === 0 ? 1.0 : validLinks / totalLinks;

  const chain: CausalChain = { chainId, events, type, totalImpact, consistency, completed: false };
  const chains = new Map(state.chains).set(chainId, chain);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeCausality({ ...state, chains, typeDistribution, totalChains: chains.size });
}

// Complete chain
export function completeCausalChain(state: PlotCausalityEngineState, chainId: string): PlotCausalityEngineState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const updated: CausalChain = { ...chain, completed: true };
  const chains = new Map(state.chains).set(chainId, updated);
  return recomputeCausality({ ...state, chains });
}

// Get chains by type
export function getCausalChainsByType(state: PlotCausalityEngineState, type: CausalChainType): CausalChain[] {
  return Array.from(state.chains.values()).filter(c => c.type === type);
}

// Get events by type
export function getEventsByType(state: PlotCausalityEngineState, type: CauseType): CausalEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get causality report
export function getCausalityReport(state: PlotCausalityEngineState): {
  totalEvents: number;
  totalChains: number;
  orphanEvents: number;
  averageImpact: number;
  causalConsistency: number;
  depthScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add causal events');
  if (state.orphanEvents > 0) recommendations.push(`${state.orphanEvents} orphan events — connect them`);
  if (state.causalConsistency < 0.6) recommendations.push('Low consistency — review chains');

  return {
    totalEvents: state.totalEvents,
    totalChains: state.totalChains,
    orphanEvents: state.orphanEvents,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    causalConsistency: Math.round(state.causalConsistency * 100) / 100,
    depthScore: Math.round(state.depthScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCausality(state: PlotCausalityEngineState): PlotCausalityEngineState {
  const events = Array.from(state.events.values());
  const chains = Array.from(state.chains.values());

  const strengthMap: Record<EffectStrength, number> = { trivial: 0.2, minor: 0.4, moderate: 0.6, major: 0.8, transformative: 1.0 };
  const averageImpact = events.length === 0 ? 0
    : events.reduce((s, e) => s + strengthMap[e.strength], 0) / events.length;

  const completedChains = chains.filter(c => c.completed);
  const causalConsistency = chains.length === 0 ? 0.7
    : completedChains.reduce((s, c) => s + c.consistency, 0) / chains.length;

  const maxChainLength = chains.length === 0 ? 0 : Math.max(...chains.map(c => c.events.length));
  const depthScore = Math.min(1, (state.totalEvents + maxChainLength) / 30);

  return { ...state, averageImpact, causalConsistency, depthScore };
}

// Reset causality state
export function resetPlotCausalityEngineState(): PlotCausalityEngineState {
  return createPlotCausalityEngineState();
}