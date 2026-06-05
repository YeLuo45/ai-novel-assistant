/**
 * V840 ContextualReasoningEngine — Direction A Iter 7/9 (Round 4)
 * Contextual reasoning engine: context-aware reasoning + decision making
 * Sources: chatdev context + nanobot reasoning + thunderbolt
 */

export type ContextType = 'situational' | 'historical' | 'cultural' | 'emotional' | 'narrative';
export type ReasoningType = 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'causal';
export type DecisionConfidence = 'low' | 'medium' | 'high' | 'very_high';

export interface ContextFrame {
  contextId: string;
  type: ContextType;
  description: string;
  relevance: number;
  data: string[];
  active: boolean;
}

export interface ReasoningStep {
  stepId: string;
  type: ReasoningType;
  contextId: string;
  premise: string;
  conclusion: string;
  confidence: DecisionConfidence;
  valid: boolean;
}

export interface ContextualReasoningEngineState {
  contexts: Map<string, ContextFrame>;
  steps: Map<string, ReasoningStep>;
  totalContexts: number;
  activeContexts: number;
  totalSteps: number;
  validSteps: number;
  averageConfidence: number;
  reasoningDepth: number;
  contextUtilization: number;
  decisionQuality: number;
}

// Factory
export function createContextualReasoningEngineState(): ContextualReasoningEngineState {
  return {
    contexts: new Map(),
    steps: new Map(),
    totalContexts: 0,
    activeContexts: 0,
    totalSteps: 0,
    validSteps: 0,
    averageConfidence: 0.5,
    reasoningDepth: 0,
    contextUtilization: 0,
    decisionQuality: 0.5,
  };
}

// Add context
export function addContext(
  state: ContextualReasoningEngineState,
  contextId: string,
  type: ContextType,
  description: string,
  relevance: number = 0.5,
  data: string[] = []
): ContextualReasoningEngineState {
  const context: ContextFrame = {
    contextId, type, description,
    relevance: Math.min(1, Math.max(0, relevance)),
    data, active: true,
  };
  const contexts = new Map(state.contexts).set(contextId, context);
  const activeContexts = state.activeContexts + 1;
  return recomputeContextReasoning({ ...state, contexts, activeContexts, totalContexts: contexts.size });
}

// Deactivate context
export function deactivateContext(state: ContextualReasoningEngineState, contextId: string): ContextualReasoningEngineState {
  const context = state.contexts.get(contextId);
  if (!context) return state;

  const updated: ContextFrame = { ...context, active: false };
  const contexts = new Map(state.contexts).set(contextId, updated);
  const activeContexts = context.active ? Math.max(0, state.activeContexts - 1) : state.activeContexts;
  return recomputeContextReasoning({ ...state, contexts, activeContexts });
}

// Add reasoning step
export function addReasoningStep(
  state: ContextualReasoningEngineState,
  stepId: string,
  type: ReasoningType,
  contextId: string,
  premise: string,
  conclusion: string,
  confidence: DecisionConfidence = 'medium'
): ContextualReasoningEngineState {
  const confidenceMap: Record<DecisionConfidence, number> = { low: 0.3, medium: 0.5, high: 0.8, very_high: 0.95 };
  const valid = confidenceMap[confidence] >= 0.5;
  const step: ReasoningStep = { stepId, type, contextId, premise, conclusion, confidence, valid };
  const steps = new Map(state.steps).set(stepId, step);
  const validSteps = valid ? state.validSteps + 1 : state.validSteps;
  return recomputeContextReasoning({ ...state, steps, validSteps, totalSteps: steps.size });
}

// Get contexts by type
export function getContextsByType(state: ContextualReasoningEngineState, type: ContextType): ContextFrame[] {
  return Array.from(state.contexts.values()).filter(c => c.type === type);
}

// Get reasoning report
export function getContextualReasoningReport(state: ContextualReasoningEngineState): {
  totalContexts: number;
  totalSteps: number;
  validSteps: number;
  averageConfidence: number;
  reasoningDepth: number;
  decisionQuality: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalContexts === 0) recommendations.push('No contexts — add them');
  if (state.decisionQuality < 0.5) recommendations.push('Low quality — improve reasoning');
  if (state.contextUtilization < 0.3) recommendations.push('Low utilization — use contexts more');

  return {
    totalContexts: state.totalContexts,
    totalSteps: state.totalSteps,
    validSteps: state.validSteps,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    reasoningDepth: Math.round(state.reasoningDepth * 100) / 100,
    decisionQuality: Math.round(state.decisionQuality * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeContextReasoning(state: ContextualReasoningEngineState): ContextualReasoningEngineState {
  const steps = Array.from(state.steps.values());
  const confidenceMap: Record<DecisionConfidence, number> = { low: 0.3, medium: 0.5, high: 0.8, very_high: 0.95 };
  const averageConfidence = steps.length === 0 ? 0.5
    : steps.reduce((s, st) => s + confidenceMap[st.confidence], 0) / steps.length;

  const reasoningDepth = Math.min(1, state.totalSteps / 20);
  const contextUtilization = state.totalContexts === 0 ? 0
    : Math.min(1, state.totalSteps / Math.max(1, state.totalContexts * 3));
  const decisionQuality = averageConfidence * 0.6 + contextUtilization * 0.4;

  return { ...state, averageConfidence, reasoningDepth, contextUtilization, decisionQuality };
}

// Reset reasoning state
export function resetContextualReasoningEngineState(): ContextualReasoningEngineState {
  return createContextualReasoningEngineState();
}