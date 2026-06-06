/**
 * V1202 NarrativeTimeCurrentEngine — Direction G Iter 9/20 (Round 5)
 * Time current engine: current in time
 * Sources: ruflo current + nanobot + thunderbolt
 */

export type TimeCurrentType = 'mainstream' | 'undercurrent' | 'crosscurrent' | 'rip_current' | 'eddy' | 'jet_stream';
export type TimeCurrentStrength = 'weak' | 'moderate' | 'strong' | 'powerful' | 'overwhelming';
export type TimeCurrentDirection = 'with' | 'against' | 'perpendicular' | 'diagonal' | 'omnidirectional';

export interface TimeCurrent {
  currentId: string;
  type: TimeCurrentType;
  strength: TimeCurrentStrength;
  direction: TimeCurrentDirection;
  description: string;
  pull: number;
  clarity: number;
  chapter: number;
}

export interface TimeCurrentFlow {
  flowId: string,
  currentIds: string[],
  cumulativePull: number,
  breadth: number,
}

export interface NarrativeTimeCurrentEngineState {
  currents: Map<string, TimeCurrent>;
  flows: Map<string, TimeCurrentFlow>;
  totalCurrents: number;
  totalFlows: number;
  averagePull: number;
  averageClarity: number;
  flowBreadth: number;
  timeCurrentMastery: number;
}

// Factory
export function createNarrativeTimeCurrentEngineState(): NarrativeTimeCurrentEngineState {
  return {
    currents: new Map(),
    flows: new Map(),
    totalCurrents: 0,
    totalFlows: 0,
    averagePull: 0.5,
    averageClarity: 0.5,
    flowBreadth: 0.5,
    timeCurrentMastery: 0.5,
  };
}

// Add current
export function addTimeCurrent(
  state: NarrativeTimeCurrentEngineState,
  currentId: string,
  type: TimeCurrentType,
  strength: TimeCurrentStrength,
  direction: TimeCurrentDirection,
  description: string,
  pull: number,
  clarity: number,
  chapter: number
): NarrativeTimeCurrentEngineState {
  const current: TimeCurrent = { currentId, type, strength, direction, description, pull, clarity, chapter };
  const currents = new Map(state.currents).set(currentId, current);
  return recomputeTimeCurrent({ ...state, currents, totalCurrents: currents.size });
}

// Add flow
export function addTimeCurrentFlow(
  state: NarrativeTimeCurrentEngineState,
  flowId: string,
  currentIds: string[]
): NarrativeTimeCurrentEngineState {
  const currents = currentIds.map(id => state.currents.get(id)).filter((c): c is TimeCurrent => c !== undefined);
  const cumulativePull = currents.length === 0 ? 0
    : currents.reduce((s, c) => s + c.pull, 0) / currents.length;
  const typeSet = new Set(currents.map(c => c.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const flow: TimeCurrentFlow = { flowId, currentIds, cumulativePull, breadth };
  const flows = new Map(state.flows).set(flowId, flow);
  return recomputeTimeCurrent({ ...state, flows, totalFlows: flows.size });
}

// Get currents by type
export function getTimeCurrentsByType(state: NarrativeTimeCurrentEngineState, type: TimeCurrentType): TimeCurrent[] {
  return Array.from(state.currents.values()).filter(c => c.type === type);
}

// Get time current report
export function getTimeCurrentReport(state: NarrativeTimeCurrentEngineState): {
  totalCurrents: number;
  totalFlows: number;
  averagePull: number;
  averageClarity: number;
  timeCurrentMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCurrents === 0) recommendations.push('No currents — add time currents');
  if (state.averagePull < 0.5) recommendations.push('Low pull — strengthen');
  if (state.timeCurrentMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCurrents: state.totalCurrents,
    totalFlows: state.totalFlows,
    averagePull: Math.round(state.averagePull * 100) / 100,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    timeCurrentMastery: Math.round(state.timeCurrentMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeCurrent(state: NarrativeTimeCurrentEngineState): NarrativeTimeCurrentEngineState {
  const currents = Array.from(state.currents.values());
  const averagePull = currents.length === 0 ? 0.5
    : currents.reduce((s, c) => s + c.pull, 0) / currents.length;
  const averageClarity = currents.length === 0 ? 0.5
    : currents.reduce((s, c) => s + c.clarity, 0) / currents.length;

  const flows = Array.from(state.flows.values());
  const flowBreadth = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.breadth, 0) / flows.length;

  const timeCurrentMastery = (averagePull * 0.4 + averageClarity * 0.3 + flowBreadth * 0.3);

  return { ...state, averagePull, averageClarity, flowBreadth, timeCurrentMastery };
}

// Reset
export function resetNarrativeTimeCurrentEngineState(): NarrativeTimeCurrentEngineState {
  return createNarrativeTimeCurrentEngineState();
}