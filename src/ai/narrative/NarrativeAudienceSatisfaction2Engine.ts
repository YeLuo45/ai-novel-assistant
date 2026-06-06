/**
 * V1242 NarrativeAudienceSatisfactionEngine2 — Direction H Iter 9/20 (Round 5)
 * Audience satisfaction engine v2: deeper satisfaction analysis
 * Sources: ruflo satisfaction + nanobot + thunderbolt
 */

export type AudienceSatisfactionDimension = 'plot' | 'character' | 'theme' | 'style' | 'emotion' | 'meaning';
export type AudienceSatisfactionLevel = 'low' | 'moderate' | 'good' | 'great' | 'transcendent';
export type AudienceSatisfactionLongevity = 'transient' | 'brief' | 'lasting' | 'enduring' | 'permanent';

export interface AudienceSatisfactionDetail {
  detailId: string;
  dimension: AudienceSatisfactionDimension;
  level: AudienceSatisfactionLevel;
  longevity: AudienceSatisfactionLongevity;
  description: string;
  score: number;
  impact: number;
  chapter: number;
}

export interface AudienceSatisfactionProfile {
  profileId: string,
  detailIds: string[],
  cumulativeScore: number,
  balance: number,
}

export interface NarrativeAudienceSatisfaction2EngineState {
  details: Map<string, AudienceSatisfactionDetail>;
  profiles: Map<string, AudienceSatisfactionProfile>;
  totalDetails: number;
  totalProfiles: number;
  averageScore: number;
  averageImpact: number;
  profileBalance: number;
  audienceSatisfaction2Mastery: number;
}

// Factory
export function createNarrativeAudienceSatisfaction2EngineState(): NarrativeAudienceSatisfaction2EngineState {
  return {
    details: new Map(),
    profiles: new Map(),
    totalDetails: 0,
    totalProfiles: 0,
    averageScore: 0.5,
    averageImpact: 0.5,
    profileBalance: 0.5,
    audienceSatisfaction2Mastery: 0.5,
  };
}

// Add detail
export function addAudienceSatisfactionDetail(
  state: NarrativeAudienceSatisfaction2EngineState,
  detailId: string,
  dimension: AudienceSatisfactionDimension,
  level: AudienceSatisfactionLevel,
  longevity: AudienceSatisfactionLongevity,
  description: string,
  score: number,
  impact: number,
  chapter: number
): NarrativeAudienceSatisfaction2EngineState {
  const detail: AudienceSatisfactionDetail = { detailId, dimension, level, longevity, description, score, impact, chapter };
  const details = new Map(state.details).set(detailId, detail);
  return recomputeAudienceSatisfaction2({ ...state, details, totalDetails: details.size });
}

// Add profile
export function addAudienceSatisfactionProfile(
  state: NarrativeAudienceSatisfaction2EngineState,
  profileId: string,
  detailIds: string[]
): NarrativeAudienceSatisfaction2EngineState {
  const details = detailIds.map(id => state.details.get(id)).filter((d): d is AudienceSatisfactionDetail => d !== undefined);
  const cumulativeScore = details.length === 0 ? 0
    : details.reduce((s, d) => s + d.score, 0) / details.length;
  const dimSet = new Set(details.map(d => d.dimension));
  const balance = Math.min(1, dimSet.size / 6);
  const profile: AudienceSatisfactionProfile = { profileId, detailIds, cumulativeScore, balance };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeAudienceSatisfaction2({ ...state, profiles, totalProfiles: profiles.size });
}

// Get details by dimension
export function getAudienceSatisfactionDetailsByDimension(state: NarrativeAudienceSatisfaction2EngineState, dimension: AudienceSatisfactionDimension): AudienceSatisfactionDetail[] {
  return Array.from(state.details.values()).filter(d => d.dimension === dimension);
}

// Get audience satisfaction2 report
export function getAudienceSatisfaction2Report(state: NarrativeAudienceSatisfaction2EngineState): {
  totalDetails: number;
  totalProfiles: number;
  averageScore: number;
  averageImpact: number;
  audienceSatisfaction2Mastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDetails === 0) recommendations.push('No details — add audience satisfaction details');
  if (state.averageScore < 0.5) recommendations.push('Low score — strengthen');
  if (state.audienceSatisfaction2Mastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDetails: state.totalDetails,
    totalProfiles: state.totalProfiles,
    averageScore: Math.round(state.averageScore * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    audienceSatisfaction2Mastery: Math.round(state.audienceSatisfaction2Mastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceSatisfaction2(state: NarrativeAudienceSatisfaction2EngineState): NarrativeAudienceSatisfaction2EngineState {
  const details = Array.from(state.details.values());
  const averageScore = details.length === 0 ? 0.5
    : details.reduce((s, d) => s + d.score, 0) / details.length;
  const averageImpact = details.length === 0 ? 0.5
    : details.reduce((s, d) => s + d.impact, 0) / details.length;

  const profiles = Array.from(state.profiles.values());
  const profileBalance = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.balance, 0) / profiles.length;

  const audienceSatisfaction2Mastery = (averageScore * 0.4 + averageImpact * 0.3 + profileBalance * 0.3);

  return { ...state, averageScore, averageImpact, profileBalance, audienceSatisfaction2Mastery };
}

// Reset
export function resetNarrativeAudienceSatisfaction2EngineState(): NarrativeAudienceSatisfaction2EngineState {
  return createNarrativeAudienceSatisfaction2EngineState();
}