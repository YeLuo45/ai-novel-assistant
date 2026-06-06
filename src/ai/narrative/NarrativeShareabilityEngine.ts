/**
 * V1138 NarrativeShareabilityEngine — Direction E Iter 17/20 (Round 5)
 * Shareability engine: how shareable narrative content is
 * Sources: nanobot shareability + thunderbolt + ruflo
 */

export type ShareabilityMode = 'quote' | 'image' | 'video' | 'audio' | 'link' | 'experience';
export type ShareabilityEagerness = 'reluctant' | 'casual' | 'willing' | 'eager' | 'compulsive';
export type ShareabilityContext = 'private' | 'friends' | 'public' | 'community' | 'broadcast';

export interface Shareability {
  shareabilityId: string;
  mode: ShareabilityMode;
  eagerness: ShareabilityEagerness;
  context: ShareabilityContext;
  description: string;
  share: number;
  appeal: number;
  chapter: number;
}

export interface ShareabilityNetwork {
  networkId: string,
  shareabilityIds: string[],
  cumulativeShare: number,
  virality: number,
}

export interface NarrativeShareabilityEngineState {
  shareabilities: Map<string, Shareability>;
  networks: Map<string, ShareabilityNetwork>;
  totalShareabilities: number;
  totalNetworks: number;
  averageShare: number;
  averageAppeal: number;
  networkVirality: number;
  shareabilityMastery: number;
}

// Factory
export function createNarrativeShareabilityEngineState(): NarrativeShareabilityEngineState {
  return {
    shareabilities: new Map(),
    networks: new Map(),
    totalShareabilities: 0,
    totalNetworks: 0,
    averageShare: 0.5,
    averageAppeal: 0.5,
    networkVirality: 0.5,
    shareabilityMastery: 0.5,
  };
}

// Add shareability
export function addShareability(
  state: NarrativeShareabilityEngineState,
  shareabilityId: string,
  mode: ShareabilityMode,
  eagerness: ShareabilityEagerness,
  context: ShareabilityContext,
  description: string,
  share: number,
  appeal: number,
  chapter: number
): NarrativeShareabilityEngineState {
  const shareability: Shareability = { shareabilityId, mode, eagerness, context, description, share, appeal, chapter };
  const shareabilities = new Map(state.shareabilities).set(shareabilityId, shareability);
  return recomputeShareability({ ...state, shareabilities, totalShareabilities: shareabilities.size });
}

// Add network
export function addShareabilityNetwork(
  state: NarrativeShareabilityEngineState,
  networkId: string,
  shareabilityIds: string[]
): NarrativeShareabilityEngineState {
  const shareabilities = shareabilityIds.map(id => state.shareabilities.get(id)).filter((s): s is Shareability => s !== undefined);
  const cumulativeShare = shareabilities.length === 0 ? 0
    : shareabilities.reduce((s, sh) => s + sh.share, 0) / shareabilities.length;
  const virality = shareabilities.length === 0 ? 0.5
    : shareabilities.reduce((s, sh) => s + (sh.eagerness === 'compulsive' ? 1 : sh.eagerness === 'eager' ? 0.85 : sh.eagerness === 'willing' ? 0.7 : sh.eagerness === 'casual' ? 0.5 : 0.3), 0) / shareabilities.length;
  const network: ShareabilityNetwork = { networkId, shareabilityIds, cumulativeShare, virality };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeShareability({ ...state, networks, totalNetworks: networks.size });
}

// Get shareabilities by mode
export function getShareabilitiesByMode(state: NarrativeShareabilityEngineState, mode: ShareabilityMode): Shareability[] {
  return Array.from(state.shareabilities.values()).filter(s => s.mode === mode);
}

// Get shareability report
export function getShareabilityReport(state: NarrativeShareabilityEngineState): {
  totalShareabilities: number;
  totalNetworks: number;
  averageShare: number;
  averageAppeal: number;
  shareabilityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalShareabilities === 0) recommendations.push('No shareabilities — add shareabilities');
  if (state.averageShare < 0.5) recommendations.push('Low share — strengthen');
  if (state.shareabilityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalShareabilities: state.totalShareabilities,
    totalNetworks: state.totalNetworks,
    averageShare: Math.round(state.averageShare * 100) / 100,
    averageAppeal: Math.round(state.averageAppeal * 100) / 100,
    shareabilityMastery: Math.round(state.shareabilityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeShareability(state: NarrativeShareabilityEngineState): NarrativeShareabilityEngineState {
  const shareabilities = Array.from(state.shareabilities.values());
  const averageShare = shareabilities.length === 0 ? 0.5
    : shareabilities.reduce((s, sh) => s + sh.share, 0) / shareabilities.length;
  const averageAppeal = shareabilities.length === 0 ? 0.5
    : shareabilities.reduce((s, sh) => s + sh.appeal, 0) / shareabilities.length;

  const networks = Array.from(state.networks.values());
  const networkVirality = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.virality, 0) / networks.length;

  const shareabilityMastery = (averageShare * 0.4 + averageAppeal * 0.3 + networkVirality * 0.3);

  return { ...state, averageShare, averageAppeal, networkVirality, shareabilityMastery };
}

// Reset
export function resetNarrativeShareabilityEngineState(): NarrativeShareabilityEngineState {
  return createNarrativeShareabilityEngineState();
}