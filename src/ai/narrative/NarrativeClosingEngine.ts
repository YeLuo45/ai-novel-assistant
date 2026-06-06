/**
 * V1018 NarrativeClosingEngine — Direction B Iter 12/15 (Round 5)
 * Closing engine: story closings + final impressions
 * Sources: thunderbolt closing + chatdev + nanobot
 */

export type ClosingType = 'resolution' | 'epilogue' | 'open_ending' | 'circular' | 'flash_forward' | 'meditation';
export type ClosingStrength = 'weak' | 'adequate' | 'good' | 'strong' | 'resonant';
export type ClosingResonance = 'transient' | 'lasting' | 'enduring' | 'transformative' | 'universal';

export interface Closing {
  closingId: string;
  type: ClosingType;
  strength: ClosingStrength;
  resonance: ClosingResonance;
  description: string;
  finality: number;
  resonance_power: number;
  chapter: number;
}

export interface ClosingProfile {
  profileId: string,
  closingIds: string[],
  averageResonance: number,
  totalPower: number,
}

export interface NarrativeClosingEngineState {
  closings: Map<string, Closing>;
  profiles: Map<string, ClosingProfile>;
  totalClosings: number;
  totalProfiles: number;
  averageFinality: number;
  averageResonance: number;
  profilePower: number;
  closingMastery: number;
}

// Factory
export function createNarrativeClosingEngineState(): NarrativeClosingEngineState {
  return {
    closings: new Map(),
    profiles: new Map(),
    totalClosings: 0,
    totalProfiles: 0,
    averageFinality: 0.5,
    averageResonance: 0.5,
    profilePower: 0.5,
    closingMastery: 0.5,
  };
}

// Add closing
export function addClosing(
  state: NarrativeClosingEngineState,
  closingId: string,
  type: ClosingType,
  strength: ClosingStrength,
  resonance: ClosingResonance,
  description: string,
  finality: number,
  resonancePower: number,
  chapter: number
): NarrativeClosingEngineState {
  const closing: Closing = { closingId, type, strength, resonance, description, finality, resonance_power: resonancePower, chapter };
  const closings = new Map(state.closings).set(closingId, closing);
  return recomputeClosing({ ...state, closings, totalClosings: closings.size });
}

// Add profile
export function addClosingProfile(
  state: NarrativeClosingEngineState,
  profileId: string,
  closingIds: string[]
): NarrativeClosingEngineState {
  const closings = closingIds.map(id => state.closings.get(id)).filter((c): c is Closing => c !== undefined);
  const totalPower = closings.reduce((s, c) => s + c.resonance_power, 0);
  const averageResonance = closings.length === 0 ? 0
    : closings.reduce((s, c) => s + c.resonance_power, 0) / closings.length;
  const profile: ClosingProfile = { profileId, closingIds, averageResonance, totalPower };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeClosing({ ...state, profiles, totalProfiles: profiles.size });
}

// Get closings by type
export function getClosingsByType(state: NarrativeClosingEngineState, type: ClosingType): Closing[] {
  return Array.from(state.closings.values()).filter(c => c.type === type);
}

// Get closing report
export function getClosingReport(state: NarrativeClosingEngineState): {
  totalClosings: number;
  totalProfiles: number;
  averageFinality: number;
  averageResonance: number;
  closingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalClosings === 0) recommendations.push('No closings — add closings');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.closingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalClosings: state.totalClosings,
    totalProfiles: state.totalProfiles,
    averageFinality: Math.round(state.averageFinality * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    closingMastery: Math.round(state.closingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeClosing(state: NarrativeClosingEngineState): NarrativeClosingEngineState {
  const closings = Array.from(state.closings.values());
  const averageFinality = closings.length === 0 ? 0.5
    : closings.reduce((s, c) => s + c.finality, 0) / closings.length;
  const averageResonance = closings.length === 0 ? 0.5
    : closings.reduce((s, c) => s + c.resonance_power, 0) / closings.length;

  const profiles = Array.from(state.profiles.values());
  const profilePower = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.averageResonance, 0) / profiles.length;

  const closingMastery = (averageFinality * 0.3 + averageResonance * 0.4 + profilePower * 0.3);

  return { ...state, averageFinality, averageResonance, profilePower, closingMastery };
}

// Reset
export function resetNarrativeClosingEngineState(): NarrativeClosingEngineState {
  return createNarrativeClosingEngineState();
}