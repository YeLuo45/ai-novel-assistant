/**
 * V1156 NarrativeMetaphorEngine — Direction F Iter 6/20 (Round 5)
 * Metaphor engine: original metaphors in narrative
 * Sources: ruflo metaphor + nanobot + thunderbolt
 */

export type MetaphorType = 'concrete' | 'abstract' | 'synesthetic' | 'anthropomorphic' | 'mechanistic' | 'organic';
export type MetaphorOriginality = 'cliche' | 'common' | 'fresh' | 'novel' | 'sublime';
export type MetaphorResonance = 'surface' | 'partial' | 'deep' | 'profound' | 'transformative';

export interface Metaphor {
  metaphorId: string;
  type: MetaphorType;
  originality: MetaphorOriginality;
  resonance: MetaphorResonance;
  description: string;
  vividness: number;
  illumination: number;
  chapter: number;
}

export interface MetaphorField {
  fieldId: string,
  metaphorIds: string[],
  cumulativeVividness: number,
  consistency: number,
}

export interface NarrativeMetaphorEngineState {
  metaphors: Map<string, Metaphor>;
  fields: Map<string, MetaphorField>;
  totalMetaphors: number;
  totalFields: number;
  averageVividness: number;
  averageIllumination: number;
  fieldConsistency: number;
  metaphorMastery: number;
}

// Factory
export function createNarrativeMetaphorEngineState(): NarrativeMetaphorEngineState {
  return {
    metaphors: new Map(),
    fields: new Map(),
    totalMetaphors: 0,
    totalFields: 0,
    averageVividness: 0.5,
    averageIllumination: 0.5,
    fieldConsistency: 0.5,
    metaphorMastery: 0.5,
  };
}

// Add metaphor
export function addMetaphor(
  state: NarrativeMetaphorEngineState,
  metaphorId: string,
  type: MetaphorType,
  originality: MetaphorOriginality,
  resonance: MetaphorResonance,
  description: string,
  vividness: number,
  illumination: number,
  chapter: number
): NarrativeMetaphorEngineState {
  const metaphor: Metaphor = { metaphorId, type, originality, resonance, description, vividness, illumination, chapter };
  const metaphors = new Map(state.metaphors).set(metaphorId, metaphor);
  return recomputeMetaphor({ ...state, metaphors, totalMetaphors: metaphors.size });
}

// Add field
export function addMetaphorField(
  state: NarrativeMetaphorEngineState,
  fieldId: string,
  metaphorIds: string[]
): NarrativeMetaphorEngineState {
  const metaphors = metaphorIds.map(id => state.metaphors.get(id)).filter((m): m is Metaphor => m !== undefined);
  const cumulativeVividness = metaphors.length === 0 ? 0
    : metaphors.reduce((s, m) => s + m.vividness, 0) / metaphors.length;
  const typeSet = new Set(metaphors.map(m => m.type));
  const consistency = Math.min(1, typeSet.size / 6);
  const field: MetaphorField = { fieldId, metaphorIds, cumulativeVividness, consistency };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeMetaphor({ ...state, fields, totalFields: fields.size });
}

// Get metaphors by type
export function getMetaphorsByType(state: NarrativeMetaphorEngineState, type: MetaphorType): Metaphor[] {
  return Array.from(state.metaphors.values()).filter(m => m.type === type);
}

// Get metaphor report
export function getMetaphorReport(state: NarrativeMetaphorEngineState): {
  totalMetaphors: number;
  totalFields: number;
  averageVividness: number;
  averageIllumination: number;
  metaphorMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMetaphors === 0) recommendations.push('No metaphors — add metaphors');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.metaphorMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalMetaphors: state.totalMetaphors,
    totalFields: state.totalFields,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    averageIllumination: Math.round(state.averageIllumination * 100) / 100,
    metaphorMastery: Math.round(state.metaphorMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMetaphor(state: NarrativeMetaphorEngineState): NarrativeMetaphorEngineState {
  const metaphors = Array.from(state.metaphors.values());
  const averageVividness = metaphors.length === 0 ? 0.5
    : metaphors.reduce((s, m) => s + m.vividness, 0) / metaphors.length;
  const averageIllumination = metaphors.length === 0 ? 0.5
    : metaphors.reduce((s, m) => s + m.illumination, 0) / metaphors.length;

  const fields = Array.from(state.fields.values());
  const fieldConsistency = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.consistency, 0) / fields.length;

  const metaphorMastery = (averageVividness * 0.4 + averageIllumination * 0.3 + fieldConsistency * 0.3);

  return { ...state, averageVividness, averageIllumination, fieldConsistency, metaphorMastery };
}

// Reset
export function resetNarrativeMetaphorEngineState(): NarrativeMetaphorEngineState {
  return createNarrativeMetaphorEngineState();
}