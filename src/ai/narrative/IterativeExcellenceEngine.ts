/**
 * V932 IterativeExcellenceEngine — Direction D Iter 14/15 (Round 4)
 * Iterative excellence engine: pursuit of excellence through iteration
 * Sources: thunderbolt excellence + generic-agent + nanobot
 */

export type ExcellenceDimension = 'craft' | 'creativity' | 'impact' | 'resonance' | 'originality' | 'mastery';
export type ExcellenceLevel = 'developing' | 'proficient' | 'distinguished' | 'exceptional' | 'transcendent';
export type IterationMomentum = 'stalled' | 'slow' | 'steady' | 'strong' | 'breakthrough';

export interface ExcellenceStep {
  stepId: string;
  dimension: ExcellenceDimension;
  before: number;
  after: number;
  gain: number;
  momentum: IterationMomentum;
  description: string;
  chapter: number;
}

export interface ExcellenceProfile {
  profileId: string;
  name: string;
  level: ExcellenceLevel;
  dimensions: Map<ExcellenceDimension, number>;
  stepIds: string[];
  overall: number;
}

export interface IterativeExcellenceEngineState {
  steps: Map<string, ExcellenceStep>;
  profiles: Map<string, ExcellenceProfile>;
  totalSteps: number;
  totalProfiles: number;
  totalGain: number;
  averageGain: number;
  averageOverall: number;
  excellenceMomentum: number;
  excellenceMastery: number;
}

// Factory
export function createIterativeExcellenceEngineState(): IterativeExcellenceEngineState {
  return {
    steps: new Map(),
    profiles: new Map(),
    totalSteps: 0,
    totalProfiles: 0,
    totalGain: 0,
    averageGain: 0,
    averageOverall: 0.5,
    excellenceMomentum: 0.5,
    excellenceMastery: 0.5,
  };
}

// Add step
export function addExcellenceStep(
  state: IterativeExcellenceEngineState,
  stepId: string,
  dimension: ExcellenceDimension,
  before: number,
  after: number,
  momentum: IterationMomentum,
  description: string,
  chapter: number
): IterativeExcellenceEngineState {
  const gain = Math.max(0, after - before);
  const step: ExcellenceStep = { stepId, dimension, before, after, gain, momentum, description, chapter };
  const steps = new Map(state.steps).set(stepId, step);
  const totalGain = state.totalGain + gain;
  return recomputeIterExcel({ ...state, steps, totalGain, totalSteps: steps.size });
}

// Add profile
export function addExcellenceProfile(
  state: IterativeExcellenceEngineState,
  profileId: string,
  name: string,
  dimensions: Map<ExcellenceDimension, number>
): IterativeExcellenceEngineState {
  const allValues = Array.from(dimensions.values());
  const overall = allValues.length === 0 ? 0.5
    : allValues.reduce((s, v) => s + v, 0) / allValues.length;
  const level: ExcellenceLevel = overall < 0.3 ? 'developing'
    : overall < 0.5 ? 'proficient'
    : overall < 0.7 ? 'distinguished'
    : overall < 0.9 ? 'exceptional'
    : 'transcendent';
  const profile: ExcellenceProfile = { profileId, name, level, dimensions, stepIds: [], overall };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeIterExcel({ ...state, profiles, totalProfiles: profiles.size });
}

// Update dimension
export function updateExcellenceDimension(state: IterativeExcellenceEngineState, profileId: string, dimension: ExcellenceDimension, value: number): IterativeExcellenceEngineState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  const dimensions = new Map(profile.dimensions).set(dimension, Math.min(1, Math.max(0, value)));
  const allValues = Array.from(dimensions.values());
  const overall = allValues.length === 0 ? 0.5
    : allValues.reduce((s, v) => s + v, 0) / allValues.length;
  const level: ExcellenceLevel = overall < 0.3 ? 'developing'
    : overall < 0.5 ? 'proficient'
    : overall < 0.7 ? 'distinguished'
    : overall < 0.9 ? 'exceptional'
    : 'transcendent';
  const updated: ExcellenceProfile = { ...profile, dimensions, level, overall };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return recomputeIterExcel({ ...state, profiles });
}

// Get steps by dimension
export function getStepsByDimension(state: IterativeExcellenceEngineState, dimension: ExcellenceDimension): ExcellenceStep[] {
  return Array.from(state.steps.values()).filter(s => s.dimension === dimension);
}

// Get excellence report
export function getExcellenceReport(state: IterativeExcellenceEngineState): {
  totalSteps: number;
  totalProfiles: number;
  totalGain: number;
  averageGain: number;
  averageOverall: number;
  excellenceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSteps === 0) recommendations.push('No steps — add steps');
  if (state.averageGain < 0.05) recommendations.push('Low gain — improve');
  if (state.excellenceMastery < 0.5) recommendations.push('Low mastery — pursue');

  return {
    totalSteps: state.totalSteps,
    totalProfiles: state.totalProfiles,
    totalGain: Math.round(state.totalGain * 100) / 100,
    averageGain: Math.round(state.averageGain * 100) / 100,
    averageOverall: Math.round(state.averageOverall * 100) / 100,
    excellenceMastery: Math.round(state.excellenceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIterExcel(state: IterativeExcellenceEngineState): IterativeExcellenceEngineState {
  const steps = Array.from(state.steps.values());
  const averageGain = steps.length === 0 ? 0
    : steps.reduce((s, st) => s + st.gain, 0) / steps.length;

  const profiles = Array.from(state.profiles.values());
  const averageOverall = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.overall, 0) / profiles.length;

  const momentumMap: Record<IterationMomentum, number> = { stalled: 0.1, slow: 0.3, steady: 0.5, strong: 0.8, breakthrough: 1.0 };
  const avgMomentum = steps.length === 0 ? 0.5
    : steps.reduce((s, st) => s + momentumMap[st.momentum], 0) / steps.length;
  const excellenceMomentum = avgMomentum;

  const excellenceMastery = (averageGain * 0.3 + averageOverall * 0.4 + excellenceMomentum * 0.3);

  return { ...state, averageGain, averageOverall, excellenceMomentum, excellenceMastery };
}

// Reset excellence state
export function resetIterativeExcellenceEngineState(): IterativeExcellenceEngineState {
  return createIterativeExcellenceEngineState();
}