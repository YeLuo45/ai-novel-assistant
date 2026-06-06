/**
 * V1174 NarrativeDictionEngine — Direction F Iter 15/20 (Round 5)
 * Diction engine: word choice in narrative
 * Sources: ruflo diction + nanobot + thunderbolt
 */

export type DictionType = 'plain' | 'precise' | 'ornate' | 'technical' | 'poetic' | 'conversational';
export type DictionPrecision = 'vague' | 'general' | 'specific' | 'exact' | 'inevitable';
export type DictionVariety = 'limited' | 'narrow' | 'moderate' | 'wide' | 'encyclopedic';

export interface Diction {
  dictionId: string;
  type: DictionType;
  precision: DictionPrecision;
  variety: DictionVariety;
  description: string;
  clarity: number;
  vividness: number;
  chapter: number;
}

export interface DictionField {
  fieldId: string,
  dictionIds: string[],
  cumulativeClarity: number,
  richness: number,
}

export interface NarrativeDictionEngineState {
  dictions: Map<string, Diction>;
  fields: Map<string, DictionField>;
  totalDictions: number;
  totalFields: number;
  averageClarity: number;
  averageVividness: number;
  fieldRichness: number;
  dictionMastery: number;
}

// Factory
export function createNarrativeDictionEngineState(): NarrativeDictionEngineState {
  return {
    dictions: new Map(),
    fields: new Map(),
    totalDictions: 0,
    totalFields: 0,
    averageClarity: 0.5,
    averageVividness: 0.5,
    fieldRichness: 0.5,
    dictionMastery: 0.5,
  };
}

// Add diction
export function addDiction(
  state: NarrativeDictionEngineState,
  dictionId: string,
  type: DictionType,
  precision: DictionPrecision,
  variety: DictionVariety,
  description: string,
  clarity: number,
  vividness: number,
  chapter: number
): NarrativeDictionEngineState {
  const diction: Diction = { dictionId, type, precision, variety, description, clarity, vividness, chapter };
  const dictions = new Map(state.dictions).set(dictionId, diction);
  return recomputeDiction({ ...state, dictions, totalDictions: dictions.size });
}

// Add field
export function addDictionField(
  state: NarrativeDictionEngineState,
  fieldId: string,
  dictionIds: string[]
): NarrativeDictionEngineState {
  const dictions = dictionIds.map(id => state.dictions.get(id)).filter((d): d is Diction => d !== undefined);
  const cumulativeClarity = dictions.length === 0 ? 0
    : dictions.reduce((s, d) => s + d.clarity, 0) / dictions.length;
  const typeSet = new Set(dictions.map(d => d.type));
  const richness = Math.min(1, typeSet.size / 6);
  const field: DictionField = { fieldId, dictionIds, cumulativeClarity, richness };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeDiction({ ...state, fields, totalFields: fields.size });
}

// Get dictions by type
export function getDictionsByType(state: NarrativeDictionEngineState, type: DictionType): Diction[] {
  return Array.from(state.dictions.values()).filter(d => d.type === type);
}

// Get diction report
export function getDictionReport(state: NarrativeDictionEngineState): {
  totalDictions: number;
  totalFields: number;
  averageClarity: number;
  averageVividness: number;
  dictionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDictions === 0) recommendations.push('No dictions — add dictions');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.dictionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDictions: state.totalDictions,
    totalFields: state.totalFields,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    dictionMastery: Math.round(state.dictionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDiction(state: NarrativeDictionEngineState): NarrativeDictionEngineState {
  const dictions = Array.from(state.dictions.values());
  const averageClarity = dictions.length === 0 ? 0.5
    : dictions.reduce((s, d) => s + d.clarity, 0) / dictions.length;
  const averageVividness = dictions.length === 0 ? 0.5
    : dictions.reduce((s, d) => s + d.vividness, 0) / dictions.length;

  const fields = Array.from(state.fields.values());
  const fieldRichness = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.richness, 0) / fields.length;

  const dictionMastery = (averageClarity * 0.4 + averageVividness * 0.3 + fieldRichness * 0.3);

  return { ...state, averageClarity, averageVividness, fieldRichness, dictionMastery };
}

// Reset
export function resetNarrativeDictionEngineState(): NarrativeDictionEngineState {
  return createNarrativeDictionEngineState();
}