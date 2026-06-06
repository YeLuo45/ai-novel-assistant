/**
 * V1040 NarrativeHermeneuticsEngine — Direction C Iter 8/20 (Round 5)
 * Narrative hermeneutics engine: interpretation + meaning
 * Sources: ruflo hermeneutics + nanobot + thunderbolt
 */

export type HermeneuticLens = 'literal' | 'allegorical' | 'moral' | 'anagogical' | 'psychoanalytic' | 'deconstructive';
export type HermeneuticMethod = 'close_reading' | 'distant_reading' | 'reader_response' | 'structural' | 'phenomenological' | 'dialogic';
export type HermeneuticDepth = 'surface' | 'interpretive' | 'critical' | 'progressive' | 'transcendent';

export interface NarrativeHermeneutic {
  hermeneuticId: string;
  lens: HermeneuticLens;
  method: HermeneuticMethod;
  depth: HermeneuticDepth;
  description: string;
  insight: number;
  revelation: number;
  chapter: number;
}

export interface HermeneuticLayer {
  layerId: string,
  hermeneuticIds: string[],
  cumulativeInsight: number,
  depth: number,
}

export interface NarrativeHermeneuticsEngineState {
  hermeneutics: Map<string, NarrativeHermeneutic>;
  layers: Map<string, HermeneuticLayer>;
  totalHermeneutics: number;
  totalLayers: number;
  averageInsight: number;
  averageRevelation: number;
  layerDepth: number;
  hermeneuticsMastery: number;
}

// Factory
export function createNarrativeHermeneuticsEngineState(): NarrativeHermeneuticsEngineState {
  return {
    hermeneutics: new Map(),
    layers: new Map(),
    totalHermeneutics: 0,
    totalLayers: 0,
    averageInsight: 0.5,
    averageRevelation: 0.5,
    layerDepth: 0.5,
    hermeneuticsMastery: 0.5,
  };
}

// Add hermeneutic
export function addHermeneutic(
  state: NarrativeHermeneuticsEngineState,
  hermeneuticId: string,
  lens: HermeneuticLens,
  method: HermeneuticMethod,
  depth: HermeneuticDepth,
  description: string,
  insight: number,
  revelation: number,
  chapter: number
): NarrativeHermeneuticsEngineState {
  const hermeneutic: NarrativeHermeneutic = { hermeneuticId, lens, method, depth, description, insight, revelation, chapter };
  const hermeneutics = new Map(state.hermeneutics).set(hermeneuticId, hermeneutic);
  return recomputeHermeneutics({ ...state, hermeneutics, totalHermeneutics: hermeneutics.size });
}

// Add layer
export function addHermeneuticLayer(
  state: NarrativeHermeneuticsEngineState,
  layerId: string,
  hermeneuticIds: string[]
): NarrativeHermeneuticsEngineState {
  const hermeneutics = hermeneuticIds.map(id => state.hermeneutics.get(id)).filter((h): h is NarrativeHermeneutic => h !== undefined);
  const cumulativeInsight = hermeneutics.length === 0 ? 0
    : hermeneutics.reduce((s, h) => s + h.insight, 0) / hermeneutics.length;
  const depth = hermeneutics.length === 0 ? 0
    : hermeneutics.reduce((s, h) => s + h.revelation, 0) / hermeneutics.length;
  const layer: HermeneuticLayer = { layerId, hermeneuticIds, cumulativeInsight, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeHermeneutics({ ...state, layers, totalLayers: layers.size });
}

// Get hermeneutics by lens
export function getHermeneuticsByLens(state: NarrativeHermeneuticsEngineState, lens: HermeneuticLens): NarrativeHermeneutic[] {
  return Array.from(state.hermeneutics.values()).filter(h => h.lens === lens);
}

// Get hermeneutics report
export function getHermeneuticsReport(state: NarrativeHermeneuticsEngineState): {
  totalHermeneutics: number;
  totalLayers: number;
  averageInsight: number;
  averageRevelation: number;
  hermeneuticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalHermeneutics === 0) recommendations.push('No hermeneutics — add narrative hermeneutics');
  if (state.averageInsight < 0.5) recommendations.push('Low insight — strengthen');
  if (state.hermeneuticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalHermeneutics: state.totalHermeneutics,
    totalLayers: state.totalLayers,
    averageInsight: Math.round(state.averageInsight * 100) / 100,
    averageRevelation: Math.round(state.averageRevelation * 100) / 100,
    hermeneuticsMastery: Math.round(state.hermeneuticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeHermeneutics(state: NarrativeHermeneuticsEngineState): NarrativeHermeneuticsEngineState {
  const hermeneutics = Array.from(state.hermeneutics.values());
  const averageInsight = hermeneutics.length === 0 ? 0.5
    : hermeneutics.reduce((s, h) => s + h.insight, 0) / hermeneutics.length;
  const averageRevelation = hermeneutics.length === 0 ? 0.5
    : hermeneutics.reduce((s, h) => s + h.revelation, 0) / hermeneutics.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const hermeneuticsMastery = (averageInsight * 0.4 + averageRevelation * 0.4 + layerDepth * 0.2);

  return { ...state, averageInsight, averageRevelation, layerDepth, hermeneuticsMastery };
}

// Reset
export function resetNarrativeHermeneuticsEngineState(): NarrativeHermeneuticsEngineState {
  return createNarrativeHermeneuticsEngineState();
}