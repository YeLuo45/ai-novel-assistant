/**
 * V1078 NarrativeGroundingEngine — Direction D Iter 7/20 (Round 6)
 * Narrative grounding engine: ground abstract narrative elements in specifics
 * Sources: ruflo grounding + thunderbolt + nanobot
 */

export type GroundingMode = 'sensory' | 'emotional' | 'intellectual' | 'embodied' | 'relational' | 'spatial';
export type GroundingDepth = 'abstract' | 'vague' | 'specific' | 'vivid' | 'tactile';
export type GroundingReach = 'self' | 'intimate' | 'social' | 'public' | 'universal';

export interface GroundingEvent {
  eventId: string;
  mode: GroundingMode;
  depth: GroundingDepth;
  reach: GroundingReach;
  description: string;
  vividness: number;
  impact: number;
  chapter: number;
}

export interface GroundingLayer {
  layerId: string,
  eventIds: string[],
  cumulativeImpact: number,
  density: number,
}

export interface NarrativeGroundingEngineState {
  events: Map<string, GroundingEvent>;
  layers: Map<string, GroundingLayer>;
  totalEvents: number;
  totalLayers: number;
  averageVividness: number;
  averageImpact: number;
  layerDensity: number;
  groundingMastery: number;
}

// Factory
export function createNarrativeGroundingEngineState(): NarrativeGroundingEngineState {
  return {
    events: new Map(),
    layers: new Map(),
    totalEvents: 0,
    totalLayers: 0,
    averageVividness: 0.5,
    averageImpact: 0.5,
    layerDensity: 0.5,
    groundingMastery: 0.5,
  };
}

// Add event
export function addGroundingEvent(
  state: NarrativeGroundingEngineState,
  eventId: string,
  mode: GroundingMode,
  depth: GroundingDepth,
  reach: GroundingReach,
  description: string,
  vividness: number,
  impact: number,
  chapter: number
): NarrativeGroundingEngineState {
  const event: GroundingEvent = { eventId, mode, depth, reach, description, vividness, impact, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeGrounding({ ...state, events, totalEvents: events.size });
}

// Add layer
export function addGroundingLayer(
  state: NarrativeGroundingEngineState,
  layerId: string,
  eventIds: string[]
): NarrativeGroundingEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is GroundingEvent => e !== undefined);
  const cumulativeImpact = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.impact, 0) / events.length;
  const modeSet = new Set(events.map(e => e.mode));
  const density = Math.min(1, modeSet.size / 6);
  const layer: GroundingLayer = { layerId, eventIds, cumulativeImpact, density };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeGrounding({ ...state, layers, totalLayers: layers.size });
}

// Get events by mode
export function getGroundingEventsByMode(state: NarrativeGroundingEngineState, mode: GroundingMode): GroundingEvent[] {
  return Array.from(state.events.values()).filter(e => e.mode === mode);
}

// Get grounding report
export function getGroundingReport(state: NarrativeGroundingEngineState): {
  totalEvents: number;
  totalLayers: number;
  averageVividness: number;
  averageImpact: number;
  groundingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add grounding events');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.groundingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalLayers: state.totalLayers,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    groundingMastery: Math.round(state.groundingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeGrounding(state: NarrativeGroundingEngineState): NarrativeGroundingEngineState {
  const events = Array.from(state.events.values());
  const averageVividness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.vividness, 0) / events.length;
  const averageImpact = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.impact, 0) / events.length;

  const layers = Array.from(state.layers.values());
  const layerDensity = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.density, 0) / layers.length;

  const groundingMastery = (averageVividness * 0.4 + averageImpact * 0.3 + layerDensity * 0.3);

  return { ...state, averageVividness, averageImpact, layerDensity, groundingMastery };
}

// Reset
export function resetNarrativeGroundingEngineState(): NarrativeGroundingEngineState {
  return createNarrativeGroundingEngineState();
}