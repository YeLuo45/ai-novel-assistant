/**
 * V944 NarrativeWisdomCore — Direction E Iter 5/15 (Round 4)
 * Narrative wisdom core: deep narrative wisdom
 * Sources: nanobot wisdom + chatdev + thunderbolt
 */

export type WisdomDomain = 'craft' | 'life' | 'truth' | 'beauty' | 'goodness' | 'meaning';
export type WisdomDepth = 'shallow' | 'moderate' | 'deep' | 'profound' | 'infinite';
export type WisdomApplication = 'theoretical' | 'practical' | 'transformative' | 'transcendent';

export interface WisdomPearl {
  pearlId: string;
  domain: WisdomDomain;
  depth: WisdomDepth;
  application: WisdomApplication;
  insight: string;
  resonance: number;
  chapter: number;
}

export interface WisdomStream {
  streamId: string;
  name: string;
  pearlIds: string[];
  flow: number;
  depth: number;
}

export interface NarrativeWisdomCoreState {
  pearls: Map<string, WisdomPearl>;
  streams: Map<string, WisdomStream>;
  totalPearls: number;
  totalStreams: number;
  averageResonance: number;
  domainCoverage: number;
  wisdomDepth: number;
  wisdomMastery: number;
}

// Factory
export function createNarrativeWisdomCoreState(): NarrativeWisdomCoreState {
  return {
    pearls: new Map(),
    streams: new Map(),
    totalPearls: 0,
    totalStreams: 0,
    averageResonance: 0.5,
    domainCoverage: 0,
    wisdomDepth: 0.5,
    wisdomMastery: 0.5,
  };
}

// Add pearl
export function addWisdomPearl(
  state: NarrativeWisdomCoreState,
  pearlId: string,
  domain: WisdomDomain,
  depth: WisdomDepth,
  application: WisdomApplication,
  insight: string,
  resonance: number,
  chapter: number
): NarrativeWisdomCoreState {
  const pearl: WisdomPearl = { pearlId, domain, depth, application, insight, resonance, chapter };
  const pearls = new Map(state.pearls).set(pearlId, pearl);
  return recomputeWisdomCore({ ...state, pearls, totalPearls: pearls.size });
}

// Create stream
export function createWisdomStream(
  state: NarrativeWisdomCoreState,
  streamId: string,
  name: string,
  pearlIds: string[]
): NarrativeWisdomCoreState {
  const pearls = pearlIds.map(id => state.pearls.get(id)).filter((p): p is WisdomPearl => p !== undefined);
  const flow = pearls.length === 0 ? 0.5
    : pearls.reduce((s, p) => s + p.resonance, 0) / pearls.length;
  const depthMap: Record<WisdomDepth, number> = { shallow: 0.2, moderate: 0.4, deep: 0.6, profound: 0.8, infinite: 1.0 };
  const depth = pearls.length === 0 ? 0.5
    : pearls.reduce((s, p) => s + depthMap[p.depth], 0) / pearls.length;
  const stream: WisdomStream = { streamId, name, pearlIds, flow, depth };
  const streams = new Map(state.streams).set(streamId, stream);
  return recomputeWisdomCore({ ...state, streams, totalStreams: streams.size });
}

// Get pearls by domain
export function getPearlsByDomain(state: NarrativeWisdomCoreState, domain: WisdomDomain): WisdomPearl[] {
  return Array.from(state.pearls.values()).filter(p => p.domain === domain);
}

// Get wisdom report
export function getWisdomReport(state: NarrativeWisdomCoreState): {
  totalPearls: number;
  totalStreams: number;
  averageResonance: number;
  domainCoverage: number;
  wisdomDepth: number;
  wisdomMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPearls === 0) recommendations.push('No pearls — add wisdom');
  if (state.domainCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.wisdomMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPearls: state.totalPearls,
    totalStreams: state.totalStreams,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    domainCoverage: Math.round(state.domainCoverage * 100) / 100,
    wisdomDepth: Math.round(state.wisdomDepth * 100) / 100,
    wisdomMastery: Math.round(state.wisdomMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWisdomCore(state: NarrativeWisdomCoreState): NarrativeWisdomCoreState {
  const pearls = Array.from(state.pearls.values());
  const averageResonance = pearls.length === 0 ? 0.5
    : pearls.reduce((s, p) => s + p.resonance, 0) / pearls.length;
  const domainSet = new Set(pearls.map(p => p.domain));
  const domainCoverage = Math.min(1, domainSet.size / 5);

  const depthMap: Record<WisdomDepth, number> = { shallow: 0.2, moderate: 0.4, deep: 0.6, profound: 0.8, infinite: 1.0 };
  const wisdomDepth = pearls.length === 0 ? 0.5
    : pearls.reduce((s, p) => s + depthMap[p.depth], 0) / pearls.length;

  const wisdomMastery = (averageResonance * 0.4 + domainCoverage * 0.3 + wisdomDepth * 0.3);

  return { ...state, averageResonance, domainCoverage, wisdomDepth, wisdomMastery };
}

// Reset wisdom state
export function resetNarrativeWisdomCoreState(): NarrativeWisdomCoreState {
  return createNarrativeWisdomCoreState();
}