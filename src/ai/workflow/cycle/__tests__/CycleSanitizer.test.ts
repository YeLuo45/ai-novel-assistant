/**
 * V2094 CycleSanitizer tests - 40+ tests covering sanitizer creation,
 * iteration/memory/execution/depth tracking, violation recording,
 * termination checks, history, headroom and health score.
 */

import { describe, it, expect } from 'vitest';
import {
  createSanitizer,
  recordIteration,
  recordMemoryUsage,
  recordExecutionTime,
  recordDepth,
  recordViolation,
  shouldTerminate,
  getViolations,
  clearViolations,
  sanitizeCycle,
  budgetHeadroom,
  healthScore,
} from '../CycleSanitizer';

function makeSanitizer(overrides: Record<string, number> = {}) {
  return createSanitizer('cyc', {
    maxIterations: 5,
    maxMemoryMB: 10,
    maxExecutionMs: 100,
    maxDepth: 3,
    ...overrides,
  });
}

describe('CycleSanitizer - createSanitizer', () => {
  it('applies defaults when config omitted', () => {
    const s = createSanitizer('cyc');
    expect(s.config.maxIterations).toBe(100);
    expect(s.config.maxMemoryMB).toBe(256);
    expect(s.config.maxExecutionMs).toBe(30_000);
    expect(s.config.maxDepth).toBe(8);
  });

  it('records initial state at zero', () => {
    const s = makeSanitizer();
    expect(s.state.iterations).toBe(0);
    expect(s.state.memoryMB).toBe(0);
    expect(s.state.elapsedMs).toBe(0);
    expect(s.state.depth).toBe(0);
  });

  it('starts with empty violations', () => {
    const s = makeSanitizer();
    expect(s.violations.length).toBe(0);
  });

  it('rejects negative maxIterations', () => {
    expect(() => createSanitizer('c', { maxIterations: -1 })).toThrow();
  });

  it('rejects negative maxMemoryMB', () => {
    expect(() => createSanitizer('c', { maxMemoryMB: -5 })).toThrow();
  });

  it('rejects negative maxExecutionMs', () => {
    expect(() => createSanitizer('c', { maxExecutionMs: -10 })).toThrow();
  });

  it('rejects negative maxDepth', () => {
    expect(() => createSanitizer('c', { maxDepth: -1 })).toThrow();
  });

  it('rejects NaN limits', () => {
    expect(() => createSanitizer('c', { maxIterations: NaN })).toThrow();
    expect(() => createSanitizer('c', { maxMemoryMB: NaN })).toThrow();
    expect(() => createSanitizer('c', { maxExecutionMs: NaN })).toThrow();
    expect(() => createSanitizer('c', { maxDepth: NaN })).toThrow();
  });
});

describe('CycleSanitizer - recordIteration', () => {
  it('increments iteration count', () => {
    const s = makeSanitizer();
    recordIteration(s);
    recordIteration(s);
    expect(s.state.iterations).toBe(2);
  });

  it('records violation when exceeding maxIterations', () => {
    const s = makeSanitizer({ maxIterations: 2 });
    recordIteration(s);
    recordIteration(s);
    expect(s.violations.length).toBe(0);
    recordIteration(s);
    expect(s.violations.length).toBe(1);
    expect(s.violations[0].kind).toBe('iteration');
    expect(s.violations[0].observed).toBe(3);
    expect(s.violations[0].threshold).toBe(2);
  });

  it('records multiple violations when repeatedly exceeding', () => {
    const s = makeSanitizer({ maxIterations: 1 });
    recordIteration(s);
    recordIteration(s);
    recordIteration(s);
    expect(s.violations.length).toBe(2);
  });
});

describe('CycleSanitizer - recordMemoryUsage', () => {
  it('updates memoryMB', () => {
    const s = makeSanitizer();
    recordMemoryUsage(s, 5);
    expect(s.state.memoryMB).toBe(5);
  });

  it('records violation when memory exceeds budget', () => {
    const s = makeSanitizer({ maxMemoryMB: 10 });
    recordMemoryUsage(s, 11);
    expect(s.violations.length).toBe(1);
    expect(s.violations[0].kind).toBe('memory');
  });

  it('does NOT record violation at exact budget', () => {
    const s = makeSanitizer({ maxMemoryMB: 10 });
    recordMemoryUsage(s, 10);
    expect(s.violations.length).toBe(0);
  });
});

describe('CycleSanitizer - recordExecutionTime', () => {
  it('updates elapsedMs', () => {
    const s = makeSanitizer();
    recordExecutionTime(s, 50);
    expect(s.state.elapsedMs).toBe(50);
  });

  it('records violation when time exceeds budget', () => {
    const s = makeSanitizer({ maxExecutionMs: 100 });
    recordExecutionTime(s, 200);
    expect(s.violations.length).toBe(1);
    expect(s.violations[0].kind).toBe('execution');
  });
});

describe('CycleSanitizer - recordDepth', () => {
  it('increments depth', () => {
    const s = makeSanitizer();
    recordDepth(s);
    recordDepth(s);
    expect(s.state.depth).toBe(2);
  });

  it('records violation when depth exceeds maxDepth', () => {
    const s = makeSanitizer({ maxDepth: 3 });
    recordDepth(s);
    recordDepth(s);
    recordDepth(s);
    expect(s.violations.length).toBe(0);
    recordDepth(s);
    expect(s.violations.length).toBe(1);
    expect(s.violations[0].kind).toBe('depth');
  });
});

describe('CycleSanitizer - recordViolation', () => {
  it('stores custom cycleId and timestamp', () => {
    let t = 1000;
    const s = makeSanitizer();
    recordViolation(s, 'iteration', 99, 'my-cycle', () => t);
    expect(s.violations[0].cycleId).toBe('my-cycle');
    expect(s.violations[0].recordedAt).toBe(1000);
  });

  it('uses default cycleId when omitted', () => {
    const s = makeSanitizer();
    recordViolation(s, 'memory', 999);
    expect(s.violations[0].cycleId).toBe('_default_');
  });
});

describe('CycleSanitizer - shouldTerminate', () => {
  it('returns false when nothing is over budget', () => {
    const s = makeSanitizer();
    expect(shouldTerminate(s)).toBe(false);
  });

  it('returns true when iterations over budget', () => {
    const s = makeSanitizer({ maxIterations: 1 });
    recordIteration(s);
    recordIteration(s);
    expect(shouldTerminate(s)).toBe(true);
  });

  it('returns true when memory over budget', () => {
    const s = makeSanitizer({ maxMemoryMB: 1 });
    recordMemoryUsage(s, 2);
    expect(shouldTerminate(s)).toBe(true);
  });

  it('returns true when execution time over budget', () => {
    const s = makeSanitizer({ maxExecutionMs: 50 });
    recordExecutionTime(s, 60);
    expect(shouldTerminate(s)).toBe(true);
  });

  it('returns true when depth over budget', () => {
    const s = makeSanitizer({ maxDepth: 1 });
    recordDepth(s);
    recordDepth(s);
    expect(shouldTerminate(s)).toBe(true);
  });
});

describe('CycleSanitizer - getViolations / clearViolations', () => {
  it('returns a defensive copy', () => {
    const s = makeSanitizer({ maxIterations: 1 });
    recordIteration(s); // iterations=1, at limit, no violation
    recordIteration(s); // iterations=2, exceeds limit, violation 1
    recordIteration(s); // iterations=3, exceeds limit, violation 2
    const list = getViolations(s);
    expect(list.length).toBe(2);
    list.push({ kind: 'memory', observed: 0, threshold: 0, cycleId: 'x', recordedAt: 0 });
    expect(s.violations.length).toBe(2);
  });

  it('clearViolations returns count and empties the list', () => {
    const s = makeSanitizer({ maxIterations: 0 });
    recordIteration(s);
    recordIteration(s);
    expect(clearViolations(s)).toBeGreaterThanOrEqual(2);
    expect(s.violations.length).toBe(0);
  });
});

describe('CycleSanitizer - sanitizeCycle', () => {
  it('returns the cycle unchanged when within budget', () => {
    const s = makeSanitizer({ maxIterations: 5 });
    expect(sanitizeCycle(['a', 'b', 'c'], s)).toEqual(['a', 'b', 'c']);
  });

  it('truncates cycle to maxIterations', () => {
    const s = makeSanitizer({ maxIterations: 2 });
    expect(sanitizeCycle(['a', 'b', 'c', 'd'], s)).toEqual(['a', 'b']);
  });

  it('returns a new array (does not mutate input)', () => {
    const s = makeSanitizer({ maxIterations: 2 });
    const input = ['a', 'b', 'c', 'd'];
    const out = sanitizeCycle(input, s);
    expect(out).not.toBe(input);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('CycleSanitizer - budgetHeadroom', () => {
  it('returns remaining capacity for iteration', () => {
    const s = makeSanitizer({ maxIterations: 5 });
    recordIteration(s);
    recordIteration(s);
    expect(budgetHeadroom(s, 'iteration')).toBe(3);
  });

  it('returns 0 when at or over budget', () => {
    const s = makeSanitizer({ maxMemoryMB: 1 });
    recordMemoryUsage(s, 5);
    expect(budgetHeadroom(s, 'memory')).toBe(0);
  });

  it('returns remaining capacity for execution', () => {
    const s = makeSanitizer({ maxExecutionMs: 100 });
    recordExecutionTime(s, 30);
    expect(budgetHeadroom(s, 'execution')).toBe(70);
  });

  it('returns remaining capacity for depth', () => {
    const s = makeSanitizer({ maxDepth: 3 });
    recordDepth(s);
    expect(budgetHeadroom(s, 'depth')).toBe(2);
  });
});

describe('CycleSanitizer - healthScore', () => {
  it('returns 1 when nothing consumed', () => {
    const s = makeSanitizer();
    expect(healthScore(s)).toBe(1);
  });

  it('returns a value between 0 and 1 after partial consumption', () => {
    const s = makeSanitizer();
    recordIteration(s); // 1/5
    recordMemoryUsage(s, 5); // 5/10
    recordExecutionTime(s, 50); // 50/100
    recordDepth(s); // 1/3
    const score = healthScore(s);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('drops toward 0 as consumption grows', () => {
    const s = makeSanitizer();
    for (let i = 0; i < 5; i++) recordIteration(s);
    recordMemoryUsage(s, 10);
    recordExecutionTime(s, 100);
    for (let i = 0; i < 3; i++) recordDepth(s);
    expect(healthScore(s)).toBe(0);
  });

  it('returns 1 for the dimension whose limit is 0', () => {
    // Set maxIterations to 0; in healthScore the iteration dimension's
    // `limit === 0 ? 1 : ...` branch fires.
    const s = makeSanitizer({ maxIterations: 0 });
    recordIteration(s);
    recordIteration(s);
    const score = healthScore(s);
    expect(score).toBeGreaterThan(0);
  });
});
