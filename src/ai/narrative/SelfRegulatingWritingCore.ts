/**
 * V928 SelfRegulatingWritingCore — Direction D Iter 12/15 (Round 4)
 * Self-regulating writing core: writing that regulates itself
 * Sources: ruflo self-regulating + nanobot + thunderbolt
 */

export type RegulationType = 'homeostasis' | 'feedback' | 'feedforward' | 'adaptive' | 'anticipatory';
export type RegulationTarget = 'quality' | 'pacing' | 'consistency' | 'creativity' | 'clarity' | 'voice';
export type RegulationStatus = 'balanced' | 'drifting' | 'correcting' | 'overshooting' | 'stable';

export interface RegulationLoop {
  loopId: string;
  type: RegulationType;
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

export interface SelfRegulatingWritingCoreState {
  loops: Map<string, RegulationLoop>;
  controllers: Map<string, RegulationController>;
  totalLoops: number;
  totalControllers: number;
  averageError: number;
  stableLoops: number;
  regulationStability: number;
  selfRegulationMastery: number;
}

// Factory
export function createSelfRegulatingWritingCoreState(): SelfRegulatingWritingCoreState {
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
export function addRegulationLoop(
  state: SelfRegulatingWritingCoreState,
  loopId: string,
  type: RegulationType,
  target: RegulationTarget,
  setpoint: number,
  current: number,
  chapter: number
): SelfRegulatingWritingCoreState {
  const error = Math.abs(setpoint - current);
  const status: RegulationStatus = error < 0.05 ? 'stable'
    : error < 0.15 ? 'correcting'
    : error < 0.3 ? 'drifting'
    : 'overshooting';
  const loop: RegulationLoop = { loopId, type, target, setpoint, current, error, status, chapter };
  const loops = new Map(state.loops).set(loopId, loop);
  const stableLoops = status === 'stable' ? state.stableLoops + 1 : state.stableLoops;
  return recomputeSelfReg({ ...state, loops, stableLoops, totalLoops: loops.size });
}

// Add controller
export function addRegulationController(
  state: SelfRegulatingWritingCoreState,
  controllerId: string,
  loopId: string,
  gain: number,
  action: string,
  effectiveness: number
): SelfRegulatingWritingCoreState {
  const controller: RegulationController = { controllerId, loopId, gain, action, effectiveness, iterations: 0 };
  const controllers = new Map(state.controllers).set(controllerId, controller);
  return recomputeSelfReg({ ...state, controllers, totalControllers: controllers.size });
}

// Update loop
export function updateLoopCurrent(state: SelfRegulatingWritingCoreState, loopId: string, current: number): SelfRegulatingWritingCoreState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;

  const error = Math.abs(loop.setpoint - current);
  const status: RegulationStatus = error < 0.05 ? 'stable'
    : error < 0.15 ? 'correcting'
    : error < 0.3 ? 'drifting'
    : 'overshooting';
  const updated: RegulationLoop = { ...loop, current, error, status };
  const loops = new Map(state.loops).set(loopId, updated);
  const stableLoops = updated.status === 'stable' && loop.status !== 'stable' ? state.stableLoops + 1 : state.stableLoops;
  return recomputeSelfReg({ ...state, loops, stableLoops });
}

// Get loops by target
export function getLoopsByTarget(state: SelfRegulatingWritingCoreState, target: RegulationTarget): RegulationLoop[] {
  return Array.from(state.loops.values()).filter(l => l.target === target);
}

// Get regulation report
export function getRegulationReport(state: SelfRegulatingWritingCoreState): {
  totalLoops: number;
  totalControllers: number;
  averageError: number;
  stableLoops: number;
  regulationStability: number;
  selfRegulationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — add loops');
  if (state.averageError > 0.2) recommendations.push('High error — tune controllers');
  if (state.regulationStability < 0.5) recommendations.push('Low stability — improve');

  return {
    totalLoops: state.totalLoops,
    totalControllers: state.totalControllers,
    averageError: Math.round(state.averageError * 100) / 100,
    stableLoops: state.stableLoops,
    regulationStability: Math.round(state.regulationStability * 100) / 100,
    selfRegulationMastery: Math.round(state.selfRegulationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfReg(state: SelfRegulatingWritingCoreState): SelfRegulatingWritingCoreState {
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

// Reset regulation state
export function resetSelfRegulatingWritingCoreState(): SelfRegulatingWritingCoreState {
  return createSelfRegulatingWritingCoreState();
}