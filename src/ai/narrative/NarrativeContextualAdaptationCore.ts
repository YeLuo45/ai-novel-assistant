/**
 * V992 NarrativeContextualAdaptationCore — Direction A Iter 14/15 (Round 5)
 * Contextual adaptation core: context-aware adaptation
 * Sources: nanobot context + thunderbolt + chatdev
 */

export type ContextKind = 'situational' | 'cultural' | 'emotional' | 'social' | 'temporal' | 'spatial';
export type AdaptationStrategy = 'conforming' | 'balancing' | 'innovating' | 'transforming' | 'preserving';
export type AdaptationResult = 'mismatch' | 'partial' | 'adequate' | 'good' | 'ideal';

export interface ContextDescriptor {
  contextId: string;
  kind: ContextKind;
  features: string[];
  requirements: string[];
  description: string;
  complexity: number;
}

export interface AdaptationAction {
  actionId: string;
  contextId: string;
  strategy: AdaptationStrategy;
  result: AdaptationResult;
  before: number;
  after: number;
  description: string;
  chapter: number;
}

export interface NarrativeContextualAdaptationCoreState {
  contexts: Map<string, ContextDescriptor>;
  actions: Map<string, AdaptationAction>;
  totalContexts: number;
  totalActions: number;
  averageImprovement: number;
  contextVersatility: number;
  adaptationFit: number;
  contextualAdaptationMastery: number;
}

// Factory
export function createNarrativeContextualAdaptationCoreState(): NarrativeContextualAdaptationCoreState {
  return {
    contexts: new Map(),
    actions: new Map(),
    totalContexts: 0,
    totalActions: 0,
    averageImprovement: 0,
    contextVersatility: 0,
    adaptationFit: 0.5,
    contextualAdaptationMastery: 0.5,
  };
}

// Add context
export function addContextDescriptor(
  state: NarrativeContextualAdaptationCoreState,
  contextId: string,
  kind: ContextKind,
  features: string[],
  requirements: string[],
  description: string,
  complexity: number
): NarrativeContextualAdaptationCoreState {
  const context: ContextDescriptor = { contextId, kind, features, requirements, description, complexity };
  const contexts = new Map(state.contexts).set(contextId, context);
  return recomputeContextualAdapt({ ...state, contexts, totalContexts: contexts.size });
}

// Add action
export function addAdaptationAction(
  state: NarrativeContextualAdaptationCoreState,
  actionId: string,
  contextId: string,
  strategy: AdaptationStrategy,
  result: AdaptationResult,
  before: number,
  after: number,
  description: string,
  chapter: number
): NarrativeContextualAdaptationCoreState {
  const action: AdaptationAction = { actionId, contextId, strategy, result, before, after, description, chapter };
  const actions = new Map(state.actions).set(actionId, action);
  return recomputeContextualAdapt({ ...state, actions, totalActions: actions.size });
}

// Get actions by strategy
export function getActionsByStrategy(state: NarrativeContextualAdaptationCoreState, strategy: AdaptationStrategy): AdaptationAction[] {
  return Array.from(state.actions.values()).filter(a => a.strategy === strategy);
}

// Get contextual adaptation report
export function getContextualAdaptationReport(state: NarrativeContextualAdaptationCoreState): {
  totalContexts: number;
  totalActions: number;
  averageImprovement: number;
  contextVersatility: number;
  contextualAdaptationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalContexts === 0) recommendations.push('No contexts — add contexts');
  if (state.contextVersatility < 0.3) recommendations.push('Low versatility — diversify');
  if (state.contextualAdaptationMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalContexts: state.totalContexts,
    totalActions: state.totalActions,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    contextVersatility: Math.round(state.contextVersatility * 100) / 100,
    contextualAdaptationMastery: Math.round(state.contextualAdaptationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeContextualAdapt(state: NarrativeContextualAdaptationCoreState): NarrativeContextualAdaptationCoreState {
  const actions = Array.from(state.actions.values());
  const improvements = actions.map(a => a.after - a.before);
  const averageImprovement = actions.length === 0 ? 0
    : improvements.reduce((s, i) => s + i, 0) / actions.length;

  const contexts = Array.from(state.contexts.values());
  const kindSet = new Set(contexts.map(c => c.kind));
  const contextVersatility = Math.min(1, kindSet.size / 5);

  const resultMap: Record<AdaptationResult, number> = { mismatch: 0, partial: 0.3, adequate: 0.5, good: 0.7, ideal: 1.0 };
  const adaptationFit = actions.length === 0 ? 0.5
    : actions.reduce((s, a) => s + resultMap[a.result], 0) / actions.length;

  const contextualAdaptationMastery = (averageImprovement * 0.4 + contextVersatility * 0.3 + adaptationFit * 0.3);

  return { ...state, averageImprovement, contextVersatility, adaptationFit, contextualAdaptationMastery };
}

// Reset
export function resetNarrativeContextualAdaptationCoreState(): NarrativeContextualAdaptationCoreState {
  return createNarrativeContextualAdaptationCoreState();
}