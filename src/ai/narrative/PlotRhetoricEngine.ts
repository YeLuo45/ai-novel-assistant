/**
 * V1030 PlotRhetoricEngine — Direction C Iter 3/20 (Round 5)
 * Plot rhetoric engine: rhetorical devices in plot
 * Sources: nanobot rhetoric + chatdev + ruflo
 */

export type RhetoricDevice = 'analogy' | 'metaphor' | 'hyperbole' | 'irony' | 'foreshadowing' | 'reversal';
export type RhetoricStrength = 'subtle' | 'moderate' | 'strong' | 'compelling' | 'overwhelming';
export type RhetoricPurpose = 'persuade' | 'emphasize' | 'connect' | 'contrast' | 'elevate' | 'reframe';

export interface PlotRhetoric {
  rhetoricId: string;
  device: RhetoricDevice;
  strength: RhetoricStrength;
  purpose: RhetoricPurpose;
  description: string;
  impact: number;
  elegance: number;
  chapter: number;
}

export interface RhetoricLayer {
  layerId: string,
  rhetoricIds: string[],
  cumulativeImpact: number,
  synergy: number,
}

export interface PlotRhetoricEngineState {
  rhetorics: Map<string, PlotRhetoric>;
  layers: Map<string, RhetoricLayer>;
  totalRhetorics: number;
  totalLayers: number;
  averageImpact: number;
  averageElegance: number;
  layerSynergy: number;
  rhetoricMastery: number;
}

// Factory
export function createPlotRhetoricEngineState(): PlotRhetoricEngineState {
  return {
    rhetorics: new Map(),
    layers: new Map(),
    totalRhetorics: 0,
    totalLayers: 0,
    averageImpact: 0.5,
    averageElegance: 0.5,
    layerSynergy: 0.5,
    rhetoricMastery: 0.5,
  };
}

// Add rhetoric
export function addPlotRhetoric(
  state: PlotRhetoricEngineState,
  rhetoricId: string,
  device: RhetoricDevice,
  strength: RhetoricStrength,
  purpose: RhetoricPurpose,
  description: string,
  impact: number,
  elegance: number,
  chapter: number
): PlotRhetoricEngineState {
  const rhetoric: PlotRhetoric = { rhetoricId, device, strength, purpose, description, impact, elegance, chapter };
  const rhetorics = new Map(state.rhetorics).set(rhetoricId, rhetoric);
  return recomputeRhetoric({ ...state, rhetorics, totalRhetorics: rhetorics.size });
}

// Add layer
export function addRhetoricLayer(
  state: PlotRhetoricEngineState,
  layerId: string,
  rhetoricIds: string[]
): PlotRhetoricEngineState {
  const rhetorics = rhetoricIds.map(id => state.rhetorics.get(id)).filter((r): r is PlotRhetoric => r !== undefined);
  const cumulativeImpact = rhetorics.length === 0 ? 0
    : rhetorics.reduce((s, r) => s + r.impact, 0) / rhetorics.length;
  // Synergy: how well multiple devices work together
  const synergy = rhetorics.length < 2 ? 0.5
    : Math.min(1, cumulativeImpact * rhetorics.length / 3);
  const layer: RhetoricLayer = { layerId, rhetoricIds, cumulativeImpact, synergy };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeRhetoric({ ...state, layers, totalLayers: layers.size });
}

// Get rhetorics by device
export function getRhetoricsByDevice(state: PlotRhetoricEngineState, device: RhetoricDevice): PlotRhetoric[] {
  return Array.from(state.rhetorics.values()).filter(r => r.device === device);
}

// Get rhetoric report
export function getRhetoricReport(state: PlotRhetoricEngineState): {
  totalRhetorics: number;
  totalLayers: number;
  averageImpact: number;
  layerSynergy: number;
  rhetoricMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRhetorics === 0) recommendations.push('No rhetorics — add rhetorics');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.rhetoricMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRhetorics: state.totalRhetorics,
    totalLayers: state.totalLayers,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    layerSynergy: Math.round(state.layerSynergy * 100) / 100,
    rhetoricMastery: Math.round(state.rhetoricMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRhetoric(state: PlotRhetoricEngineState): PlotRhetoricEngineState {
  const rhetorics = Array.from(state.rhetorics.values());
  const averageImpact = rhetorics.length === 0 ? 0.5
    : rhetorics.reduce((s, r) => s + r.impact, 0) / rhetorics.length;
  const averageElegance = rhetorics.length === 0 ? 0.5
    : rhetorics.reduce((s, r) => s + r.elegance, 0) / rhetorics.length;

  const layers = Array.from(state.layers.values());
  const layerSynergy = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.synergy, 0) / layers.length;

  const rhetoricMastery = (averageImpact * 0.4 + averageElegance * 0.3 + layerSynergy * 0.3);

  return { ...state, averageImpact, averageElegance, layerSynergy, rhetoricMastery };
}

// Reset
export function resetPlotRhetoricEngineState(): PlotRhetoricEngineState {
  return createPlotRhetoricEngineState();
}