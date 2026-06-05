/**
 * V726 NarrativeReasoningCore — Direction E Iter 4/9 (Round 2)
 * Narrative reasoning core: advanced causal + abductive + analogical reasoning
 * Sources: thunderbolt reasoning + chatdev logical + nanobot
 */

export type ReasoningType = 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'causal' | 'counterfactual';
export type ReasoningStep = 'premise' | 'inference' | 'conclusion' | 'evaluation';
export type ReasoningConfidence = 'certain' | 'high' | 'moderate' | 'low' | 'speculative';

export interface ReasoningChain {
  chainId: string;
  type: ReasoningType;
  steps: ReasoningStep[];
  premises: string[];
  conclusion: string;
  confidence: ReasoningConfidence;
  confidenceScore: number;
  valid: boolean;
}

export interface NarrativeReasoningCoreState {
  chains: Map<string, ReasoningChain>;
  typeDistribution: Map<ReasoningType, number>;
  totalChains: number;
  validChains: number;
  averageConfidence: number;
  reasoningDepth: number;
  abductivePower: number;
}

// Factory
export function createNarrativeReasoningCoreState(): NarrativeReasoningCoreState {
  return {
    chains: new Map(),
    typeDistribution: new Map(),
    totalChains: 0,
    validChains: 0,
    averageConfidence: 0.5,
    reasoningDepth: 0.5,
    abductivePower: 0.5,
  };
}

// Create chain
export function createReasoningChain(
  state: NarrativeReasoningCoreState,
  chainId: string,
  type: ReasoningType,
  premises: string[],
  steps: ReasoningStep[] = ['premise', 'inference', 'conclusion']
): NarrativeReasoningCoreState {
  const confidence = inferConfidence(type);
  const confidenceScore = confidenceToScore(confidence);
  const chain: ReasoningChain = {
    chainId,
    type,
    steps,
    premises,
    conclusion: '',
    confidence,
    confidenceScore,
    valid: true,
  };
  const chains = new Map(state.chains).set(chainId, chain);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeReasoning({ ...state, chains, typeDistribution, totalChains: chains.size });
}

// Set conclusion
export function setConclusion(state: NarrativeReasoningCoreState, chainId: string, conclusion: string): NarrativeReasoningCoreState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const updated: ReasoningChain = { ...chain, conclusion };
  const chains = new Map(state.chains).set(chainId, updated);
  return recomputeReasoning({ ...state, chains });
}

// Invalidate chain
export function invalidateChain(state: NarrativeReasoningCoreState, chainId: string): NarrativeReasoningCoreState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const updated: ReasoningChain = { ...chain, valid: false };
  const chains = new Map(state.chains).set(chainId, updated);
  return recomputeReasoning({ ...state, chains });
}

// Re-validate chain
export function revalidateChain(state: NarrativeReasoningCoreState, chainId: string): NarrativeReasoningCoreState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const updated: ReasoningChain = { ...chain, valid: true };
  const chains = new Map(state.chains).set(chainId, updated);
  return recomputeReasoning({ ...state, chains });
}

// Get chains by type
export function getChainsByType(state: NarrativeReasoningCoreState, type: ReasoningType): ReasoningChain[] {
  return Array.from(state.chains.values()).filter(c => c.type === type);
}

// Get valid chains
export function getValidChains(state: NarrativeReasoningCoreState): ReasoningChain[] {
  return Array.from(state.chains.values()).filter(c => c.valid);
}

// Infer conclusion (abductive)
export function inferConclusion(state: NarrativeReasoningCoreState, observation: string): string {
  const abductiveChains = getChainsByType(state, 'abductive').filter(c => c.valid);
  if (abductiveChains.length === 0) return 'No abductive basis';

  // Find chain with most similar premises
  let bestChain: ReasoningChain | null = null;
  let bestScore = -1;
  for (const chain of abductiveChains) {
    const matchScore = chain.premises.filter(p => p.toLowerCase().includes(observation.toLowerCase())).length;
    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestChain = chain;
    }
  }
  return bestChain?.conclusion || 'No conclusion found';
}

// Get reasoning report
export function getReasoningReport(state: NarrativeReasoningCoreState): {
  totalChains: number;
  validChains: number;
  averageConfidence: number;
  reasoningDepth: number;
  abductivePower: number;
  typeDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalChains === 0) recommendations.push('No reasoning chains — start reasoning');
  if (state.validChains / Math.max(1, state.totalChains) < 0.7) {
    recommendations.push('Low validity rate — re-evaluate chains');
  }
  if (state.abductivePower < 0.4) recommendations.push('Low abductive power — add more abductive chains');

  const typeDistribution: Record<string, number> = {};
  state.typeDistribution.forEach((count, type) => {
    typeDistribution[type] = count;
  });

  return {
    totalChains: state.totalChains,
    validChains: state.validChains,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    reasoningDepth: Math.round(state.reasoningDepth * 100) / 100,
    abductivePower: Math.round(state.abductivePower * 100) / 100,
    typeDistribution,
    recommendations,
  };
}

// Infer confidence from type
function inferConfidence(type: ReasoningType): ReasoningConfidence {
  const map: Record<ReasoningType, ReasoningConfidence> = {
    deductive: 'certain',
    inductive: 'high',
    abductive: 'moderate',
    analogical: 'moderate',
    causal: 'high',
    counterfactual: 'low',
  };
  return map[type];
}

function confidenceToScore(conf: ReasoningConfidence): number {
  const map: Record<ReasoningConfidence, number> = {
    certain: 1.0,
    high: 0.85,
    moderate: 0.65,
    low: 0.4,
    speculative: 0.2,
  };
  return map[conf];
}

// Recompute metrics
function recomputeReasoning(state: NarrativeReasoningCoreState): NarrativeReasoningCoreState {
  const chains = Array.from(state.chains.values());
  const validChains = chains.filter(c => c.valid).length;
  const averageConfidence = chains.length > 0
    ? chains.reduce((s, c) => s + c.confidenceScore, 0) / chains.length
    : 0.5;
  const reasoningDepth = chains.length === 0 ? 0.5 : Math.min(1, chains.length / 10);
  const abductiveChains = chains.filter(c => c.type === 'abductive' && c.valid).length;
  const abductivePower = chains.length === 0 ? 0.5 : abductiveChains / chains.length;

  return { ...state, validChains, averageConfidence, reasoningDepth, abductivePower };
}

// Reset reasoning state
export function resetNarrativeReasoningCoreState(): NarrativeReasoningCoreState {
  return createNarrativeReasoningCoreState();
}