/**
 * V2106 Direction A Iteration 21/30 Round 6: OrchestratorCycleIntegration
 *
 * Integrates the existing orchestrator with the cycle subsystem so the
 * orchestrator can spawn, monitor, and shut down cycle executions.
 *
 * Inspired by:
 * - chatdev-design: orchestrator + cycle integration
 * - nanobot-design: mesh orchestrator
 */

export interface OrchestratorCycleHandle {
  id: string;
  cycleId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  startedAt: number | null;
  endedAt: number | null;
  metadata: Record<string, string>;
}

export function createOrchestratorHandle(
  id: string,
  cycleId: string,
  metadata: Record<string, string> = {}
): OrchestratorCycleHandle {
  return {
    id,
    cycleId,
    status: 'pending',
    startedAt: null,
    endedAt: null,
    metadata,
  };
}

export function startOrchestratorHandle(
  h: OrchestratorCycleHandle,
  now: () => number = () => Date.now()
): OrchestratorCycleHandle {
  h.status = 'running';
  h.startedAt = now();
  return h;
}

export function completeOrchestratorHandle(
  h: OrchestratorCycleHandle,
  now: () => number = () => Date.now()
): OrchestratorCycleHandle {
  h.status = 'completed';
  h.endedAt = now();
  return h;
}

export function failOrchestratorHandle(
  h: OrchestratorCycleHandle,
  now: () => number = () => Date.now()
): OrchestratorCycleHandle {
  h.status = 'failed';
  h.endedAt = now();
  return h;
}

export function pauseOrchestratorHandle(h: OrchestratorCycleHandle): OrchestratorCycleHandle {
  h.status = 'paused';
  return h;
}

export function getOrchestratorDurationMs(
  h: OrchestratorCycleHandle,
  now: () => number = () => Date.now()
): number {
  if (h.startedAt === null) return 0;
  const end = h.endedAt ?? now();
  return end - h.startedAt;
}

export function isOrchestratorTerminal(h: OrchestratorCycleHandle): boolean {
  return h.status === 'completed' || h.status === 'failed';
}

export function listActiveHandles(handles: OrchestratorCycleHandle[]): OrchestratorCycleHandle[] {
  return handles.filter((h) => h.status === 'running' || h.status === 'paused');
}
