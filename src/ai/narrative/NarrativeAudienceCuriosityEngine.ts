/**
 * V1228 NarrativeAudienceCuriosityEngine — Direction H Iter 2/20 (Round 5)
 * Audience curiosity engine: curiosity of audience
 * Sources: ruflo curiosity + nanobot + thunderbolt
 */

export type AudienceCuriosityType = 'epistemic' | 'perceptual' | 'specific' | 'diversive' | 'cognitive' | 'emotional';
export type AudienceCuriosityIntensity = 'mild' | 'moderate' | 'strong' | 'intense' | 'overwhelming';
export type AudienceCuriosityPersistence = 'fleeting' | 'brief' | 'moderate' | 'enduring' | 'permanent';

export interface AudienceCuriosity {
  curiosityId: string;
  type: AudienceCuriosityType;
  intensity: AudienceCuriosityIntensity;
  persistence: AudienceCuriosityPersistence;
  description: string;
  pull: number;
  satisfaction: number;
  chapter: number;
}

export interface AudienceCuriosityField {
  fieldId: string,
  curiosityIds: string[],
  cumulativePull: number,
  variety: number,
}

export interface NarrativeAudienceCuriosityEngineState {
  curiosities: Map<string, AudienceCuriosity>;
  fields: Map<string, AudienceCuriosityField>;
  totalCuriosities: number;
  totalFields: number;
  averagePull: number;
  averageSatisfaction: number;
  fieldVariety: number;
  audienceCuriosityMastery: number;
}

// Factory
export function createNarrativeAudienceCuriosityEngineState(): NarrativeAudienceCuriosityEngineState {
  return {
    curiosities: new Map(),
    fields: new Map(),
    totalCuriosities: 0,
    totalFields: 0,
    averagePull: 0.5,
    averageSatisfaction: 0.5,
    fieldVariety: 0.5,
    audienceCuriosityMastery: 0.5,
  };
}

// Add curiosity
export function addAudienceCuriosity(
  state: NarrativeAudienceCuriosityEngineState,
  curiosityId: string,
  type: AudienceCuriosityType,
  intensity: AudienceCuriosityIntensity,
  persistence: AudienceCuriosityPersistence,
  description: string,
  pull: number,
  satisfaction: number,
  chapter: number
): NarrativeAudienceCuriosityEngineState {
  const curiosity: AudienceCuriosity = { curiosityId, type, intensity, persistence, description, pull, satisfaction, chapter };
  const curiosities = new Map(state.curiosities).set(curiosityId, curiosity);
  return recomputeAudienceCuriosity({ ...state, curiosities, totalCuriosities: curiosities.size });
}

// Add field
export function addAudienceCuriosityField(
  state: NarrativeAudienceCuriosityEngineState,
  fieldId: string,
  curiosityIds: string[]
): NarrativeAudienceCuriosityEngineState {
  const curiosities = curiosityIds.map(id => state.curiosities.get(id)).filter((c): c is AudienceCuriosity => c !== undefined);
  const cumulativePull = curiosities.length === 0 ? 0
    : curiosities.reduce((s, c) => s + c.pull, 0) / curiosities.length;
  const typeSet = new Set(curiosities.map(c => c.type));
  const variety = Math.min(1, typeSet.size / 6);
  const field: AudienceCuriosityField = { fieldId, curiosityIds, cumulativePull, variety };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeAudienceCuriosity({ ...state, fields, totalFields: fields.size });
}

// Get curiosities by type
export function getAudienceCuriositiesByType(state: NarrativeAudienceCuriosityEngineState, type: AudienceCuriosityType): AudienceCuriosity[] {
  return Array.from(state.curiosities.values()).filter(c => c.type === type);
}

// Get audience curiosity report
export function getAudienceCuriosityReport(state: NarrativeAudienceCuriosityEngineState): {
  totalCuriosities: number;
  totalFields: number;
  averagePull: number;
  averageSatisfaction: number;
  audienceCuriosityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCuriosities === 0) recommendations.push('No curiosities — add audience curiosities');
  if (state.averagePull < 0.5) recommendations.push('Low pull — strengthen');
  if (state.audienceCuriosityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCuriosities: state.totalCuriosities,
    totalFields: state.totalFields,
    averagePull: Math.round(state.averagePull * 100) / 100,
    averageSatisfaction: Math.round(state.averageSatisfaction * 100) / 100,
    audienceCuriosityMastery: Math.round(state.audienceCuriosityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceCuriosity(state: NarrativeAudienceCuriosityEngineState): NarrativeAudienceCuriosityEngineState {
  const curiosities = Array.from(state.curiosities.values());
  const averagePull = curiosities.length === 0 ? 0.5
    : curiosities.reduce((s, c) => s + c.pull, 0) / curiosities.length;
  const averageSatisfaction = curiosities.length === 0 ? 0.5
    : curiosities.reduce((s, c) => s + c.satisfaction, 0) / curiosities.length;

  const fields = Array.from(state.fields.values());
  const fieldVariety = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.variety, 0) / fields.length;

  const audienceCuriosityMastery = (averagePull * 0.4 + averageSatisfaction * 0.3 + fieldVariety * 0.3);

  return { ...state, averagePull, averageSatisfaction, fieldVariety, audienceCuriosityMastery };
}

// Reset
export function resetNarrativeAudienceCuriosityEngineState(): NarrativeAudienceCuriosityEngineState {
  return createNarrativeAudienceCuriosityEngineState();
}