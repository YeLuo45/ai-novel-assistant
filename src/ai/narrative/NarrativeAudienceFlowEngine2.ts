/**
 * V1244 NarrativeAudienceFlowEngine2 — Direction H Iter 10/20 (Round 5)
 * Audience flow engine v2: audience reading flow
 * Sources: nanobot flow + thunderbolt + ruflo
 */

export type AudienceFlowCondition = 'bored' | 'anxious' | 'aroused' | 'flow' | 'control' | 'transcendent';
export type AudienceFlowChallenge = 'too_easy' | 'balanced' | 'challenging' | 'difficult' | 'mastery';
export type AudienceFlowFeedback = 'absent' | 'delayed' | 'immediate' | 'rich' | 'transformative';

export interface AudienceFlow {
  flowId: string;
  condition: AudienceFlowCondition;
  challenge: AudienceFlowChallenge;
  feedback: AudienceFlowFeedback;
  description: string;
  engagement: number;
  immersion: number;
  chapter: number;
}

export interface AudienceFlowState {
  stateId: string,
  flowIds: string[],
  cumulativeEngagement: number,
  depth: number,
}

export interface NarrativeAudienceFlow2EngineState {
  flows: Map<string, AudienceFlow>;
  states: Map<string, AudienceFlowState>;
  totalFlows: number;
  totalStates: number;
  averageEngagement: number;
  averageImmersion: number;
  stateDepth: number;
  audienceFlow2Mastery: number;
}

// Factory
export function createNarrativeAudienceFlow2EngineState(): NarrativeAudienceFlow2EngineState {
  return {
    flows: new Map(),
    states: new Map(),
    totalFlows: 0,
    totalStates: 0,
    averageEngagement: 0.5,
    averageImmersion: 0.5,
    stateDepth: 0.5,
    audienceFlow2Mastery: 0.5,
  };
}

// Add flow
export function addAudienceFlow(
  state: NarrativeAudienceFlow2EngineState,
  flowId: string,
  condition: AudienceFlowCondition,
  challenge: AudienceFlowChallenge,
  feedback: AudienceFlowFeedback,
  description: string,
  engagement: number,
  immersion: number,
  chapter: number
): NarrativeAudienceFlow2EngineState {
  const flow: AudienceFlow = { flowId, condition, challenge, feedback, description, engagement, immersion, chapter };
  const flows = new Map(state.flows).set(flowId, flow);
  return recomputeAudienceFlow2({ ...state, flows, totalFlows: flows.size });
}

// Add state
export function addAudienceFlowState(
  state: NarrativeAudienceFlow2EngineState,
  stateId: string,
  flowIds: string[]
): NarrativeAudienceFlow2EngineState {
  const flows = flowIds.map(id => state.flows.get(id)).filter((f): f is AudienceFlow => f !== undefined);
  const cumulativeEngagement = flows.length === 0 ? 0
    : flows.reduce((s, f) => s + f.engagement, 0) / flows.length;
  const condSet = new Set(flows.map(f => f.condition));
  const depth = Math.min(1, condSet.size / 6);
  const flowState: AudienceFlowState = { stateId, flowIds, cumulativeEngagement, depth };
  const states = new Map(state.states).set(stateId, flowState);
  return recomputeAudienceFlow2({ ...state, states, totalStates: states.size });
}

// Get flows by condition
export function getAudienceFlowsByCondition(state: NarrativeAudienceFlow2EngineState, condition: AudienceFlowCondition): AudienceFlow[] {
  return Array.from(state.flows.values()).filter(f => f.condition === condition);
}

// Get audience flow2 report
export function getAudienceFlow2Report(state: NarrativeAudienceFlow2EngineState): {
  totalFlows: number;
  totalStates: number;
  averageEngagement: number;
  averageImmersion: number;
  audienceFlow2Mastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFlows === 0) recommendations.push('No flows — add audience flows');
  if (state.averageEngagement < 0.5) recommendations.push('Low engagement — strengthen');
  if (state.audienceFlow2Mastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFlows: state.totalFlows,
    totalStates: state.totalStates,
    averageEngagement: Math.round(state.averageEngagement * 100) / 100,
    averageImmersion: Math.round(state.averageImmersion * 100) / 100,
    audienceFlow2Mastery: Math.round(state.audienceFlow2Mastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceFlow2(state: NarrativeAudienceFlow2EngineState): NarrativeAudienceFlow2EngineState {
  const flows = Array.from(state.flows.values());
  const averageEngagement = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.engagement, 0) / flows.length;
  const averageImmersion = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.immersion, 0) / flows.length;

  const states = Array.from(state.states.values());
  const stateDepth = states.length === 0 ? 0.5
    : states.reduce((s, st) => s + st.depth, 0) / states.length;

  const audienceFlow2Mastery = (averageEngagement * 0.4 + averageImmersion * 0.3 + stateDepth * 0.3);

  return { ...state, averageEngagement, averageImmersion, stateDepth, audienceFlow2Mastery };
}

// Reset
export function resetNarrativeAudienceFlow2EngineState(): NarrativeAudienceFlow2EngineState {
  return createNarrativeAudienceFlow2EngineState();
}