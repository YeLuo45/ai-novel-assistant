/**
 * V1234 NarrativeAudienceReceptionEngine — Direction H Iter 5/20 (Round 5)
 * Audience reception engine: reception of audience
 * Sources: thunderbolt reception + nanobot + ruflo
 */

export type AudienceReceptionType = 'initial' | 'critical' | 'interpretive' | 'reception_history' | 'cultural' | 'cross_cultural';
export type AudienceReceptionSentiment = 'negative' | 'mixed' | 'neutral' | 'positive' | 'ecstatic';
export type AudienceReceptionBreadth = 'niche' | 'limited' | 'moderate' | 'broad' | 'universal';

export interface AudienceReception {
  receptionId: string;
  type: AudienceReceptionType;
  sentiment: AudienceReceptionSentiment;
  breadth: AudienceReceptionBreadth;
  description: string;
  impact: number;
  longevity: number;
  chapter: number;
}

export interface AudienceReceptionField {
  fieldId: string,
  receptionIds: string[],
  cumulativeImpact: number,
  diversity: number,
}

export interface NarrativeAudienceReceptionEngineState {
  receptions: Map<string, AudienceReception>;
  fields: Map<string, AudienceReceptionField>;
  totalReceptions: number;
  totalFields: number;
  averageImpact: number;
  averageLongevity: number;
  fieldDiversity: number;
  audienceReceptionMastery: number;
}

// Factory
export function createNarrativeAudienceReceptionEngineState(): NarrativeAudienceReceptionEngineState {
  return {
    receptions: new Map(),
    fields: new Map(),
    totalReceptions: 0,
    totalFields: 0,
    averageImpact: 0.5,
    averageLongevity: 0.5,
    fieldDiversity: 0.5,
    audienceReceptionMastery: 0.5,
  };
}

// Add reception
export function addAudienceReception(
  state: NarrativeAudienceReceptionEngineState,
  receptionId: string,
  type: AudienceReceptionType,
  sentiment: AudienceReceptionSentiment,
  breadth: AudienceReceptionBreadth,
  description: string,
  impact: number,
  longevity: number,
  chapter: number
): NarrativeAudienceReceptionEngineState {
  const reception: AudienceReception = { receptionId, type, sentiment, breadth, description, impact, longevity, chapter };
  const receptions = new Map(state.receptions).set(receptionId, reception);
  return recomputeAudienceReception({ ...state, receptions, totalReceptions: receptions.size });
}

// Add field
export function addAudienceReceptionField(
  state: NarrativeAudienceReceptionEngineState,
  fieldId: string,
  receptionIds: string[]
): NarrativeAudienceReceptionEngineState {
  const receptions = receptionIds.map(id => state.receptions.get(id)).filter((r): r is AudienceReception => r !== undefined);
  const cumulativeImpact = receptions.length === 0 ? 0
    : receptions.reduce((s, r) => s + r.impact, 0) / receptions.length;
  const typeSet = new Set(receptions.map(r => r.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const field: AudienceReceptionField = { fieldId, receptionIds, cumulativeImpact, diversity };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeAudienceReception({ ...state, fields, totalFields: fields.size });
}

// Get receptions by type
export function getAudienceReceptionsByType(state: NarrativeAudienceReceptionEngineState, type: AudienceReceptionType): AudienceReception[] {
  return Array.from(state.receptions.values()).filter(r => r.type === type);
}

// Get audience reception report
export function getAudienceReceptionReport(state: NarrativeAudienceReceptionEngineState): {
  totalReceptions: number;
  totalFields: number;
  averageImpact: number;
  averageLongevity: number;
  audienceReceptionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalReceptions === 0) recommendations.push('No receptions — add audience receptions');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.audienceReceptionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalReceptions: state.totalReceptions,
    totalFields: state.totalFields,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageLongevity: Math.round(state.averageLongevity * 100) / 100,
    audienceReceptionMastery: Math.round(state.audienceReceptionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceReception(state: NarrativeAudienceReceptionEngineState): NarrativeAudienceReceptionEngineState {
  const receptions = Array.from(state.receptions.values());
  const averageImpact = receptions.length === 0 ? 0.5
    : receptions.reduce((s, r) => s + r.impact, 0) / receptions.length;
  const averageLongevity = receptions.length === 0 ? 0.5
    : receptions.reduce((s, r) => s + r.longevity, 0) / receptions.length;

  const fields = Array.from(state.fields.values());
  const fieldDiversity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.diversity, 0) / fields.length;

  const audienceReceptionMastery = (averageImpact * 0.4 + averageLongevity * 0.3 + fieldDiversity * 0.3);

  return { ...state, averageImpact, averageLongevity, fieldDiversity, audienceReceptionMastery };
}

// Reset
export function resetNarrativeAudienceReceptionEngineState(): NarrativeAudienceReceptionEngineState {
  return createNarrativeAudienceReceptionEngineState();
}