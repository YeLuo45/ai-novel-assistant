/**
 * V1220 NarrativeTimeDecelerationEngine — Direction G Iter 18/20 (Round 5)
 * Time deceleration engine: deceleration in time
 * Sources: ruflo deceleration + nanobot + thunderbolt
 */

export type TimeDecelerationType = 'linear' | 'exponential' | 'logarithmic' | 'stepped' | 's_curve' | 'plateau';
export type TimeDecelerationRate = 'gentle' | 'moderate' | 'rapid' | 'sudden' | 'absolute_stop';
export type TimeDecelerationEffect = 'subtle' | 'noticeable' | 'dramatic' | 'frozen' | 'crystallized';

export interface TimeDeceleration {
  decelerationId: string;
  type: TimeDecelerationType;
  rate: TimeDecelerationRate;
  effect: TimeDecelerationEffect;
  description: string;
  velocity_loss: number;
  impact: number;
  chapter: number;
}

export interface TimeDecelerationField {
  fieldId: string,
  decelerationIds: string[],
  cumulativeVelocityLoss: number,
  intensity: number,
}

export interface NarrativeTimeDecelerationEngineState {
  decelerations: Map<string, TimeDeceleration>;
  fields: Map<string, TimeDecelerationField>;
  totalDecelerations: number;
  totalFields: number;
  averageVelocityLoss: number;
  averageImpact: number;
  fieldIntensity: number;
  timeDecelerationMastery: number;
}

// Factory
export function createNarrativeTimeDecelerationEngineState(): NarrativeTimeDecelerationEngineState {
  return {
    decelerations: new Map(),
    fields: new Map(),
    totalDecelerations: 0,
    totalFields: 0,
    averageVelocityLoss: 0.5,
    averageImpact: 0.5,
    fieldIntensity: 0.5,
    timeDecelerationMastery: 0.5,
  };
}

// Add deceleration
export function addTimeDeceleration(
  state: NarrativeTimeDecelerationEngineState,
  decelerationId: string,
  type: TimeDecelerationType,
  rate: TimeDecelerationRate,
  effect: TimeDecelerationEffect,
  description: string,
  velocity_loss: number,
  impact: number,
  chapter: number
): NarrativeTimeDecelerationEngineState {
  const deceleration: TimeDeceleration = { decelerationId, type, rate, effect, description, velocity_loss, impact, chapter };
  const decelerations = new Map(state.decelerations).set(decelerationId, deceleration);
  return recomputeTimeDeceleration({ ...state, decelerations, totalDecelerations: decelerations.size });
}

// Add field
export function addTimeDecelerationField(
  state: NarrativeTimeDecelerationEngineState,
  fieldId: string,
  decelerationIds: string[]
): NarrativeTimeDecelerationEngineState {
  const decelerations = decelerationIds.map(id => state.decelerations.get(id)).filter((d): d is TimeDeceleration => d !== undefined);
  const cumulativeVelocityLoss = decelerations.length === 0 ? 0
    : decelerations.reduce((s, d) => s + d.velocity_loss, 0) / decelerations.length;
  const typeSet = new Set(decelerations.map(d => d.type));
  const intensity = Math.min(1, typeSet.size / 6);
  const field: TimeDecelerationField = { fieldId, decelerationIds, cumulativeVelocityLoss, intensity };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeTimeDeceleration({ ...state, fields, totalFields: fields.size });
}

// Get decelerations by type
export function getTimeDecelerationsByType(state: NarrativeTimeDecelerationEngineState, type: TimeDecelerationType): TimeDeceleration[] {
  return Array.from(state.decelerations.values()).filter(d => d.type === type);
}

// Get time deceleration report
export function getTimeDecelerationReport(state: NarrativeTimeDecelerationEngineState): {
  totalDecelerations: number;
  totalFields: number;
  averageVelocityLoss: number;
  averageImpact: number;
  timeDecelerationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDecelerations === 0) recommendations.push('No decelerations — add time decelerations');
  if (state.averageVelocityLoss < 0.5) recommendations.push('Low velocity loss — strengthen');
  if (state.timeDecelerationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDecelerations: state.totalDecelerations,
    totalFields: state.totalFields,
    averageVelocityLoss: Math.round(state.averageVelocityLoss * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    timeDecelerationMastery: Math.round(state.timeDecelerationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeDeceleration(state: NarrativeTimeDecelerationEngineState): NarrativeTimeDecelerationEngineState {
  const decelerations = Array.from(state.decelerations.values());
  const averageVelocityLoss = decelerations.length === 0 ? 0.5
    : decelerations.reduce((s, d) => s + d.velocity_loss, 0) / decelerations.length;
  const averageImpact = decelerations.length === 0 ? 0.5
    : decelerations.reduce((s, d) => s + d.impact, 0) / decelerations.length;

  const fields = Array.from(state.fields.values());
  const fieldIntensity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.intensity, 0) / fields.length;

  const timeDecelerationMastery = (averageVelocityLoss * 0.4 + averageImpact * 0.3 + fieldIntensity * 0.3);

  return { ...state, averageVelocityLoss, averageImpact, fieldIntensity, timeDecelerationMastery };
}

// Reset
export function resetNarrativeTimeDecelerationEngineState(): NarrativeTimeDecelerationEngineState {
  return createNarrativeTimeDecelerationEngineState();
}