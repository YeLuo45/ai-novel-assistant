/**
 * V2105 Direction A Iteration 20/30 Round 6: PhaseEngineCycleBridge
 *
 * Bridges the existing PhaseEngine into the cycle subsystem. Allows
 * phases to declare themselves as cycle-aware so they participate in
 * cycle detection and exit conditions.
 *
 * Inspired by:
 * - chatdev-design: phase + cycle bridge
 * - ruflo-design: hierarchical worker bridge
 */

export interface PhaseDefinition {
  id: string;
  name: string;
  cycleAware: boolean;
  exitCondition?: string;
}

export interface CyclePhaseBinding {
  phaseId: string;
  cycleId: string;
  bindingAt: number;
}

export function bindPhaseToCycle(
  phase: PhaseDefinition,
  cycleId: string,
  now: () => number = () => Date.now()
): CyclePhaseBinding {
  if (!phase.cycleAware) {
    throw new Error(`Phase "${phase.id}" is not cycle-aware; cannot bind`);
  }
  return { phaseId: phase.id, cycleId, bindingAt: now() };
}

export function unbindPhase(binding: CyclePhaseBinding): null {
  void binding;
  return null;
}

export function listCycleAwarePhases(phases: PhaseDefinition[]): PhaseDefinition[] {
  return phases.filter((p) => p.cycleAware);
}

export function describeBinding(binding: CyclePhaseBinding): string {
  return `phase=${binding.phaseId} → cycle=${binding.cycleId} @ ${new Date(binding.bindingAt).toISOString()}`;
}

export interface CyclePhaseExecution {
  phaseId: string;
  cycleId: string;
  startedAt: number;
  endedAt: number | null;
  exitReason: string | null;
}

export function startPhaseExecution(
  binding: CyclePhaseBinding,
  now: () => number = () => Date.now()
): CyclePhaseExecution {
  return {
    phaseId: binding.phaseId,
    cycleId: binding.cycleId,
    startedAt: now(),
    endedAt: null,
    exitReason: null,
  };
}

export function endPhaseExecution(
  exec: CyclePhaseExecution,
  exitReason: string,
  now: () => number = () => Date.now()
): CyclePhaseExecution {
  exec.endedAt = now();
  exec.exitReason = exitReason;
  return exec;
}

export function isPhaseActive(exec: CyclePhaseExecution): boolean {
  return exec.endedAt === null;
}

export function getPhaseDurationMs(
  exec: CyclePhaseExecution,
  now: () => number = () => Date.now()
): number {
  const end = exec.endedAt ?? now();
  return end - exec.startedAt;
}
