/**
 * V1212 NarrativeTimeGravityEngine — Direction G Iter 14/20 (Round 5)
 * Time gravity engine: gravity of time
 * Sources: nanobot gravity + thunderbolt + ruflo
 */

export type TimeGravityType = 'attractive' | 'repulsive' | 'neutral' | 'curved' | 'warped' | 'singular';
export type TimeGravityPull = 'weak' | 'moderate' | 'strong' | 'extreme' | 'infinite';
export type TimeGravityWell = 'shallow' | 'moderate' | 'deep' | 'abyssal' | 'event_horizon';

export interface TimeGravity {
  gravityId: string;
  type: TimeGravityType;
  pull: TimeGravityPull;
  well: TimeGravityWell;
  description: string;
  mass: number;
  curvature: number;
  chapter: number;
}

export interface TimeGravityField {
  fieldId: string,
  gravityIds: string[],
  cumulativeMass: number,
  depth: number,
}

export interface NarrativeTimeGravityEngineState {
  gravities: Map<string, TimeGravity>;
  fields: Map<string, TimeGravityField>;
  totalGravities: number;
  totalFields: number;
  averageMass: number;
  averageCurvature: number;
  fieldDepth: number;
  timeGravityMastery: number;
}

// Factory
export function createNarrativeTimeGravityEngineState(): NarrativeTimeGravityEngineState {
  return {
    gravities: new Map(),
    fields: new Map(),
    totalGravities: 0,
    totalFields: 0,
    averageMass: 0.5,
    averageCurvature: 0.5,
    fieldDepth: 0.5,
    timeGravityMastery: 0.5,
  };
}

// Add gravity
export function addTimeGravity(
  state: NarrativeTimeGravityEngineState,
  gravityId: string,
  type: TimeGravityType,
  pull: TimeGravityPull,
  well: TimeGravityWell,
  description: string,
  mass: number,
  curvature: number,
  chapter: number
): NarrativeTimeGravityEngineState {
  const gravity: TimeGravity = { gravityId, type, pull, well, description, mass, curvature, chapter };
  const gravities = new Map(state.gravities).set(gravityId, gravity);
  return recomputeTimeGravity({ ...state, gravities, totalGravities: gravities.size });
}

// Add field
export function addTimeGravityField(
  state: NarrativeTimeGravityEngineState,
  fieldId: string,
  gravityIds: string[]
): NarrativeTimeGravityEngineState {
  const gravities = gravityIds.map(id => state.gravities.get(id)).filter((g): g is TimeGravity => g !== undefined);
  const cumulativeMass = gravities.length === 0 ? 0
    : gravities.reduce((s, g) => s + g.mass, 0) / gravities.length;
  const typeSet = new Set(gravities.map(g => g.type));
  const depth = Math.min(1, typeSet.size / 6);
  const field: TimeGravityField = { fieldId, gravityIds, cumulativeMass, depth };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeTimeGravity({ ...state, fields, totalFields: fields.size });
}

// Get gravities by type
export function getTimeGravitiesByType(state: NarrativeTimeGravityEngineState, type: TimeGravityType): TimeGravity[] {
  return Array.from(state.gravities.values()).filter(g => g.type === type);
}

// Get time gravity report
export function getTimeGravityReport(state: NarrativeTimeGravityEngineState): {
  totalGravities: number;
  totalFields: number;
  averageMass: number;
  averageCurvature: number;
  timeGravityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGravities === 0) recommendations.push('No gravities — add time gravities');
  if (state.averageMass < 0.5) recommendations.push('Low mass — strengthen');
  if (state.timeGravityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalGravities: state.totalGravities,
    totalFields: state.totalFields,
    averageMass: Math.round(state.averageMass * 100) / 100,
    averageCurvature: Math.round(state.averageCurvature * 100) / 100,
    timeGravityMastery: Math.round(state.timeGravityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeGravity(state: NarrativeTimeGravityEngineState): NarrativeTimeGravityEngineState {
  const gravities = Array.from(state.gravities.values());
  const averageMass = gravities.length === 0 ? 0.5
    : gravities.reduce((s, g) => s + g.mass, 0) / gravities.length;
  const averageCurvature = gravities.length === 0 ? 0.5
    : gravities.reduce((s, g) => s + g.curvature, 0) / gravities.length;

  const fields = Array.from(state.fields.values());
  const fieldDepth = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.depth, 0) / fields.length;

  const timeGravityMastery = (averageMass * 0.4 + averageCurvature * 0.3 + fieldDepth * 0.3);

  return { ...state, averageMass, averageCurvature, fieldDepth, timeGravityMastery };
}

// Reset
export function resetNarrativeTimeGravityEngineState(): NarrativeTimeGravityEngineState {
  return createNarrativeTimeGravityEngineState();
}