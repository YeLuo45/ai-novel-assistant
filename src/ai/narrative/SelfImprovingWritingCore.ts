/**
 * V912 SelfImprovingWritingCore — Direction D Iter 4/15 (Round 4)
 * Self-improving writing core: writing that improves itself
 * Sources: generic-agent self-improve + thunderbolt + nanobot
 */

export type ImprovementArea = 'craft' | 'style' | 'pacing' | 'clarity' | 'depth' | 'voice';
export type ImprovementMethod = 'practice' | 'analysis' | 'feedback' | 'study' | 'experimentation' | 'intuition';
export type GrowthStage = 'novice' | 'developing' | 'competent' | 'proficient' | 'expert' | 'master';

export interface SkillImprovement {
  improvementId: string;
  area: ImprovementArea;
  method: ImprovementMethod;
  before: number;
  after: number;
  gain: number;
  chapter: number;
}

export interface SkillProfile {
  profileId: string;
  skillName: string;
  area: ImprovementArea;
  level: number;
  improvements: string[];
  growthStage: GrowthStage;
}

export interface SelfImprovingWritingCoreState {
  improvements: Map<string, SkillImprovement>;
  profiles: Map<string, SkillProfile>;
  totalImprovements: number;
  totalProfiles: number;
  totalGain: number;
  averageGain: number;
  growthVelocity: number;
  selfImprovementScore: number;
  coreMastery: number;
}

// Factory
export function createSelfImprovingWritingCoreState(): SelfImprovingWritingCoreState {
  return {
    improvements: new Map(),
    profiles: new Map(),
    totalImprovements: 0,
    totalProfiles: 0,
    totalGain: 0,
    averageGain: 0,
    growthVelocity: 0.5,
    selfImprovementScore: 0.5,
    coreMastery: 0.5,
  };
}

// Record improvement
export function recordImprovement(
  state: SelfImprovingWritingCoreState,
  improvementId: string,
  area: ImprovementArea,
  method: ImprovementMethod,
  before: number,
  after: number,
  chapter: number
): SelfImprovingWritingCoreState {
  const gain = Math.max(0, after - before);
  const improvement: SkillImprovement = { improvementId, area, method, before, after, gain, chapter };
  const improvements = new Map(state.improvements).set(improvementId, improvement);
  const totalGain = state.totalGain + gain;
  return recomputeSelfImprove({ ...state, improvements, totalGain, totalImprovements: improvements.size });
}

// Add skill profile
export function addSkillProfile(
  state: SelfImprovingWritingCoreState,
  profileId: string,
  skillName: string,
  area: ImprovementArea,
  level: number = 0.5
): SelfImprovingWritingCoreState {
  const stage: GrowthStage = level < 0.2 ? 'novice'
    : level < 0.4 ? 'developing'
    : level < 0.6 ? 'competent'
    : level < 0.75 ? 'proficient'
    : level < 0.9 ? 'expert'
    : 'master';
  const profile: SkillProfile = { profileId, skillName, area, level, improvements: [], growthStage: stage };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeSelfImprove({ ...state, profiles, totalProfiles: profiles.size });
}

// Update skill level
export function updateSkillLevel(state: SelfImprovingWritingCoreState, profileId: string, level: number): SelfImprovingWritingCoreState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  const stage: GrowthStage = level < 0.2 ? 'novice'
    : level < 0.4 ? 'developing'
    : level < 0.6 ? 'competent'
    : level < 0.75 ? 'proficient'
    : level < 0.9 ? 'expert'
    : 'master';
  const updated: SkillProfile = { ...profile, level, growthStage: stage };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return recomputeSelfImprove({ ...state, profiles });
}

// Get profiles by area
export function getProfilesByArea(state: SelfImprovingWritingCoreState, area: ImprovementArea): SkillProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.area === area);
}

// Get self-improvement report
export function getSelfImprovementReport(state: SelfImprovingWritingCoreState): {
  totalImprovements: number;
  totalProfiles: number;
  totalGain: number;
  averageGain: number;
  growthVelocity: number;
  selfImprovementScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalImprovements === 0) recommendations.push('No improvements — record improvements');
  if (state.averageGain < 0.1) recommendations.push('Low gain — improve methods');
  if (state.growthVelocity < 0.3) recommendations.push('Low velocity — increase pace');

  return {
    totalImprovements: state.totalImprovements,
    totalProfiles: state.totalProfiles,
    totalGain: Math.round(state.totalGain * 100) / 100,
    averageGain: Math.round(state.averageGain * 100) / 100,
    growthVelocity: Math.round(state.growthVelocity * 100) / 100,
    selfImprovementScore: Math.round(state.selfImprovementScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfImprove(state: SelfImprovingWritingCoreState): SelfImprovingWritingCoreState {
  const improvements = Array.from(state.improvements.values());
  const averageGain = improvements.length === 0 ? 0
    : improvements.reduce((s, i) => s + i.gain, 0) / improvements.length;

  const profiles = Array.from(state.profiles.values());
  const averageLevel = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.level, 0) / profiles.length;

  const growthVelocity = Math.min(1, improvements.length / Math.max(1, profiles.length * 3));

  const selfImprovementScore = (averageGain * 0.4 + averageLevel * 0.3 + growthVelocity * 0.3);
  const coreMastery = selfImprovementScore;

  return { ...state, averageGain, growthVelocity, selfImprovementScore, coreMastery };
}

// Reset self-improvement state
export function resetSelfImprovingWritingCoreState(): SelfImprovingWritingCoreState {
  return createSelfImprovingWritingCoreState();
}