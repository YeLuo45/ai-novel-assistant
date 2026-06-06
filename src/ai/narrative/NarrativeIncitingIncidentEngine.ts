/**
 * V998 NarrativeIncitingIncidentEngine — Direction B Iter 2/15 (Round 5)
 * Inciting incident engine: the incident that kicks off the story
 * Sources: thunderbolt incident + nanobot + ruflo
 */

export type IncidentType = 'disruption' | 'revelation' | 'invitation' | 'loss' | 'discovery' | 'choice';
export type IncidentIntensity = 'subtle' | 'moderate' | 'strong' | 'dramatic' | 'cataclysmic';
export type IncidentTiming = 'early' | 'midpoint' | 'late' | 'epilogue' | 'preface';

export interface IncitingIncident {
  incidentId: string;
  type: IncidentType;
  intensity: IncidentIntensity;
  timing: IncidentTiming;
  description: string;
  impact: number;
  characterIds: string[];
  chapter: number;
}

export interface IncidentRipple {
  rippleId: string,
  incidentId: string,
  description: string,
  reach: number,
  depth: number,
}

export interface NarrativeIncitingIncidentEngineState {
  incidents: Map<string, IncitingIncident>;
  ripples: Map<string, IncidentRipple>;
  totalIncidents: number;
  totalRipples: number;
  averageImpact: number;
  averageReach: number;
  narrativeMomentum: number;
  incitingMastery: number;
}

// Factory
export function createNarrativeIncitingIncidentEngineState(): NarrativeIncitingIncidentEngineState {
  return {
    incidents: new Map(),
    ripples: new Map(),
    totalIncidents: 0,
    totalRipples: 0,
    averageImpact: 0.5,
    averageReach: 0.5,
    narrativeMomentum: 0.5,
    incitingMastery: 0.5,
  };
}

// Add incident
export function addIncitingIncident(
  state: NarrativeIncitingIncidentEngineState,
  incidentId: string,
  type: IncidentType,
  intensity: IncidentIntensity,
  timing: IncidentTiming,
  description: string,
  impact: number,
  characterIds: string[],
  chapter: number
): NarrativeIncitingIncidentEngineState {
  const incident: IncitingIncident = { incidentId, type, intensity, timing, description, impact, characterIds, chapter };
  const incidents = new Map(state.incidents).set(incidentId, incident);
  return recomputeInciting({ ...state, incidents, totalIncidents: incidents.size });
}

// Add ripple
export function addIncidentRipple(
  state: NarrativeIncitingIncidentEngineState,
  rippleId: string,
  incidentId: string,
  description: string,
  reach: number,
  depth: number
): NarrativeIncitingIncidentEngineState {
  const ripple: IncidentRipple = { rippleId, incidentId, description, reach, depth };
  const ripples = new Map(state.ripples).set(rippleId, ripple);
  return recomputeInciting({ ...state, ripples, totalRipples: ripples.size });
}

// Get incidents by type
export function getIncidentsByType(state: NarrativeIncitingIncidentEngineState, type: IncidentType): IncitingIncident[] {
  return Array.from(state.incidents.values()).filter(i => i.type === type);
}

// Get inciting report
export function getIncitingReport(state: NarrativeIncitingIncidentEngineState): {
  totalIncidents: number;
  totalRipples: number;
  averageImpact: number;
  narrativeMomentum: number;
  incitingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIncidents === 0) recommendations.push('No incidents — add incidents');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.incitingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalIncidents: state.totalIncidents,
    totalRipples: state.totalRipples,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    narrativeMomentum: Math.round(state.narrativeMomentum * 100) / 100,
    incitingMastery: Math.round(state.incitingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeInciting(state: NarrativeIncitingIncidentEngineState): NarrativeIncitingIncidentEngineState {
  const incidents = Array.from(state.incidents.values());
  const averageImpact = incidents.length === 0 ? 0.5
    : incidents.reduce((s, i) => s + i.impact, 0) / incidents.length;

  const ripples = Array.from(state.ripples.values());
  const averageReach = ripples.length === 0 ? 0.5
    : ripples.reduce((s, r) => s + r.reach, 0) / ripples.length;
  const averageDepth = ripples.length === 0 ? 0.5
    : ripples.reduce((s, r) => s + r.depth, 0) / ripples.length;
  const narrativeMomentum = (averageReach * 0.5 + averageDepth * 0.5);

  const incitingMastery = (averageImpact * 0.4 + narrativeMomentum * 0.3 + (incidents.length > 0 ? Math.min(1, incidents.length / 3) : 0) * 0.3);

  return { ...state, averageImpact, averageReach, narrativeMomentum, incitingMastery };
}

// Reset
export function resetNarrativeIncitingIncidentEngineState(): NarrativeIncitingIncidentEngineState {
  return createNarrativeIncitingIncidentEngineState();
}