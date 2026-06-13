import { describe, it, expect } from 'vitest';
import {
  createOrchestratorState,
  addJob,
  processNext,
  pendingCount,
  completionRate,
  setStrategy,
  orchestratorHealth,
} from './SyncOrchestrator';

describe('V2141 SyncOrchestrator', () => {
  it('should create empty orchestrator', () => {
    const s = createOrchestratorState();
    expect(s.jobs).toEqual([]);
    expect(pendingCount(s)).toBe(0);
  });

  it('should add job', () => {
    const s = addJob(createOrchestratorState(), { jobId: 'j1', entityId: 'e1', priority: 1, strategy: 'immediate' });
    expect(pendingCount(s)).toBe(1);
  });

  it('should process highest priority job first', () => {
    let s = createOrchestratorState();
    s = addJob(s, { jobId: 'j1', entityId: 'e1', priority: 1, strategy: 'immediate' });
    s = addJob(s, { jobId: 'j2', entityId: 'e2', priority: 5, strategy: 'batched' });
    const r = processNext(s);
    expect(r.processed?.jobId).toBe('j2');
  });

  it('should return null when no jobs', () => {
    const r = processNext(createOrchestratorState());
    expect(r.processed).toBe(null);
  });

  it('should compute completion rate', () => {
    const s = createOrchestratorState();
    expect(completionRate(s)).toBe(1);
  });

  it('should set strategy', () => {
    const s = setStrategy(createOrchestratorState(), 'crdt_merge');
    expect(s.strategy).toBe('crdt_merge');
  });

  it('should compute orchestrator health', () => {
    const s = createOrchestratorState();
    const h = orchestratorHealth(s);
    expect(h.pending).toBe(0);
    expect(h.health).toBe(1);
  });

  it('should track completed count', () => {
    let s = createOrchestratorState();
    s = addJob(s, { jobId: 'j1', entityId: 'e1', priority: 1, strategy: 'immediate' });
    const r = processNext(s);
    s = r.state;
    expect(s.completed).toBe(1);
  });

  it('should add multiple jobs in priority order', () => {
    let s = createOrchestratorState();
    s = addJob(s, { jobId: 'j1', entityId: 'e1', priority: 3, strategy: 'lazy' });
    s = addJob(s, { jobId: 'j2', entityId: 'e2', priority: 3, strategy: 'immediate' });
    s = addJob(s, { jobId: 'j3', entityId: 'e3', priority: 1, strategy: 'batched' });
    const r = processNext(s);
    expect(r.processed?.priority).toBe(3);
  });
});
