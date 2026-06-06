/**
 * V1130 NarrativePresenceEngine — Direction E Iter 13/20 (Round 5)
 * Presence engine: sense of presence in narrative
 * Sources: ruflo presence + nanobot + thunderbolt
 */

export type PresenceType = 'spatial' | 'temporal' | 'social' | 'embodied' | 'narrative' | 'emotional';
export type PresenceIntensity = 'absent' | 'weak' | 'moderate' | 'strong' | 'overwhelming';
export type PresenceRealness = 'abstract' | 'symbolic' | 'concrete' | 'tangible' | 'indistinguishable';

export interface Presence {
  presenceId: string;
  type: PresenceType;
  intensity: PresenceIntensity;
  realness: PresenceRealness;
  description: string;
  here: number;
  immediacy: number;
  chapter: number;
}

export interface PresenceField {
  fieldId: string,
  presenceIds: string[],
  cumulativeHere: number,
  density: number,
}

export interface NarrativePresenceEngineState {
  presences: Map<string, Presence>;
  fields: Map<string, PresenceField>;
  totalPresences: number;
  totalFields: number;
  averageHere: number;
  averageImmediacy: number;
  fieldDensity: number;
  presenceMastery: number;
}

// Factory
export function createNarrativePresenceEngineState(): NarrativePresenceEngineState {
  return {
    presences: new Map(),
    fields: new Map(),
    totalPresences: 0,
    totalFields: 0,
    averageHere: 0.5,
    averageImmediacy: 0.5,
    fieldDensity: 0.5,
    presenceMastery: 0.5,
  };
}

// Add presence
export function addPresence(
  state: NarrativePresenceEngineState,
  presenceId: string,
  type: PresenceType,
  intensity: PresenceIntensity,
  realness: PresenceRealness,
  description: string,
  here: number,
  immediacy: number,
  chapter: number
): NarrativePresenceEngineState {
  const presence: Presence = { presenceId, type, intensity, realness, description, here, immediacy, chapter };
  const presences = new Map(state.presences).set(presenceId, presence);
  return recomputePresence({ ...state, presences, totalPresences: presences.size });
}

// Add field
export function addPresenceField(
  state: NarrativePresenceEngineState,
  fieldId: string,
  presenceIds: string[]
): NarrativePresenceEngineState {
  const presences = presenceIds.map(id => state.presences.get(id)).filter((p): p is Presence => p !== undefined);
  const cumulativeHere = presences.length === 0 ? 0
    : presences.reduce((s, p) => s + p.here, 0) / presences.length;
  const typeSet = new Set(presences.map(p => p.type));
  const density = Math.min(1, typeSet.size / 6);
  const field: PresenceField = { fieldId, presenceIds, cumulativeHere, density };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputePresence({ ...state, fields, totalFields: fields.size });
}

// Get presences by type
export function getPresencesByType(state: NarrativePresenceEngineState, type: PresenceType): Presence[] {
  return Array.from(state.presences.values()).filter(p => p.type === type);
}

// Get presence report
export function getPresenceReport(state: NarrativePresenceEngineState): {
  totalPresences: number;
  totalFields: number;
  averageHere: number;
  averageImmediacy: number;
  presenceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPresences === 0) recommendations.push('No presences — add presences');
  if (state.averageHere < 0.5) recommendations.push('Low here — strengthen');
  if (state.presenceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPresences: state.totalPresences,
    totalFields: state.totalFields,
    averageHere: Math.round(state.averageHere * 100) / 100,
    averageImmediacy: Math.round(state.averageImmediacy * 100) / 100,
    presenceMastery: Math.round(state.presenceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePresence(state: NarrativePresenceEngineState): NarrativePresenceEngineState {
  const presences = Array.from(state.presences.values());
  const averageHere = presences.length === 0 ? 0.5
    : presences.reduce((s, p) => s + p.here, 0) / presences.length;
  const averageImmediacy = presences.length === 0 ? 0.5
    : presences.reduce((s, p) => s + p.immediacy, 0) / presences.length;

  const fields = Array.from(state.fields.values());
  const fieldDensity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.density, 0) / fields.length;

  const presenceMastery = (averageHere * 0.4 + averageImmediacy * 0.3 + fieldDensity * 0.3);

  return { ...state, averageHere, averageImmediacy, fieldDensity, presenceMastery };
}

// Reset
export function resetNarrativePresenceEngineState(): NarrativePresenceEngineState {
  return createNarrativePresenceEngineState();
}