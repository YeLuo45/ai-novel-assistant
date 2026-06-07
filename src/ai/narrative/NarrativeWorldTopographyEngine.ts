/**
 * V1322 NarrativeWorldTopographyEngine — Direction J Iter 9/30 (Round 5)
 * World topography engine: surface features of narrative world
 * Sources: ruflo topography + nanobot + thunderbolt
 */

export type WorldTopographyFeature = 'peak' | 'ridge' | 'valley' | 'basin' | 'plateau' | 'cliff' | 'transcendent';
export type WorldTopographyElevation = 'subterranean' | 'lowland' | 'upland' | 'highland' | 'alpine' | 'transcendent' | 'celestial';
export type WorldTopographyRuggedness = 'smooth' | 'gentle' | 'moderate' | 'rugged' | 'extreme' | 'legendary' | 'transcendent';

export interface WorldTopographyEntry {
  entryId: string;
  feature: WorldTopographyFeature;
  elevation: WorldTopographyElevation;
  ruggedness: WorldTopographyRuggedness;
  description: string;
  verticality: number;
  challenge: number;
  chapter: number;
}

export interface WorldTopographyProfile {
  profileId: string,
  entryIds: string[],
  cumulativeVerticality: number,
  complexity: number,
}

export interface NarrativeWorldTopographyEngineState {
  entries: Map<string, WorldTopographyEntry>;
  profiles: Map<string, WorldTopographyProfile>;
  totalEntries: number;
  totalProfiles: number;
  averageVerticality: number;
  averageChallenge: number;
  profileComplexity: number;
  worldTopographyMastery: number;
}

// Factory
export function createNarrativeWorldTopographyEngineState(): NarrativeWorldTopographyEngineState {
  return {
    entries: new Map(),
    profiles: new Map(),
    totalEntries: 0,
    totalProfiles: 0,
    averageVerticality: 0.5,
    averageChallenge: 0.5,
    profileComplexity: 0.5,
    worldTopographyMastery: 0.5,
  };
}

// Add entry
export function addWorldTopographyEntry(
  state: NarrativeWorldTopographyEngineState,
  entryId: string,
  feature: WorldTopographyFeature,
  elevation: WorldTopographyElevation,
  ruggedness: WorldTopographyRuggedness,
  description: string,
  verticality: number,
  challenge: number,
  chapter: number
): NarrativeWorldTopographyEngineState {
  const entry: WorldTopographyEntry = { entryId, feature, elevation, ruggedness, description, verticality, challenge, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldTopography({ ...state, entries, totalEntries: entries.size });
}

// Add profile
export function addWorldTopographyProfile(
  state: NarrativeWorldTopographyEngineState,
  profileId: string,
  entryIds: string[]
): NarrativeWorldTopographyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldTopographyEntry => e !== undefined);
  const cumulativeVerticality = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.verticality, 0) / entries.length;
  const featureSet = new Set(entries.map(e => e.feature));
  const complexity = Math.min(1, featureSet.size / 7);
  const profile: WorldTopographyProfile = { profileId, entryIds, cumulativeVerticality, complexity };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeWorldTopography({ ...state, profiles, totalProfiles: profiles.size });
}

// Get entries by feature
export function getWorldTopographyEntriesByFeature(state: NarrativeWorldTopographyEngineState, feature: WorldTopographyFeature): WorldTopographyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.feature === feature);
}

// Get world topography report
export function getWorldTopographyReport(state: NarrativeWorldTopographyEngineState): {
  totalEntries: number;
  totalProfiles: number;
  averageVerticality: number;
  averageChallenge: number;
  worldTopographyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world topography entries');
  if (state.averageVerticality < 0.5) recommendations.push('Low verticality — strengthen');
  if (state.worldTopographyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalProfiles: state.totalProfiles,
    averageVerticality: Math.round(state.averageVerticality * 100) / 100,
    averageChallenge: Math.round(state.averageChallenge * 100) / 100,
    worldTopographyMastery: Math.round(state.worldTopographyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldTopography(state: NarrativeWorldTopographyEngineState): NarrativeWorldTopographyEngineState {
  const entries = Array.from(state.entries.values());
  const averageVerticality = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.verticality, 0) / entries.length;
  const averageChallenge = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.challenge, 0) / entries.length;

  const profiles = Array.from(state.profiles.values());
  const profileComplexity = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.complexity, 0) / profiles.length;

  const worldTopographyMastery = (averageVerticality * 0.4 + averageChallenge * 0.3 + profileComplexity * 0.3);

  return { ...state, averageVerticality, averageChallenge, profileComplexity, worldTopographyMastery };
}

// Reset
export function resetNarrativeWorldTopographyEngineState(): NarrativeWorldTopographyEngineState {
  return createNarrativeWorldTopographyEngineState();
}