/**
 * V1210 NarrativeTimeFieldEngine2 — Direction G Iter 13/20 (Round 5)
 * Time field engine v2: time fields
 * Sources: ruflo field + nanobot + thunderbolt
 */

export type TimeFieldType = 'gravitational' | 'magnetic' | 'electric' | 'quantum' | 'consciousness' | 'narrative';
export type TimeFieldStrength = 'weak' | 'moderate' | 'strong' | 'powerful' | 'absolute';
export type TimeFieldShape = 'point' | 'linear' | 'planar' | 'volumetric' | 'hyperspatial';

export interface TimeField {
  fieldId: string;
  type: TimeFieldType;
  strength: TimeFieldStrength;
  shape: TimeFieldShape;
  description: string;
  reach: number;
  intensity: number;
  chapter: number;
}

export interface TimeFieldDomain {
  domainId: string,
  fieldIds: string[],
  cumulativeReach: number,
  complexity: number,
}

export interface NarrativeTimeFieldEngineState {
  fields: Map<string, TimeField>;
  domains: Map<string, TimeFieldDomain>;
  totalFields: number;
  totalDomains: number;
  averageReach: number;
  averageIntensity: number;
  domainComplexity: number;
  timeFieldMastery: number;
}

// Factory
export function createNarrativeTimeFieldEngineState(): NarrativeTimeFieldEngineState {
  return {
    fields: new Map(),
    domains: new Map(),
    totalFields: 0,
    totalDomains: 0,
    averageReach: 0.5,
    averageIntensity: 0.5,
    domainComplexity: 0.5,
    timeFieldMastery: 0.5,
  };
}

// Add field
export function addTimeField(
  state: NarrativeTimeFieldEngineState,
  fieldId: string,
  type: TimeFieldType,
  strength: TimeFieldStrength,
  shape: TimeFieldShape,
  description: string,
  reach: number,
  intensity: number,
  chapter: number
): NarrativeTimeFieldEngineState {
  const field: TimeField = { fieldId, type, strength, shape, description, reach, intensity, chapter };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeTimeField({ ...state, fields, totalFields: fields.size });
}

// Add domain
export function addTimeFieldDomain(
  state: NarrativeTimeFieldEngineState,
  domainId: string,
  fieldIds: string[]
): NarrativeTimeFieldEngineState {
  const fields = fieldIds.map(id => state.fields.get(id)).filter((f): f is TimeField => f !== undefined);
  const cumulativeReach = fields.length === 0 ? 0
    : fields.reduce((s, f) => s + f.reach, 0) / fields.length;
  const typeSet = new Set(fields.map(f => f.type));
  const complexity = Math.min(1, typeSet.size / 6);
  const domain: TimeFieldDomain = { domainId, fieldIds, cumulativeReach, complexity };
  const domains = new Map(state.domains).set(domainId, domain);
  return recomputeTimeField({ ...state, domains, totalDomains: domains.size });
}

// Get fields by type
export function getTimeFieldsByType(state: NarrativeTimeFieldEngineState, type: TimeFieldType): TimeField[] {
  return Array.from(state.fields.values()).filter(f => f.type === type);
}

// Get time field report
export function getTimeFieldReport(state: NarrativeTimeFieldEngineState): {
  totalFields: number;
  totalDomains: number;
  averageReach: number;
  averageIntensity: number;
  timeFieldMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFields === 0) recommendations.push('No fields — add time fields');
  if (state.averageReach < 0.5) recommendations.push('Low reach — strengthen');
  if (state.timeFieldMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFields: state.totalFields,
    totalDomains: state.totalDomains,
    averageReach: Math.round(state.averageReach * 100) / 100,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    timeFieldMastery: Math.round(state.timeFieldMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeField(state: NarrativeTimeFieldEngineState): NarrativeTimeFieldEngineState {
  const fields = Array.from(state.fields.values());
  const averageReach = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.reach, 0) / fields.length;
  const averageIntensity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.intensity, 0) / fields.length;

  const domains = Array.from(state.domains.values());
  const domainComplexity = domains.length === 0 ? 0.5
    : domains.reduce((s, d) => s + d.complexity, 0) / domains.length;

  const timeFieldMastery = (averageReach * 0.4 + averageIntensity * 0.3 + domainComplexity * 0.3);

  return { ...state, averageReach, averageIntensity, domainComplexity, timeFieldMastery };
}

// Reset
export function resetNarrativeTimeFieldEngineState(): NarrativeTimeFieldEngineState {
  return createNarrativeTimeFieldEngineState();
}