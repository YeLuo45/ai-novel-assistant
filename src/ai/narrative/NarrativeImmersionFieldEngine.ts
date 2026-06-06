/**
 * V1108 NarrativeImmersionFieldEngine — Direction E Iter 2/20 (Round 5)
 * Immersion field engine: field of reader immersion
 * Sources: nanobot immersion + thunderbolt + ruflo
 */

export type ImmersionFieldMode = 'sensory' | 'emotional' | 'cognitive' | 'temporal' | 'spatial' | 'social';
export type ImmersionFieldDepth = 'surface' | 'shallow' | 'medium' | 'deep' | 'profound';
export type ImmersionFieldContinuity = 'fragmented' | 'patchy' | 'continuous' | 'seamless' | 'total';

export interface ImmersionField {
  fieldId: string;
  mode: ImmersionFieldMode;
  depth: ImmersionFieldDepth;
  continuity: ImmersionFieldContinuity;
  description: string;
  saturation: number;
  presence: number;
  chapter: number;
}

export interface ImmersionLayer {
  layerId: string,
  fieldIds: string[],
  cumulativeSaturation: number,
  uniformity: number,
}

export interface NarrativeImmersionFieldEngineState {
  fields: Map<string, ImmersionField>;
  layers: Map<string, ImmersionLayer>;
  totalFields: number;
  totalLayers: number;
  averageSaturation: number;
  averagePresence: number;
  layerUniformity: number;
  immersionMastery: number;
}

// Factory
export function createNarrativeImmersionFieldEngineState(): NarrativeImmersionFieldEngineState {
  return {
    fields: new Map(),
    layers: new Map(),
    totalFields: 0,
    totalLayers: 0,
    averageSaturation: 0.5,
    averagePresence: 0.5,
    layerUniformity: 0.5,
    immersionMastery: 0.5,
  };
}

// Add field
export function addImmersionField(
  state: NarrativeImmersionFieldEngineState,
  fieldId: string,
  mode: ImmersionFieldMode,
  depth: ImmersionFieldDepth,
  continuity: ImmersionFieldContinuity,
  description: string,
  saturation: number,
  presence: number,
  chapter: number
): NarrativeImmersionFieldEngineState {
  const field: ImmersionField = { fieldId, mode, depth, continuity, description, saturation, presence, chapter };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeImmersion({ ...state, fields, totalFields: fields.size });
}

// Add layer
export function addImmersionLayer(
  state: NarrativeImmersionFieldEngineState,
  layerId: string,
  fieldIds: string[]
): NarrativeImmersionFieldEngineState {
  const fields = fieldIds.map(id => state.fields.get(id)).filter((f): f is ImmersionField => f !== undefined);
  const cumulativeSaturation = fields.length === 0 ? 0
    : fields.reduce((s, f) => s + f.saturation, 0) / fields.length;
  const modeSet = new Set(fields.map(f => f.mode));
  const uniformity = Math.min(1, modeSet.size / 6);
  const layer: ImmersionLayer = { layerId, fieldIds, cumulativeSaturation, uniformity };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeImmersion({ ...state, layers, totalLayers: layers.size });
}

// Get fields by mode
export function getImmersionFieldsByMode(state: NarrativeImmersionFieldEngineState, mode: ImmersionFieldMode): ImmersionField[] {
  return Array.from(state.fields.values()).filter(f => f.mode === mode);
}

// Get immersion report
export function getImmersionFieldReport(state: NarrativeImmersionFieldEngineState): {
  totalFields: number;
  totalLayers: number;
  averageSaturation: number;
  averagePresence: number;
  immersionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFields === 0) recommendations.push('No fields — add immersion fields');
  if (state.averageSaturation < 0.5) recommendations.push('Low saturation — strengthen');
  if (state.immersionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFields: state.totalFields,
    totalLayers: state.totalLayers,
    averageSaturation: Math.round(state.averageSaturation * 100) / 100,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    immersionMastery: Math.round(state.immersionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeImmersion(state: NarrativeImmersionFieldEngineState): NarrativeImmersionFieldEngineState {
  const fields = Array.from(state.fields.values());
  const averageSaturation = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.saturation, 0) / fields.length;
  const averagePresence = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.presence, 0) / fields.length;

  const layers = Array.from(state.layers.values());
  const layerUniformity = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.uniformity, 0) / layers.length;

  const immersionMastery = (averageSaturation * 0.4 + averagePresence * 0.3 + layerUniformity * 0.3);

  return { ...state, averageSaturation, averagePresence, layerUniformity, immersionMastery };
}

// Reset
export function resetNarrativeImmersionFieldEngineState(): NarrativeImmersionFieldEngineState {
  return createNarrativeImmersionFieldEngineState();
}