/**
 * V798 StyleRefinementEngine — Direction D Iter 4/9 (Round 3)
 * Style refinement engine: style consistency + voice coherence
 * Sources: chatdev style + thunderbolt + nanobot
 */

export type StyleAspect = 'voice' | 'tone' | 'register' | 'syntax' | 'vocabulary' | 'rhythm';
export type RefinementLevel = 'surface' | 'intermediate' | 'deep' | 'comprehensive';
export type StylePhase = 'detected' | 'measured' | 'analyzed' | 'refined' | 'verified';

export interface StyleProfile {
  profileId: string;
  aspect: StyleAspect;
  baseline: number;
  current: number;
  target: number;
  variance: number;
  samples: number;
}

export interface StyleRefinement {
  refinementId: string;
  profileId: string;
  level: RefinementLevel;
  phase: StylePhase;
  changes: string[];
  improvement: number;
  timestamp: number;
}

export interface StyleRefinementEngineState {
  profiles: Map<string, StyleProfile>;
  refinements: Map<string, StyleRefinement>;
  totalProfiles: number;
  totalRefinements: number;
  completedRefinements: number;
  averageCoherence: number;
  totalImprovement: number;
  averageImprovement: number;
  dominantAspect: StyleAspect | null;
}

// Factory
export function createStyleRefinementEngineState(): StyleRefinementEngineState {
  return {
    profiles: new Map(),
    refinements: new Map(),
    totalProfiles: 0,
    totalRefinements: 0,
    completedRefinements: 0,
    averageCoherence: 0.5,
    totalImprovement: 0,
    averageImprovement: 0,
    dominantAspect: null,
  };
}

// Create profile
export function createStyleProfile(
  state: StyleRefinementEngineState,
  profileId: string,
  aspect: StyleAspect,
  baseline: number = 0.5,
  target: number = 0.8
): StyleRefinementEngineState {
  const profile: StyleProfile = { profileId, aspect, baseline, current: baseline, target, variance: 0, samples: 0 };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeStyle({ ...state, profiles, totalProfiles: profiles.size });
}

// Update profile measurement
export function updateStyleMeasurement(state: StyleRefinementEngineState, profileId: string, measurement: number): StyleRefinementEngineState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  // Update running stats
  const samples = profile.samples + 1;
  const current = (profile.current * profile.samples + measurement) / samples;
  const variance = Math.abs(measurement - profile.target) / profile.target;
  const updated: StyleProfile = { ...profile, current, variance, samples };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return recomputeStyle({ ...state, profiles });
}

// Apply refinement
export function applyStyleRefinement(
  state: StyleRefinementEngineState,
  refinementId: string,
  profileId: string,
  level: RefinementLevel,
  changes: string[],
  improvement: number
): StyleRefinementEngineState {
  const refinement: StyleRefinement = {
    refinementId, profileId, level, phase: 'refined',
    changes, improvement: Math.min(1, Math.max(0, improvement)),
    timestamp: Date.now(),
  };
  const refinements = new Map(state.refinements).set(refinementId, refinement);

  // Update profile
  const profile = state.profiles.get(profileId);
  let profiles = state.profiles;
  if (profile) {
    const updated: StyleProfile = { ...profile, current: Math.min(1, profile.current + improvement) };
    profiles = new Map(state.profiles).set(profileId, updated);
  }

  return recomputeStyle({ ...state, profiles, refinements, totalRefinements: refinements.size });
}

// Verify refinement
export function verifyStyleRefinement(state: StyleRefinementEngineState, refinementId: string, success: boolean): StyleRefinementEngineState {
  const refinement = state.refinements.get(refinementId);
  if (!refinement) return state;

  const updated: StyleRefinement = { ...refinement, phase: success ? 'verified' : 'analyzed' };
  const refinements = new Map(state.refinements).set(refinementId, updated);
  const completedRefinements = success ? state.completedRefinements + 1 : state.completedRefinements;
  return recomputeStyle({ ...state, refinements, completedRefinements });
}

// Get profiles by aspect
export function getProfilesByAspect(state: StyleRefinementEngineState, aspect: StyleAspect): StyleProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.aspect === aspect);
}

// Get style report
export function getStyleRefinementReport(state: StyleRefinementEngineState): {
  totalProfiles: number;
  totalRefinements: number;
  completedRefinements: number;
  averageCoherence: number;
  averageImprovement: number;
  dominantAspect: StyleAspect | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No profiles — create style profiles');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — refine more');
  if (state.averageImprovement < 0.1) recommendations.push('Low improvement — strengthen refinements');

  return {
    totalProfiles: state.totalProfiles,
    totalRefinements: state.totalRefinements,
    completedRefinements: state.completedRefinements,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    dominantAspect: state.dominantAspect,
    recommendations,
  };
}

// Recompute metrics
function recomputeStyle(state: StyleRefinementEngineState): StyleRefinementEngineState {
  const profiles = Array.from(state.profiles.values());
  const completedRefinements = Array.from(state.refinements.values()).filter(r => r.phase === 'verified');
  const totalImprovement = completedRefinements.reduce((s, r) => s + r.improvement, 0);
  const averageImprovement = completedRefinements.length === 0 ? 0
    : totalImprovement / completedRefinements.length;

  // Coherence = average of (1 - variance) for profiles
  const averageCoherence = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + (1 - p.variance), 0) / profiles.length;

  let dominantAspect: StyleAspect | null = null;
  let maxCount = -1;
  const aspectCounts = new Map<StyleAspect, number>();
  profiles.forEach(p => aspectCounts.set(p.aspect, (aspectCounts.get(p.aspect) || 0) + 1));
  aspectCounts.forEach((count, a) => { if (count > maxCount) { maxCount = count; dominantAspect = a; } });

  return { ...state, totalImprovement, averageImprovement, averageCoherence, dominantAspect };
}

// Reset style state
export function resetStyleRefinementEngineState(): StyleRefinementEngineState {
  return createStyleRefinementEngineState();
}