/**
 * V1124 NarrativeFlowStateEngine — Direction E Iter 10/20 (Round 5)
 * Flow state engine: reader's flow state during reading
 * Sources: generic-agent flow + thunderbolt + nanobot
 */

export type FlowStateChallenge = 'easy' | 'moderate' | 'balanced' | 'stretching' | 'overwhelming';
export type FlowStateSkill = 'beginner' | 'developing' | 'proficient' | 'expert' | 'mastery';
export type FlowStateClarity = 'confused' | 'uncertain' | 'clear' | 'focused' | 'lucid';

export interface FlowState {
  flowId: string;
  challenge: FlowStateChallenge;
  skill: FlowStateSkill;
  clarity: FlowStateClarity;
  description: string;
  engagement: number;
  immersion: number;
  chapter: number;
}

export interface FlowZone {
  zoneId: string,
  flowIds: string[],
  cumulativeEngagement: number,
  stability: number,
}

export interface NarrativeFlowStateEngineState {
  flows: Map<string, FlowState>;
  zones: Map<string, FlowZone>;
  totalFlows: number;
  totalZones: number;
  averageEngagement: number;
  averageImmersion: number;
  zoneStability: number;
  flowMastery: number;
}

// Factory
export function createNarrativeFlowStateEngineState(): NarrativeFlowStateEngineState {
  return {
    flows: new Map(),
    zones: new Map(),
    totalFlows: 0,
    totalZones: 0,
    averageEngagement: 0.5,
    averageImmersion: 0.5,
    zoneStability: 0.5,
    flowMastery: 0.5,
  };
}

// Add flow
export function addFlowState(
  state: NarrativeFlowStateEngineState,
  flowId: string,
  challenge: FlowStateChallenge,
  skill: FlowStateSkill,
  clarity: FlowStateClarity,
  description: string,
  engagement: number,
  immersion: number,
  chapter: number
): NarrativeFlowStateEngineState {
  const flow: FlowState = { flowId, challenge, skill, clarity, description, engagement, immersion, chapter };
  const flows = new Map(state.flows).set(flowId, flow);
  return recomputeFlow({ ...state, flows, totalFlows: flows.size });
}

// Add zone
export function addFlowZone(
  state: NarrativeFlowStateEngineState,
  zoneId: string,
  flowIds: string[]
): NarrativeFlowStateEngineState {
  const flows = flowIds.map(id => state.flows.get(id)).filter((f): f is FlowState => f !== undefined);
  const cumulativeEngagement = flows.length === 0 ? 0
    : flows.reduce((s, f) => s + f.engagement, 0) / flows.length;
  const stability = flows.length < 2 ? 0.5
    : 1 - Math.abs(flows[0].engagement - flows[flows.length - 1].engagement);
  const zone: FlowZone = { zoneId, flowIds, cumulativeEngagement, stability };
  const zones = new Map(state.zones).set(zoneId, zone);
  return recomputeFlow({ ...state, zones, totalZones: zones.size });
}

// Get flows by challenge
export function getFlowStatesByChallenge(state: NarrativeFlowStateEngineState, challenge: FlowStateChallenge): FlowState[] {
  return Array.from(state.flows.values()).filter(f => f.challenge === challenge);
}

// Get flow report
export function getFlowStateReport(state: NarrativeFlowStateEngineState): {
  totalFlows: number;
  totalZones: number;
  averageEngagement: number;
  averageImmersion: number;
  flowMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFlows === 0) recommendations.push('No flows — add flow states');
  if (state.averageEngagement < 0.5) recommendations.push('Low engagement — strengthen');
  if (state.flowMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFlows: state.totalFlows,
    totalZones: state.totalZones,
    averageEngagement: Math.round(state.averageEngagement * 100) / 100,
    averageImmersion: Math.round(state.averageImmersion * 100) / 100,
    flowMastery: Math.round(state.flowMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeFlow(state: NarrativeFlowStateEngineState): NarrativeFlowStateEngineState {
  const flows = Array.from(state.flows.values());
  const averageEngagement = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.engagement, 0) / flows.length;
  const averageImmersion = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.immersion, 0) / flows.length;

  const zones = Array.from(state.zones.values());
  const zoneStability = zones.length === 0 ? 0.5
    : zones.reduce((s, z) => s + z.stability, 0) / zones.length;

  const flowMastery = (averageEngagement * 0.4 + averageImmersion * 0.3 + zoneStability * 0.3);

  return { ...state, averageEngagement, averageImmersion, zoneStability, flowMastery };
}

// Reset
export function resetNarrativeFlowStateEngineState(): NarrativeFlowStateEngineState {
  return createNarrativeFlowStateEngineState();
}