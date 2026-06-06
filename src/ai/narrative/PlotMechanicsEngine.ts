/**
 * V898 PlotMechanicsEngine — Direction C Iter 12/15 (Round 4)
 * Plot mechanics engine: plot mechanics + operational systems
 * Sources: thunderbolt mechanics + ruflo + nanobot
 */

export type MechanismType = 'trigger' | 'constraint' | 'catalyst' | 'obstacle' | 'opportunity' | 'revelation';
export type MechanismState = 'inactive' | 'armed' | 'active' | 'spent' | 'recurring';
export type MechanismReliability = 'unreliable' | 'flaky' | 'reliable' | 'consistent' | 'absolute';

export interface PlotMechanism {
  mechanismId: string;
  type: MechanismType;
  state: MechanismState;
  reliability: MechanismReliability;
  description: string;
  activationCount: number;
  successCount: number;
  chapter: number;
}

export interface MechanismInteraction {
  interactionId: string;
  mechanism1Id: string;
  mechanism2Id: string;
  outcome: 'synergy' | 'conflict' | 'neutral' | 'cascade';
  impact: number;
  chapter: number;
}

export interface PlotMechanicsEngineState {
  mechanisms: Map<string, PlotMechanism>;
  interactions: Map<string, MechanismInteraction>;
  totalMechanisms: number;
  totalInteractions: number;
  activeMechanisms: number;
  averageReliability: number;
  mechanicsHealth: number;
  plotComplexity: number;
  mechanismElegance: number;
}

// Factory
export function createPlotMechanicsEngineState(): PlotMechanicsEngineState {
  return {
    mechanisms: new Map(),
    interactions: new Map(),
    totalMechanisms: 0,
    totalInteractions: 0,
    activeMechanisms: 0,
    averageReliability: 0.5,
    mechanicsHealth: 0.5,
    plotComplexity: 0.5,
    mechanismElegance: 0.5,
  };
}

// Add mechanism
export function addPlotMechanism(
  state: PlotMechanicsEngineState,
  mechanismId: string,
  type: MechanismType,
  description: string,
  chapter: number,
  reliability: MechanismReliability = 'reliable'
): PlotMechanicsEngineState {
  const mechanism: PlotMechanism = {
    mechanismId, type, state: 'inactive', reliability, description,
    activationCount: 0, successCount: 0, chapter,
  };
  const mechanisms = new Map(state.mechanisms).set(mechanismId, mechanism);
  return recomputePlotMech({ ...state, mechanisms, totalMechanisms: mechanisms.size });
}

// Activate mechanism
export function activateMechanism(state: PlotMechanicsEngineState, mechanismId: string, success: boolean = true): PlotMechanicsEngineState {
  const mechanism = state.mechanisms.get(mechanismId);
  if (!mechanism) return state;

  const newState: MechanismState = success ? 'spent' : 'armed';
  const updated: PlotMechanism = {
    ...mechanism,
    state: newState,
    activationCount: mechanism.activationCount + 1,
    successCount: success ? mechanism.successCount + 1 : mechanism.successCount,
  };
  const mechanisms = new Map(state.mechanisms).set(mechanismId, updated);
  const activeMechanisms = mechanism.state === 'active' ? state.activeMechanisms : state.activeMechanisms + 1;
  return recomputePlotMech({ ...state, mechanisms, activeMechanisms });
}

// Record interaction
export function recordMechanismInteraction(
  state: PlotMechanicsEngineState,
  interactionId: string,
  mechanism1Id: string,
  mechanism2Id: string,
  outcome: MechanismInteraction['outcome'],
  impact: number,
  chapter: number
): PlotMechanicsEngineState {
  const interaction: MechanismInteraction = { interactionId, mechanism1Id, mechanism2Id, outcome, impact, chapter };
  const interactions = new Map(state.interactions).set(interactionId, interaction);
  return recomputePlotMech({ ...state, interactions, totalInteractions: interactions.size });
}

// Get mechanisms by type
export function getMechanismsByType(state: PlotMechanicsEngineState, type: MechanismType): PlotMechanism[] {
  return Array.from(state.mechanisms.values()).filter(m => m.type === type);
}

// Get plot mechanics report
export function getPlotMechanicsReport(state: PlotMechanicsEngineState): {
  totalMechanisms: number;
  totalInteractions: number;
  activeMechanisms: number;
  averageReliability: number;
  plotComplexity: number;
  mechanismElegance: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMechanisms === 0) recommendations.push('No mechanisms — add mechanisms');
  if (state.averageReliability < 0.5) recommendations.push('Low reliability — improve');
  if (state.plotComplexity < 0.3) recommendations.push('Low complexity — diversify');

  return {
    totalMechanisms: state.totalMechanisms,
    totalInteractions: state.totalInteractions,
    activeMechanisms: state.activeMechanisms,
    averageReliability: Math.round(state.averageReliability * 100) / 100,
    plotComplexity: Math.round(state.plotComplexity * 100) / 100,
    mechanismElegance: Math.round(state.mechanismElegance * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlotMech(state: PlotMechanicsEngineState): PlotMechanicsEngineState {
  const mechanisms = Array.from(state.mechanisms.values());
  const reliabilityMap: Record<MechanismReliability, number> = { unreliable: 0.2, flaky: 0.4, reliable: 0.6, consistent: 0.8, absolute: 1.0 };
  const averageReliability = mechanisms.length === 0 ? 0.5
    : mechanisms.reduce((s, m) => s + reliabilityMap[m.reliability], 0) / mechanisms.length;

  const successRate = mechanisms.length === 0 ? 0.5
    : mechanisms.reduce((s, m) => s + m.successCount / Math.max(1, m.activationCount), 0) / mechanisms.length;
  const mechanicsHealth = (averageReliability * 0.5 + successRate * 0.5);

  const typeSet = new Set(mechanisms.map(m => m.type));
  const plotComplexity = Math.min(1, typeSet.size / 5);

  const interactions = Array.from(state.interactions.values());
  const positiveInteractions = interactions.filter(i => i.outcome === 'synergy').length;
  const interactionHealth = interactions.length === 0 ? 0.5 : positiveInteractions / interactions.length;

  const mechanismElegance = (mechanicsHealth * 0.5 + interactionHealth * 0.3 + plotComplexity * 0.2);

  return { ...state, averageReliability, mechanicsHealth, plotComplexity, mechanismElegance };
}

// Reset plot mechanics state
export function resetPlotMechanicsEngineState(): PlotMechanicsEngineState {
  return createPlotMechanicsEngineState();
}