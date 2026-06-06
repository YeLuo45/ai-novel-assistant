/**
 * V1142 NarrativeDiscoveryEngine — Direction E Iter 19/20 (Round 5)
 * Discovery engine: how reader discovers narrative
 * Sources: nanobot discovery + thunderbolt + ruflo
 */

export type DiscoveryMode = 'search' | 'browse' | 'recommend' | 'social' | 'serendipity' | 'curated';
export type DiscoveryEase = 'difficult' | 'moderate' | 'easy' | 'frictionless' | 'instant';
export type DiscoveryMatch = 'mismatch' | 'partial' | 'good' | 'excellent' | 'perfect';

export interface Discovery {
  discoveryId: string;
  mode: DiscoveryMode;
  ease: DiscoveryEase;
  match: DiscoveryMatch;
  description: string;
  visibility: number;
  alignment: number;
  chapter: number;
}

export interface DiscoveryPath {
  pathId: string,
  discoveryIds: string[],
  cumulativeVisibility: number,
  alignment: number,
}

export interface NarrativeDiscoveryEngineState {
  discoveries: Map<string, Discovery>;
  paths: Map<string, DiscoveryPath>;
  totalDiscoveries: number;
  totalPaths: number;
  averageVisibility: number;
  averageAlignment: number;
  pathAlignment: number;
  discoveryMastery: number;
}

// Factory
export function createNarrativeDiscoveryEngineState(): NarrativeDiscoveryEngineState {
  return {
    discoveries: new Map(),
    paths: new Map(),
    totalDiscoveries: 0,
    totalPaths: 0,
    averageVisibility: 0.5,
    averageAlignment: 0.5,
    pathAlignment: 0.5,
    discoveryMastery: 0.5,
  };
}

// Add discovery
export function addDiscovery(
  state: NarrativeDiscoveryEngineState,
  discoveryId: string,
  mode: DiscoveryMode,
  ease: DiscoveryEase,
  match: DiscoveryMatch,
  description: string,
  visibility: number,
  alignment: number,
  chapter: number
): NarrativeDiscoveryEngineState {
  const discovery: Discovery = { discoveryId, mode, ease, match, description, visibility, alignment, chapter };
  const discoveries = new Map(state.discoveries).set(discoveryId, discovery);
  return recomputeDiscovery({ ...state, discoveries, totalDiscoveries: discoveries.size });
}

// Add path
export function addDiscoveryPath(
  state: NarrativeDiscoveryEngineState,
  pathId: string,
  discoveryIds: string[]
): NarrativeDiscoveryEngineState {
  const discoveries = discoveryIds.map(id => state.discoveries.get(id)).filter((d): d is Discovery => d !== undefined);
  const cumulativeVisibility = discoveries.length === 0 ? 0
    : discoveries.reduce((s, d) => s + d.visibility, 0) / discoveries.length;
  const alignment = discoveries.length === 0 ? 0
    : discoveries.reduce((s, d) => s + d.alignment, 0) / discoveries.length;
  const path: DiscoveryPath = { pathId, discoveryIds, cumulativeVisibility, alignment };
  const paths = new Map(state.paths).set(pathId, path);
  return recomputeDiscovery({ ...state, paths, totalPaths: paths.size });
}

// Get discoveries by mode
export function getDiscoveriesByMode(state: NarrativeDiscoveryEngineState, mode: DiscoveryMode): Discovery[] {
  return Array.from(state.discoveries.values()).filter(d => d.mode === mode);
}

// Get discovery report
export function getDiscoveryReport(state: NarrativeDiscoveryEngineState): {
  totalDiscoveries: number;
  totalPaths: number;
  averageVisibility: number;
  averageAlignment: number;
  discoveryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDiscoveries === 0) recommendations.push('No discoveries — add discoveries');
  if (state.averageVisibility < 0.5) recommendations.push('Low visibility — strengthen');
  if (state.discoveryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDiscoveries: state.totalDiscoveries,
    totalPaths: state.totalPaths,
    averageVisibility: Math.round(state.averageVisibility * 100) / 100,
    averageAlignment: Math.round(state.averageAlignment * 100) / 100,
    discoveryMastery: Math.round(state.discoveryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDiscovery(state: NarrativeDiscoveryEngineState): NarrativeDiscoveryEngineState {
  const discoveries = Array.from(state.discoveries.values());
  const averageVisibility = discoveries.length === 0 ? 0.5
    : discoveries.reduce((s, d) => s + d.visibility, 0) / discoveries.length;
  const averageAlignment = discoveries.length === 0 ? 0.5
    : discoveries.reduce((s, d) => s + d.alignment, 0) / discoveries.length;

  const paths = Array.from(state.paths.values());
  const pathAlignment = paths.length === 0 ? 0.5
    : paths.reduce((s, p) => s + p.alignment, 0) / paths.length;

  const discoveryMastery = (averageVisibility * 0.4 + averageAlignment * 0.3 + pathAlignment * 0.3);

  return { ...state, averageVisibility, averageAlignment, pathAlignment, discoveryMastery };
}

// Reset
export function resetNarrativeDiscoveryEngineState(): NarrativeDiscoveryEngineState {
  return createNarrativeDiscoveryEngineState();
}