/**
 * V1068 NarrativeProfilingEngine — Direction D Iter 2/20 (Round 6)
 * Narrative profiling engine: profile narrative elements + readers
 * Sources: ruflo profiling + nanobot + chatdev
 */

export type ProfileType = 'character' | 'reader' | 'narrative' | 'voice' | 'theme' | 'genre';
export type ProfileDepth = 'surface' | 'moderate' | 'deep' | 'profound' | 'archetypal';
export type ProfileAccuracy = 'approximate' | 'good' | 'precise' | 'uncanny' | 'prescient';

export interface Profile {
  profileId: string;
  type: ProfileType;
  depth: ProfileDepth;
  accuracy: ProfileAccuracy;
  name: string;
  description: string;
  fidelity: number;
  utility: number;
}

export interface ProfileSnapshot {
  snapshotId: string,
  profileId: string,
  timestamp: number,
  drift: number,
  confidence: number,
}

export interface NarrativeProfilingEngineState {
  profiles: Map<string, Profile>;
  snapshots: Map<string, ProfileSnapshot>;
  totalProfiles: number;
  totalSnapshots: number;
  averageFidelity: number;
  averageUtility: number;
  snapshotConfidence: number;
  profilingMastery: number;
}

// Factory
export function createNarrativeProfilingEngineState(): NarrativeProfilingEngineState {
  return {
    profiles: new Map(),
    snapshots: new Map(),
    totalProfiles: 0,
    totalSnapshots: 0,
    averageFidelity: 0.5,
    averageUtility: 0.5,
    snapshotConfidence: 0.5,
    profilingMastery: 0.5,
  };
}

// Add profile
export function addProfile(
  state: NarrativeProfilingEngineState,
  profileId: string,
  type: ProfileType,
  depth: ProfileDepth,
  accuracy: ProfileAccuracy,
  name: string,
  description: string,
  fidelity: number,
  utility: number
): NarrativeProfilingEngineState {
  const profile: Profile = { profileId, type, depth, accuracy, name, description, fidelity, utility };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeProfiling({ ...state, profiles, totalProfiles: profiles.size });
}

// Snapshot
export function takeProfileSnapshot(
  state: NarrativeProfilingEngineState,
  snapshotId: string,
  profileId: string,
  timestamp: number,
  drift: number
): NarrativeProfilingEngineState {
  const profile = state.profiles.get(profileId);
  const confidence = profile ? (1 - drift) * profile.fidelity : 0.5;
  const snapshot: ProfileSnapshot = { snapshotId, profileId, timestamp, drift, confidence };
  const snapshots = new Map(state.snapshots).set(snapshotId, snapshot);
  return recomputeProfiling({ ...state, snapshots, totalSnapshots: snapshots.size });
}

// Get profiles by type
export function getProfilesByType(state: NarrativeProfilingEngineState, type: ProfileType): Profile[] {
  return Array.from(state.profiles.values()).filter(p => p.type === type);
}

// Get profiling report
export function getProfilingReport(state: NarrativeProfilingEngineState): {
  totalProfiles: number;
  totalSnapshots: number;
  averageFidelity: number;
  averageUtility: number;
  profilingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No profiles — add profiles');
  if (state.averageFidelity < 0.5) recommendations.push('Low fidelity — improve');
  if (state.profilingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalProfiles: state.totalProfiles,
    totalSnapshots: state.totalSnapshots,
    averageFidelity: Math.round(state.averageFidelity * 100) / 100,
    averageUtility: Math.round(state.averageUtility * 100) / 100,
    profilingMastery: Math.round(state.profilingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeProfiling(state: NarrativeProfilingEngineState): NarrativeProfilingEngineState {
  const profiles = Array.from(state.profiles.values());
  const averageFidelity = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.fidelity, 0) / profiles.length;
  const averageUtility = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.utility, 0) / profiles.length;

  const snapshots = Array.from(state.snapshots.values());
  const snapshotConfidence = snapshots.length === 0 ? 0.5
    : snapshots.reduce((s, sn) => s + sn.confidence, 0) / snapshots.length;

  const profilingMastery = (averageFidelity * 0.4 + averageUtility * 0.3 + snapshotConfidence * 0.3);

  return { ...state, averageFidelity, averageUtility, snapshotConfidence, profilingMastery };
}

// Reset
export function resetNarrativeProfilingEngineState(): NarrativeProfilingEngineState {
  return createNarrativeProfilingEngineState();
}