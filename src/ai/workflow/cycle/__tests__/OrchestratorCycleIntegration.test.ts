import { describe, it, expect } from 'vitest';
import {
  createOrchestratorHandle,
  startOrchestratorHandle,
  completeOrchestratorHandle,
  failOrchestratorHandle,
  pauseOrchestratorHandle,
  getOrchestratorDurationMs,
  isOrchestratorTerminal,
  listActiveHandles,
} from '../OrchestratorCycleIntegration';

describe('OrchestratorCycleIntegration - handle lifecycle', () => {
  it('creates a pending handle', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    expect(h.status).toBe('pending');
    expect(h.startedAt).toBeNull();
    expect(h.endedAt).toBeNull();
  });

  it('starts the handle', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    expect(h.status).toBe('running');
    expect(h.startedAt).toBe(100);
  });

  it('completes the handle', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    completeOrchestratorHandle(h, () => 500);
    expect(h.status).toBe('completed');
    expect(h.endedAt).toBe(500);
  });

  it('fails the handle', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    failOrchestratorHandle(h, () => 500);
    expect(h.status).toBe('failed');
    expect(h.endedAt).toBe(500);
  });

  it('pauses the handle', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    pauseOrchestratorHandle(h);
    expect(h.status).toBe('paused');
  });
});

describe('OrchestratorCycleIntegration - duration / terminal', () => {
  it('returns 0 duration when not started', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    expect(getOrchestratorDurationMs(h, () => 999)).toBe(0);
  });

  it('returns elapsed ms from start to now', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    expect(getOrchestratorDurationMs(h, () => 500)).toBe(400);
  });

  it('returns frozen duration after complete', () => {
    const h = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h, () => 100);
    completeOrchestratorHandle(h, () => 500);
    expect(getOrchestratorDurationMs(h, () => 9999)).toBe(400);
  });

  it('reports terminal status for completed/failed', () => {
    const h1 = createOrchestratorHandle('h1', 'cyc1');
    startOrchestratorHandle(h1);
    completeOrchestratorHandle(h1);
    expect(isOrchestratorTerminal(h1)).toBe(true);

    const h2 = createOrchestratorHandle('h2', 'cyc1');
    startOrchestratorHandle(h2);
    failOrchestratorHandle(h2);
    expect(isOrchestratorTerminal(h2)).toBe(true);

    const h3 = createOrchestratorHandle('h3', 'cyc1');
    startOrchestratorHandle(h3);
    expect(isOrchestratorTerminal(h3)).toBe(false);
  });
});

describe('OrchestratorCycleIntegration - listActiveHandles', () => {
  it('returns only running/paused handles', () => {
    const h1 = createOrchestratorHandle('h1', 'c');
    startOrchestratorHandle(h1);
    const h2 = createOrchestratorHandle('h2', 'c');
    startOrchestratorHandle(h2);
    pauseOrchestratorHandle(h2);
    const h3 = createOrchestratorHandle('h3', 'c');
    startOrchestratorHandle(h3);
    completeOrchestratorHandle(h3);

    expect(listActiveHandles([h1, h2, h3]).map((h) => h.id)).toEqual(['h1', 'h2']);
  });
});

describe('OrchestratorCycleIntegration - default now() clock', () => {
  it('covers the default `() => Date.now()` clock paths', () => {
    // Three separate scenarios — each exercises one default `now` clock.
    // startOrchestratorHandle: no `endedAt` set yet, so start records `now`.
    const h1 = createOrchestratorHandle('h1', 'c');
    startOrchestratorHandle(h1);
    expect(h1.startedAt).toBeGreaterThan(0);

    // completeOrchestratorHandle: endedAt is null before this call, so the
    // default `now` is invoked.
    const h2 = createOrchestratorHandle('h2', 'c');
    startOrchestratorHandle(h2);
    completeOrchestratorHandle(h2);
    expect(h2.endedAt).toBeGreaterThan(0);

    // failOrchestratorHandle: same path as complete.
    const h3 = createOrchestratorHandle('h3', 'c');
    startOrchestratorHandle(h3);
    failOrchestratorHandle(h3);
    expect(h3.endedAt).toBeGreaterThan(0);

    // getOrchestratorDurationMs: keep endedAt=null so `?? now()` falls
    // through to the default `() => Date.now()` arrow.
    const h4 = createOrchestratorHandle('h4', 'c');
    startOrchestratorHandle(h4);
    expect(getOrchestratorDurationMs(h4)).toBeGreaterThanOrEqual(0);
  });
});
