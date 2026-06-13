// V2141 SyncOrchestrator - Direction A Iter 26/30
// 同步编排器 - 多策略协调
// Source: generic-agent (orchestration)

import { createQueue, enqueue, markDone, type SyncQueueState } from '../sync/SyncQueue';
import { resolveLWW, type ResolutionStrategy } from '../sync/ConflictResolver';

export type SyncStrategy = 'immediate' | 'batched' | 'lazy' | 'manual';

export interface SyncJob {
  jobId: string;
  entityId: string;
  priority: number;
  strategy: SyncStrategy;
  addedAt: number;
}

export interface OrchestratorState {
  jobs: SyncJob[];
  queue: SyncQueueState;
  strategy: ResolutionStrategy;
  completed: number;
  failed: number;
}

export function createOrchestratorState(strategy: ResolutionStrategy = 'lww'): OrchestratorState {
  return { jobs: [], queue: createQueue(), strategy, completed: 0, failed: 0 };
}

export function addJob(state: OrchestratorState, job: Omit<SyncJob, 'addedAt'>): OrchestratorState {
  const fullJob: SyncJob = { ...job, addedAt: Date.now() };
  return {
    ...state,
    jobs: [...state.jobs, fullJob],
    queue: enqueue(state.queue, job.jobId, { entityId: job.entityId, strategy: job.strategy }),
  };
}

export function processNext(state: OrchestratorState): { state: OrchestratorState; processed: SyncJob | null } {
  const next = [...state.jobs].sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt)[0];
  if (!next) return { state, processed: null };
  const queue = markDone(state.queue, next.jobId);
  return { state: { ...state, jobs: state.jobs.filter((j) => j.jobId !== next.jobId), queue, completed: state.completed + 1 }, processed: next };
}

export function resolveConflict(state: OrchestratorState, ops: Parameters<typeof resolveLWW>[0]) {
  return resolveLWW(ops);
}

export function pendingCount(state: OrchestratorState): number {
  return state.jobs.length;
}

export function completionRate(state: OrchestratorState): number {
  const total = state.completed + state.failed;
  return total > 0 ? state.completed / total : 1;
}

export function setStrategy(state: OrchestratorState, strategy: ResolutionStrategy): OrchestratorState {
  return { ...state, strategy };
}

export function orchestratorHealth(state: OrchestratorState): {
  pending: number;
  completed: number;
  failed: number;
  rate: number;
  health: number;
} {
  const rate = completionRate(state);
  return {
    pending: state.jobs.length,
    completed: state.completed,
    failed: state.failed,
    rate,
    health: rate,
  };
}
