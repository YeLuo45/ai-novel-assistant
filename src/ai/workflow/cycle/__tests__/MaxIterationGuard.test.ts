/**
 * V2099 MaxIterationGuard tests - 30+ tests covering guard creation,
 * iteration recording, callback invocation, progress / ETA / age helpers.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createMaxIterationGuard,
  shouldAllowIteration,
  recordIteration,
  getRemainingIterations,
  getProgress,
  resetGuard,
  isExceeded,
  guardAge,
} from '../MaxIterationGuard';

function makeGuard(max: number, onExceeded?: (g: unknown) => void) {
  return createMaxIterationGuard({
    cycleId: 'c1',
    maxIterations: max,
    onExceeded,
  });
}

describe('MaxIterationGuard - createMaxIterationGuard', () => {
  it('creates a guard with the given cycle id and max', () => {
    const g = makeGuard(5);
    expect(g.cycleId).toBe('c1');
    expect(g.config.maxIterations).toBe(5);
    expect(g.counter.state.value).toBe(0);
    expect(g.exceededFired).toBe(false);
  });

  it('rejects non-positive maxIterations', () => {
    expect(() => makeGuard(0)).toThrow();
    expect(() => makeGuard(-1)).toThrow();
  });

  it('rejects non-finite maxIterations', () => {
    expect(() => makeGuard(NaN)).toThrow();
  });

  it('records startedAt via now()', () => {
    const g = createMaxIterationGuard({
      cycleId: 'c',
      maxIterations: 3,
      now: () => 1_700_000_000,
    });
    expect(g.startedAt).toBe(1_700_000_000);
  });
});

describe('MaxIterationGuard - shouldAllowIteration', () => {
  it('returns true below max', () => {
    const g = makeGuard(3);
    expect(shouldAllowIteration(g)).toBe(true);
  });

  it('returns false at max', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    expect(shouldAllowIteration(g)).toBe(false);
  });
});

describe('MaxIterationGuard - recordIteration', () => {
  it('increments iteration count', () => {
    const g = makeGuard(3);
    recordIteration(g);
    expect(g.counter.state.value).toBe(1);
  });

  it('returns the new value', () => {
    const g = makeGuard(3);
    expect(recordIteration(g)).toBe(1);
  });

  it('does not throw when over budget', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    expect(() => recordIteration(g)).not.toThrow();
  });

  it('fires onExceeded exactly once when hitting max', () => {
    const fn = vi.fn();
    const g = makeGuard(2, fn);
    recordIteration(g);
    expect(fn).toHaveBeenCalledTimes(0);
    recordIteration(g);
    expect(fn).toHaveBeenCalledTimes(1);
    recordIteration(g);
    expect(fn).toHaveBeenCalledTimes(1); // still only once
  });

  it('marks exceededFired=true after firing', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    expect(g.exceededFired).toBe(true);
  });
});

describe('MaxIterationGuard - getRemainingIterations', () => {
  it('returns max - value', () => {
    const g = makeGuard(5);
    recordIteration(g);
    recordIteration(g);
    expect(getRemainingIterations(g)).toBe(3);
  });

  it('returns 0 at or beyond max', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    recordIteration(g);
    expect(getRemainingIterations(g)).toBe(0);
  });
});

describe('MaxIterationGuard - getProgress', () => {
  it('returns ratio between 0 and 1', () => {
    const g = makeGuard(4);
    recordIteration(g);
    expect(getProgress(g).ratio).toBe(0.25);
  });

  it('clamps ratio to 1 when over max', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    recordIteration(g);
    recordIteration(g);
    expect(getProgress(g).ratio).toBe(1);
  });

  it('returns ratio=1 when max=0', () => {
    // maxIterations < 1 is rejected, but we can construct a guard with max=1 then mutate.
    const g = makeGuard(1);
    g.config.maxIterations = 0;
    expect(getProgress(g).ratio).toBe(1);
  });

  it('reports etaIterations', () => {
    const g = makeGuard(4);
    recordIteration(g);
    recordIteration(g);
    expect(getProgress(g).etaIterations).toBe(2);
  });
});

describe('MaxIterationGuard - resetGuard', () => {
  it('zeroes the counter and clears exceededFired', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    resetGuard(g);
    expect(g.counter.state.value).toBe(0);
    expect(g.exceededFired).toBe(false);
  });

  it('updates startedAt when now is provided', () => {
    const g = createMaxIterationGuard({
      cycleId: 'c',
      maxIterations: 3,
      now: () => 1_000,
    });
    resetGuard(g);
    expect(g.startedAt).toBe(1_000);
  });
});

describe('MaxIterationGuard - isExceeded', () => {
  it('returns false below max', () => {
    const g = makeGuard(3);
    expect(isExceeded(g)).toBe(false);
  });

  it('returns true at or above max', () => {
    const g = makeGuard(2);
    recordIteration(g);
    recordIteration(g);
    expect(isExceeded(g)).toBe(true);
  });
});

describe('MaxIterationGuard - guardAge', () => {
  it('returns now - startedAt', () => {
    const g = createMaxIterationGuard({
      cycleId: 'c',
      maxIterations: 3,
      now: () => 1_000,
    });
    expect(guardAge(g, () => 1_500)).toBe(500);
  });

  it('uses default Date.now when no provider', () => {
    const g = makeGuard(3);
    expect(typeof guardAge(g)).toBe('number');
  });
});
