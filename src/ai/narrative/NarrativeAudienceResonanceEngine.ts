/**
 * V1252 NarrativeAudienceResonanceEngine — Direction H Iter 14/20 (Round 5)
 * Audience resonance engine: resonance with audience
 * Sources: ruflo resonance + nanobot + thunderbolt
 */

export type AudienceResonanceType = 'thematic' | 'emotional' | 'philosophical' | 'personal' | 'universal' | 'spiritual';
export type AudienceResonanceHarmonic = 'dissonant' | 'unstable' | 'consonant' | 'harmonic' | 'perfect';
export type AudienceResonanceVibration = 'subsonic' | 'low' | 'mid' | 'high' | 'ultrasonic';

export interface AudienceResonance {
  resonanceId: string;
  type: AudienceResonanceType;
  harmonic: AudienceResonanceHarmonic;
  vibration: AudienceResonanceVibration;
  description: string;
  amplitude: number;
  frequency: number;
  chapter: number;
}

export interface AudienceResonanceField {
  fieldId: string,
  resonanceIds: string[],
  cumulativeAmplitude: number,
  harmony: number,
}

export interface NarrativeAudienceResonanceEngineState {
  resonances: Map<string, AudienceResonance>;
  fields: Map<string, AudienceResonanceField>;
  totalResonances: number;
  totalFields: number;
  averageAmplitude: number;
  averageFrequency: number;
  fieldHarmony: number;
  audienceResonanceMastery: number;
}

// Factory
export function createNarrativeAudienceResonanceEngineState(): NarrativeAudienceResonanceEngineState {
  return {
    resonances: new Map(),
    fields: new Map(),
    totalResonances: 0,
    totalFields: 0,
    averageAmplitude: 0.5,
    averageFrequency: 0.5,
    fieldHarmony: 0.5,
    audienceResonanceMastery: 0.5,
  };
}

// Add resonance
export function addAudienceResonance(
  state: NarrativeAudienceResonanceEngineState,
  resonanceId: string,
  type: AudienceResonanceType,
  harmonic: AudienceResonanceHarmonic,
  vibration: AudienceResonanceVibration,
  description: string,
  amplitude: number,
  frequency: number,
  chapter: number
): NarrativeAudienceResonanceEngineState {
  const resonance: AudienceResonance = { resonanceId, type, harmonic, vibration, description, amplitude, frequency, chapter };
  const resonances = new Map(state.resonances).set(resonanceId, resonance);
  return recomputeAudienceResonance({ ...state, resonances, totalResonances: resonances.size });
}

// Add field
export function addAudienceResonanceField(
  state: NarrativeAudienceResonanceEngineState,
  fieldId: string,
  resonanceIds: string[]
): NarrativeAudienceResonanceEngineState {
  const resonances = resonanceIds.map(id => state.resonances.get(id)).filter((r): r is AudienceResonance => r !== undefined);
  const cumulativeAmplitude = resonances.length === 0 ? 0
    : resonances.reduce((s, r) => s + r.amplitude, 0) / resonances.length;
  const typeSet = new Set(resonances.map(r => r.type));
  const harmony = Math.min(1, typeSet.size / 6);
  const field: AudienceResonanceField = { fieldId, resonanceIds, cumulativeAmplitude, harmony };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeAudienceResonance({ ...state, fields, totalFields: fields.size });
}

// Get resonances by type
export function getAudienceResonancesByType(state: NarrativeAudienceResonanceEngineState, type: AudienceResonanceType): AudienceResonance[] {
  return Array.from(state.resonances.values()).filter(r => r.type === type);
}

// Get audience resonance report
export function getAudienceResonanceReport(state: NarrativeAudienceResonanceEngineState): {
  totalResonances: number;
  totalFields: number;
  averageAmplitude: number;
  averageFrequency: number;
  audienceResonanceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalResonances === 0) recommendations.push('No resonances — add audience resonances');
  if (state.averageAmplitude < 0.5) recommendations.push('Low amplitude — strengthen');
  if (state.audienceResonanceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalResonances: state.totalResonances,
    totalFields: state.totalFields,
    averageAmplitude: Math.round(state.averageAmplitude * 100) / 100,
    averageFrequency: Math.round(state.averageFrequency * 100) / 100,
    audienceResonanceMastery: Math.round(state.audienceResonanceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceResonance(state: NarrativeAudienceResonanceEngineState): NarrativeAudienceResonanceEngineState {
  const resonances = Array.from(state.resonances.values());
  const averageAmplitude = resonances.length === 0 ? 0.5
    : resonances.reduce((s, r) => s + r.amplitude, 0) / resonances.length;
  const averageFrequency = resonances.length === 0 ? 0.5
    : resonances.reduce((s, r) => s + r.frequency, 0) / resonances.length;

  const fields = Array.from(state.fields.values());
  const fieldHarmony = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.harmony, 0) / fields.length;

  const audienceResonanceMastery = (averageAmplitude * 0.4 + averageFrequency * 0.3 + fieldHarmony * 0.3);

  return { ...state, averageAmplitude, averageFrequency, fieldHarmony, audienceResonanceMastery };
}

// Reset
export function resetNarrativeAudienceResonanceEngineState(): NarrativeAudienceResonanceEngineState {
  return createNarrativeAudienceResonanceEngineState();
}