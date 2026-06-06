/**
 * V1236 NarrativeAudienceResponseEngine — Direction H Iter 6/20 (Round 5)
 * Audience response engine: response of audience
 * Sources: ruflo response + nanobot + thunderbolt
 */

export type AudienceResponseType = 'reactive' | 'reflective' | 'transformative' | 'participatory' | 'creative' | 'collective';
export type AudienceResponseIntensity = 'subtle' | 'moderate' | 'strong' | 'intense' | 'overwhelming';
export type AudienceResponseManifestation = 'internal' | 'behavioral' | 'verbal' | 'written' | 'artistic' | 'social';

export interface AudienceResponse {
  responseId: string;
  type: AudienceResponseType;
  intensity: AudienceResponseIntensity;
  manifestation: AudienceResponseManifestation;
  description: string;
  immediacy: number;
  power: number;
  chapter: number;
}

export interface AudienceResponseWave {
  waveId: string,
  responseIds: string[],
  cumulativeImmediacy: number,
  depth: number,
}

export interface NarrativeAudienceResponseEngineState {
  responses: Map<string, AudienceResponse>;
  waves: Map<string, AudienceResponseWave>;
  totalResponses: number;
  totalWaves: number;
  averageImmediacy: number;
  averagePower: number;
  waveDepth: number;
  audienceResponseMastery: number;
}

// Factory
export function createNarrativeAudienceResponseEngineState(): NarrativeAudienceResponseEngineState {
  return {
    responses: new Map(),
    waves: new Map(),
    totalResponses: 0,
    totalWaves: 0,
    averageImmediacy: 0.5,
    averagePower: 0.5,
    waveDepth: 0.5,
    audienceResponseMastery: 0.5,
  };
}

// Add response
export function addAudienceResponse(
  state: NarrativeAudienceResponseEngineState,
  responseId: string,
  type: AudienceResponseType,
  intensity: AudienceResponseIntensity,
  manifestation: AudienceResponseManifestation,
  description: string,
  immediacy: number,
  power: number,
  chapter: number
): NarrativeAudienceResponseEngineState {
  const response: AudienceResponse = { responseId, type, intensity, manifestation, description, immediacy, power, chapter };
  const responses = new Map(state.responses).set(responseId, response);
  return recomputeAudienceResponse({ ...state, responses, totalResponses: responses.size });
}

// Add wave
export function addAudienceResponseWave(
  state: NarrativeAudienceResponseEngineState,
  waveId: string,
  responseIds: string[]
): NarrativeAudienceResponseEngineState {
  const responses = responseIds.map(id => state.responses.get(id)).filter((r): r is AudienceResponse => r !== undefined);
  const cumulativeImmediacy = responses.length === 0 ? 0
    : responses.reduce((s, r) => s + r.immediacy, 0) / responses.length;
  const typeSet = new Set(responses.map(r => r.type));
  const depth = Math.min(1, typeSet.size / 6);
  const wave: AudienceResponseWave = { waveId, responseIds, cumulativeImmediacy, depth };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeAudienceResponse({ ...state, waves, totalWaves: waves.size });
}

// Get responses by type
export function getAudienceResponsesByType(state: NarrativeAudienceResponseEngineState, type: AudienceResponseType): AudienceResponse[] {
  return Array.from(state.responses.values()).filter(r => r.type === type);
}

// Get audience response report
export function getAudienceResponseReport(state: NarrativeAudienceResponseEngineState): {
  totalResponses: number;
  totalWaves: number;
  averageImmediacy: number;
  averagePower: number;
  audienceResponseMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalResponses === 0) recommendations.push('No responses — add audience responses');
  if (state.averageImmediacy < 0.5) recommendations.push('Low immediacy — strengthen');
  if (state.audienceResponseMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalResponses: state.totalResponses,
    totalWaves: state.totalWaves,
    averageImmediacy: Math.round(state.averageImmediacy * 100) / 100,
    averagePower: Math.round(state.averagePower * 100) / 100,
    audienceResponseMastery: Math.round(state.audienceResponseMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceResponse(state: NarrativeAudienceResponseEngineState): NarrativeAudienceResponseEngineState {
  const responses = Array.from(state.responses.values());
  const averageImmediacy = responses.length === 0 ? 0.5
    : responses.reduce((s, r) => s + r.immediacy, 0) / responses.length;
  const averagePower = responses.length === 0 ? 0.5
    : responses.reduce((s, r) => s + r.power, 0) / responses.length;

  const waves = Array.from(state.waves.values());
  const waveDepth = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.depth, 0) / waves.length;

  const audienceResponseMastery = (averageImmediacy * 0.4 + averagePower * 0.3 + waveDepth * 0.3);

  return { ...state, averageImmediacy, averagePower, waveDepth, audienceResponseMastery };
}

// Reset
export function resetNarrativeAudienceResponseEngineState(): NarrativeAudienceResponseEngineState {
  return createNarrativeAudienceResponseEngineState();
}