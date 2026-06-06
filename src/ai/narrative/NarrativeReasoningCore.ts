/**
 * V958 NarrativeReasoningCore — Direction E Iter 12/15 (Round 4)
 * Narrative reasoning core: deep narrative reasoning
 * Sources: ruflo reasoning + thunderbolt + nanobot
 */

export type ReasoningType = 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'narrative' | 'metaphorical';
export type ReasoningQuality = 'flawed' | 'weak' | 'adequate' | 'strong' | 'irrefutable';
export type ReasoningDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'abyssal';

export interface ReasoningArgument {
  argumentId: string;
  type: ReasoningType;
  quality: ReasoningQuality;
  depth: ReasoningDepth;
  premise: string;
  conclusion: string;
  validity: number;
  chapter: number;
}

export interface ReasoningChain {
  chainId: string,
  name: string,
  argumentIds: string[],
  coherence: number,
  power: number,
}

export interface NarrativeReasoningCoreState {
  arguments: Map<string, ReasoningArgument>;
  chains: Map<string, ReasoningChain>;
  totalArguments: number;
  totalChains: number;
  averageValidity: number;
  typeVersatility: number;
  reasoningDepth: number;
  reasoningMastery: number;
}

// Factory
export function createNarrativeReasoningCoreState(): NarrativeReasoningCoreState {
  return {
    arguments: new Map(),
    chains: new Map(),
    totalArguments: 0,
    totalChains: 0,
    averageValidity: 0.5,
    typeVersatility: 0,
    reasoningDepth: 0.5,
    reasoningMastery: 0.5,
  };
}

// Add argument
export function addReasoningArgument(
  state: NarrativeReasoningCoreState,
  argumentId: string,
  type: ReasoningType,
  quality: ReasoningQuality,
  depth: ReasoningDepth,
  premise: string,
  conclusion: string,
  validity: number,
  chapter: number
): NarrativeReasoningCoreState {
  const argument: ReasoningArgument = { argumentId, type, quality, depth, premise, conclusion, validity, chapter };
  const arguments_ = new Map(state.arguments).set(argumentId, argument);
  return recomputeReasoning({ ...state, arguments: arguments_, totalArguments: arguments_.size });
}

// Add chain
export function addReasoningChain(
  state: NarrativeReasoningCoreState,
  chainId: string,
  name: string,
  argumentIds: string[]
): NarrativeReasoningCoreState {
  const arguments_ = argumentIds.map(id => state.arguments.get(id)).filter((a): a is ReasoningArgument => a !== undefined);
  const power = arguments_.length === 0 ? 0
    : arguments_.reduce((s, a) => s + a.validity, 0) / arguments_.length;
  const coherence = arguments_.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(arguments_[0].validity - arguments_[arguments_.length - 1].validity));
  const chain: ReasoningChain = { chainId, name, argumentIds, coherence, power };
  const chains = new Map(state.chains).set(chainId, chain);
  return recomputeReasoning({ ...state, chains, totalChains: chains.size });
}

// Get arguments by type
export function getArgumentsByType(state: NarrativeReasoningCoreState, type: ReasoningType): ReasoningArgument[] {
  return Array.from(state.arguments.values()).filter(a => a.type === type);
}

// Get reasoning report
export function getReasoningReport(state: NarrativeReasoningCoreState): {
  totalArguments: number;
  totalChains: number;
  averageValidity: number;
  typeVersatility: number;
  reasoningDepth: number;
  reasoningMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalArguments === 0) recommendations.push('No arguments — add reasoning arguments');
  if (state.averageValidity < 0.5) recommendations.push('Low validity — improve reasoning');
  if (state.reasoningMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalArguments: state.totalArguments,
    totalChains: state.totalChains,
    averageValidity: Math.round(state.averageValidity * 100) / 100,
    typeVersatility: Math.round(state.typeVersatility * 100) / 100,
    reasoningDepth: Math.round(state.reasoningDepth * 100) / 100,
    reasoningMastery: Math.round(state.reasoningMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeReasoning(state: NarrativeReasoningCoreState): NarrativeReasoningCoreState {
  const arguments_ = Array.from(state.arguments.values());
  const averageValidity = arguments_.length === 0 ? 0.5
    : arguments_.reduce((s, a) => s + a.validity, 0) / arguments_.length;
  const typeSet = new Set(arguments_.map(a => a.type));
  const typeVersatility = Math.min(1, typeSet.size / 5);

  const depthMap: Record<ReasoningDepth, number> = { surface: 0.2, shallow: 0.4, moderate: 0.6, deep: 0.8, abyssal: 1.0 };
  const reasoningDepth = arguments_.length === 0 ? 0.5
    : arguments_.reduce((s, a) => s + depthMap[a.depth], 0) / arguments_.length;

  const reasoningMastery = (averageValidity * 0.4 + typeVersatility * 0.3 + reasoningDepth * 0.3);

  return { ...state, averageValidity, typeVersatility, reasoningDepth, reasoningMastery };
}

// Reset reasoning state
export function resetNarrativeReasoningCoreState(): NarrativeReasoningCoreState {
  return createNarrativeReasoningCoreState();
}