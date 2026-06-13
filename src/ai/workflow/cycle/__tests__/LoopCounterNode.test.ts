/**
 * V2089 LoopCounterNode tests - 45+ tests covering creation, increment /
 * decrement / reset, boundary handling, snapshotting and serialization.
 */

import { describe, it, expect } from 'vitest';
import {
  createLoopCounterNode,
  incrementCounter,
  decrementCounter,
  resetCounter,
  hasReachedMax,
  hasReachedMin,
  getRemainingIterations,
  getProgressRatio,
  snapshotCounter,
  deserializeCounter,
  estimateCapacity,
  compareCounters,
} from '../LoopCounterNode';

function makeNode(overrides: Partial<Parameters<typeof createLoopCounterNode>[1]> = {}) {
  return createLoopCounterNode('counter-1', {
    max: 10,
    min: 0,
    step: 1,
    initial: 0,
    ...overrides,
  });
}

describe('LoopCounterNode - createLoopCounterNode', () => {
  it('creates a node with sensible defaults', () => {
    const n = createLoopCounterNode('n1', { max: 5 });
    expect(n.id).toBe('n1');
    expect(n.state.value).toBe(0);
    expect(n.config.max).toBe(5);
    expect(n.config.min).toBe(0);
    expect(n.config.step).toBe(1);
  });

  it('honours initial value', () => {
    const n = createLoopCounterNode('n', { max: 10, initial: 5 });
    expect(n.state.value).toBe(5);
  });

  it('honours step and min overrides', () => {
    const n = createLoopCounterNode('n', { max: 20, step: 2, min: -5, initial: -5 });
    expect(n.config.step).toBe(2);
    expect(n.config.min).toBe(-5);
    expect(n.state.value).toBe(-5);
  });

  it('rejects negative max', () => {
    expect(() => createLoopCounterNode('n', { max: -1 })).toThrow(/max must be/);
  });

  it('rejects non-positive step', () => {
    expect(() => createLoopCounterNode('n', { max: 10, step: 0 })).toThrow(/step must be/);
  });

  it('rejects NaN max', () => {
    expect(() => createLoopCounterNode('n', { max: NaN })).toThrow();
  });

  it('rejects NaN min', () => {
    expect(() => createLoopCounterNode('n', { max: 5, min: NaN })).toThrow(/min must be/);
  });

  it('rejects Infinity min', () => {
    expect(() => createLoopCounterNode('n', { max: 5, min: Infinity })).toThrow(/min must be/);
  });

  it('rejects min greater than max', () => {
    expect(() => createLoopCounterNode('n', { max: 5, min: 10 })).toThrow();
  });

  it('rejects initial outside [min, max]', () => {
    expect(() => createLoopCounterNode('n', { max: 5, initial: 10 })).toThrow();
    expect(() => createLoopCounterNode('n', { max: 5, min: 0, initial: -1 })).toThrow();
  });

  it('records lastUpdatedAt and initial history entry', () => {
    const fixed = () => 1_700_000_000;
    const n = createLoopCounterNode('n', { max: 5 }, fixed);
    expect(n.state.lastUpdatedAt).toBe(1_700_000_000);
    expect(n.state.history).toEqual([0]);
  });
});

describe('LoopCounterNode - incrementCounter', () => {
  it('advances value by step', () => {
    const n = makeNode();
    expect(incrementCounter(n)).toBe(1);
    expect(n.state.value).toBe(1);
  });

  it('honours a custom amount', () => {
    const n = makeNode({ step: 2 });
    incrementCounter(n, 5);
    expect(n.state.value).toBe(5);
  });

  it('updates lastUpdatedAt via now()', () => {
    let t = 1_000;
    const n = makeNode();
    incrementCounter(n, undefined, () => t);
    expect(n.state.lastUpdatedAt).toBe(1_000);
    t = 2_000;
    incrementCounter(n, undefined, () => t);
    expect(n.state.lastUpdatedAt).toBe(2_000);
  });

  it('pushes the new value onto history', () => {
    const n = makeNode();
    incrementCounter(n);
    incrementCounter(n);
    expect(n.state.history).toEqual([0, 1, 2]);
  });

  it('throws when increment would exceed max', () => {
    const n = makeNode({ initial: 10, max: 10 });
    // value already at max; any increment step pushes it past max.
    expect(() => incrementCounter(n)).toThrow(/exceed max/);
  });

  it('throws on non-positive amount', () => {
    const n = makeNode();
    expect(() => incrementCounter(n, 0)).toThrow();
    expect(() => incrementCounter(n, -1)).toThrow();
  });

  it('throws on non-finite amount', () => {
    const n = makeNode();
    expect(() => incrementCounter(n, NaN)).toThrow();
    expect(() => incrementCounter(n, Infinity)).toThrow();
  });

  it('counts total increments', () => {
    const n = makeNode();
    incrementCounter(n);
    incrementCounter(n);
    expect(n.state.totalIncrements).toBe(2);
    expect(n.state.totalDecrements).toBe(0);
  });
});

describe('LoopCounterNode - decrementCounter', () => {
  it('decreases value by step', () => {
    const n = makeNode({ initial: 5 });
    expect(decrementCounter(n)).toBe(4);
    expect(n.state.value).toBe(4);
  });

  it('honours a custom amount', () => {
    const n = makeNode({ initial: 10, step: 3 });
    decrementCounter(n, 7);
    expect(n.state.value).toBe(3);
  });

  it('throws when decrement would go below min', () => {
    const n = makeNode({ initial: 0 });
    expect(() => decrementCounter(n)).toThrow(/below min/);
  });

  it('updates history', () => {
    const n = makeNode({ initial: 3 });
    decrementCounter(n);
    decrementCounter(n);
    expect(n.state.history).toEqual([3, 2, 1]);
  });

  it('counts total decrements', () => {
    const n = makeNode({ initial: 5 });
    decrementCounter(n);
    decrementCounter(n);
    expect(n.state.totalDecrements).toBe(2);
  });

  it('throws on non-positive amount', () => {
    const n = makeNode({ initial: 5 });
    expect(() => decrementCounter(n, 0)).toThrow();
    expect(() => decrementCounter(n, -2)).toThrow();
  });

  it('throws on non-finite amount', () => {
    const n = makeNode({ initial: 5 });
    expect(() => decrementCounter(n, NaN)).toThrow();
  });
});

describe('LoopCounterNode - resetCounter', () => {
  it('resets to initial by default', () => {
    const n = makeNode({ initial: 2 });
    incrementCounter(n);
    incrementCounter(n);
    expect(resetCounter(n)).toBe(2);
    expect(n.state.value).toBe(2);
  });

  it('resets to a custom value', () => {
    const n = makeNode();
    resetCounter(n, 5);
    expect(n.state.value).toBe(5);
  });

  it('throws when target is outside [min, max]', () => {
    const n = makeNode();
    expect(() => resetCounter(n, 100)).toThrow();
    expect(() => resetCounter(n, -1)).toThrow();
  });

  it('counts total resets', () => {
    const n = makeNode();
    resetCounter(n, 3);
    resetCounter(n, 5);
    expect(n.state.totalResets).toBe(2);
  });

  it('updates lastUpdatedAt', () => {
    let t = 100;
    const n = makeNode();
    resetCounter(n, 5, () => t);
    expect(n.state.lastUpdatedAt).toBe(100);
    t = 200;
    resetCounter(n, 3, () => t);
    expect(n.state.lastUpdatedAt).toBe(200);
  });

  it('appends reset value to history', () => {
    const n = makeNode({ initial: 1 });
    incrementCounter(n);
    resetCounter(n, 0);
    expect(n.state.history).toEqual([1, 2, 0]);
  });
});

describe('LoopCounterNode - hasReachedMax / hasReachedMin', () => {
  it('hasReachedMax is false below max', () => {
    const n = makeNode({ max: 10, initial: 9 });
    expect(hasReachedMax(n)).toBe(false);
  });

  it('hasReachedMax is true at or above max', () => {
    const n = makeNode({ max: 10, initial: 10 });
    expect(hasReachedMax(n)).toBe(true);
  });

  it('hasReachedMin is true at or below min', () => {
    const n = makeNode({ min: 0, initial: 0 });
    expect(hasReachedMin(n)).toBe(true);
  });

  it('hasReachedMin is false above min', () => {
    const n = makeNode({ min: 0, initial: 1 });
    expect(hasReachedMin(n)).toBe(false);
  });
});

describe('LoopCounterNode - getRemainingIterations', () => {
  it('returns max - value when below max', () => {
    const n = makeNode({ max: 10, initial: 3 });
    expect(getRemainingIterations(n)).toBe(7);
  });

  it('returns 0 at max', () => {
    const n = makeNode({ max: 10, initial: 10 });
    expect(getRemainingIterations(n)).toBe(0);
  });

  it('returns 0 above max', () => {
    const n = makeNode({ max: 5 });
    n.state.value = 8;
    expect(getRemainingIterations(n)).toBe(0);
  });
});

describe('LoopCounterNode - getProgressRatio', () => {
  it('returns 0 at min', () => {
    const n = makeNode({ min: 0, max: 10, initial: 0 });
    expect(getProgressRatio(n)).toBe(0);
  });

  it('returns 1 at max', () => {
    const n = makeNode({ min: 0, max: 10, initial: 10 });
    expect(getProgressRatio(n)).toBe(1);
  });

  it('returns fraction for intermediate value', () => {
    const n = makeNode({ min: 0, max: 10, initial: 5 });
    expect(getProgressRatio(n)).toBe(0.5);
  });

  it('clamps to 0..1 when value out of range', () => {
    const n = makeNode({ max: 10, initial: 0 });
    n.state.value = 15;
    expect(getProgressRatio(n)).toBe(1);
  });

  it('returns 1 when range is 0 and value >= max', () => {
    const n = createLoopCounterNode('n', { max: 5, min: 5, initial: 5 });
    n.state.value = 5;
    expect(getProgressRatio(n)).toBe(1);
  });

  it('returns 0 when range is 0 and value < max', () => {
    const n = createLoopCounterNode('n', { max: 5, min: 5, initial: 5 });
    n.state.value = 4;
    expect(getProgressRatio(n)).toBe(0);
  });

  it('returns 1 when range is negative and value >= max', () => {
    // min > max (degenerate): range = max - min = -3. We construct a valid
    // node then mutate min/max on the normalised config to force the
    // negative-range branch.
    const n = createLoopCounterNode('n', { max: 5, min: 0, initial: 0 });
    n.config.min = 8; // min > max → range = -3
    n.state.value = 5;
    expect(getProgressRatio(n)).toBe(1);
  });
});

describe('LoopCounterNode - snapshot / deserialize', () => {
  it('snapshot returns immutable view', () => {
    const n = makeNode({ initial: 3 });
    const s = snapshotCounter(n);
    expect(s.id).toBe('counter-1');
    expect(s.value).toBe(3);
    expect(s.max).toBe(10);
    expect(s.min).toBe(0);
    expect(s.step).toBe(1);
  });

  it('deserialize restores value and counters', () => {
    const original = makeNode({ initial: 4 });
    incrementCounter(original);
    const snap = snapshotCounter(original);
    const restored = deserializeCounter('counter-1', { max: 10 }, snap);
    expect(restored.state.value).toBe(snap.value);
    expect(restored.state.totalIncrements).toBe(snap.totalIncrements);
  });

  it('deserialize rejects out-of-range snapshot value', () => {
    const snap = {
      id: 'n',
      value: 100,
      totalIncrements: 0,
      totalDecrements: 0,
      max: 10,
      min: 0,
      step: 1,
    };
    expect(() => deserializeCounter('n', { max: 10 }, snap)).toThrow();
  });

  it('snapshot is independent from node state mutation', () => {
    const n = makeNode({ initial: 2 });
    const s = snapshotCounter(n);
    incrementCounter(n);
    expect(s.value).toBe(2);
    expect(n.state.value).toBe(3);
  });
});

describe('LoopCounterNode - estimateCapacity', () => {
  it('returns remaining steps when stepSize provided', () => {
    const n = makeNode({ max: 10, initial: 2, step: 2 });
    expect(estimateCapacity(n, 2)).toBe(4);
  });

  it('returns 0 for non-positive step', () => {
    const n = makeNode({ initial: 5 });
    expect(estimateCapacity(n, 0)).toBe(0);
    expect(estimateCapacity(n, -1)).toBe(0);
  });

  it('returns 0 when at max', () => {
    const n = makeNode({ max: 10, initial: 10 });
    expect(estimateCapacity(n)).toBe(0);
  });
});

describe('LoopCounterNode - compareCounters', () => {
  it('returns negative when a<b', () => {
    const a = { id: 'a', value: 1, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    const b = { id: 'b', value: 5, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    expect(compareCounters(a, b)).toBeLessThan(0);
  });

  it('returns 0 when equal', () => {
    const a = { id: 'a', value: 3, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    const b = { id: 'b', value: 3, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    expect(compareCounters(a, b)).toBe(0);
  });

  it('returns positive when a>b', () => {
    const a = { id: 'a', value: 9, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    const b = { id: 'b', value: 1, totalIncrements: 0, totalDecrements: 0, max: 10, min: 0, step: 1 };
    expect(compareCounters(a, b)).toBeGreaterThan(0);
  });
});
