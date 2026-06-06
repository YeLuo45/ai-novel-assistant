/**
 * V1002 NarrativeResolutionEngine — Direction B Iter 4/15 (Round 5)
 * Resolution engine: denouement + narrative resolution
 * Sources: thunderbolt resolution + nanobot + chatdev
 */

export type ResolutionType = 'closure' | 'new_beginning' | 'transformation' | 'revelation' | 'acceptance' | 'transcendence';
export type ResolutionCompleteness = 'partial' | 'mostly' | 'complete' | 'thematic' | 'emotional' | 'philosophical';
export type ResolutionTone = 'hopeful' | 'bittersweet' | 'tragic' | 'comic' | 'mysterious' | 'serene';

export interface ResolutionEvent {
  eventId: string;
  type: ResolutionType;
  completeness: ResolutionCompleteness;
  tone: ResolutionTone;
  description: string;
  satisfaction: number;
  characterIds: string[];
  chapter: number;
}

export interface ResolutionArc {
  arcId: string,
  eventId: string,
  before: number,
  after: number,
  completion: number,
}

export interface NarrativeResolutionEngineState {
  events: Map<string, ResolutionEvent>;
  arcs: Map<string, ResolutionArc>;
  totalEvents: number;
  totalArcs: number;
  averageSatisfaction: number;
  arcCompletion: number;
  thematicClosure: number;
  resolutionMastery: number;
}

// Factory
export function createNarrativeResolutionEngineState(): NarrativeResolutionEngineState {
  return {
    events: new Map(),
    arcs: new Map(),
    totalEvents: 0,
    totalArcs: 0,
    averageSatisfaction: 0.5,
    arcCompletion: 0.5,
    thematicClosure: 0.5,
    resolutionMastery: 0.5,
  };
}

// Add event
export function addResolutionEvent(
  state: NarrativeResolutionEngineState,
  eventId: string,
  type: ResolutionType,
  completeness: ResolutionCompleteness,
  tone: ResolutionTone,
  description: string,
  satisfaction: number,
  characterIds: string[],
  chapter: number
): NarrativeResolutionEngineState {
  const event: ResolutionEvent = { eventId, type, completeness, tone, description, satisfaction, characterIds, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeResolution({ ...state, events, totalEvents: events.size });
}

// Add arc
export function addResolutionArc(
  state: NarrativeResolutionEngineState,
  arcId: string,
  eventId: string,
  before: number,
  after: number
): NarrativeResolutionEngineState {
  const completion = Math.max(0, Math.min(1, after - before));
  const arc: ResolutionArc = { arcId, eventId, before, after, completion };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeResolution({ ...state, arcs, totalArcs: arcs.size });
}

// Get events by type
export function getResolutionEventsByType(state: NarrativeResolutionEngineState, type: ResolutionType): ResolutionEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get resolution report
export function getResolutionReport(state: NarrativeResolutionEngineState): {
  totalEvents: number;
  totalArcs: number;
  averageSatisfaction: number;
  thematicClosure: number;
  resolutionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add resolution events');
  if (state.averageSatisfaction < 0.5) recommendations.push('Low satisfaction — improve');
  if (state.resolutionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalArcs: state.totalArcs,
    averageSatisfaction: Math.round(state.averageSatisfaction * 100) / 100,
    thematicClosure: Math.round(state.thematicClosure * 100) / 100,
    resolutionMastery: Math.round(state.resolutionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeResolution(state: NarrativeResolutionEngineState): NarrativeResolutionEngineState {
  const events = Array.from(state.events.values());
  const averageSatisfaction = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.satisfaction, 0) / events.length;

  const arcs = Array.from(state.arcs.values());
  const arcCompletion = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.completion, 0) / arcs.length;

  // Thematic closure: how well resolution addresses themes
  const completeMap: Record<ResolutionCompleteness, number> = { partial: 0.3, mostly: 0.5, complete: 0.7, thematic: 0.9, emotional: 0.85, philosophical: 0.95 };
  const thematicClosure = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + completeMap[e.completeness], 0) / events.length;

  const resolutionMastery = (averageSatisfaction * 0.4 + arcCompletion * 0.3 + thematicClosure * 0.3);

  return { ...state, averageSatisfaction, arcCompletion, thematicClosure, resolutionMastery };
}

// Reset
export function resetNarrativeResolutionEngineState(): NarrativeResolutionEngineState {
  return createNarrativeResolutionEngineState();
}