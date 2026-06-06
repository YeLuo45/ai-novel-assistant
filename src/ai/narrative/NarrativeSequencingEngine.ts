/**
 * V1074 NarrativeSequencingEngine — Direction D Iter 5/20 (Round 6)
 * Narrative sequencing engine: optimal order of narrative elements
 * Sources: thunderbolt sequencing + nanobot + ruflo
 */

export type SequenceType = 'linear' | 'parallel' | 'braided' | 'interleaved' | 'nested' | 'cyclical';
export type SequenceOptimality = 'suboptimal' | 'adequate' | 'good' | 'optimal' | 'ideal';
export type SequenceFlow = 'smooth' | 'jumpy' | 'disjointed' | 'natural' | 'compelling';

export interface SequenceEvent {
  eventId: string;
  type: SequenceType;
  optimality: SequenceOptimality;
  flow: SequenceFlow;
  description: string;
  order: number;
  impact: number;
  chapter: number;
}

export interface SequencePlan {
  planId: string,
  name: string,
  eventIds: string[],
  totalImpact: number,
  optimality: number,
}

export interface NarrativeSequencingEngineState {
  events: Map<string, SequenceEvent>;
  plans: Map<string, SequencePlan>;
  totalEvents: number;
  totalPlans: number;
  averageImpact: number;
  averageOrder: number;
  planOptimality: number;
  sequencingMastery: number;
}

// Factory
export function createNarrativeSequencingEngineState(): NarrativeSequencingEngineState {
  return {
    events: new Map(),
    plans: new Map(),
    totalEvents: 0,
    totalPlans: 0,
    averageImpact: 0.5,
    averageOrder: 0.5,
    planOptimality: 0.5,
    sequencingMastery: 0.5,
  };
}

// Add event
export function addSequenceEvent(
  state: NarrativeSequencingEngineState,
  eventId: string,
  type: SequenceType,
  optimality: SequenceOptimality,
  flow: SequenceFlow,
  description: string,
  order: number,
  impact: number,
  chapter: number
): NarrativeSequencingEngineState {
  const event: SequenceEvent = { eventId, type, optimality, flow, description, order, impact, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeSequencing({ ...state, events, totalEvents: events.size });
}

// Add plan
export function addSequencePlan(
  state: NarrativeSequencingEngineState,
  planId: string,
  name: string,
  eventIds: string[]
): NarrativeSequencingEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is SequenceEvent => e !== undefined);
  const totalImpact = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.impact, 0);
  // Optimality: events are in increasing order without gaps
  const orders = events.map(e => e.order).sort((a, b) => a - b);
  const isOrdered = orders.every((o, i) => i === 0 || o >= orders[i - 1]);
  const optimality = events.length < 2 ? 0.5
    : (isOrdered ? 1 : 0.5) * (events.length / Math.max(orders[orders.length - 1] + 1, 1));
  const plan: SequencePlan = { planId, name, eventIds, totalImpact, optimality };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeSequencing({ ...state, plans, totalPlans: plans.size });
}

// Get events by type
export function getSequenceEventsByType(state: NarrativeSequencingEngineState, type: SequenceType): SequenceEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get sequencing report
export function getSequencingReport(state: NarrativeSequencingEngineState): {
  totalEvents: number;
  totalPlans: number;
  averageImpact: number;
  planOptimality: number;
  sequencingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add sequence events');
  if (state.planOptimality < 0.5) recommendations.push('Low plan optimality — improve');
  if (state.sequencingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalPlans: state.totalPlans,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    planOptimality: Math.round(state.planOptimality * 100) / 100,
    sequencingMastery: Math.round(state.sequencingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSequencing(state: NarrativeSequencingEngineState): NarrativeSequencingEngineState {
  const events = Array.from(state.events.values());
  const averageImpact = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.impact, 0) / events.length;
  const averageOrder = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.order, 0) / events.length / 10;

  const plans = Array.from(state.plans.values());
  const planOptimality = plans.length === 0 ? 0.5
    : plans.reduce((s, p) => s + p.optimality, 0) / plans.length;

  const sequencingMastery = (averageImpact * 0.4 + planOptimality * 0.6);

  return { ...state, averageImpact, averageOrder, planOptimality, sequencingMastery };
}

// Reset
export function resetNarrativeSequencingEngineState(): NarrativeSequencingEngineState {
  return createNarrativeSequencingEngineState();
}