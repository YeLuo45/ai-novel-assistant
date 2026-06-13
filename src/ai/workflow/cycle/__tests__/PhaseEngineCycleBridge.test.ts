import { describe, it, expect } from 'vitest';
import {
  bindPhaseToCycle,
  unbindPhase,
  listCycleAwarePhases,
  describeBinding,
  startPhaseExecution,
  endPhaseExecution,
  isPhaseActive,
  getPhaseDurationMs,
} from '../PhaseEngineCycleBridge';

describe('PhaseEngineCycleBridge - bindPhaseToCycle', () => {
  it('binds a cycle-aware phase', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1', () => 1000);
    expect(b.phaseId).toBe('p1');
    expect(b.cycleId).toBe('cyc1');
    expect(b.bindingAt).toBe(1000);
  });

  it('throws when binding a non-cycle-aware phase', () => {
    expect(() =>
      bindPhaseToCycle({ id: 'p2', name: 'X', cycleAware: false }, 'cyc1')
    ).toThrow();
  });
});

describe('PhaseEngineCycleBridge - unbindPhase', () => {
  it('returns null', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1');
    expect(unbindPhase(b)).toBeNull();
  });
});

describe('PhaseEngineCycleBridge - listCycleAwarePhases', () => {
  it('filters phases', () => {
    const phases = [
      { id: 'a', name: 'A', cycleAware: true },
      { id: 'b', name: 'B', cycleAware: false },
      { id: 'c', name: 'C', cycleAware: true },
    ];
    expect(listCycleAwarePhases(phases).map((p) => p.id)).toEqual(['a', 'c']);
  });
});

describe('PhaseEngineCycleBridge - describeBinding', () => {
  it('includes phase and cycle ids', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1');
    expect(describeBinding(b)).toContain('p1');
    expect(describeBinding(b)).toContain('cyc1');
  });
});

describe('PhaseEngineCycleBridge - phase execution lifecycle', () => {
  it('starts as active', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1', () => 1000);
    const exec = startPhaseExecution(b, () => 1000);
    expect(isPhaseActive(exec)).toBe(true);
    expect(exec.endedAt).toBeNull();
  });

  it('ends and updates exit reason', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1', () => 1000);
    const exec = startPhaseExecution(b, () => 1000);
    endPhaseExecution(exec, 'target', () => 1500);
    expect(isPhaseActive(exec)).toBe(false);
    expect(exec.exitReason).toBe('target');
    expect(exec.endedAt).toBe(1500);
  });

  it('computes duration', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1', () => 1000);
    const exec = startPhaseExecution(b, () => 1000);
    endPhaseExecution(exec, 'completed', () => 2500);
    expect(getPhaseDurationMs(exec, () => 9999)).toBe(1500);
  });

  it('reports current duration when still active', () => {
    const b = bindPhaseToCycle({ id: 'p1', name: 'Plan', cycleAware: true }, 'cyc1', () => 1000);
    const exec = startPhaseExecution(b, () => 1000);
    expect(getPhaseDurationMs(exec, () => 1500)).toBe(500);
  });
});

describe('PhaseEngineCycleBridge - default now() clock', () => {
  it('covers the default `() => Date.now()` clock paths', () => {
    // bindPhaseToCycle: not throwing → default `now` is invoked.
    const b1 = bindPhaseToCycle(
      { id: 'p1', name: 'Plan', cycleAware: true },
      'cyc1'
    );
    expect(b1.bindingAt).toBeGreaterThan(0);

    // startPhaseExecution: endedAt is null → default `now` is invoked.
    const b2 = bindPhaseToCycle(
      { id: 'p2', name: 'Plan', cycleAware: true },
      'cyc1'
    );
    const exec2 = startPhaseExecution(b2);
    expect(exec2.startedAt).toBeGreaterThan(0);

    // endPhaseExecution: passed by tests; still need a fresh default path.
    const b3 = bindPhaseToCycle(
      { id: 'p3', name: 'Plan', cycleAware: true },
      'cyc1'
    );
    const exec3 = startPhaseExecution(b3);
    endPhaseExecution(exec3, 'ok');
    expect(exec3.endedAt).toBeGreaterThan(0);

    // getPhaseDurationMs: keep endedAt=null so `?? now()` falls through to
    // the default `() => Date.now()` arrow.
    const b4 = bindPhaseToCycle(
      { id: 'p4', name: 'Plan', cycleAware: true },
      'cyc1'
    );
    const exec4 = startPhaseExecution(b4);
    expect(getPhaseDurationMs(exec4)).toBeGreaterThanOrEqual(0);
  });
});
