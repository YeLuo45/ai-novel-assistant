/**
 * V1084 NarrativeAmplificationEngine — Direction D Iter 10/20 (Round 6)
 * Narrative amplification engine: amplify narrative effects
 * Sources: thunderbolt amplification + nanobot + ruflo
 */

export type AmplificationMode = 'subtle' | 'moderate' | 'dramatic' | 'extreme' | 'transcendent';
export type AmplificationTarget = 'emotion' | 'theme' | 'symbol' | 'moment' | 'idea' | 'effect';
export type AmplificationRisk = 'safe' | 'moderate' | 'high' | 'extreme' | 'irreversible';

export interface AmplificationEvent {
  eventId: string;
  mode: AmplificationMode;
  target: AmplificationTarget;
  risk: AmplificationRisk;
  description: string;
  baseValue: number;
  amplified: number;
  gain: number;
}

export interface AmplificationPath {
  pathId: string,
  eventIds: string[],
  cumulativeGain: number,
  payoff: number,
}

export interface NarrativeAmplificationEngineState {
  events: Map<string, AmplificationEvent>;
  paths: Map<string, AmplificationPath>;
  totalEvents: number;
  totalPaths: number;
  averageGain: number;
  averageBase: number;
  pathPayoff: number;
  amplificationMastery: number;
}

// Factory
export function createNarrativeAmplificationEngineState(): NarrativeAmplificationEngineState {
  return {
    events: new Map(),
    paths: new Map(),
    totalEvents: 0,
    totalPaths: 0,
    averageGain: 0.5,
    averageBase: 0.5,
    pathPayoff: 0.5,
    amplificationMastery: 0.5,
  };
}

// Add event
export function addAmplificationEvent(
  state: NarrativeAmplificationEngineState,
  eventId: string,
  mode: AmplificationMode,
  target: AmplificationTarget,
  risk: AmplificationRisk,
  description: string,
  baseValue: number,
  amplified: number
): NarrativeAmplificationEngineState {
  const gain = Math.max(0, amplified - baseValue);
  const event: AmplificationEvent = { eventId, mode, target, risk, description, baseValue, amplified, gain };
  const events = new Map(state.events).set(eventId, event);
  return recomputeAmplification({ ...state, events, totalEvents: events.size });
}

// Add path
export function addAmplificationPath(
  state: NarrativeAmplificationEngineState,
  pathId: string,
  eventIds: string[]
): NarrativeAmplificationEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is AmplificationEvent => e !== undefined);
  const cumulativeGain = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.gain, 0) / events.length;
  const payoff = cumulativeGain > 0 ? Math.min(1, cumulativeGain) : 0.5;
  const path: AmplificationPath = { pathId, eventIds, cumulativeGain, payoff };
  const paths = new Map(state.paths).set(pathId, path);
  return recomputeAmplification({ ...state, paths, totalPaths: paths.size });
}

// Get events by mode
export function getAmplificationEventsByMode(state: NarrativeAmplificationEngineState, mode: AmplificationMode): AmplificationEvent[] {
  return Array.from(state.events.values()).filter(e => e.mode === mode);
}

// Get amplification report
export function getAmplificationReport(state: NarrativeAmplificationEngineState): {
  totalEvents: number;
  totalPaths: number;
  averageGain: number;
  pathPayoff: number;
  amplificationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add amplification events');
  if (state.averageGain < 0.2) recommendations.push('Low gain — strengthen');
  if (state.amplificationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalPaths: state.totalPaths,
    averageGain: Math.round(state.averageGain * 100) / 100,
    pathPayoff: Math.round(state.pathPayoff * 100) / 100,
    amplificationMastery: Math.round(state.amplificationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAmplification(state: NarrativeAmplificationEngineState): NarrativeAmplificationEngineState {
  const events = Array.from(state.events.values());
  const averageGain = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.gain, 0) / events.length;
  const averageBase = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.baseValue, 0) / events.length;

  const paths = Array.from(state.paths.values());
  const pathPayoff = paths.length === 0 ? 0.5
    : paths.reduce((s, p) => s + p.payoff, 0) / paths.length;

  const amplificationMastery = (averageGain * 0.4 + pathPayoff * 0.4 + averageBase * 0.2);

  return { ...state, averageGain, averageBase, pathPayoff, amplificationMastery };
}

// Reset
export function resetNarrativeAmplificationEngineState(): NarrativeAmplificationEngineState {
  return createNarrativeAmplificationEngineState();
}