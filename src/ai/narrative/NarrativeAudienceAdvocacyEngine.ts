/**
 * V1260 NarrativeAudienceAdvocacyEngine — Direction H Iter 18/20 (Round 5)
 * Audience advocacy engine: audience advocacy
 * Sources: nanobot advocacy + thunderbolt + ruflo
 */

export type AudienceAdvocacyType = 'personal' | 'enthusiastic' | 'evangelical' | 'defensive' | 'intellectual' | 'transcendent';
export type AudienceAdvocacyIntensity = 'subtle' | 'moderate' | 'strong' | 'passionate' | 'crusading';
export type AudienceAdvocacyReach = 'inner_circle' | 'friends' | 'community' | 'public' | 'universal';

export interface AudienceAdvocacy {
  advocacyId: string;
  type: AudienceAdvocacyType;
  intensity: AudienceAdvocacyIntensity;
  reach: AudienceAdvocacyReach;
  description: string;
  passion: number;
  effectiveness: number;
  chapter: number;
}

export interface AudienceAdvocacyCampaign {
  campaignId: string,
  advocacyIds: string[],
  cumulativePassion: number,
  momentum: number,
}

export interface NarrativeAudienceAdvocacyEngineState {
  advocacies: Map<string, AudienceAdvocacy>;
  campaigns: Map<string, AudienceAdvocacyCampaign>;
  totalAdvocacies: number;
  totalCampaigns: number;
  averagePassion: number;
  averageEffectiveness: number;
  campaignMomentum: number;
  audienceAdvocacyMastery: number;
}

// Factory
export function createNarrativeAudienceAdvocacyEngineState(): NarrativeAudienceAdvocacyEngineState {
  return {
    advocacies: new Map(),
    campaigns: new Map(),
    totalAdvocacies: 0,
    totalCampaigns: 0,
    averagePassion: 0.5,
    averageEffectiveness: 0.5,
    campaignMomentum: 0.5,
    audienceAdvocacyMastery: 0.5,
  };
}

// Add advocacy
export function addAudienceAdvocacy(
  state: NarrativeAudienceAdvocacyEngineState,
  advocacyId: string,
  type: AudienceAdvocacyType,
  intensity: AudienceAdvocacyIntensity,
  reach: AudienceAdvocacyReach,
  description: string,
  passion: number,
  effectiveness: number,
  chapter: number
): NarrativeAudienceAdvocacyEngineState {
  const advocacy: AudienceAdvocacy = { advocacyId, type, intensity, reach, description, passion, effectiveness, chapter };
  const advocacies = new Map(state.advocacies).set(advocacyId, advocacy);
  return recomputeAudienceAdvocacy({ ...state, advocacies, totalAdvocacies: advocacies.size });
}

// Add campaign
export function addAudienceAdvocacyCampaign(
  state: NarrativeAudienceAdvocacyEngineState,
  campaignId: string,
  advocacyIds: string[]
): NarrativeAudienceAdvocacyEngineState {
  const advocacies = advocacyIds.map(id => state.advocacies.get(id)).filter((a): a is AudienceAdvocacy => a !== undefined);
  const cumulativePassion = advocacies.length === 0 ? 0
    : advocacies.reduce((s, a) => s + a.passion, 0) / advocacies.length;
  const typeSet = new Set(advocacies.map(a => a.type));
  const momentum = Math.min(1, typeSet.size / 6);
  const campaign: AudienceAdvocacyCampaign = { campaignId, advocacyIds, cumulativePassion, momentum };
  const campaigns = new Map(state.campaigns).set(campaignId, campaign);
  return recomputeAudienceAdvocacy({ ...state, campaigns, totalCampaigns: campaigns.size });
}

// Get advocacies by type
export function getAudienceAdvocaciesByType(state: NarrativeAudienceAdvocacyEngineState, type: AudienceAdvocacyType): AudienceAdvocacy[] {
  return Array.from(state.advocacies.values()).filter(a => a.type === type);
}

// Get audience advocacy report
export function getAudienceAdvocacyReport(state: NarrativeAudienceAdvocacyEngineState): {
  totalAdvocacies: number;
  totalCampaigns: number;
  averagePassion: number;
  averageEffectiveness: number;
  audienceAdvocacyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAdvocacies === 0) recommendations.push('No advocacies — add audience advocacies');
  if (state.averagePassion < 0.5) recommendations.push('Low passion — strengthen');
  if (state.audienceAdvocacyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAdvocacies: state.totalAdvocacies,
    totalCampaigns: state.totalCampaigns,
    averagePassion: Math.round(state.averagePassion * 100) / 100,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    audienceAdvocacyMastery: Math.round(state.audienceAdvocacyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceAdvocacy(state: NarrativeAudienceAdvocacyEngineState): NarrativeAudienceAdvocacyEngineState {
  const advocacies = Array.from(state.advocacies.values());
  const averagePassion = advocacies.length === 0 ? 0.5
    : advocacies.reduce((s, a) => s + a.passion, 0) / advocacies.length;
  const averageEffectiveness = advocacies.length === 0 ? 0.5
    : advocacies.reduce((s, a) => s + a.effectiveness, 0) / advocacies.length;

  const campaigns = Array.from(state.campaigns.values());
  const campaignMomentum = campaigns.length === 0 ? 0.5
    : campaigns.reduce((s, c) => s + c.momentum, 0) / campaigns.length;

  const audienceAdvocacyMastery = (averagePassion * 0.4 + averageEffectiveness * 0.3 + campaignMomentum * 0.3);

  return { ...state, averagePassion, averageEffectiveness, campaignMomentum, audienceAdvocacyMastery };
}

// Reset
export function resetNarrativeAudienceAdvocacyEngineState(): NarrativeAudienceAdvocacyEngineState {
  return createNarrativeAudienceAdvocacyEngineState();
}