/**
 * V1050 WorldChronologyEngine — Direction C Iter 13/20 (Round 5)
 * World chronology engine: timeline + chronological framework
 * Sources: nanobot chronology + ruflo + thunderbolt
 */

export type ChronologyScale = 'moment' | 'day' | 'month' | 'year' | 'decade' | 'era' | 'epoch' | 'eon';
export type ChronologyCertainty = 'mythic' | 'legendary' | 'documented' | 'verified' | 'precise';
export type ChronologySignificance = 'minor' | 'notable' | 'major' | 'pivotal' | 'epochal' | 'world_altering';

export interface ChronologyEvent {
  eventId: string;
  scale: ChronologyScale;
  certainty: ChronologyCertainty;
  significance: ChronologySignificance;
  description: string;
  time: number;
  impact: number;
  ripple: number;
}

export interface ChronologyEra {
  eraId: string,
  name: string,
  startTime: number,
  endTime: number,
  eventIds: string[],
  importance: number,
}

export interface WorldChronologyEngineState {
  events: Map<string, ChronologyEvent>;
  eras: Map<string, ChronologyEra>;
  totalEvents: number;
  totalEras: number;
  averageImpact: number;
  averageRipple: number;
  eraImportance: number;
  chronologyMastery: number;
}

// Factory
export function createWorldChronologyEngineState(): WorldChronologyEngineState {
  return {
    events: new Map(),
    eras: new Map(),
    totalEvents: 0,
    totalEras: 0,
    averageImpact: 0.5,
    averageRipple: 0.5,
    eraImportance: 0.5,
    chronologyMastery: 0.5,
  };
}

// Add event
export function addChronologyEvent(
  state: WorldChronologyEngineState,
  eventId: string,
  scale: ChronologyScale,
  certainty: ChronologyCertainty,
  significance: ChronologySignificance,
  description: string,
  time: number,
  impact: number,
  ripple: number
): WorldChronologyEngineState {
  const event: ChronologyEvent = { eventId, scale, certainty, significance, description, time, impact, ripple };
  const events = new Map(state.events).set(eventId, event);
  return recomputeChronology({ ...state, events, totalEvents: events.size });
}

// Add era
export function addChronologyEra(
  state: WorldChronologyEngineState,
  eraId: string,
  name: string,
  startTime: number,
  endTime: number,
  eventIds: string[]
): WorldChronologyEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is ChronologyEvent => e !== undefined);
  const importance = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.impact, 0) / events.length;
  const era: ChronologyEra = { eraId, name, startTime, endTime, eventIds, importance };
  const eras = new Map(state.eras).set(eraId, era);
  return recomputeChronology({ ...state, eras, totalEras: eras.size });
}

// Get events by scale
export function getEventsByScale(state: WorldChronologyEngineState, scale: ChronologyScale): ChronologyEvent[] {
  return Array.from(state.events.values()).filter(e => e.scale === scale);
}

// Get chronology report
export function getChronologyReport(state: WorldChronologyEngineState): {
  totalEvents: number;
  totalEras: number;
  averageImpact: number;
  averageRipple: number;
  chronologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add chronology events');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.chronologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalEras: state.totalEras,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageRipple: Math.round(state.averageRipple * 100) / 100,
    chronologyMastery: Math.round(state.chronologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeChronology(state: WorldChronologyEngineState): WorldChronologyEngineState {
  const events = Array.from(state.events.values());
  const averageImpact = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.impact, 0) / events.length;
  const averageRipple = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.ripple, 0) / events.length;

  const eras = Array.from(state.eras.values());
  const eraImportance = eras.length === 0 ? 0.5
    : eras.reduce((s, era) => s + era.importance, 0) / eras.length;

  const chronologyMastery = (averageImpact * 0.4 + averageRipple * 0.3 + eraImportance * 0.3);

  return { ...state, averageImpact, averageRipple, eraImportance, chronologyMastery };
}

// Reset
export function resetWorldChronologyEngineState(): WorldChronologyEngineState {
  return createWorldChronologyEngineState();
}