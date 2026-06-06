/**
 * V1222 NarrativeTimeCompressionEngine2 — Direction G Iter 19/20 (Round 5)
 * Time compression engine v2: time compression
 * Sources: nanobot compression + thunderbolt + ruflo
 */

export type TimeCompressionType = 'montage' | 'summary' | 'ellipsis' | 'fast_forward' | 'time_lapse' | 'condensation';
export type TimeCompressionRatio = 'minimal' | 'modest' | 'significant' | 'dramatic' | 'extreme';
export type TimeCompressionEffect = 'invisible' | 'subtle' | 'noticeable' | 'dramatic' | 'revolutionary';

export interface TimeCompression {
  compressionId: string;
  type: TimeCompressionType;
  ratio: TimeCompressionRatio;
  effect: TimeCompressionEffect;
  description: string;
  density: number;
  impact: number;
  chapter: number;
}

export interface TimeCompressionLayer {
  layerId: string,
  compressionIds: string[],
  cumulativeDensity: number,
  diversity: number,
}

export interface NarrativeTimeCompressionEngineState {
  compressions: Map<string, TimeCompression>;
  layers: Map<string, TimeCompressionLayer>;
  totalCompressions: number;
  totalLayers: number;
  averageDensity: number;
  averageImpact: number;
  layerDiversity: number;
  timeCompressionMastery: number;
}

// Factory
export function createNarrativeTimeCompressionEngineState(): NarrativeTimeCompressionEngineState {
  return {
    compressions: new Map(),
    layers: new Map(),
    totalCompressions: 0,
    totalLayers: 0,
    averageDensity: 0.5,
    averageImpact: 0.5,
    layerDiversity: 0.5,
    timeCompressionMastery: 0.5,
  };
}

// Add compression
export function addTimeCompression(
  state: NarrativeTimeCompressionEngineState,
  compressionId: string,
  type: TimeCompressionType,
  ratio: TimeCompressionRatio,
  effect: TimeCompressionEffect,
  description: string,
  density: number,
  impact: number,
  chapter: number
): NarrativeTimeCompressionEngineState {
  const compression: TimeCompression = { compressionId, type, ratio, effect, description, density, impact, chapter };
  const compressions = new Map(state.compressions).set(compressionId, compression);
  return recomputeTimeCompression({ ...state, compressions, totalCompressions: compressions.size });
}

// Add layer
export function addTimeCompressionLayer(
  state: NarrativeTimeCompressionEngineState,
  layerId: string,
  compressionIds: string[]
): NarrativeTimeCompressionEngineState {
  const compressions = compressionIds.map(id => state.compressions.get(id)).filter((c): c is TimeCompression => c !== undefined);
  const cumulativeDensity = compressions.length === 0 ? 0
    : compressions.reduce((s, c) => s + c.density, 0) / compressions.length;
  const typeSet = new Set(compressions.map(c => c.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const layer: TimeCompressionLayer = { layerId, compressionIds, cumulativeDensity, diversity };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeTimeCompression({ ...state, layers, totalLayers: layers.size });
}

// Get compressions by type
export function getTimeCompressionsByType(state: NarrativeTimeCompressionEngineState, type: TimeCompressionType): TimeCompression[] {
  return Array.from(state.compressions.values()).filter(c => c.type === type);
}

// Get time compression report
export function getTimeCompressionReport(state: NarrativeTimeCompressionEngineState): {
  totalCompressions: number;
  totalLayers: number;
  averageDensity: number;
  averageImpact: number;
  timeCompressionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCompressions === 0) recommendations.push('No compressions — add time compressions');
  if (state.averageDensity < 0.5) recommendations.push('Low density — strengthen');
  if (state.timeCompressionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCompressions: state.totalCompressions,
    totalLayers: state.totalLayers,
    averageDensity: Math.round(state.averageDensity * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    timeCompressionMastery: Math.round(state.timeCompressionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeCompression(state: NarrativeTimeCompressionEngineState): NarrativeTimeCompressionEngineState {
  const compressions = Array.from(state.compressions.values());
  const averageDensity = compressions.length === 0 ? 0.5
    : compressions.reduce((s, c) => s + c.density, 0) / compressions.length;
  const averageImpact = compressions.length === 0 ? 0.5
    : compressions.reduce((s, c) => s + c.impact, 0) / compressions.length;

  const layers = Array.from(state.layers.values());
  const layerDiversity = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.diversity, 0) / layers.length;

  const timeCompressionMastery = (averageDensity * 0.4 + averageImpact * 0.3 + layerDiversity * 0.3);

  return { ...state, averageDensity, averageImpact, layerDiversity, timeCompressionMastery };
}

// Reset
export function resetNarrativeTimeCompressionEngineState(): NarrativeTimeCompressionEngineState {
  return createNarrativeTimeCompressionEngineState();
}