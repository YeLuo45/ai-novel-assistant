/**
 * V886 WorldSociologyEngine — Direction C Iter 6/15 (Round 4)
 * World sociology engine: social structures + institutions + power
 * Sources: nanobot sociology + ruflo + thunderbolt
 */

export type SocialClass = 'ruling' | 'nobility' | 'merchant' | 'artisan' | 'peasant' | 'outcast';
export type InstitutionType = 'government' | 'religion' | 'education' | 'military' | 'guild' | 'criminal';
export type SocialHealth = 'oppressive' | 'unstable' | 'stable' | 'prosperous' | 'utopian';

export interface SocialGroup {
  groupId: string;
  name: string;
  class: SocialClass;
  size: number;
  power: number;
  privileges: string[];
  obligations: string[];
  chapter: number;
}

export interface Institution {
  institutionId: string;
  name: string;
  type: InstitutionType;
  influence: number;
  reach: number;
  leader: string;
  corrupted: boolean;
}

export interface WorldSociologyEngineState {
  groups: Map<string, SocialGroup>;
  institutions: Map<string, Institution>;
  totalGroups: number;
  totalInstitutions: number;
  totalPopulation: number;
  classCoverage: number;
  socialStability: number;
  socialHealth: SocialHealth;
}

// Factory
export function createWorldSociologyEngineState(): WorldSociologyEngineState {
  return {
    groups: new Map(),
    institutions: new Map(),
    totalGroups: 0,
    totalInstitutions: 0,
    totalPopulation: 0,
    classCoverage: 0,
    socialStability: 0.5,
    socialHealth: 'stable',
  };
}

// Add group
export function addSocialGroup(
  state: WorldSociologyEngineState,
  groupId: string,
  name: string,
  socialClass: SocialClass,
  size: number,
  power: number,
  chapter: number,
  privileges: string[] = [],
  obligations: string[] = []
): WorldSociologyEngineState {
  const group: SocialGroup = { groupId, name, class: socialClass, size, power, privileges, obligations, chapter };
  const groups = new Map(state.groups).set(groupId, group);
  return recomputeSociology({ ...state, groups, totalGroups: groups.size });
}

// Add institution
export function addInstitution(
  state: WorldSociologyEngineState,
  institutionId: string,
  name: string,
  type: InstitutionType,
  influence: number,
  reach: number,
  leader: string,
  corrupted: boolean = false
): WorldSociologyEngineState {
  const institution: Institution = { institutionId, name, type, influence, reach, leader, corrupted };
  const institutions = new Map(state.institutions).set(institutionId, institution);
  return recomputeSociology({ ...state, institutions, totalInstitutions: institutions.size });
}

// Get groups by class
export function getGroupsByClass(state: WorldSociologyEngineState, socialClass: SocialClass): SocialGroup[] {
  return Array.from(state.groups.values()).filter(g => g.class === socialClass);
}

// Get sociology report
export function getSociologyReport(state: WorldSociologyEngineState): {
  totalGroups: number;
  totalInstitutions: number;
  totalPopulation: number;
  classCoverage: number;
  socialStability: number;
  socialHealth: SocialHealth;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGroups === 0) recommendations.push('No groups — add social groups');
  if (state.classCoverage < 0.3) recommendations.push('Low class coverage — diversify');
  if (state.socialStability < 0.5) recommendations.push('Low stability — strengthen');

  return {
    totalGroups: state.totalGroups,
    totalInstitutions: state.totalInstitutions,
    totalPopulation: state.totalPopulation,
    classCoverage: Math.round(state.classCoverage * 100) / 100,
    socialStability: Math.round(state.socialStability * 100) / 100,
    socialHealth: state.socialHealth,
    recommendations,
  };
}

// Recompute metrics
function recomputeSociology(state: WorldSociologyEngineState): WorldSociologyEngineState {
  const groups = Array.from(state.groups.values());
  const totalPopulation = groups.reduce((s, g) => s + g.size, 0);
  const classSet = new Set(groups.map(g => g.class));
  const classCoverage = Math.min(1, classSet.size / 5);

  const institutions = Array.from(state.institutions.values());
  const corruptedCount = institutions.filter(i => i.corrupted).length;
  const stabilityFromInstitutions = institutions.length === 0 ? 0.5
    : 1 - (corruptedCount / institutions.length) * 0.5;

  const powerImbalance = groups.length === 0 ? 0
    : Math.max(...groups.map(g => g.power)) - Math.min(...groups.map(g => g.power));
  const stabilityFromGroups = groups.length === 0 ? 0.5
    : 1 - Math.min(1, powerImbalance);

  const socialStability = (stabilityFromInstitutions + stabilityFromGroups) / 2;

  const health: SocialHealth = socialStability < 0.3 ? 'oppressive'
    : socialStability < 0.5 ? 'unstable'
    : socialStability < 0.7 ? 'stable'
    : socialStability < 0.85 ? 'prosperous'
    : 'utopian';

  return { ...state, totalPopulation, classCoverage, socialStability, socialHealth: health };
}

// Reset sociology state
export function resetWorldSociologyEngineState(): WorldSociologyEngineState {
  return createWorldSociologyEngineState();
}