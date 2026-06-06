/**
 * V1072 NarrativeResilienceEngine — Direction D Iter 4/20 (Round 6)
 * Narrative resilience engine: narrative resilience + recovery
 * Sources: ruflo resilience + generic-agent + thunderbolt
 */

export type ResilienceType = 'plot' | 'character' | 'theme' | 'voice' | 'narrative' | 'meta';
export type ResilienceStrength = 'fragile' | 'moderate' | 'strong' | 'robust' | 'antifragile';
export type ResilienceStress = 'low' | 'moderate' | 'high' | 'extreme' | 'existential';

export interface ResilienceEvent {
  eventId: string;
  type: ResilienceType;
  strength: ResilienceStrength;
  stress: ResilienceStress;
  description: string;
  recovery: number;
  growth: number;
  chapter: number;
}

export interface ResilienceCurve {
  curveId: string,
  eventId: string,
  initialState: number,
  finalState: number,
  recoveryTime: number,
}

export interface NarrativeResilienceEngineState {
  events: Map<string, ResilienceEvent>;
  curves: Map<string, ResilienceCurve>;
  totalEvents: number;
  totalCurves: number;
  averageRecovery: number;
  averageGrowth: number;
  curveEfficiency: number;
  resilienceMastery: number;
}

// Factory
export function createNarrativeResilienceEngineState(): NarrativeResilienceEngineState {
  return {
    events: new Map(),
    curves: new Map(),
    totalEvents: 0,
    totalCurves: 0,
    averageRecovery: 0.5,
    averageGrowth: 0.5,
    curveEfficiency: 0.5,
    resilienceMastery: 0.5,
  };
}

// Add event
export function addResilienceEvent(
  state: NarrativeResilienceEngineState,
  eventId: string,
  type: ResilienceType,
  strength: ResilienceStrength,
  stress: ResilienceStress,
  description: string,
  recovery: number,
  growth: number,
  chapter: number
): NarrativeResilienceEngineState {
  const event: ResilienceEvent = { eventId, type, strength, stress, description, recovery, growth, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeResilience({ ...state, events, totalEvents: events.size });
}

// Add curve
export function addResilienceCurve(
  state: NarrativeResilienceEngineState,
  curveId: string,
  eventId: string,
  initialState: number,
  finalState: number,
  recoveryTime: number
): NarrativeResilienceEngineState {
  const curve: ResilienceCurve = { curveId, eventId, initialState, finalState, recoveryTime };
  const curves = new Map(state.curves).set(curveId, curve);
  return recomputeResilience({ ...state, curves, totalCurves: curves.size });
}

// Get events by type
export function getResilienceEventsByType(state: NarrativeResilienceEngineState, type: ResilienceType): ResilienceEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get resilience report
export function getResilienceReport(state: NarrativeResilienceEngineState): {
  totalEvents: number;
  totalCurves: number;
  averageRecovery: number;
  averageGrowth: number;
  resilienceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add resilience events');
  if (state.averageRecovery < 0.5) recommendations.push('Low recovery — strengthen');
  if (state.resilienceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalCurves: state.totalCurves,
    averageRecovery: Math.round(state.averageRecovery * 100) / 100,
    averageGrowth: Math.round(state.averageGrowth * 100) / 100,
    resilienceMastery: Math.round(state.resilienceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeResilience(state: NarrativeResilienceEngineState): NarrativeResilienceEngineState {
  const events = Array.from(state.events.values());
  const averageRecovery = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.recovery, 0) / events.length;
  const averageGrowth = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.growth, 0) / events.length;

  const curves = Array.from(state.curves.values());
  const curveEfficiency = curves.length === 0 ? 0.5
    : curves.reduce((s, c) => s + Math.min(1, (c.finalState - c.initialState) / Math.max(0.1, c.recoveryTime)), 0) / curves.length;

  const resilienceMastery = (averageRecovery * 0.4 + averageGrowth * 0.3 + curveEfficiency * 0.3);

  return { ...state, averageRecovery, averageGrowth, curveEfficiency, resilienceMastery };
}

// Reset
export function resetNarrativeResilienceEngineState(): NarrativeResilienceEngineState {
  return createNarrativeResilienceEngineState();
}