/**
 * V1082 NarrativeReframingEngine — Direction D Iter 9/20 (Round 6)
 * Narrative reframing engine: reframe narrative elements
 * Sources: generic-agent reframe + nanobot + thunderbolt
 */

export type ReframeType = 'perspective' | 'context' | 'meaning' | 'focus' | 'scale' | 'genre';
export type ReframeEffectiveness = 'failed' | 'partial' | 'successful' | 'profound' | 'transformative';
export type ReframeScope = 'element' | 'scene' | 'chapter' | 'arc' | 'narrative';

export interface ReframeEvent {
  eventId: string;
  type: ReframeType;
  effectiveness: ReframeEffectiveness;
  scope: ReframeScope;
  description: string;
  before: number;
  after: number;
  chapter: number;
}

export interface ReframeSequence {
  sequenceId: string,
  eventIds: string[],
  cumulativeTransformation: number,
  insight: number,
}

export interface NarrativeReframingEngineState {
  events: Map<string, ReframeEvent>;
  sequences: Map<string, ReframeSequence>;
  totalEvents: number;
  totalSequences: number;
  averageBefore: number;
  averageAfter: number;
  sequenceInsight: number;
  reframingMastery: number;
}

// Factory
export function createNarrativeReframingEngineState(): NarrativeReframingEngineState {
  return {
    events: new Map(),
    sequences: new Map(),
    totalEvents: 0,
    totalSequences: 0,
    averageBefore: 0.5,
    averageAfter: 0.5,
    sequenceInsight: 0.5,
    reframingMastery: 0.5,
  };
}

// Add event
export function addReframeEvent(
  state: NarrativeReframingEngineState,
  eventId: string,
  type: ReframeType,
  effectiveness: ReframeEffectiveness,
  scope: ReframeScope,
  description: string,
  before: number,
  after: number,
  chapter: number
): NarrativeReframingEngineState {
  const event: ReframeEvent = { eventId, type, effectiveness, scope, description, before, after, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeReframing({ ...state, events, totalEvents: events.size });
}

// Add sequence
export function addReframeSequence(
  state: NarrativeReframingEngineState,
  sequenceId: string,
  eventIds: string[]
): NarrativeReframingEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is ReframeEvent => e !== undefined);
  const cumulativeTransformation = events.length === 0 ? 0
    : events.reduce((s, e) => s + (e.after - e.before), 0) / events.length;
  const insight = cumulativeTransformation > 0 ? Math.min(1, cumulativeTransformation) : 0.5;
  const sequence: ReframeSequence = { sequenceId, eventIds, cumulativeTransformation, insight };
  const sequences = new Map(state.sequences).set(sequenceId, sequence);
  return recomputeReframing({ ...state, sequences, totalSequences: sequences.size });
}

// Get events by type
export function getReframeEventsByType(state: NarrativeReframingEngineState, type: ReframeType): ReframeEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get reframing report
export function getReframingReport(state: NarrativeReframingEngineState): {
  totalEvents: number;
  totalSequences: number;
  averageBefore: number;
  averageAfter: number;
  reframingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add reframe events');
  if (state.averageAfter < state.averageBefore) recommendations.push('Negative transformation — improve');
  if (state.reframingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalSequences: state.totalSequences,
    averageBefore: Math.round(state.averageBefore * 100) / 100,
    averageAfter: Math.round(state.averageAfter * 100) / 100,
    reframingMastery: Math.round(state.reframingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeReframing(state: NarrativeReframingEngineState): NarrativeReframingEngineState {
  const events = Array.from(state.events.values());
  const averageBefore = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.before, 0) / events.length;
  const averageAfter = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.after, 0) / events.length;

  const sequences = Array.from(state.sequences.values());
  const sequenceInsight = sequences.length === 0 ? 0.5
    : sequences.reduce((s, sq) => s + sq.insight, 0) / sequences.length;

  const transformation = Math.max(0, averageAfter - averageBefore);
  const reframingMastery = (transformation * 0.5 + sequenceInsight * 0.5);

  return { ...state, averageBefore, averageAfter, sequenceInsight, reframingMastery };
}

// Reset
export function resetNarrativeReframingEngineState(): NarrativeReframingEngineState {
  return createNarrativeReframingEngineState();
}