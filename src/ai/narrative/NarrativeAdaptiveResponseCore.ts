/**
 * V986 NarrativeAdaptiveResponseCore — Direction A Iter 11/15 (Round 5)
 * Adaptive response core: adaptive response to stimuli
 * Sources: thunderbolt response + nanobot + generic-agent
 */

export type StimulusType = 'reader' | 'critic' | 'editor' | 'market' | 'self' | 'situation';
export type ResponseMode = 'reflect' | 'react' | 'proact' | 'anticipate' | 'transform';
export type ResponseQuality = 'poor' | 'adequate' | 'good' | 'excellent' | 'exceptional';

export interface Stimulus {
  stimulusId: string;
  type: StimulusType;
  intensity: number;
  content: string;
  timestamp: number;
}

export interface Response {
  responseId: string;
  stimulusId: string;
  mode: ResponseMode;
  quality: ResponseQuality;
  action: string;
  effectiveness: number;
  latency: number;
  chapter: number;
}

export interface ResponsePattern {
  patternId: string,
  name: string,
  stimulusType: StimulusType,
  responseIds: string[],
  successRate: number,
}

export interface NarrativeAdaptiveResponseCoreState {
  stimuli: Map<string, Stimulus>;
  responses: Map<string, Response>;
  patterns: Map<string, ResponsePattern>;
  totalStimuli: number;
  totalResponses: number;
  totalPatterns: number;
  averageEffectiveness: number;
  responseLatency: number;
  adaptiveResponseMastery: number;
}

// Factory
export function createNarrativeAdaptiveResponseCoreState(): NarrativeAdaptiveResponseCoreState {
  return {
    stimuli: new Map(),
    responses: new Map(),
    patterns: new Map(),
    totalStimuli: 0,
    totalResponses: 0,
    totalPatterns: 0,
    averageEffectiveness: 0.5,
    responseLatency: 0.5,
    adaptiveResponseMastery: 0.5,
  };
}

// Add stimulus
export function addStimulus(
  state: NarrativeAdaptiveResponseCoreState,
  stimulusId: string,
  type: StimulusType,
  intensity: number,
  content: string,
  timestamp: number
): NarrativeAdaptiveResponseCoreState {
  const stimulus: Stimulus = { stimulusId, type, intensity, content, timestamp };
  const stimuli = new Map(state.stimuli).set(stimulusId, stimulus);
  return recomputeAdaptiveResponse({ ...state, stimuli, totalStimuli: stimuli.size });
}

// Add response
export function addResponse(
  state: NarrativeAdaptiveResponseCoreState,
  responseId: string,
  stimulusId: string,
  mode: ResponseMode,
  quality: ResponseQuality,
  action: string,
  effectiveness: number,
  latency: number,
  chapter: number
): NarrativeAdaptiveResponseCoreState {
  const response: Response = { responseId, stimulusId, mode, quality, action, effectiveness, latency, chapter };
  const responses = new Map(state.responses).set(responseId, response);
  return recomputeAdaptiveResponse({ ...state, responses, totalResponses: responses.size });
}

// Add pattern
export function addResponsePattern(
  state: NarrativeAdaptiveResponseCoreState,
  patternId: string,
  name: string,
  stimulusType: StimulusType,
  responseIds: string[]
): NarrativeAdaptiveResponseCoreState {
  const responses = responseIds.map(id => state.responses.get(id)).filter((r): r is Response => r !== undefined);
  const successCount = responses.filter(r => r.quality === 'excellent' || r.quality === 'exceptional').length;
  const successRate = responses.length === 0 ? 0.5 : successCount / responses.length;
  const pattern: ResponsePattern = { patternId, name, stimulusType, responseIds, successRate };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeAdaptiveResponse({ ...state, patterns, totalPatterns: patterns.size });
}

// Get responses by mode
export function getResponsesByMode(state: NarrativeAdaptiveResponseCoreState, mode: ResponseMode): Response[] {
  return Array.from(state.responses.values()).filter(r => r.mode === mode);
}

// Get response report
export function getAdaptiveResponseReport(state: NarrativeAdaptiveResponseCoreState): {
  totalStimuli: number;
  totalResponses: number;
  averageEffectiveness: number;
  responseLatency: number;
  adaptiveResponseMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalResponses === 0) recommendations.push('No responses — add responses');
  if (state.responseLatency > 0.7) recommendations.push('High latency — improve speed');
  if (state.adaptiveResponseMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalStimuli: state.totalStimuli,
    totalResponses: state.totalResponses,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    responseLatency: Math.round(state.responseLatency * 100) / 100,
    adaptiveResponseMastery: Math.round(state.adaptiveResponseMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptiveResponse(state: NarrativeAdaptiveResponseCoreState): NarrativeAdaptiveResponseCoreState {
  const responses = Array.from(state.responses.values());
  const averageEffectiveness = responses.length === 0 ? 0.5
    : responses.reduce((s, r) => s + r.effectiveness, 0) / responses.length;
  const responseLatency = responses.length === 0 ? 0.5
    : responses.reduce((s, r) => s + r.latency, 0) / responses.length;

  const patterns = Array.from(state.patterns.values());
  const patternSuccess = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.successRate, 0) / patterns.length;

  const adaptiveResponseMastery = (averageEffectiveness * 0.4 + (1 - responseLatency) * 0.3 + patternSuccess * 0.3);

  return { ...state, averageEffectiveness, responseLatency, adaptiveResponseMastery };
}

// Reset
export function resetNarrativeAdaptiveResponseCoreState(): NarrativeAdaptiveResponseCoreState {
  return createNarrativeAdaptiveResponseCoreState();
}