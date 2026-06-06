/**
 * V1060 CharacterSociologyEngine — Direction C Iter 18/20 (Round 5)
 * Character sociology engine: character's social position + relations
 * Sources: nanobot sociology + thunderbolt + chatdev
 */

export type SocialClass = 'aristocracy' | 'upper' | 'middle' | 'working' | 'lower' | 'outcast';
export type SocialRole = 'leader' | 'follower' | 'outsider' | 'bridge' | 'ritualist' | 'rebel';
export type SocialNetwork = 'kinship' | 'professional' | 'voluntary' | 'community' | 'institutional' | 'transnational';

export interface CharacterSocial {
  socialId: string;
  class: SocialClass;
  role: SocialRole;
  network: SocialNetwork;
  characterId: string;
  description: string;
  influence: number;
  mobility: number;
  chapter: number;
}

export interface SocialPosition {
  positionId: string,
  characterId: string,
  socialIds: string[],
  socialCapital: number,
  range: number,
}

export interface CharacterSociologyEngineState {
  socials: Map<string, CharacterSocial>;
  positions: Map<string, SocialPosition>;
  totalSocials: number;
  totalPositions: number;
  averageInfluence: number;
  averageMobility: number;
  positionRange: number;
  sociologyMastery: number;
}

// Factory
export function createCharacterSociologyEngineState(): CharacterSociologyEngineState {
  return {
    socials: new Map(),
    positions: new Map(),
    totalSocials: 0,
    totalPositions: 0,
    averageInfluence: 0.5,
    averageMobility: 0.5,
    positionRange: 0.5,
    sociologyMastery: 0.5,
  };
}

// Add social
export function addCharacterSocial(
  state: CharacterSociologyEngineState,
  socialId: string,
  class_: SocialClass,
  role: SocialRole,
  network: SocialNetwork,
  characterId: string,
  description: string,
  influence: number,
  mobility: number,
  chapter: number
): CharacterSociologyEngineState {
  const social: CharacterSocial = { socialId, class: class_, role, network, characterId, description, influence, mobility, chapter };
  const socials = new Map(state.socials).set(socialId, social);
  return recomputeSociology({ ...state, socials, totalSocials: socials.size });
}

// Add position
export function addSocialPosition(
  state: CharacterSociologyEngineState,
  positionId: string,
  characterId: string,
  socialIds: string[]
): CharacterSociologyEngineState {
  const socials = socialIds.map(id => state.socials.get(id)).filter((s): s is CharacterSocial => s !== undefined);
  const socialCapital = socials.length === 0 ? 0
    : socials.reduce((s, sc) => s + sc.influence, 0) / socials.length;
  const networkSet = new Set(socials.map(s => s.network));
  const range = Math.min(1, networkSet.size / 6);
  const position: SocialPosition = { positionId, characterId, socialIds, socialCapital, range };
  const positions = new Map(state.positions).set(positionId, position);
  return recomputeSociology({ ...state, positions, totalPositions: positions.size });
}

// Get socials by class
export function getSocialsByClass(state: CharacterSociologyEngineState, class_: SocialClass): CharacterSocial[] {
  return Array.from(state.socials.values()).filter(s => s.class === class_);
}

// Get sociology report
export function getSociologyReport(state: CharacterSociologyEngineState): {
  totalSocials: number;
  totalPositions: number;
  averageInfluence: number;
  averageMobility: number;
  sociologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSocials === 0) recommendations.push('No socials — add character socials');
  if (state.averageMobility < 0.5) recommendations.push('Low mobility — strengthen');
  if (state.sociologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSocials: state.totalSocials,
    totalPositions: state.totalPositions,
    averageInfluence: Math.round(state.averageInfluence * 100) / 100,
    averageMobility: Math.round(state.averageMobility * 100) / 100,
    sociologyMastery: Math.round(state.sociologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSociology(state: CharacterSociologyEngineState): CharacterSociologyEngineState {
  const socials = Array.from(state.socials.values());
  const averageInfluence = socials.length === 0 ? 0.5
    : socials.reduce((s, sc) => s + sc.influence, 0) / socials.length;
  const averageMobility = socials.length === 0 ? 0.5
    : socials.reduce((s, sc) => s + sc.mobility, 0) / socials.length;

  const positions = Array.from(state.positions.values());
  const positionRange = positions.length === 0 ? 0.5
    : positions.reduce((s, p) => s + p.range, 0) / positions.length;

  const sociologyMastery = (averageInfluence * 0.3 + averageMobility * 0.4 + positionRange * 0.3);

  return { ...state, averageInfluence, averageMobility, positionRange, sociologyMastery };
}

// Reset
export function resetCharacterSociologyEngineState(): CharacterSociologyEngineState {
  return createCharacterSociologyEngineState();
}