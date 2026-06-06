/**
 * V1288 NarrativeStoryCircuitEngine — Direction I Iter 12/20 (Round 5)
 * Story circuit engine: circuit of story flows
 * Sources: ruflo circuit + nanobot + thunderbolt
 */

export type StoryCircuitType = 'linear' | 'parallel' | 'series' | 'feedback' | 'closed_loop';
export type StoryCircuitVoltage = 'low' | 'moderate' | 'high' | 'extreme' | 'overwhelming';
export type StoryCircuitCurrent = 'weak' | 'moderate' | 'strong' | 'intense' | 'transcendent';

export interface StoryCircuitNode {
  circuitId: string;
  type: StoryCircuitType;
  voltage: StoryCircuitVoltage;
  current: StoryCircuitCurrent;
  description: string;
  flow: number;
  resistance: number;
  chapter: number;
}

export interface StoryCircuitLoop {
  loopId: string,
  circuitIds: string[],
  cumulativeFlow: number,
  conductivity: number,
}

export interface NarrativeStoryCircuitEngineState {
  circuits: Map<string, StoryCircuitNode>;
  loops: Map<string, StoryCircuitLoop>;
  totalCircuits: number;
  totalLoops: number;
  averageFlow: number;
  averageResistance: number;
  loopConductivity: number;
  storyCircuitMastery: number;
}

// Factory
export function createNarrativeStoryCircuitEngineState(): NarrativeStoryCircuitEngineState {
  return {
    circuits: new Map(),
    loops: new Map(),
    totalCircuits: 0,
    totalLoops: 0,
    averageFlow: 0.5,
    averageResistance: 0.5,
    loopConductivity: 0.5,
    storyCircuitMastery: 0.5,
  };
}

// Add circuit
export function addStoryCircuitNode(
  state: NarrativeStoryCircuitEngineState,
  circuitId: string,
  type: StoryCircuitType,
  voltage: StoryCircuitVoltage,
  current: StoryCircuitCurrent,
  description: string,
  flow: number,
  resistance: number,
  chapter: number
): NarrativeStoryCircuitEngineState {
  const circuit: StoryCircuitNode = { circuitId, type, voltage, current, description, flow, resistance, chapter };
  const circuits = new Map(state.circuits).set(circuitId, circuit);
  return recomputeStoryCircuit({ ...state, circuits, totalCircuits: circuits.size });
}

// Add loop
export function addStoryCircuitLoop(
  state: NarrativeStoryCircuitEngineState,
  loopId: string,
  circuitIds: string[]
): NarrativeStoryCircuitEngineState {
  const circuits = circuitIds.map(id => state.circuits.get(id)).filter((c): c is StoryCircuitNode => c !== undefined);
  const cumulativeFlow = circuits.length === 0 ? 0
    : circuits.reduce((s, c) => s + c.flow, 0) / circuits.length;
  const typeSet = new Set(circuits.map(c => c.type));
  const conductivity = Math.min(1, typeSet.size / 6);
  const loop: StoryCircuitLoop = { loopId, circuitIds, cumulativeFlow, conductivity };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeStoryCircuit({ ...state, loops, totalLoops: loops.size });
}

// Get circuits by type
export function getStoryCircuitNodesByType(state: NarrativeStoryCircuitEngineState, type: StoryCircuitType): StoryCircuitNode[] {
  return Array.from(state.circuits.values()).filter(c => c.type === type);
}

// Get story circuit report
export function getStoryCircuitReport(state: NarrativeStoryCircuitEngineState): {
  totalCircuits: number;
  totalLoops: number;
  averageFlow: number;
  averageResistance: number;
  storyCircuitMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCircuits === 0) recommendations.push('No circuits — add story circuit nodes');
  if (state.averageFlow < 0.5) recommendations.push('Low flow — strengthen');
  if (state.storyCircuitMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCircuits: state.totalCircuits,
    totalLoops: state.totalLoops,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    averageResistance: Math.round(state.averageResistance * 100) / 100,
    storyCircuitMastery: Math.round(state.storyCircuitMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryCircuit(state: NarrativeStoryCircuitEngineState): NarrativeStoryCircuitEngineState {
  const circuits = Array.from(state.circuits.values());
  const averageFlow = circuits.length === 0 ? 0.5
    : circuits.reduce((s, c) => s + c.flow, 0) / circuits.length;
  const averageResistance = circuits.length === 0 ? 0.5
    : circuits.reduce((s, c) => s + c.resistance, 0) / circuits.length;

  const loops = Array.from(state.loops.values());
  const loopConductivity = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.conductivity, 0) / loops.length;

  const storyCircuitMastery = (averageFlow * 0.4 + averageResistance * 0.3 + loopConductivity * 0.3);

  return { ...state, averageFlow, averageResistance, loopConductivity, storyCircuitMastery };
}

// Reset
export function resetNarrativeStoryCircuitEngineState(): NarrativeStoryCircuitEngineState {
  return createNarrativeStoryCircuitEngineState();
}