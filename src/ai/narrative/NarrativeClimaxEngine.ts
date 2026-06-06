/**
 * V1000 NarrativeClimaxEngine — Direction B Iter 3/15 (Round 5)
 * Climax engine: narrative climax + peak action
 * Sources: thunderbolt climax + ruflo + nanobot
 */

export type ClimaxType = 'confrontation' | 'revelation' | 'decision' | 'transformation' | 'sacrifice' | 'revelation';
export type ClimaxIntensity = 'subdued' | 'moderate' | 'intense' | 'explosive' | 'transcendent';
export type ClimaxResolution = 'victory' | 'defeat' | 'transformation' | 'bittersweet' | 'cliffhanger';

export interface ClimaxEvent {
  eventId: string;
  type: ClimaxType;
  intensity: ClimaxIntensity;
  resolution: ClimaxResolution;
  description: string;
  peakMoment: number;
  characterIds: string[];
  chapter: number;
}

export interface ClimaxBuildup {
  buildupId: string,
  eventId: string,
  tensionBefore: number,
  tensionAfter: number,
  pace: number,
}

export interface NarrativeClimaxEngineState {
  events: Map<string, ClimaxEvent>;
  buildups: Map<string, ClimaxBuildup>;
  totalEvents: number;
  totalBuildups: number;
  averagePeak: number;
  buildQuality: number;
  climacticSatisfaction: number;
  climaxMastery: number;
}

// Factory
export function createNarrativeClimaxEngineState(): NarrativeClimaxEngineState {
  return {
    events: new Map(),
    buildups: new Map(),
    totalEvents: 0,
    totalBuildups: 0,
    averagePeak: 0.5,
    buildQuality: 0.5,
    climacticSatisfaction: 0.5,
    climaxMastery: 0.5,
  };
}

// Add event
export function addClimaxEvent(
  state: NarrativeClimaxEngineState,
  eventId: string,
  type: ClimaxType,
  intensity: ClimaxIntensity,
  resolution: ClimaxResolution,
  description: string,
  peakMoment: number,
  characterIds: string[],
  chapter: number
): NarrativeClimaxEngineState {
  const event: ClimaxEvent = { eventId, type, intensity, resolution, description, peakMoment, characterIds, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeClimax({ ...state, events, totalEvents: events.size });
}

// Add buildup
export function addClimaxBuildup(
  state: NarrativeClimaxEngineState,
  buildupId: string,
  eventId: string,
  tensionBefore: number,
  tensionAfter: number,
  pace: number
): NarrativeClimaxEngineState {
  const buildup: ClimaxBuildup = { buildupId, eventId, tensionBefore, tensionAfter, pace };
  const buildups = new Map(state.buildups).set(buildupId, buildup);
  return recomputeClimax({ ...state, buildups, totalBuildups: buildups.size });
}

// Get events by type
export function getClimaxEventsByType(state: NarrativeClimaxEngineState, type: ClimaxType): ClimaxEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get climax report
export function getClimaxReport(state: NarrativeClimaxEngineState): {
  totalEvents: number;
  totalBuildups: number;
  averagePeak: number;
  climacticSatisfaction: number;
  climaxMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add climax events');
  if (state.averagePeak < 0.5) recommendations.push('Low peak — strengthen');
  if (state.climaxMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalBuildups: state.totalBuildups,
    averagePeak: Math.round(state.averagePeak * 100) / 100,
    climacticSatisfaction: Math.round(state.climacticSatisfaction * 100) / 100,
    climaxMastery: Math.round(state.climaxMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeClimax(state: NarrativeClimaxEngineState): NarrativeClimaxEngineState {
  const events = Array.from(state.events.values());
  const averagePeak = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.peakMoment, 0) / events.length;

  const buildups = Array.from(state.buildups.values());
  // Build quality: tension difference (sharp rise = good build)
  const buildQuality = buildups.length === 0 ? 0.5
    : buildups.reduce((s, b) => s + (b.tensionAfter - b.tensionBefore), 0) / buildups.length;

  // Resolution satisfaction: transformation > bittersweet > cliffhanger
  const resMap: Record<ClimaxResolution, number> = { victory: 0.7, defeat: 0.5, transformation: 0.9, bittersweet: 0.8, cliffhanger: 0.6 };
  const climacticSatisfaction = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + resMap[e.resolution], 0) / events.length;

  const climaxMastery = (averagePeak * 0.4 + buildQuality * 0.3 + climacticSatisfaction * 0.3);

  return { ...state, averagePeak, buildQuality, climacticSatisfaction, climaxMastery };
}

// Reset
export function resetNarrativeClimaxEngineState(): NarrativeClimaxEngineState {
  return createNarrativeClimaxEngineState();
}