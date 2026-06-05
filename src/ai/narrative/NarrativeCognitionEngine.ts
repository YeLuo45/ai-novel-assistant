/**
 * V810 NarrativeCognitionEngine — Direction E Iter 1/9 (Round 3)
 * Narrative cognition engine: high-level cognitive processes for narrative
 * Sources: nanobot cognition + chatdev + thunderbolt
 */

export type CognitionType = 'perception' | 'attention' | 'memory' | 'reasoning' | 'judgment' | 'imagination';
export type CognitionLevel = 'novice' | 'developing' | 'competent' | 'proficient' | 'expert' | 'master';
export type CognitionState = 'dormant' | 'active' | 'focused' | 'overloaded' | 'integrated';

export interface Cognition {
  cognitionId: string;
  type: CognitionType;
  level: CognitionLevel;
  state: CognitionState;
  capacity: number;
  load: number;
  activations: number;
  lastUsed: number;
}

export interface CognitionProcess {
  processId: string;
  cognitionTypes: CognitionType[];
  startTime: number;
  endTime: number | null;
  input: string;
  output: string;
  success: boolean;
  duration: number;
}

export interface NarrativeCognitionEngineState {
  cognitions: Map<string, Cognition>;
  processes: Map<string, CognitionProcess>;
  totalCognitions: number;
  totalProcesses: number;
  activeProcesses: number;
  averageLevel: number;
  averageLoad: number;
  integrationScore: number;
  cognitiveBalance: number;
}

// Factory
export function createNarrativeCognitionEngineState(): NarrativeCognitionEngineState {
  return {
    cognitions: new Map(),
    processes: new Map(),
    totalCognitions: 0,
    totalProcesses: 0,
    activeProcesses: 0,
    averageLevel: 0.5,
    averageLoad: 0,
    integrationScore: 0.5,
    cognitiveBalance: 0.5,
  };
}

// Create cognition
export function createCognition(
  state: NarrativeCognitionEngineState,
  cognitionId: string,
  type: CognitionType,
  level: CognitionLevel = 'developing',
  capacity: number = 1.0
): NarrativeCognitionEngineState {
  const cognition: Cognition = {
    cognitionId, type, level, state: 'dormant',
    capacity, load: 0, activations: 0, lastUsed: Date.now(),
  };
  const cognitions = new Map(state.cognitions).set(cognitionId, cognition);
  return recomputeCognition({ ...state, cognitions, totalCognitions: cognitions.size });
}

// Activate cognition
export function activateCognition(state: NarrativeCognitionEngineState, cognitionId: string, load: number = 0.5): NarrativeCognitionEngineState {
  const cognition = state.cognitions.get(cognitionId);
  if (!cognition) return state;

  const stateStatus: CognitionState = load > 0.9 ? 'overloaded' : load > 0.7 ? 'focused' : 'active';
  const updated: Cognition = { ...cognition, state: stateStatus, load: Math.min(1, load), lastUsed: Date.now(), activations: cognition.activations + 1 };
  const cognitions = new Map(state.cognitions).set(cognitionId, updated);
  return recomputeCognition({ ...state, cognitions });
}

// Start process
export function startCognitionProcess(
  state: NarrativeCognitionEngineState,
  processId: string,
  cognitionTypes: CognitionType[],
  input: string
): NarrativeCognitionEngineState {
  const process: CognitionProcess = {
    processId, cognitionTypes,
    startTime: Date.now(), endTime: null,
    input, output: '', success: false, duration: 0,
  };
  const processes = new Map(state.processes).set(processId, process);
  return recomputeCognition({ ...state, processes, totalProcesses: processes.size, activeProcesses: state.activeProcesses + 1 });
}

// Complete process
export function completeCognitionProcess(state: NarrativeCognitionEngineState, processId: string, output: string, success: boolean): NarrativeCognitionEngineState {
  const process = state.processes.get(processId);
  if (!process) return state;

  const endTime = Date.now();
  const updated: CognitionProcess = { ...process, endTime, output, success, duration: endTime - process.startTime };
  const processes = new Map(state.processes).set(processId, updated);
  return recomputeCognition({ ...state, processes, activeProcesses: Math.max(0, state.activeProcesses - 1) });
}

// Get cognitions by type
export function getCognitionsByType(state: NarrativeCognitionEngineState, type: CognitionType): Cognition[] {
  return Array.from(state.cognitions.values()).filter(c => c.type === type);
}

// Get cognition report
export function getCognitionReport(state: NarrativeCognitionEngineState): {
  totalCognitions: number;
  totalProcesses: number;
  activeProcesses: number;
  averageLevel: number;
  averageLoad: number;
  integrationScore: number;
  cognitiveBalance: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCognitions === 0) recommendations.push('No cognitions — create cognitions');
  if (state.averageLoad > 0.8) recommendations.push('High load — reduce cognitive load');
  if (state.cognitiveBalance < 0.4) recommendations.push('Imbalanced — diversify cognition types');

  return {
    totalCognitions: state.totalCognitions,
    totalProcesses: state.totalProcesses,
    activeProcesses: state.activeProcesses,
    averageLevel: Math.round(state.averageLevel * 100) / 100,
    averageLoad: Math.round(state.averageLoad * 100) / 100,
    integrationScore: Math.round(state.integrationScore * 100) / 100,
    cognitiveBalance: Math.round(state.cognitiveBalance * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCognition(state: NarrativeCognitionEngineState): NarrativeCognitionEngineState {
  const cognitions = Array.from(state.cognitions.values());
  const levelMap: Record<CognitionLevel, number> = { novice: 0.2, developing: 0.4, competent: 0.6, proficient: 0.8, expert: 0.9, master: 1.0 };
  const averageLevel = cognitions.length === 0 ? 0.5
    : cognitions.reduce((s, c) => s + levelMap[c.level], 0) / cognitions.length;
  const averageLoad = cognitions.length === 0 ? 0
    : cognitions.reduce((s, c) => s + c.load, 0) / cognitions.length;

  const typeSet = new Set(cognitions.map(c => c.type));
  const cognitiveBalance = Math.min(1, typeSet.size / 5);

  const completed = Array.from(state.processes.values()).filter(p => p.endTime !== null);
  const successRate = completed.length === 0 ? 0.5
    : completed.filter(p => p.success).length / completed.length;
  const integrationScore = (averageLevel * 0.5 + successRate * 0.5);

  return { ...state, averageLevel, averageLoad, integrationScore, cognitiveBalance };
}

// Reset cognition state
export function resetNarrativeCognitionEngineState(): NarrativeCognitionEngineState {
  return createNarrativeCognitionEngineState();
}