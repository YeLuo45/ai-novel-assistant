/**
 * V1076 NarrativeAnchoringEngine — Direction D Iter 6/20 (Round 6)
 * Narrative anchoring engine: anchor narrative elements in reader's mind
 * Sources: nanobot anchoring + thunderbolt + ruflo
 */

export type AnchorType = 'image' | 'phrase' | 'symbol' | 'motif' | 'detail' | 'character';
export type AnchorStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'haunting';
export type AnchorRepetition = 'single' | 'rare' | 'occasional' | 'frequent' | 'leitmotif';

export interface Anchor {
  anchorId: string;
  type: AnchorType;
  strength: AnchorStrength;
  repetition: AnchorRepetition;
  description: string;
  memorability: number;
  resonance: number;
  chapter: number;
}

export interface AnchorCluster {
  clusterId: string,
  name: string,
  anchorIds: string[],
  cohesion: number,
  power: number,
}

export interface NarrativeAnchoringEngineState {
  anchors: Map<string, Anchor>;
  clusters: Map<string, AnchorCluster>;
  totalAnchors: number;
  totalClusters: number;
  averageMemorability: number;
  averageResonance: number;
  clusterPower: number;
  anchoringMastery: number;
}

// Factory
export function createNarrativeAnchoringEngineState(): NarrativeAnchoringEngineState {
  return {
    anchors: new Map(),
    clusters: new Map(),
    totalAnchors: 0,
    totalClusters: 0,
    averageMemorability: 0.5,
    averageResonance: 0.5,
    clusterPower: 0.5,
    anchoringMastery: 0.5,
  };
}

// Add anchor
export function addAnchor(
  state: NarrativeAnchoringEngineState,
  anchorId: string,
  type: AnchorType,
  strength: AnchorStrength,
  repetition: AnchorRepetition,
  description: string,
  memorability: number,
  resonance: number,
  chapter: number
): NarrativeAnchoringEngineState {
  const anchor: Anchor = { anchorId, type, strength, repetition, description, memorability, resonance, chapter };
  const anchors = new Map(state.anchors).set(anchorId, anchor);
  return recomputeAnchoring({ ...state, anchors, totalAnchors: anchors.size });
}

// Add cluster
export function addAnchorCluster(
  state: NarrativeAnchoringEngineState,
  clusterId: string,
  name: string,
  anchorIds: string[]
): NarrativeAnchoringEngineState {
  const anchors = anchorIds.map(id => state.anchors.get(id)).filter((a): a is Anchor => a !== undefined);
  const power = anchors.length === 0 ? 0
    : anchors.reduce((s, a) => s + a.resonance, 0) / anchors.length;
  const typeSet = new Set(anchors.map(a => a.type));
  const cohesion = Math.min(1, typeSet.size / 6);
  const cluster: AnchorCluster = { clusterId, name, anchorIds, cohesion, power };
  const clusters = new Map(state.clusters).set(clusterId, cluster);
  return recomputeAnchoring({ ...state, clusters, totalClusters: clusters.size });
}

// Get anchors by type
export function getAnchorsByType(state: NarrativeAnchoringEngineState, type: AnchorType): Anchor[] {
  return Array.from(state.anchors.values()).filter(a => a.type === type);
}

// Get anchoring report
export function getAnchoringReport(state: NarrativeAnchoringEngineState): {
  totalAnchors: number;
  totalClusters: number;
  averageMemorability: number;
  averageResonance: number;
  anchoringMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAnchors === 0) recommendations.push('No anchors — add anchors');
  if (state.averageMemorability < 0.5) recommendations.push('Low memorability — strengthen');
  if (state.anchoringMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAnchors: state.totalAnchors,
    totalClusters: state.totalClusters,
    averageMemorability: Math.round(state.averageMemorability * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    anchoringMastery: Math.round(state.anchoringMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAnchoring(state: NarrativeAnchoringEngineState): NarrativeAnchoringEngineState {
  const anchors = Array.from(state.anchors.values());
  const averageMemorability = anchors.length === 0 ? 0.5
    : anchors.reduce((s, a) => s + a.memorability, 0) / anchors.length;
  const averageResonance = anchors.length === 0 ? 0.5
    : anchors.reduce((s, a) => s + a.resonance, 0) / anchors.length;

  const clusters = Array.from(state.clusters.values());
  const clusterPower = clusters.length === 0 ? 0.5
    : clusters.reduce((s, c) => s + c.power, 0) / clusters.length;

  const anchoringMastery = (averageMemorability * 0.4 + averageResonance * 0.3 + clusterPower * 0.3);

  return { ...state, averageMemorability, averageResonance, clusterPower, anchoringMastery };
}

// Reset
export function resetNarrativeAnchoringEngineState(): NarrativeAnchoringEngineState {
  return createNarrativeAnchoringEngineState();
}