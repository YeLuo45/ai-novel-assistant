/**
 * V1158 NarrativeSimileEngine — Direction F Iter 7/20 (Round 5)
 * Simile engine: similes in narrative
 * Sources: nanobot simile + thunderbolt + ruflo
 */

export type SimileType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'abstract';
export type SimileOriginality = 'cliche' | 'common' | 'fresh' | 'novel' | 'sublime';
export type SimilePrecision = 'loose' | 'approximate' | 'precise' | 'exact' | 'inevitable';

export interface Simile {
  simileId: string;
  type: SimileType;
  originality: SimileOriginality;
  precision: SimilePrecision;
  description: string;
  clarity: number;
  resonance: number;
  chapter: number;
}

export interface SimileField {
  fieldId: string,
  simileIds: string[],
  cumulativeClarity: number,
  diversity: number,
}

export interface NarrativeSimileEngineState {
  similes: Map<string, Simile>;
  fields: Map<string, SimileField>;
  totalSimiles: number;
  totalFields: number;
  averageClarity: number;
  averageResonance: number;
  fieldDiversity: number;
  simileMastery: number;
}

// Factory
export function createNarrativeSimileEngineState(): NarrativeSimileEngineState {
  return {
    similes: new Map(),
    fields: new Map(),
    totalSimiles: 0,
    totalFields: 0,
    averageClarity: 0.5,
    averageResonance: 0.5,
    fieldDiversity: 0.5,
    simileMastery: 0.5,
  };
}

// Add simile
export function addSimile(
  state: NarrativeSimileEngineState,
  simileId: string,
  type: SimileType,
  originality: SimileOriginality,
  precision: SimilePrecision,
  description: string,
  clarity: number,
  resonance: number,
  chapter: number
): NarrativeSimileEngineState {
  const simile: Simile = { simileId, type, originality, precision, description, clarity, resonance, chapter };
  const similes = new Map(state.similes).set(simileId, simile);
  return recomputeSimile({ ...state, similes, totalSimiles: similes.size });
}

// Add field
export function addSimileField(
  state: NarrativeSimileEngineState,
  fieldId: string,
  simileIds: string[]
): NarrativeSimileEngineState {
  const similes = simileIds.map(id => state.similes.get(id)).filter((s): s is Simile => s !== undefined);
  const cumulativeClarity = similes.length === 0 ? 0
    : similes.reduce((s, si) => s + si.clarity, 0) / similes.length;
  const typeSet = new Set(similes.map(s => s.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const field: SimileField = { fieldId, simileIds, cumulativeClarity, diversity };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeSimile({ ...state, fields, totalFields: fields.size });
}

// Get similes by type
export function getSimilesByType(state: NarrativeSimileEngineState, type: SimileType): Simile[] {
  return Array.from(state.similes.values()).filter(s => s.type === type);
}

// Get simile report
export function getSimileReport(state: NarrativeSimileEngineState): {
  totalSimiles: number;
  totalFields: number;
  averageClarity: number;
  averageResonance: number;
  simileMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSimiles === 0) recommendations.push('No similes — add similes');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.simileMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSimiles: state.totalSimiles,
    totalFields: state.totalFields,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    simileMastery: Math.round(state.simileMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSimile(state: NarrativeSimileEngineState): NarrativeSimileEngineState {
  const similes = Array.from(state.similes.values());
  const averageClarity = similes.length === 0 ? 0.5
    : similes.reduce((s, si) => s + si.clarity, 0) / similes.length;
  const averageResonance = similes.length === 0 ? 0.5
    : similes.reduce((s, si) => s + si.resonance, 0) / similes.length;

  const fields = Array.from(state.fields.values());
  const fieldDiversity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.diversity, 0) / fields.length;

  const simileMastery = (averageClarity * 0.4 + averageResonance * 0.3 + fieldDiversity * 0.3);

  return { ...state, averageClarity, averageResonance, fieldDiversity, simileMastery };
}

// Reset
export function resetNarrativeSimileEngineState(): NarrativeSimileEngineState {
  return createNarrativeSimileEngineState();
}