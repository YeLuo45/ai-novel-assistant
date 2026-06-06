/**
 * V1240 NarrativeAudienceAnticipationEngine — Direction H Iter 8/20 (Round 5)
 * Audience anticipation engine: anticipation of audience
 * Sources: thunderbolt anticipation + nanobot + ruflo
 */

export type AudienceAnticipationType = 'plot' | 'character' | 'thematic' | 'emotional' | 'aesthetic' | 'conceptual';
export type AudienceAnticipationIntensity = 'mild' | 'moderate' | 'strong' | 'intense' | 'overwhelming';
export type AudienceAnticipationReward = 'denied' | 'subverted' | 'delayed' | 'satisfied' | 'exceeded';

export interface AudienceAnticipation {
  anticipationId: string;
  type: AudienceAnticipationType;
  intensity: AudienceAnticipationIntensity;
  reward: AudienceAnticipationReward;
  description: string;
  expectation: number;
  fulfillment: number;
  chapter: number;
}

export interface AudienceAnticipationWave {
  waveId: string,
  anticipationIds: string[],
  cumulativeExpectation: number,
  intensity: number,
}

export interface NarrativeAudienceAnticipationEngineState {
  anticipations: Map<string, AudienceAnticipation>;
  waves: Map<string, AudienceAnticipationWave>;
  totalAnticipations: number;
  totalWaves: number;
  averageExpectation: number;
  averageFulfillment: number;
  waveIntensity: number;
  audienceAnticipationMastery: number;
}

// Factory
export function createNarrativeAudienceAnticipationEngineState(): NarrativeAudienceAnticipationEngineState {
  return {
    anticipations: new Map(),
    waves: new Map(),
    totalAnticipations: 0,
    totalWaves: 0,
    averageExpectation: 0.5,
    averageFulfillment: 0.5,
    waveIntensity: 0.5,
    audienceAnticipationMastery: 0.5,
  };
}

// Add anticipation
export function addAudienceAnticipation(
  state: NarrativeAudienceAnticipationEngineState,
  anticipationId: string,
  type: AudienceAnticipationType,
  intensity: AudienceAnticipationIntensity,
  reward: AudienceAnticipationReward,
  description: string,
  expectation: number,
  fulfillment: number,
  chapter: number
): NarrativeAudienceAnticipationEngineState {
  const anticipation: AudienceAnticipation = { anticipationId, type, intensity, reward, description, expectation, fulfillment, chapter };
  const anticipations = new Map(state.anticipations).set(anticipationId, anticipation);
  return recomputeAudienceAnticipation({ ...state, anticipations, totalAnticipations: anticipations.size });
}

// Add wave
export function addAudienceAnticipationWave(
  state: NarrativeAudienceAnticipationEngineState,
  waveId: string,
  anticipationIds: string[]
): NarrativeAudienceAnticipationEngineState {
  const anticipations = anticipationIds.map(id => state.anticipations.get(id)).filter((a): a is AudienceAnticipation => a !== undefined);
  const cumulativeExpectation = anticipations.length === 0 ? 0
    : anticipations.reduce((s, a) => s + a.expectation, 0) / anticipations.length;
  const typeSet = new Set(anticipations.map(a => a.type));
  const intensity = Math.min(1, typeSet.size / 6);
  const wave: AudienceAnticipationWave = { waveId, anticipationIds, cumulativeExpectation, intensity };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeAudienceAnticipation({ ...state, waves, totalWaves: waves.size });
}

// Get anticipations by type
export function getAudienceAnticipationsByType(state: NarrativeAudienceAnticipationEngineState, type: AudienceAnticipationType): AudienceAnticipation[] {
  return Array.from(state.anticipations.values()).filter(a => a.type === type);
}

// Get audience anticipation report
export function getAudienceAnticipationReport(state: NarrativeAudienceAnticipationEngineState): {
  totalAnticipations: number;
  totalWaves: number;
  averageExpectation: number;
  averageFulfillment: number;
  audienceAnticipationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAnticipations === 0) recommendations.push('No anticipations — add audience anticipations');
  if (state.averageExpectation < 0.5) recommendations.push('Low expectation — strengthen');
  if (state.audienceAnticipationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAnticipations: state.totalAnticipations,
    totalWaves: state.totalWaves,
    averageExpectation: Math.round(state.averageExpectation * 100) / 100,
    averageFulfillment: Math.round(state.averageFulfillment * 100) / 100,
    audienceAnticipationMastery: Math.round(state.audienceAnticipationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceAnticipation(state: NarrativeAudienceAnticipationEngineState): NarrativeAudienceAnticipationEngineState {
  const anticipations = Array.from(state.anticipations.values());
  const averageExpectation = anticipations.length === 0 ? 0.5
    : anticipations.reduce((s, a) => s + a.expectation, 0) / anticipations.length;
  const averageFulfillment = anticipations.length === 0 ? 0.5
    : anticipations.reduce((s, a) => s + a.fulfillment, 0) / anticipations.length;

  const waves = Array.from(state.waves.values());
  const waveIntensity = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.intensity, 0) / waves.length;

  const audienceAnticipationMastery = (averageExpectation * 0.4 + averageFulfillment * 0.3 + waveIntensity * 0.3);

  return { ...state, averageExpectation, averageFulfillment, waveIntensity, audienceAnticipationMastery };
}

// Reset
export function resetNarrativeAudienceAnticipationEngineState(): NarrativeAudienceAnticipationEngineState {
  return createNarrativeAudienceAnticipationEngineState();
}