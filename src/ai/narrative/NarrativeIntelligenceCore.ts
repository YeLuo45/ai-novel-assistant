/**
 * V720 NarrativeIntelligenceCore — Direction E Iter 1/9 (Round 2)
 * Narrative intelligence core: master intelligence + meta-cognition
 * Sources: all 6 design systems — thunderbolt pipeline + chatdev + nanobot + ruflo + generic-agent
 */

export type IntelligenceMode = 'analytical' | 'creative' | 'critical' | 'intuitive' | 'hybrid';
export type CognitiveLevel = 'surface' | 'shallow' | 'deep' | 'meta';
export type IntelligenceState = 'dormant' | 'awakening' | 'active' | 'reflecting' | 'integrating';

export interface CognitiveState {
  level: CognitiveLevel;
  focus: string;
  confidence: number;
  context: string;
  timestamp: number;
}

export interface IntelligenceProcess {
  processId: string;
  name: string;
  mode: IntelligenceMode;
  state: IntelligenceState;
  cognitiveState: CognitiveState;
  input: string;
  output: string;
  qualityScore: number;
  startTime: number;
  endTime: number | null;
}

export interface NarrativeIntelligenceCoreState {
  processes: Map<string, IntelligenceProcess>;
  currentMode: IntelligenceMode;
  currentLevel: CognitiveLevel;
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  averageQuality: number;
  metaCognition: number;
  intelligenceQuotient: number;
}

// Factory
export function createNarrativeIntelligenceCoreState(): NarrativeIntelligenceCoreState {
  return {
    processes: new Map(),
    currentMode: 'hybrid',
    currentLevel: 'deep',
    totalProcesses: 0,
    activeProcesses: 0,
    completedProcesses: 0,
    averageQuality: 0.5,
    metaCognition: 0.6,
    intelligenceQuotient: 0.7,
  };
}

// Start process
export function startProcess(
  state: NarrativeIntelligenceCoreState,
  processId: string,
  name: string,
  mode: IntelligenceMode,
  input: string,
  context: string = ''
): NarrativeIntelligenceCoreState {
  const cognitiveState: CognitiveState = {
    level: state.currentLevel,
    focus: name,
    confidence: 0.5,
    context,
    timestamp: Date.now(),
  };

  const process: IntelligenceProcess = {
    processId,
    name,
    mode,
    state: 'awakening',
    cognitiveState,
    input,
    output: '',
    qualityScore: 0,
    startTime: Date.now(),
    endTime: null,
  };

  const processes = new Map(state.processes).set(processId, process);
  return recomputeIntelligence({ ...state, processes, totalProcesses: processes.size, activeProcesses: state.activeProcesses + 1 });
}

// Update process state
export function updateProcessState(
  state: NarrativeIntelligenceCoreState,
  processId: string,
  newState: IntelligenceState,
  output: string = '',
  qualityScore: number = 0
): NarrativeIntelligenceCoreState {
  const process = state.processes.get(processId);
  if (!process) return state;

  const updated: IntelligenceProcess = {
    ...process,
    state: newState,
    output: output || process.output,
    qualityScore,
    cognitiveState: { ...process.cognitiveState, confidence: qualityScore },
    endTime: newState === 'integrating' ? Date.now() : process.endTime,
  };
  const processes = new Map(state.processes).set(processId, updated);

  const completedProcesses = newState === 'integrating' ? state.completedProcesses + 1 : state.completedProcesses;
  const activeProcesses = newState === 'integrating' ? state.activeProcesses - 1 : state.activeProcesses;

  return recomputeIntelligence({ ...state, processes, completedProcesses, activeProcesses: Math.max(0, activeProcesses) });
}

// Set intelligence mode
export function setIntelligenceMode(state: NarrativeIntelligenceCoreState, mode: IntelligenceMode): NarrativeIntelligenceCoreState {
  return { ...state, currentMode: mode };
}

// Set cognitive level
export function setCognitiveLevel(state: NarrativeIntelligenceCoreState, level: CognitiveLevel): NarrativeIntelligenceCoreState {
  return { ...state, currentLevel: level };
}

// Get processes by mode
export function getProcessesByMode(state: NarrativeIntelligenceCoreState, mode: IntelligenceMode): IntelligenceProcess[] {
  return Array.from(state.processes.values()).filter(p => p.mode === mode);
}

// Get processes by state
export function getProcessesByIntelligenceState(state: NarrativeIntelligenceCoreState, intState: IntelligenceState): IntelligenceProcess[] {
  return Array.from(state.processes.values()).filter(p => p.state === intState);
}

// Reflect (meta-cognition)
export function reflect(state: NarrativeIntelligenceCoreState, processId: string, reflection: string): NarrativeIntelligenceCoreState {
  const process = state.processes.get(processId);
  if (!process) return state;

  const updated: IntelligenceProcess = {
    ...process,
    cognitiveState: { ...process.cognitiveState, context: process.cognitiveState.context + '\nReflection: ' + reflection },
  };
  const processes = new Map(state.processes).set(processId, updated);
  return { ...state, processes };
}

// Get intelligence core report
export function getIntelligenceCoreReport(state: NarrativeIntelligenceCoreState): {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  averageQuality: number;
  metaCognition: number;
  intelligenceQuotient: number;
  currentMode: IntelligenceMode;
  currentLevel: CognitiveLevel;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProcesses === 0) recommendations.push('No processes — start intelligence work');
  if (state.metaCognition < 0.5) recommendations.push('Low meta-cognition — reflect more');
  if (state.averageQuality < 0.6) recommendations.push('Quality below 60% — review processes');

  return {
    totalProcesses: state.totalProcesses,
    activeProcesses: state.activeProcesses,
    completedProcesses: state.completedProcesses,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    metaCognition: Math.round(state.metaCognition * 100) / 100,
    intelligenceQuotient: Math.round(state.intelligenceQuotient * 100) / 100,
    currentMode: state.currentMode,
    currentLevel: state.currentLevel,
    recommendations,
  };
}

// Recompute metrics
function recomputeIntelligence(state: NarrativeIntelligenceCoreState): NarrativeIntelligenceCoreState {
  const processes = Array.from(state.processes.values());
  const completed = processes.filter(p => p.state === 'integrating');
  const averageQuality = completed.length > 0
    ? completed.reduce((s, p) => s + p.qualityScore, 0) / completed.length
    : 0.5;

  const reflected = processes.filter(p => p.cognitiveState.context.includes('Reflection:')).length;
  const metaCognition = processes.length > 0 ? reflected / processes.length : 0.6;

  const intelligenceQuotient = (averageQuality + metaCognition) / 2 + 0.2;

  return { ...state, averageQuality, metaCognition, intelligenceQuotient: Math.min(1, intelligenceQuotient) };
}

// Reset intelligence core
export function resetNarrativeIntelligenceCoreState(): NarrativeIntelligenceCoreState {
  return createNarrativeIntelligenceCoreState();
}