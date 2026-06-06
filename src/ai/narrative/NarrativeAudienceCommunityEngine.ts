/**
 * V1262 NarrativeAudienceCommunityEngine — Direction H Iter 19/20 (Round 5)
 * Audience community engine: community of audience
 * Sources: thunderbolt community + nanobot + ruflo
 */

export type AudienceCommunityType = 'fan' | 'devotee' | 'scholar' | 'creator' | 'critic' | 'transcendent';
export type AudienceCommunityCohesion = 'fragmented' | 'loose' | 'moderate' | 'tight' | 'unbreakable';
export type AudienceCommunityGrowth = 'shrinking' | 'stable' | 'growing' | 'thriving' | 'explosive';

export interface AudienceCommunity {
  communityId: string;
  type: AudienceCommunityType;
  cohesion: AudienceCommunityCohesion;
  growth: AudienceCommunityGrowth;
  description: string;
  engagement: number;
  vibrancy: number;
  chapter: number;
}

export interface AudienceCommunityNetwork {
  networkId: string,
  communityIds: string[],
  cumulativeEngagement: number,
  diversity: number,
}

export interface NarrativeAudienceCommunityEngineState {
  communities: Map<string, AudienceCommunity>;
  networks: Map<string, AudienceCommunityNetwork>;
  totalCommunities: number;
  totalNetworks: number;
  averageEngagement: number;
  averageVibrancy: number;
  networkDiversity: number;
  audienceCommunityMastery: number;
}

// Factory
export function createNarrativeAudienceCommunityEngineState(): NarrativeAudienceCommunityEngineState {
  return {
    communities: new Map(),
    networks: new Map(),
    totalCommunities: 0,
    totalNetworks: 0,
    averageEngagement: 0.5,
    averageVibrancy: 0.5,
    networkDiversity: 0.5,
    audienceCommunityMastery: 0.5,
  };
}

// Add community
export function addAudienceCommunity(
  state: NarrativeAudienceCommunityEngineState,
  communityId: string,
  type: AudienceCommunityType,
  cohesion: AudienceCommunityCohesion,
  growth: AudienceCommunityGrowth,
  description: string,
  engagement: number,
  vibrancy: number,
  chapter: number
): NarrativeAudienceCommunityEngineState {
  const community: AudienceCommunity = { communityId, type, cohesion, growth, description, engagement, vibrancy, chapter };
  const communities = new Map(state.communities).set(communityId, community);
  return recomputeAudienceCommunity({ ...state, communities, totalCommunities: communities.size });
}

// Add network
export function addAudienceCommunityNetwork(
  state: NarrativeAudienceCommunityEngineState,
  networkId: string,
  communityIds: string[]
): NarrativeAudienceCommunityEngineState {
  const communities = communityIds.map(id => state.communities.get(id)).filter((c): c is AudienceCommunity => c !== undefined);
  const cumulativeEngagement = communities.length === 0 ? 0
    : communities.reduce((s, c) => s + c.engagement, 0) / communities.length;
  const typeSet = new Set(communities.map(c => c.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const network: AudienceCommunityNetwork = { networkId, communityIds, cumulativeEngagement, diversity };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeAudienceCommunity({ ...state, networks, totalNetworks: networks.size });
}

// Get communities by type
export function getAudienceCommunitiesByType(state: NarrativeAudienceCommunityEngineState, type: AudienceCommunityType): AudienceCommunity[] {
  return Array.from(state.communities.values()).filter(c => c.type === type);
}

// Get audience community report
export function getAudienceCommunityReport(state: NarrativeAudienceCommunityEngineState): {
  totalCommunities: number;
  totalNetworks: number;
  averageEngagement: number;
  averageVibrancy: number;
  audienceCommunityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCommunities === 0) recommendations.push('No communities — add audience communities');
  if (state.averageEngagement < 0.5) recommendations.push('Low engagement — strengthen');
  if (state.audienceCommunityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCommunities: state.totalCommunities,
    totalNetworks: state.totalNetworks,
    averageEngagement: Math.round(state.averageEngagement * 100) / 100,
    averageVibrancy: Math.round(state.averageVibrancy * 100) / 100,
    audienceCommunityMastery: Math.round(state.audienceCommunityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceCommunity(state: NarrativeAudienceCommunityEngineState): NarrativeAudienceCommunityEngineState {
  const communities = Array.from(state.communities.values());
  const averageEngagement = communities.length === 0 ? 0.5
    : communities.reduce((s, c) => s + c.engagement, 0) / communities.length;
  const averageVibrancy = communities.length === 0 ? 0.5
    : communities.reduce((s, c) => s + c.vibrancy, 0) / communities.length;

  const networks = Array.from(state.networks.values());
  const networkDiversity = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.diversity, 0) / networks.length;

  const audienceCommunityMastery = (averageEngagement * 0.4 + averageVibrancy * 0.3 + networkDiversity * 0.3);

  return { ...state, averageEngagement, averageVibrancy, networkDiversity, audienceCommunityMastery };
}

// Reset
export function resetNarrativeAudienceCommunityEngineState(): NarrativeAudienceCommunityEngineState {
  return createNarrativeAudienceCommunityEngineState();
}