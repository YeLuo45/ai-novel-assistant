/**
 * V650 NarrativeReasoningEngine — Direction E Iter 2/9
 * Narrative reasoning engine: causal reasoning + consequence prediction
 * Sources: thunderbolt reasoning + chatdev logical + nanobot causal
 */

export type ReasoningType = 'deductive' | 'abductive' | 'inductive' | 'analogical';
export type ReasoningState = 'exploring' | 'evaluating' | 'converging' | 'concluded';

export interface ReasoningChain {
  chainId: string;
  type: ReasoningType;
  premises: string[];
  conclusions: string[];
  confidence: number;
  evidenceStrength: number;
}

export interface NarrativeReasoningState {
  activeChain: ReasoningChain | null;
  chainHistory: ReasoningChain[];
  reasoningType: ReasoningType;
  state: ReasoningState;
  depth: number;
  breadth: number;
}

export interface ReasoningResult {
  conclusion: string;
  confidence: number;
  reasoningType: ReasoningType;
  supportingEvidence: string[];
}

// Factory
export function createNarrativeReasoningState(): NarrativeReasoningState {
  return {
    activeChain: null,
    chainHistory: [],
    reasoningType: 'deductive',
    state: 'exploring',
    depth: 0,
    breadth: 0,
  };
}

// Start reasoning chain
export function startReasoningChain(
  state: NarrativeReasoningState,
  chainId: string,
  reasoningType: ReasoningType,
  premises: string[]
): NarrativeReasoningState {
  const chain: ReasoningChain = {
    chainId,
    type: reasoningType,
    premises,
    conclusions: [],
    confidence: 0.5,
    evidenceStrength: 0.5,
  };

  return {
    ...state,
    activeChain: chain,
    reasoningType: reasoningType,
    state: 'exploring',
    depth: premises.length,
  };
}

// Add conclusion
export function addConclusion(state: NarrativeReasoningState, conclusion: string): NarrativeReasoningState {
  if (!state.activeChain) return state;

  const updatedChain: ReasoningChain = {
    ...state.activeChain,
    conclusions: [...state.activeChain.conclusions, conclusion],
  };

  return { ...state, activeChain: updatedChain };
}

// Set reasoning type
export function setReasoningType(state: NarrativeReasoningState, reasoningType: ReasoningType): NarrativeReasoningState {
  return { ...state, reasoningType };
}

// Set reasoning state
export function setReasoningState(state: NarrativeReasoningState, newState: ReasoningState): NarrativeReasoningState {
  return { ...state, state: newState };
}

// Compute conclusion confidence
export function computeConclusionConfidence(state: NarrativeReasoningState): number {
  if (!state.activeChain) return 0;

  const baseConfidence = state.activeChain.premises.length * 0.1;
  const conclusionBonus = state.activeChain.conclusions.length * 0.05;
  const depthPenalty = state.depth * 0.02;

  return Math.min(1, Math.max(0, baseConfidence + conclusionBonus - depthPenalty + 0.3));
}

// Finalize chain
export function finalizeChain(state: NarrativeReasoningState): { state: NarrativeReasoningState; result: ReasoningResult | null } {
  if (!state.activeChain || state.activeChain.conclusions.length === 0) {
    return { state, result: null };
  }

  const finalChain: ReasoningChain = {
    ...state.activeChain,
    confidence: computeConclusionConfidence(state),
    evidenceStrength: Math.min(1, state.breadth * 0.1 + 0.4),
  };

  const chainHistory = [...state.chainHistory, finalChain];

  const result: ReasoningResult = {
    conclusion: finalChain.conclusions[finalChain.conclusions.length - 1],
    confidence: finalChain.confidence,
    reasoningType: finalChain.type,
    supportingEvidence: finalChain.premises,
  };

  return {
    state: {
      ...state,
      activeChain: null,
      chainHistory,
      state: 'concluded',
    },
    result,
  };
}

// Get reasoning report
export function getReasoningReport(state: NarrativeReasoningState): {
  hasActiveChain: boolean;
  chainCount: number;
  reasoningType: ReasoningType;
  state: ReasoningState;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (!state.activeChain) recommendations.push('No active reasoning chain — start a new chain');
  if (state.state === 'exploring' && state.depth > 5) recommendations.push('Deep exploration — consider converging');
  if (state.chainHistory.length > 10) recommendations.push('Many chains — consolidate learnings');

  return {
    hasActiveChain: state.activeChain !== null,
    chainCount: state.chainHistory.length,
    reasoningType: state.reasoningType,
    state: state.state,
    recommendations,
  };
}

// Reset reasoning state
export function resetNarrativeReasoningState(): NarrativeReasoningState {
  return createNarrativeReasoningState();
}