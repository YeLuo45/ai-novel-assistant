/**
 * V782 NarrativeDepthEngine — Direction C Iter 5/9 (Round 3)
 * Narrative depth engine: depth layers + subtext + symbolic depth
 * Sources: nanobot depth + thunderbolt symbolic + chatdev
 */

export type DepthLayer = 'surface' | 'plot' | 'character' | 'thematic' | 'symbolic' | 'archetypal' | 'mythic';
export type DepthQuality = 'shallow' | 'moderate' | 'deep' | 'profound' | 'transcendent';
export type SubtextComplexity = 'simple' | 'moderate' | 'nuanced' | 'multi_layered' | 'paradoxical';

export interface DepthMarker {
  markerId: string;
  layer: DepthLayer;
  location: string;
  description: string;
  quality: DepthQuality;
  discovered: boolean;
  impact: number;
}

export interface SubtextElement {
  elementId: string;
  surfaceText: string;
  subtext: string;
  complexity: SubtextComplexity;
  layer: DepthLayer;
  effectiveness: number;
}

export interface NarrativeDepthEngineState {
  markers: Map<string, DepthMarker>;
  subtexts: Map<string, SubtextElement>;
  totalMarkers: number;
  totalSubtexts: number;
  discoveredMarkers: number;
  averageQuality: number;
  averageComplexity: number;
  layerCoverage: number;
  depthScore: number;
  dominantLayer: DepthLayer | null;
}

// Factory
export function createNarrativeDepthEngineState(): NarrativeDepthEngineState {
  return {
    markers: new Map(),
    subtexts: new Map(),
    totalMarkers: 0,
    totalSubtexts: 0,
    discoveredMarkers: 0,
    averageQuality: 0.5,
    averageComplexity: 0.5,
    layerCoverage: 0,
    depthScore: 0.5,
    dominantLayer: null,
  };
}

// Add depth marker
export function addDepthMarker(
  state: NarrativeDepthEngineState,
  markerId: string,
  layer: DepthLayer,
  location: string,
  description: string,
  quality: DepthQuality = 'moderate',
  impact: number = 0.5
): NarrativeDepthEngineState {
  const marker: DepthMarker = { markerId, layer, location, description, quality, discovered: false, impact: Math.min(1, Math.max(0, impact)) };
  const markers = new Map(state.markers).set(markerId, marker);
  return recomputeDepth({ ...state, markers, totalMarkers: markers.size });
}

// Discover marker
export function discoverDepthMarker(state: NarrativeDepthEngineState, markerId: string): NarrativeDepthEngineState {
  const marker = state.markers.get(markerId);
  if (!marker) return state;

  const updated: DepthMarker = { ...marker, discovered: true };
  const markers = new Map(state.markers).set(markerId, updated);
  const discoveredMarkers = marker.discovered ? state.discoveredMarkers : state.discoveredMarkers + 1;
  return recomputeDepth({ ...state, markers, discoveredMarkers });
}

// Add subtext
export function addSubtextElement(
  state: NarrativeDepthEngineState,
  elementId: string,
  surfaceText: string,
  subtext: string,
  layer: DepthLayer,
  complexity: SubtextComplexity = 'moderate',
  effectiveness: number = 0.5
): NarrativeDepthEngineState {
  const element: SubtextElement = { elementId, surfaceText, subtext, layer, complexity, effectiveness: Math.min(1, Math.max(0, effectiveness)) };
  const subtexts = new Map(state.subtexts).set(elementId, element);
  return recomputeDepth({ ...state, subtexts, totalSubtexts: subtexts.size });
}

// Get markers by layer
export function getMarkersByLayer(state: NarrativeDepthEngineState, layer: DepthLayer): DepthMarker[] {
  return Array.from(state.markers.values()).filter(m => m.layer === layer);
}

// Get subtexts by complexity
export function getSubtextsByComplexity(state: NarrativeDepthEngineState, complexity: SubtextComplexity): SubtextElement[] {
  return Array.from(state.subtexts.values()).filter(s => s.complexity === complexity);
}

// Get depth report
export function getDepthReport(state: NarrativeDepthEngineState): {
  totalMarkers: number;
  totalSubtexts: number;
  discoveredMarkers: number;
  averageQuality: number;
  averageComplexity: number;
  layerCoverage: number;
  depthScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMarkers === 0) recommendations.push('No markers — add depth markers');
  if (state.layerCoverage < 0.4) recommendations.push('Low layer coverage — diversify');
  if (state.depthScore < 0.5) recommendations.push('Low depth — add deeper layers');

  return {
    totalMarkers: state.totalMarkers,
    totalSubtexts: state.totalSubtexts,
    discoveredMarkers: state.discoveredMarkers,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    layerCoverage: Math.round(state.layerCoverage * 100) / 100,
    depthScore: Math.round(state.depthScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDepth(state: NarrativeDepthEngineState): NarrativeDepthEngineState {
  const markers = Array.from(state.markers.values());
  const subtexts = Array.from(state.subtexts.values());

  const qualityMap: Record<DepthQuality, number> = { shallow: 0.2, moderate: 0.4, deep: 0.6, profound: 0.8, transcendent: 1.0 };
  const averageQuality = markers.length === 0 ? 0.5
    : markers.reduce((s, m) => s + qualityMap[m.quality], 0) / markers.length;

  const complexityMap: Record<SubtextComplexity, number> = { simple: 0.2, moderate: 0.4, nuanced: 0.6, multi_layered: 0.8, paradoxical: 1.0 };
  const averageComplexity = subtexts.length === 0 ? 0.5
    : subtexts.reduce((s, st) => s + complexityMap[st.complexity], 0) / subtexts.length;

  const layerSet = new Set([...markers.map(m => m.layer), ...subtexts.map(s => s.layer)]);
  const layerCoverage = Math.min(1, layerSet.size / 6);

  const depthScore = (averageQuality * 0.4 + averageComplexity * 0.3 + layerCoverage * 0.3);

  let dominantLayer: DepthLayer | null = null;
  let maxCount = -1;
  const layerCounts = new Map<DepthLayer, number>();
  [...markers, ...subtexts].forEach(item => {
    const layer = 'layer' in item ? item.layer : null;
    if (layer) layerCounts.set(layer, (layerCounts.get(layer) || 0) + 1);
  });
  layerCounts.forEach((count, l) => { if (count > maxCount) { maxCount = count; dominantLayer = l; } });

  return { ...state, averageQuality, averageComplexity, layerCoverage, depthScore, dominantLayer };
}

// Reset depth state
export function resetNarrativeDepthEngineState(): NarrativeDepthEngineState {
  return createNarrativeDepthEngineState();
}