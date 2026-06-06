/**
 * V892 NarrativeTopologyEngine — Direction C Iter 9/15 (Round 4)
 * Narrative topology engine: overall narrative topology + structure
 * Sources: ruflo topology + thunderbolt + nanobot
 */

export type NarrativeMode = 'episodic' | 'continuous' | 'modular' | 'interwoven' | 'fractal' | 'layered';
export type StructuralElement = 'frame' | 'inset' | 'parallel' | 'mirror' | 'embedded' | 'standalone';
export type CoherenceType = 'temporal' | 'causal' | 'thematic' | 'character' | 'spatial';

export interface NarrativeLayer {
  layerId: string;
  name: string;
  level: number;
  element: StructuralElement;
  parent: string | null;
  childCount: number;
  chapter: number;
}

export interface NarrativeBridge {
  bridgeId: string;
  fromLayer: string;
  toLayer: string;
  type: 'reference' | 'flashback' | 'parallel' | 'echo' | 'contrast';
  strength: number;
}

export interface NarrativeTopologyEngineState {
  layers: Map<string, NarrativeLayer>;
  bridges: Map<string, NarrativeBridge>;
  mode: NarrativeMode;
  totalLayers: number;
  totalBridges: number;
  maxDepth: number;
  narrativeBreadth: number;
  topologyCoherence: number;
  structuralElegance: number;
}

// Factory
export function createNarrativeTopologyEngineState(): NarrativeTopologyEngineState {
  return {
    layers: new Map(),
    bridges: new Map(),
    mode: 'continuous',
    totalLayers: 0,
    totalBridges: 0,
    maxDepth: 0,
    narrativeBreadth: 0,
    topologyCoherence: 0.5,
    structuralElegance: 0.5,
  };
}

// Add layer
export function addNarrativeLayer(
  state: NarrativeTopologyEngineState,
  layerId: string,
  name: string,
  level: number,
  element: StructuralElement,
  chapter: number,
  parent: string | null = null
): NarrativeTopologyEngineState {
  const layer: NarrativeLayer = { layerId, name, level, element, parent, childCount: 0, chapter };
  const layers = new Map(state.layers).set(layerId, layer);

  // Update parent's child count
  if (parent) {
    const parentLayer = state.layers.get(parent);
    if (parentLayer) {
      const updatedParent: NarrativeLayer = { ...parentLayer, childCount: parentLayer.childCount + 1 };
      layers.set(parent, updatedParent);
    }
  }

  return recomputeNarrativeTopo({ ...state, layers, totalLayers: layers.size });
}

// Add bridge
export function addNarrativeBridge(
  state: NarrativeTopologyEngineState,
  bridgeId: string,
  fromLayer: string,
  toLayer: string,
  type: NarrativeBridge['type'],
  strength: number = 0.5
): NarrativeTopologyEngineState {
  const bridge: NarrativeBridge = { bridgeId, fromLayer, toLayer, type, strength };
  const bridges = new Map(state.bridges).set(bridgeId, bridge);
  return recomputeNarrativeTopo({ ...state, bridges, totalBridges: bridges.size });
}

// Get layers by element
export function getLayersByElement(state: NarrativeTopologyEngineState, element: StructuralElement): NarrativeLayer[] {
  return Array.from(state.layers.values()).filter(l => l.element === element);
}

// Get narrative topology report
export function getNarrativeTopologyReport(state: NarrativeTopologyEngineState): {
  totalLayers: number;
  totalBridges: number;
  maxDepth: number;
  mode: NarrativeMode;
  topologyCoherence: number;
  structuralElegance: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLayers === 0) recommendations.push('No layers — add layers');
  if (state.totalBridges === 0) recommendations.push('No bridges — add bridges');
  if (state.topologyCoherence < 0.4) recommendations.push('Low coherence — improve');

  return {
    totalLayers: state.totalLayers,
    totalBridges: state.totalBridges,
    maxDepth: state.maxDepth,
    mode: state.mode,
    topologyCoherence: Math.round(state.topologyCoherence * 100) / 100,
    structuralElegance: Math.round(state.structuralElegance * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeNarrativeTopo(state: NarrativeTopologyEngineState): NarrativeTopologyEngineState {
  const layers = Array.from(state.layers.values());
  const maxDepth = layers.length === 0 ? 0 : Math.max(...layers.map(l => l.level));
  const narrativeBreadth = layers.length === 0 ? 0
    : layers.filter(l => l.parent === null).length;

  // Determine mode
  let mode: NarrativeMode = 'continuous';
  const elementSet = new Set(layers.map(l => l.element));
  if (elementSet.has('embedded') && elementSet.has('frame')) mode = 'layered';
  else if (elementSet.has('parallel')) mode = 'modular';
  else if (maxDepth > 2) mode = 'layered';
  else mode = 'continuous';

  // Coherence: bridges / (layers - 1) for fully connected
  const expectedBridges = Math.max(0, layers.length - 1);
  const topologyCoherence = expectedBridges === 0 ? 0.5
    : Math.min(1, state.totalBridges / expectedBridges);

  const structuralElegance = (topologyCoherence * 0.5 + Math.min(0.5, narrativeBreadth / 5));

  return { ...state, mode, maxDepth, narrativeBreadth, topologyCoherence, structuralElegance };
}

// Reset narrative topology state
export function resetNarrativeTopologyEngineState(): NarrativeTopologyEngineState {
  return createNarrativeTopologyEngineState();
}