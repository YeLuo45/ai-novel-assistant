/**
 * V1172 NarrativeIdiomEngine — Direction F Iter 14/20 (Round 5)
 * Idiom engine: idioms + figurative language
 * Sources: nanobot idiom + thunderbolt + ruflo
 */

export type IdiomType = 'proverbial' | 'cultural' | 'regional' | 'occupational' | 'generational' | 'invented';
export type IdiomFit = 'forced' | 'uneven' | 'natural' | 'organic' | 'inevitable';
export type IdiomFreshness = 'tired' | 'common' | 'fresh' | 'novel' | 'inventive';

export interface Idiom {
  idiomId: string;
  type: IdiomType;
  fit: IdiomFit;
  freshness: IdiomFreshness;
  description: string;
  resonance: number;
  color: number;
  chapter: number;
}

export interface IdiomField {
  fieldId: string,
  idiomIds: string[],
  cumulativeResonance: number,
  variety: number,
}

export interface NarrativeIdiomEngineState {
  idioms: Map<string, Idiom>;
  fields: Map<string, IdiomField>;
  totalIdioms: number;
  totalFields: number;
  averageResonance: number;
  averageColor: number;
  fieldVariety: number;
  idiomMastery: number;
}

// Factory
export function createNarrativeIdiomEngineState(): NarrativeIdiomEngineState {
  return {
    idioms: new Map(),
    fields: new Map(),
    totalIdioms: 0,
    totalFields: 0,
    averageResonance: 0.5,
    averageColor: 0.5,
    fieldVariety: 0.5,
    idiomMastery: 0.5,
  };
}

// Add idiom
export function addIdiom(
  state: NarrativeIdiomEngineState,
  idiomId: string,
  type: IdiomType,
  fit: IdiomFit,
  freshness: IdiomFreshness,
  description: string,
  resonance: number,
  color: number,
  chapter: number
): NarrativeIdiomEngineState {
  const idiom: Idiom = { idiomId, type, fit, freshness, description, resonance, color, chapter };
  const idioms = new Map(state.idioms).set(idiomId, idiom);
  return recomputeIdiom({ ...state, idioms, totalIdioms: idioms.size });
}

// Add field
export function addIdiomField(
  state: NarrativeIdiomEngineState,
  fieldId: string,
  idiomIds: string[]
): NarrativeIdiomEngineState {
  const idioms = idiomIds.map(id => state.idioms.get(id)).filter((i): i is Idiom => i !== undefined);
  const cumulativeResonance = idioms.length === 0 ? 0
    : idioms.reduce((s, i) => s + i.resonance, 0) / idioms.length;
  const typeSet = new Set(idioms.map(i => i.type));
  const variety = Math.min(1, typeSet.size / 6);
  const field: IdiomField = { fieldId, idiomIds, cumulativeResonance, variety };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeIdiom({ ...state, fields, totalFields: fields.size });
}

// Get idioms by type
export function getIdiomsByType(state: NarrativeIdiomEngineState, type: IdiomType): Idiom[] {
  return Array.from(state.idioms.values()).filter(i => i.type === type);
}

// Get idiom report
export function getIdiomReport(state: NarrativeIdiomEngineState): {
  totalIdioms: number;
  totalFields: number;
  averageResonance: number;
  averageColor: number;
  idiomMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIdioms === 0) recommendations.push('No idioms — add idioms');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.idiomMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalIdioms: state.totalIdioms,
    totalFields: state.totalFields,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageColor: Math.round(state.averageColor * 100) / 100,
    idiomMastery: Math.round(state.idiomMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIdiom(state: NarrativeIdiomEngineState): NarrativeIdiomEngineState {
  const idioms = Array.from(state.idioms.values());
  const averageResonance = idioms.length === 0 ? 0.5
    : idioms.reduce((s, i) => s + i.resonance, 0) / idioms.length;
  const averageColor = idioms.length === 0 ? 0.5
    : idioms.reduce((s, i) => s + i.color, 0) / idioms.length;

  const fields = Array.from(state.fields.values());
  const fieldVariety = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.variety, 0) / fields.length;

  const idiomMastery = (averageResonance * 0.4 + averageColor * 0.3 + fieldVariety * 0.3);

  return { ...state, averageResonance, averageColor, fieldVariety, idiomMastery };
}

// Reset
export function resetNarrativeIdiomEngineState(): NarrativeIdiomEngineState {
  return createNarrativeIdiomEngineState();
}