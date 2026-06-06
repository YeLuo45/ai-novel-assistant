/**
 * V1226 NarrativeAudienceEmpathyEngine — Direction H Iter 1/20 (Round 5)
 * Audience empathy engine: empathy of audience
 * Sources: thunderbolt empathy + nanobot + ruflo
 */

export type AudienceEmpathyType = 'cognitive' | 'emotional' | 'compassionate' | 'radical' | 'reflective' | 'imaginative';
export type AudienceEmpathyDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'profound';
export type AudienceEmpathySustainability = 'transient' | 'brief' | 'moderate' | 'enduring' | 'permanent';

export interface AudienceEmpathy {
  empathyId: string;
  type: AudienceEmpathyType;
  depth: AudienceEmpathyDepth;
  sustainability: AudienceEmpathySustainability;
  description: string;
  resonance: number;
  impact: number;
  chapter: number;
}

export interface AudienceEmpathyField {
  fieldId: string,
  empathyIds: string[],
  cumulativeResonance: number,
  diversity: number,
}

export interface NarrativeAudienceEmpathyEngineState {
  empathies: Map<string, AudienceEmpathy>;
  fields: Map<string, AudienceEmpathyField>;
  totalEmpathies: number;
  totalFields: number;
  averageResonance: number;
  averageImpact: number;
  fieldDiversity: number;
  audienceEmpathyMastery: number;
}

// Factory
export function createNarrativeAudienceEmpathyEngineState(): NarrativeAudienceEmpathyEngineState {
  return {
    empathies: new Map(),
    fields: new Map(),
    totalEmpathies: 0,
    totalFields: 0,
    averageResonance: 0.5,
    averageImpact: 0.5,
    fieldDiversity: 0.5,
    audienceEmpathyMastery: 0.5,
  };
}

// Add empathy
export function addAudienceEmpathy(
  state: NarrativeAudienceEmpathyEngineState,
  empathyId: string,
  type: AudienceEmpathyType,
  depth: AudienceEmpathyDepth,
  sustainability: AudienceEmpathySustainability,
  description: string,
  resonance: number,
  impact: number,
  chapter: number
): NarrativeAudienceEmpathyEngineState {
  const empathy: AudienceEmpathy = { empathyId, type, depth, sustainability, description, resonance, impact, chapter };
  const empathies = new Map(state.empathies).set(empathyId, empathy);
  return recomputeAudienceEmpathy({ ...state, empathies, totalEmpathies: empathies.size });
}

// Add field
export function addAudienceEmpathyField(
  state: NarrativeAudienceEmpathyEngineState,
  fieldId: string,
  empathyIds: string[]
): NarrativeAudienceEmpathyEngineState {
  const empathies = empathyIds.map(id => state.empathies.get(id)).filter((e): e is AudienceEmpathy => e !== undefined);
  const cumulativeResonance = empathies.length === 0 ? 0
    : empathies.reduce((s, e) => s + e.resonance, 0) / empathies.length;
  const typeSet = new Set(empathies.map(e => e.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const field: AudienceEmpathyField = { fieldId, empathyIds, cumulativeResonance, diversity };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeAudienceEmpathy({ ...state, fields, totalFields: fields.size });
}

// Get empathies by type
export function getAudienceEmpathiesByType(state: NarrativeAudienceEmpathyEngineState, type: AudienceEmpathyType): AudienceEmpathy[] {
  return Array.from(state.empathies.values()).filter(e => e.type === type);
}

// Get audience empathy report
export function getAudienceEmpathyReport(state: NarrativeAudienceEmpathyEngineState): {
  totalEmpathies: number;
  totalFields: number;
  averageResonance: number;
  averageImpact: number;
  audienceEmpathyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEmpathies === 0) recommendations.push('No empathies — add audience empathies');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.audienceEmpathyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEmpathies: state.totalEmpathies,
    totalFields: state.totalFields,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    audienceEmpathyMastery: Math.round(state.audienceEmpathyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceEmpathy(state: NarrativeAudienceEmpathyEngineState): NarrativeAudienceEmpathyEngineState {
  const empathies = Array.from(state.empathies.values());
  const averageResonance = empathies.length === 0 ? 0.5
    : empathies.reduce((s, e) => s + e.resonance, 0) / empathies.length;
  const averageImpact = empathies.length === 0 ? 0.5
    : empathies.reduce((s, e) => s + e.impact, 0) / empathies.length;

  const fields = Array.from(state.fields.values());
  const fieldDiversity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.diversity, 0) / fields.length;

  const audienceEmpathyMastery = (averageResonance * 0.4 + averageImpact * 0.3 + fieldDiversity * 0.3);

  return { ...state, averageResonance, averageImpact, fieldDiversity, audienceEmpathyMastery };
}

// Reset
export function resetNarrativeAudienceEmpathyEngineState(): NarrativeAudienceEmpathyEngineState {
  return createNarrativeAudienceEmpathyEngineState();
}