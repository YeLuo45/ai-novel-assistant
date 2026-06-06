/**
 * V1090 NarrativeModulationEngine — Direction D Iter 13/20 (Round 6)
 * Narrative modulation engine: modulate narrative qualities
 * Sources: thunderbolt modulation + nanobot + ruflo
 */

export type ModulationType = 'volume' | 'frequency' | 'amplitude' | 'phase' | 'timbre' | 'rhythm';
export type ModulationSmoothness = 'abrupt' | 'rough' | 'smooth' | 'elegant' | 'seamless';
export type ModulationRange = 'narrow' | 'moderate' | 'wide' | 'extreme' | 'transcendent';

export interface ModulationEvent {
  eventId: string;
  type: ModulationType;
  smoothness: ModulationSmoothness;
  range: ModulationRange;
  description: string;
  beforeValue: number;
  afterValue: number;
  delta: number;
}

export interface ModulationPattern {
  patternId: string,
  eventIds: string[],
  averageDelta: number,
  flow: number,
}

export interface NarrativeModulationEngineState {
  events: Map<string, ModulationEvent>;
  patterns: Map<string, ModulationPattern>;
  totalEvents: number;
  totalPatterns: number;
  averageDelta: number;
  averageSmoothness: number;
  patternFlow: number;
  modulationMastery: number;
}

// Factory
export function createNarrativeModulationEngineState(): NarrativeModulationEngineState {
  return {
    events: new Map(),
    patterns: new Map(),
    totalEvents: 0,
    totalPatterns: 0,
    averageDelta: 0.5,
    averageSmoothness: 0.5,
    patternFlow: 0.5,
    modulationMastery: 0.5,
  };
}

// Add event
export function addModulationEvent(
  state: NarrativeModulationEngineState,
  eventId: string,
  type: ModulationType,
  smoothness: ModulationSmoothness,
  range: ModulationRange,
  description: string,
  beforeValue: number,
  afterValue: number
): NarrativeModulationEngineState {
  const delta = Math.abs(afterValue - beforeValue);
  const event: ModulationEvent = { eventId, type, smoothness, range, description, beforeValue, afterValue, delta };
  const events = new Map(state.events).set(eventId, event);
  return recomputeModulation({ ...state, events, totalEvents: events.size });
}

// Add pattern
export function addModulationPattern(
  state: NarrativeModulationEngineState,
  patternId: string,
  eventIds: string[]
): NarrativeModulationEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is ModulationEvent => e !== undefined);
  const averageDelta = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.delta, 0) / events.length;
  const flow = events.length < 2 ? 0.5
    : 1 - Math.abs(events[0].afterValue - events[events.length - 1].afterValue) / 2;
  const pattern: ModulationPattern = { patternId, eventIds, averageDelta, flow };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeModulation({ ...state, patterns, totalPatterns: patterns.size });
}

// Get events by type
export function getModulationEventsByType(state: NarrativeModulationEngineState, type: ModulationType): ModulationEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get modulation report
export function getModulationReport(state: NarrativeModulationEngineState): {
  totalEvents: number;
  totalPatterns: number;
  averageDelta: number;
  patternFlow: number;
  modulationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add modulation events');
  if (state.patternFlow < 0.5) recommendations.push('Low flow — improve');
  if (state.modulationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalPatterns: state.totalPatterns,
    averageDelta: Math.round(state.averageDelta * 100) / 100,
    patternFlow: Math.round(state.patternFlow * 100) / 100,
    modulationMastery: Math.round(state.modulationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeModulation(state: NarrativeModulationEngineState): NarrativeModulationEngineState {
  const events = Array.from(state.events.values());
  const averageDelta = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.delta, 0) / events.length;
  const averageSmoothness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.smoothness === 'seamless' ? 1 : e.smoothness === 'elegant' ? 0.85 : e.smoothness === 'smooth' ? 0.7 : e.smoothness === 'rough' ? 0.4 : 0.2), 0) / events.length;

  const patterns = Array.from(state.patterns.values());
  const patternFlow = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.flow, 0) / patterns.length;

  const modulationMastery = (averageSmoothness * 0.4 + patternFlow * 0.4 + averageDelta * 0.2);

  return { ...state, averageDelta, averageSmoothness, patternFlow, modulationMastery };
}

// Reset
export function resetNarrativeModulationEngineState(): NarrativeModulationEngineState {
  return createNarrativeModulationEngineState();
}