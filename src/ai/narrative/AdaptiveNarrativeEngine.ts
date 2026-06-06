/**
 * V910 AdaptiveNarrativeEngine — Direction D Iter 3/15 (Round 4)
 * Adaptive narrative engine: narrative adaptation + dynamic story
 * Sources: generic-agent adaptive + thunderbolt + nanobot
 */

export type NarrativeContext = 'reader_mood' | 'genre' | 'audience' | 'platform' | 'length' | 'purpose';
export type AdaptationAction = 'intensify' | 'soften' | 'redirect' | 'expand' | 'condense' | 'maintain';
export type AdaptationMode = 'passive' | 'reactive' | 'proactive' | 'predictive' | 'autonomous';

export interface NarrativeAdaptation {
  adaptationId: string;
  context: NarrativeContext;
  action: AdaptationAction;
  mode: AdaptationMode;
  description: string;
  effectiveness: number;
  chapter: number;
}

export interface NarrativeFeedback {
  feedbackId: string,
  adaptationId: string,
  signal: 'positive' | 'negative' | 'neutral' | 'ambivalent',
  magnitude: number,
  note: string,
  chapter: number,
}

export interface AdaptiveNarrativeEngineState {
  adaptations: Map<string, NarrativeAdaptation>;
  feedback: Map<string, NarrativeFeedback>;
  totalAdaptations: number;
  totalFeedback: number;
  positiveFeedback: number;
  effectiveness: number;
  adaptationIntelligence: number;
  narrativeAgility: number;
  adaptiveMastery: number;
}

// Factory
export function createAdaptiveNarrativeEngineState(): AdaptiveNarrativeEngineState {
  return {
    adaptations: new Map(),
    feedback: new Map(),
    totalAdaptations: 0,
    totalFeedback: 0,
    positiveFeedback: 0,
    effectiveness: 0.5,
    adaptationIntelligence: 0.5,
    narrativeAgility: 0.5,
    adaptiveMastery: 0.5,
  };
}

// Add adaptation
export function addNarrativeAdaptation(
  state: AdaptiveNarrativeEngineState,
  adaptationId: string,
  context: NarrativeContext,
  action: AdaptationAction,
  mode: AdaptationMode,
  description: string,
  chapter: number,
  effectiveness: number = 0.5
): AdaptiveNarrativeEngineState {
  const adaptation: NarrativeAdaptation = { adaptationId, context, action, mode, description, effectiveness, chapter };
  const adaptations = new Map(state.adaptations).set(adaptationId, adaptation);
  return recomputeAdaptNarr({ ...state, adaptations, totalAdaptations: adaptations.size });
}

// Add feedback
export function addNarrativeFeedback(
  state: AdaptiveNarrativeEngineState,
  feedbackId: string,
  adaptationId: string,
  signal: NarrativeFeedback['signal'],
  magnitude: number,
  note: string,
  chapter: number
): AdaptiveNarrativeEngineState {
  const fb: NarrativeFeedback = { feedbackId, adaptationId, signal, magnitude, note, chapter };
  const feedback = new Map(state.feedback).set(feedbackId, fb);
  const positiveFeedback = signal === 'positive' ? state.positiveFeedback + 1 : state.positiveFeedback;
  return recomputeAdaptNarr({ ...state, feedback, positiveFeedback, totalFeedback: feedback.size });
}

// Get adaptations by context
export function getAdaptationsByContext(state: AdaptiveNarrativeEngineState, context: NarrativeContext): NarrativeAdaptation[] {
  return Array.from(state.adaptations.values()).filter(a => a.context === context);
}

// Get adaptive narrative report
export function getAdaptiveNarrativeReport(state: AdaptiveNarrativeEngineState): {
  totalAdaptations: number;
  totalFeedback: number;
  positiveFeedback: number;
  effectiveness: number;
  adaptationIntelligence: number;
  adaptiveMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAdaptations === 0) recommendations.push('No adaptations — add adaptations');
  if (state.effectiveness < 0.5) recommendations.push('Low effectiveness — improve');
  if (state.adaptiveMastery < 0.5) recommendations.push('Low mastery — refine');

  return {
    totalAdaptations: state.totalAdaptations,
    totalFeedback: state.totalFeedback,
    positiveFeedback: state.positiveFeedback,
    effectiveness: Math.round(state.effectiveness * 100) / 100,
    adaptationIntelligence: Math.round(state.adaptationIntelligence * 100) / 100,
    adaptiveMastery: Math.round(state.adaptiveMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptNarr(state: AdaptiveNarrativeEngineState): AdaptiveNarrativeEngineState {
  const adaptations = Array.from(state.adaptations.values());
  const effectiveness = adaptations.length === 0 ? 0.5
    : adaptations.reduce((s, a) => s + a.effectiveness, 0) / adaptations.length;

  const feedback = Array.from(state.feedback.values());
  const positiveRate = feedback.length === 0 ? 0.5
    : state.positiveFeedback / feedback.length;

  const modeMap: Record<AdaptationMode, number> = { passive: 0.2, reactive: 0.4, proactive: 0.6, predictive: 0.8, autonomous: 1.0 };
  const avgMode = adaptations.length === 0 ? 0.5
    : adaptations.reduce((s, a) => s + modeMap[a.mode], 0) / adaptations.length;
  const adaptationIntelligence = avgMode;

  const narrativeAgility = Math.min(1, (feedback.length / Math.max(1, adaptations.length)) * 0.5 + positiveRate * 0.5);

  const adaptiveMastery = (effectiveness * 0.4 + positiveRate * 0.3 + adaptationIntelligence * 0.3);

  return { ...state, effectiveness, adaptationIntelligence, narrativeAgility, adaptiveMastery };
}

// Reset adaptive narrative state
export function resetAdaptiveNarrativeEngineState(): AdaptiveNarrativeEngineState {
  return createAdaptiveNarrativeEngineState();
}