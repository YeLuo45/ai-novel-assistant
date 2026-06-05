/**
 * V824 NarrativeAdaptationCore — Direction E Iter 8/9 (Round 3)
 * Narrative adaptation core: adaptive narrative + dynamic adjustment
 * Sources: generic-agent adaptive + thunderbolt + nanobot
 */

export type AdaptationTrigger = 'feedback' | 'metric' | 'time' | 'context' | 'event' | 'auto';
export type AdaptationType = 'restructure' | 'rewrite' | 'expand' | 'contract' | 'redirect' | 'maintain';
export type AdaptationStatus = 'detected' | 'planned' | 'applying' | 'verified' | 'reverted';

export interface Adaptation {
  adaptationId: string;
  trigger: AdaptationTrigger;
  type: AdaptationType;
  status: AdaptationStatus;
  target: string;
  description: string;
  before: string;
  after: string;
  impact: number;
  timestamp: number;
}

export interface AdaptationContext {
  contextId: string;
  conditions: string[];
  recommendedType: AdaptationType;
  active: boolean;
  matchedConditions: string[];
}

export interface NarrativeAdaptationCoreState {
  adaptations: Map<string, Adaptation>;
  contexts: Map<string, AdaptationContext>;
  totalAdaptations: number;
  totalContexts: number;
  verifiedAdaptations: number;
  averageImpact: number;
  adaptationRate: number;
  adaptationSuccess: number;
  responsiveness: number;
}

// Factory
export function createNarrativeAdaptationCoreState(): NarrativeAdaptationCoreState {
  return {
    adaptations: new Map(),
    contexts: new Map(),
    totalAdaptations: 0,
    totalContexts: 0,
    verifiedAdaptations: 0,
    averageImpact: 0.5,
    adaptationRate: 0,
    adaptationSuccess: 0.5,
    responsiveness: 0.5,
  };
}

// Detect adaptation
export function detectAdaptation(
  state: NarrativeAdaptationCoreState,
  adaptationId: string,
  trigger: AdaptationTrigger,
  target: string,
  description: string,
  impact: number = 0.5
): NarrativeAdaptationCoreState {
  const adaptation: Adaptation = {
    adaptationId, trigger, type: 'maintain', status: 'detected',
    target, description, before: '', after: '',
    impact: Math.min(1, Math.max(0, impact)),
    timestamp: Date.now(),
  };
  const adaptations = new Map(state.adaptations).set(adaptationId, adaptation);
  return recomputeAdaptation({ ...state, adaptations, totalAdaptations: adaptations.size });
}

// Apply adaptation
export function applyAdaptation(
  state: NarrativeAdaptationCoreState,
  adaptationId: string,
  type: AdaptationType,
  before: string,
  after: string
): NarrativeAdaptationCoreState {
  const adaptation = state.adaptations.get(adaptationId);
  if (!adaptation) return state;

  const updated: Adaptation = { ...adaptation, type, status: 'applying', before, after };
  const adaptations = new Map(state.adaptations).set(adaptationId, updated);
  return recomputeAdaptation({ ...state, adaptations });
}

// Verify adaptation
export function verifyAdaptation(state: NarrativeAdaptationCoreState, adaptationId: string, success: boolean): NarrativeAdaptationCoreState {
  const adaptation = state.adaptations.get(adaptationId);
  if (!adaptation) return state;

  const updated: Adaptation = { ...adaptation, status: success ? 'verified' : 'reverted' };
  const adaptations = new Map(state.adaptations).set(adaptationId, updated);
  const verifiedAdaptations = success ? state.verifiedAdaptations + 1 : state.verifiedAdaptations;
  return recomputeAdaptation({ ...state, adaptations, verifiedAdaptations });
}

// Add context
export function addAdaptationContext(
  state: NarrativeAdaptationCoreState,
  contextId: string,
  conditions: string[],
  recommendedType: AdaptationType
): NarrativeAdaptationCoreState {
  const context: AdaptationContext = { contextId, conditions, recommendedType, active: true, matchedConditions: [] };
  const contexts = new Map(state.contexts).set(contextId, context);
  return recomputeAdaptation({ ...state, contexts, totalContexts: contexts.size });
}

// Get adaptations by type
export function getAdaptationsByType(state: NarrativeAdaptationCoreState, type: AdaptationType): Adaptation[] {
  return Array.from(state.adaptations.values()).filter(a => a.type === type);
}

// Get adaptation report
export function getAdaptationCoreReport(state: NarrativeAdaptationCoreState): {
  totalAdaptations: number;
  totalContexts: number;
  verifiedAdaptations: number;
  averageImpact: number;
  adaptationSuccess: number;
  responsiveness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAdaptations === 0) recommendations.push('No adaptations — detect issues');
  if (state.adaptationSuccess < 0.5) recommendations.push('Low success — review adaptations');
  if (state.responsiveness < 0.4) recommendations.push('Low responsiveness — speed up');

  return {
    totalAdaptations: state.totalAdaptations,
    totalContexts: state.totalContexts,
    verifiedAdaptations: state.verifiedAdaptations,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    adaptationSuccess: Math.round(state.adaptationSuccess * 100) / 100,
    responsiveness: Math.round(state.responsiveness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptation(state: NarrativeAdaptationCoreState): NarrativeAdaptationCoreState {
  const adaptations = Array.from(state.adaptations.values());
  const averageImpact = adaptations.length === 0 ? 0.5
    : adaptations.reduce((s, a) => s + a.impact, 0) / adaptations.length;

  const verified = adaptations.filter(a => a.status === 'verified');
  const adaptationSuccess = adaptations.length === 0 ? 0.5
    : verified.length / adaptations.length;

  const adaptationRate = state.totalAdaptations === 0 ? 0
    : Math.min(1, state.totalAdaptations / 20);

  // Responsiveness: how quickly adaptations are verified
  const responsiveness = adaptations.length === 0 ? 0.5
    : Math.min(1, state.verifiedAdaptations / adaptations.length);

  return { ...state, averageImpact, adaptationRate, adaptationSuccess, responsiveness };
}

// Reset adaptation state
export function resetNarrativeAdaptationCoreState(): NarrativeAdaptationCoreState {
  return createNarrativeAdaptationCoreState();
}