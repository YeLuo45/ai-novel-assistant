/**
 * V1092 NarrativeAttunementEngine — Direction D Iter 14/20 (Round 6)
 * Narrative attunement engine: attune narrative to reader/context
 * Sources: ruflo attunement + nanobot + thunderbolt
 */

export type AttunementTarget = 'reader' | 'audience' | 'culture' | 'context' | 'mood' | 'era';
export type AttunementDepth = 'surface' | 'shallow' | 'medium' | 'deep' | 'profound';
export type AttunementResonance = 'discordant' | 'neutral' | 'harmonious' | 'resonant' | 'symphonic';

export interface AttunementEvent {
  eventId: string;
  target: AttunementTarget;
  depth: AttunementDepth;
  resonance: AttunementResonance;
  description: string;
  alignment: number;
  sensitivity: number;
  chapter: number;
}

export interface AttunementProfile {
  profileId: string,
  target: AttunementTarget,
  eventIds: string[],
  cumulativeAlignment: number,
  fidelity: number,
}

export interface NarrativeAttunementEngineState {
  events: Map<string, AttunementEvent>;
  profiles: Map<string, AttunementProfile>;
  totalEvents: number;
  totalProfiles: number;
  averageAlignment: number;
  averageSensitivity: number;
  profileFidelity: number;
  attunementMastery: number;
}

// Factory
export function createNarrativeAttunementEngineState(): NarrativeAttunementEngineState {
  return {
    events: new Map(),
    profiles: new Map(),
    totalEvents: 0,
    totalProfiles: 0,
    averageAlignment: 0.5,
    averageSensitivity: 0.5,
    profileFidelity: 0.5,
    attunementMastery: 0.5,
  };
}

// Add event
export function addAttunementEvent(
  state: NarrativeAttunementEngineState,
  eventId: string,
  target: AttunementTarget,
  depth: AttunementDepth,
  resonance: AttunementResonance,
  description: string,
  alignment: number,
  sensitivity: number,
  chapter: number
): NarrativeAttunementEngineState {
  const event: AttunementEvent = { eventId, target, depth, resonance, description, alignment, sensitivity, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeAttunement({ ...state, events, totalEvents: events.size });
}

// Add profile
export function addAttunementProfile(
  state: NarrativeAttunementEngineState,
  profileId: string,
  target: AttunementTarget,
  eventIds: string[]
): NarrativeAttunementEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is AttunementEvent => e !== undefined);
  const cumulativeAlignment = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.alignment, 0) / events.length;
  const fidelity = events.length < 2 ? 0.5
    : 1 - Math.abs(events[0].alignment - events[events.length - 1].alignment);
  const profile: AttunementProfile = { profileId, target, eventIds, cumulativeAlignment, fidelity };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeAttunement({ ...state, profiles, totalProfiles: profiles.size });
}

// Get events by target
export function getAttunementEventsByTarget(state: NarrativeAttunementEngineState, target: AttunementTarget): AttunementEvent[] {
  return Array.from(state.events.values()).filter(e => e.target === target);
}

// Get attunement report
export function getAttunementReport(state: NarrativeAttunementEngineState): {
  totalEvents: number;
  totalProfiles: number;
  averageAlignment: number;
  averageSensitivity: number;
  attunementMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add attunement events');
  if (state.averageAlignment < 0.5) recommendations.push('Low alignment — improve');
  if (state.attunementMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalProfiles: state.totalProfiles,
    averageAlignment: Math.round(state.averageAlignment * 100) / 100,
    averageSensitivity: Math.round(state.averageSensitivity * 100) / 100,
    attunementMastery: Math.round(state.attunementMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAttunement(state: NarrativeAttunementEngineState): NarrativeAttunementEngineState {
  const events = Array.from(state.events.values());
  const averageAlignment = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.alignment, 0) / events.length;
  const averageSensitivity = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.sensitivity, 0) / events.length;

  const profiles = Array.from(state.profiles.values());
  const profileFidelity = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.fidelity, 0) / profiles.length;

  const attunementMastery = (averageAlignment * 0.4 + averageSensitivity * 0.3 + profileFidelity * 0.3);

  return { ...state, averageAlignment, averageSensitivity, profileFidelity, attunementMastery };
}

// Reset
export function resetNarrativeAttunementEngineState(): NarrativeAttunementEngineState {
  return createNarrativeAttunementEngineState();
}