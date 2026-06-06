/**
 * V1066 NarrativeCalibrationEngine — Direction D Iter 1/20 (Round 6)
 * Narrative calibration engine: fine-tuning narrative elements
 * Sources: generic-agent calibration + thunderbolt + nanobot
 */

export type CalibrationTarget = 'pacing' | 'tone' | 'voice' | 'density' | 'temperature' | 'rhythm';
export type CalibrationPrecision = 'coarse' | 'moderate' | 'fine' | 'precise' | 'atomic';
export type CalibrationOutcome = 'under' | 'optimal' | 'over' | 'misaligned' | 'recalibrating';

export interface CalibrationEvent {
  eventId: string;
  target: CalibrationTarget;
  precision: CalibrationPrecision;
  outcome: CalibrationOutcome;
  description: string;
  before: number;
  after: number;
  delta: number;
}

export interface CalibrationProfile {
  profileId: string,
  name: string,
  eventIds: string[],
  averageDelta: number,
  precision: number,
}

export interface NarrativeCalibrationEngineState {
  events: Map<string, CalibrationEvent>;
  profiles: Map<string, CalibrationProfile>;
  totalEvents: number;
  totalProfiles: number;
  averageDelta: number;
  averagePrecision: number;
  profilePrecision: number;
  calibrationMastery: number;
}

// Factory
export function createNarrativeCalibrationEngineState(): NarrativeCalibrationEngineState {
  return {
    events: new Map(),
    profiles: new Map(),
    totalEvents: 0,
    totalProfiles: 0,
    averageDelta: 0.5,
    averagePrecision: 0.5,
    profilePrecision: 0.5,
    calibrationMastery: 0.5,
  };
}

// Add event
export function addCalibrationEvent(
  state: NarrativeCalibrationEngineState,
  eventId: string,
  target: CalibrationTarget,
  precision: CalibrationPrecision,
  outcome: CalibrationOutcome,
  description: string,
  before: number,
  after: number
): NarrativeCalibrationEngineState {
  const delta = Math.abs(after - before);
  const event: CalibrationEvent = { eventId, target, precision, outcome, description, before, after, delta };
  const events = new Map(state.events).set(eventId, event);
  return recomputeCalibration({ ...state, events, totalEvents: events.size });
}

// Add profile
export function addCalibrationProfile(
  state: NarrativeCalibrationEngineState,
  profileId: string,
  name: string,
  eventIds: string[]
): NarrativeCalibrationEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is CalibrationEvent => e !== undefined);
  const averageDelta = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.delta, 0) / events.length;
  const precision = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.precision === 'atomic' ? 1 : e.precision === 'precise' ? 0.85 : e.precision === 'fine' ? 0.7 : e.precision === 'moderate' ? 0.5 : 0.3), 0) / events.length;
  const profile: CalibrationProfile = { profileId, name, eventIds, averageDelta, precision };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeCalibration({ ...state, profiles, totalProfiles: profiles.size });
}

// Get events by target
export function getEventsByTarget(state: NarrativeCalibrationEngineState, target: CalibrationTarget): CalibrationEvent[] {
  return Array.from(state.events.values()).filter(e => e.target === target);
}

// Get calibration report
export function getCalibrationReport(state: NarrativeCalibrationEngineState): {
  totalEvents: number;
  totalProfiles: number;
  averageDelta: number;
  averagePrecision: number;
  calibrationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add calibration events');
  if (state.averageDelta > 0.5) recommendations.push('High delta — recalibrate');
  if (state.calibrationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalProfiles: state.totalProfiles,
    averageDelta: Math.round(state.averageDelta * 100) / 100,
    averagePrecision: Math.round(state.averagePrecision * 100) / 100,
    calibrationMastery: Math.round(state.calibrationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCalibration(state: NarrativeCalibrationEngineState): NarrativeCalibrationEngineState {
  const events = Array.from(state.events.values());
  const averageDelta = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.delta, 0) / events.length;
  const averagePrecision = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.precision === 'atomic' ? 1 : e.precision === 'precise' ? 0.85 : e.precision === 'fine' ? 0.7 : e.precision === 'moderate' ? 0.5 : 0.3), 0) / events.length;

  const profiles = Array.from(state.profiles.values());
  const profilePrecision = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.precision, 0) / profiles.length;

  const calibrationMastery = (averagePrecision * 0.5 + profilePrecision * 0.3 + (1 - averageDelta) * 0.2);

  return { ...state, averageDelta, averagePrecision, profilePrecision, calibrationMastery };
}

// Reset
export function resetNarrativeCalibrationEngineState(): NarrativeCalibrationEngineState {
  return createNarrativeCalibrationEngineState();
}