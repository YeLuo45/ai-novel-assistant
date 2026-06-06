/**
 * V968 NarrativeSelfRegulationEngine — Direction A Iter 2/15 (Round 5)
 * Self-regulation engine: self-regulating narrative behavior
 * Sources: ruflo self-reg + generic-agent + nanobot
 */

export type RegulationLoop = 'homeostasis' | 'feedback' | 'feedforward' | 'adaptive' | 'anticipatory';
export type RegulationTarget = 'quality' | 'consistency' | 'pacing' | 'depth' | 'engagement' | 'voice';
export type RegulationStatus = 'balanced' | 'drifting' | 'correcting' | 'overshooting' | 'stable';

export interface RegulationLoopData {
  loopId: string;
  loop: RegulationLoop;
  target: RegulationTarget;
  setpoint: number;
  current: number;
  error: number;
  status: RegulationStatus;
  chapter: number;
}

export interface RegulationController {
  controllerId: string;
  loopId: string;
  gain: number;
  action: string;
  effectiveness: number;
  iterations: number;
}

export interface NarrativeSelfRegulationEngineState {
  loops: Map<string, RegulationLoopData>;
  controllers: Map<string, RegulationController>;
  totalLoops: number;
  totalControllers: number;
  averageError: number;
  stableLoops: number;
  regulationStability: number;
  selfRegulationMastery: number;
}

// Factory
export function createNarrativeSelfRegulationEngineState(): NarrativeSelfRegulationEngineState {
  return {
    loops: new Map(),
    controllers: new Map(),
    totalLoops: 0,
    totalControllers: 0,
    averageError: 0,
    stableLoops: 0,
    regulationStability: 0.5,
    selfRegulationMastery: 0.5,
  };
}

// Add loop
export function addSelfRegulationLoop(
  state: NarrativeSelfRegulationEngineState,
  loopId: string,
  loop: RegulationLoop,
  target: RegulationTarget,
  setpoint: number,
  current: number,
  chapter: number
): NarrativeSelfRegulationEngineState {
  const error = Math.abs(setpoint - current);
  const status: RegulationStatus = error < 0.05 ? 'stable'
    : error < 0.15 ? 'correcting'
    : error < 0.3 ? 'drifting'
    : 'overshooting';
  const regLoop: RegulationLoopData = { loopId, loop, target, setpoint, current, error, status, chapter };
  const loops = new Map(state.loops).set(loopId, regLoop);
  const stableLoops = status === 'stable' ? state.stableLoops + 1 : state.stableLoops;
  return recomputeSelfRegEngine({ ...state, loops, stableLoops, totalLoops: loops.size });
}

// Add controller
export function addSelfRegulationController(
  state: NarrativeSelfRegulationEngineState,
  controllerId: string,
  loopId: string,
  gain: number,
  action: string,
  effectiveness: number
): NarrativeSelfRegulationEngineState {
  const controller: RegulationController = { controllerId, loopId, gain, action, effectiveness, iterations: 0 };
  const controllers = new Map(state.controllers).set(controllerId, controller);
  return recomputeSelfRegEngine({ ...state, controllers, totalControllers: controllers.size });
}

// Update loop
export function updateSelfRegulationLoop(state: NarrativeSelfRegulationEngineState, loopId: string, current: number): NarrativeSelfRegulationEngineState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;

  const error = Math.abs(loop.setpoint - current);
  const status: RegulationStatus = error < 0.05 ? 'stable'
    : error < 0.15 ? 'correcting'
    : error < 0.3 ? 'drifting'
    : 'overshooting';
  const updated: RegulationLoopData = { ...loop, current, error, status };
  const loops = new Map(state.loops).set(loopId, updated);
  const stableLoops = updated.status === 'stable' && loop.status !== 'stable' ? state.stableLoops + 1 : state.stableLoops;
  return recomputeSelfRegEngine({ ...state, loops, stableLoops });
}

// Get loops by target
export function getLoopsByTargetSR(state: NarrativeSelfRegulationEngineState, target: RegulationTarget): RegulationLoopData[] {
  return Array.from(state.loops.values()).filter(l => l.target === target);
}

// Get regulation report
export function getSelfRegulationReport(state: NarrativeSelfRegulationEngineState): {
  totalLoops: number;
  totalControllers: number;
  averageError: number;
  regulationStability: number;
  selfRegulationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — add regulation loops');
  if (state.averageError > 0.2) recommendations.push('High error — tune controllers');
  if (state.regulationStability < 0.5) recommendations.push('Low stability — improve');

  return {
    totalLoops: state.totalLoops,
    totalControllers: state.totalControllers,
    averageError: Math.round(state.averageError * 100) / 100,
    regulationStability: Math.round(state.regulationStability * 100) / 100,
    selfRegulationMastery: Math.round(state.selfRegulationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfRegEngine(state: NarrativeSelfRegulationEngineState): NarrativeSelfRegulationEngineState {
  const loops = Array.from(state.loops.values());
  const totalError = loops.reduce((s, l) => s + l.error, 0);
  const averageError = loops.length === 0 ? 0 : totalError / loops.length;
  const regulationStability = loops.length === 0 ? 0.5
    : state.stableLoops / loops.length;

  const controllers = Array.from(state.controllers.values());
  const avgEffectiveness = controllers.length === 0 ? 0.5
    : controllers.reduce((s, c) => s + c.effectiveness, 0) / controllers.length;

  const selfRegulationMastery = ((1 - averageError) * 0.4 + regulationStability * 0.3 + avgEffectiveness * 0.3);

  return { ...state, averageError, regulationStability, selfRegulationMastery };
}

// Reset
export function resetNarrativeSelfRegulationEngineState(): NarrativeSelfRegulationEngineState {
  return createNarrativeSelfRegulationEngineState();
}