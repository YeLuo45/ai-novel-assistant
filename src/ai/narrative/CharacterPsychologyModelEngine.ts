/**
 * V888 CharacterPsychologyModelEngine — Direction C Iter 7/15 (Round 4)
 * Character psychology model engine: deep psychological modeling
 * Sources: nanobot psychology + chatdev + ruflo
 */

export type PersonalityTrait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
export type DefenseMechanism = 'denial' | 'projection' | 'sublimation' | 'rationalization' | 'displacement' | 'humor';
export type PsychologicalState = 'balanced' | 'anxious' | 'depressed' | 'euphoric' | 'traumatized' | 'transformed';

export interface PersonalityProfile {
  profileId: string;
  characterId: string;
  traits: Map<PersonalityTrait, number>;
  defenseMechanisms: DefenseMechanism[];
  selfEsteem: number;
  resilience: number;
  developmentStage: string;
}

export interface PsychologicalEvent {
  eventId: string;
  characterId: string;
  description: string;
  impact: number;
  defense: DefenseMechanism;
  state: PsychologicalState;
  resolved: boolean;
  chapter: number;
}

export interface CharacterPsychologyModelEngineState {
  profiles: Map<string, PersonalityProfile>;
  events: Map<string, PsychologicalEvent>;
  totalProfiles: number;
  totalEvents: number;
  averageResilience: number;
  averageSelfEsteem: number;
  psychologyDepth: number;
  modelCoherence: number;
  characterInsight: number;
}

// Factory
export function createCharacterPsychologyModelEngineState(): CharacterPsychologyModelEngineState {
  return {
    profiles: new Map(),
    events: new Map(),
    totalProfiles: 0,
    totalEvents: 0,
    averageResilience: 0.5,
    averageSelfEsteem: 0.5,
    psychologyDepth: 0.5,
    modelCoherence: 0.5,
    characterInsight: 0.5,
  };
}

// Create profile
export function createPersonalityProfile(
  state: CharacterPsychologyModelEngineState,
  profileId: string,
  characterId: string,
  traits: Map<PersonalityTrait, number>,
  developmentStage: string,
  selfEsteem: number = 0.5,
  resilience: number = 0.5,
  defenseMechanisms: DefenseMechanism[] = []
): CharacterPsychologyModelEngineState {
  const profile: PersonalityProfile = {
    profileId, characterId,
    traits: new Map(Array.from(traits.entries()).map(([k, v]) => [k, Math.min(1, Math.max(0, v))])),
    selfEsteem: Math.min(1, Math.max(0, selfEsteem)),
    resilience: Math.min(1, Math.max(0, resilience)),
    developmentStage, defenseMechanisms,
  };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputePsychologyModel({ ...state, profiles, totalProfiles: profiles.size });
}

// Add psychological event
export function addPsychologicalEvent(
  state: CharacterPsychologyModelEngineState,
  eventId: string,
  characterId: string,
  description: string,
  impact: number,
  defense: DefenseMechanism,
  stateType: PsychologicalState,
  chapter: number
): CharacterPsychologyModelEngineState {
  const event: PsychologicalEvent = {
    eventId, characterId, description,
    impact: Math.min(1, Math.max(0, impact)),
    defense, state: stateType, resolved: false, chapter,
  };
  const events = new Map(state.events).set(eventId, event);
  return recomputePsychologyModel({ ...state, events, totalEvents: events.size });
}

// Add defense mechanism
export function addDefenseMechanism(state: CharacterPsychologyModelEngineState, profileId: string, defense: DefenseMechanism): CharacterPsychologyModelEngineState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  const updated: PersonalityProfile = { ...profile, defenseMechanisms: [...profile.defenseMechanisms, defense] };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return recomputePsychologyModel({ ...state, profiles });
}

// Get profiles by character
export function getProfilesByCharacter(state: CharacterPsychologyModelEngineState, characterId: string): PersonalityProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.characterId === characterId);
}

// Get psychology report
export function getPsychologyModelReport(state: CharacterPsychologyModelEngineState): {
  totalProfiles: number;
  totalEvents: number;
  averageResilience: number;
  averageSelfEsteem: number;
  psychologyDepth: number;
  characterInsight: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No profiles — create profiles');
  if (state.averageResilience < 0.5) recommendations.push('Low resilience — strengthen');
  if (state.psychologyDepth < 0.4) recommendations.push('Low depth — add detail');

  return {
    totalProfiles: state.totalProfiles,
    totalEvents: state.totalEvents,
    averageResilience: Math.round(state.averageResilience * 100) / 100,
    averageSelfEsteem: Math.round(state.averageSelfEsteem * 100) / 100,
    psychologyDepth: Math.round(state.psychologyDepth * 100) / 100,
    characterInsight: Math.round(state.characterInsight * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePsychologyModel(state: CharacterPsychologyModelEngineState): CharacterPsychologyModelEngineState {
  const profiles = Array.from(state.profiles.values());
  const averageResilience = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.resilience, 0) / profiles.length;
  const averageSelfEsteem = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.selfEsteem, 0) / profiles.length;

  // Depth: how many traits + defenses per profile
  const avgProfileDetail = profiles.length === 0 ? 0
    : profiles.reduce((s, p) => s + p.traits.size + p.defenseMechanisms.length, 0) / profiles.length;
  const psychologyDepth = Math.min(1, avgProfileDetail / 10);

  // Coherence: how consistent profiles are (low variance in selfEsteem)
  const variance = profiles.length === 0 ? 0
    : profiles.reduce((s, p) => s + Math.pow(p.selfEsteem - averageSelfEsteem, 2), 0) / profiles.length;
  const modelCoherence = Math.max(0, 1 - variance * 4);

  const characterInsight = (averageResilience * 0.3 + averageSelfEsteem * 0.3 + psychologyDepth * 0.2 + modelCoherence * 0.2);

  return { ...state, averageResilience, averageSelfEsteem, psychologyDepth, modelCoherence, characterInsight };
}

// Reset psychology state
export function resetCharacterPsychologyModelEngineState(): CharacterPsychologyModelEngineState {
  return createCharacterPsychologyModelEngineState();
}