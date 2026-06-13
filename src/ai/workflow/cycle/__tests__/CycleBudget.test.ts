/**
 * V2101 CycleBudget tests - 30+ tests covering budget creation, consumption
 * of tokens / cost / time, exhaustion detection, remaining budget, snapshot
 * and restore, and history inspection.
 */

import { describe, it, expect } from 'vitest';
import {
  createCycleBudget,
  consumeTokens,
  consumeCost,
  consumeTime,
  isExhausted,
  isDimensionExhausted,
  getRemainingBudget,
  utilisation,
  snapshotBudget,
  restoreBudget,
  getHistory,
  historyTotal,
  historyLength,
  resetBudgetIdCounter,
} from '../CycleBudget';

function makeBudget(overrides: Record<string, number> = {}, cycleId?: string) {
  return createCycleBudget(
    {
      maxTokens: 100,
      maxCost: 10,
      maxTimeMs: 1000,
      ...overrides,
    },
    cycleId ? { cycleId } : {}
  );
}

describe('CycleBudget - createCycleBudget', () => {
  it('applies defaults when no config supplied', () => {
    const b = createCycleBudget();
    expect(b.config.maxTokens).toBe(100_000);
    expect(b.config.maxCost).toBe(5.0);
    expect(b.config.maxTimeMs).toBe(60_000);
  });

  it('starts with zero spend', () => {
    const b = makeBudget();
    expect(b.spent.tokens).toBe(0);
    expect(b.spent.cost).toBe(0);
    expect(b.spent.timeMs).toBe(0);
  });

  it('assigns a non-empty cycleId when not supplied', () => {
    const b = makeBudget();
    expect(typeof b.cycleId).toBe('string');
    expect(b.cycleId.length).toBeGreaterThan(0);
  });

  it('honours a user-supplied cycleId', () => {
    const b = makeBudget({}, 'my-cycle');
    expect(b.cycleId).toBe('my-cycle');
  });

  it('rejects negative maxTokens', () => {
    expect(() => createCycleBudget({ maxTokens: -1 })).toThrow();
  });

  it('rejects negative maxCost', () => {
    expect(() => createCycleBudget({ maxCost: -1 })).toThrow();
  });

  it('rejects negative maxTimeMs', () => {
    expect(() => createCycleBudget({ maxTimeMs: -1 })).toThrow();
  });

  it('rejects NaN limits', () => {
    expect(() => createCycleBudget({ maxTokens: NaN })).toThrow();
    expect(() => createCycleBudget({ maxCost: NaN })).toThrow();
    expect(() => createCycleBudget({ maxTimeMs: NaN })).toThrow();
  });

  it('starts with empty history', () => {
    const b = makeBudget();
    expect(b.history.length).toBe(0);
  });

  it('resetBudgetIdCounter does not throw', () => {
    expect(() => resetBudgetIdCounter()).not.toThrow();
  });

  it('increments id counter on successive creations', () => {
    resetBudgetIdCounter();
    const a = createCycleBudget({}, { cycleId: undefined });
    const b = createCycleBudget({}, { cycleId: undefined });
    expect(a.cycleId).not.toBe(b.cycleId);
  });
});

describe('CycleBudget - consumeTokens', () => {
  it('increments spent tokens', () => {
    const b = makeBudget();
    consumeTokens(b, 30);
    expect(b.spent.tokens).toBe(30);
  });

  it('returns an event with the remaining amount', () => {
    const b = makeBudget({ maxTokens: 100 });
    const ev = consumeTokens(b, 25);
    expect(ev.dimension).toBe('tokens');
    expect(ev.amount).toBe(25);
    expect(ev.remaining).toBe(75);
    expect(ev.cycleId).toBe(b.cycleId);
    expect(typeof ev.recordedAt).toBe('number');
  });

  it('clamps remaining to zero when over-spending', () => {
    const b = makeBudget({ maxTokens: 10 });
    const ev = consumeTokens(b, 20);
    expect(b.spent.tokens).toBe(20);
    expect(ev.remaining).toBe(0);
  });

  it('rejects negative count', () => {
    const b = makeBudget();
    expect(() => consumeTokens(b, -1)).toThrow();
  });

  it('rejects NaN count', () => {
    const b = makeBudget();
    expect(() => consumeTokens(b, NaN)).toThrow();
  });

  it('appends to history', () => {
    const b = makeBudget();
    consumeTokens(b, 5);
    consumeTokens(b, 7);
    expect(b.history.length).toBe(2);
    expect(b.history[0].dimension).toBe('tokens');
    expect(b.history[1].dimension).toBe('tokens');
  });
});

describe('CycleBudget - consumeCost', () => {
  it('increments spent cost', () => {
    const b = makeBudget();
    consumeCost(b, 2.5);
    expect(b.spent.cost).toBe(2.5);
  });

  it('rejects negative amount', () => {
    expect(() => consumeCost(makeBudget(), -0.01)).toThrow();
  });

  it('records events on the cost dimension', () => {
    const b = makeBudget();
    consumeCost(b, 1);
    expect(b.history[0].dimension).toBe('cost');
  });
});

describe('CycleBudget - consumeTime', () => {
  it('increments spent time', () => {
    const b = makeBudget();
    consumeTime(b, 250);
    expect(b.spent.timeMs).toBe(250);
  });

  it('rejects negative ms', () => {
    expect(() => consumeTime(makeBudget(), -10)).toThrow();
  });

  it('records events on the time dimension', () => {
    const b = makeBudget();
    consumeTime(b, 100);
    expect(b.history[0].dimension).toBe('time');
  });
});

describe('CycleBudget - isExhausted / isDimensionExhausted', () => {
  it('returns false on a fresh budget', () => {
    expect(isExhausted(makeBudget())).toBe(false);
  });

  it('returns true when tokens reach limit', () => {
    const b = makeBudget({ maxTokens: 10 });
    consumeTokens(b, 10);
    expect(isExhausted(b)).toBe(true);
  });

  it('returns true when cost reaches limit', () => {
    const b = makeBudget({ maxCost: 1 });
    consumeCost(b, 1);
    expect(isExhausted(b)).toBe(true);
  });

  it('returns true when time reaches limit', () => {
    const b = makeBudget({ maxTimeMs: 50 });
    consumeTime(b, 50);
    expect(isExhausted(b)).toBe(true);
  });

  it('isDimensionExhausted reports per-dimension', () => {
    const b = makeBudget({ maxTokens: 10, maxCost: 100, maxTimeMs: 1000 });
    consumeTokens(b, 10);
    expect(isDimensionExhausted(b, 'tokens')).toBe(true);
    expect(isDimensionExhausted(b, 'cost')).toBe(false);
    expect(isDimensionExhausted(b, 'time')).toBe(false);
  });
});

describe('CycleBudget - getRemainingBudget', () => {
  it('returns the full budget when nothing spent', () => {
    const r = getRemainingBudget(makeBudget());
    expect(r.tokens).toBe(100);
    expect(r.cost).toBe(10);
    expect(r.timeMs).toBe(1000);
  });

  it('reports remaining after partial consumption', () => {
    const b = makeBudget();
    consumeTokens(b, 30);
    consumeCost(b, 2);
    consumeTime(b, 200);
    const r = getRemainingBudget(b);
    expect(r.tokens).toBe(70);
    expect(r.cost).toBe(8);
    expect(r.timeMs).toBe(800);
  });

  it('clamps negative remaining to zero', () => {
    const b = makeBudget({ maxTokens: 5 });
    consumeTokens(b, 100);
    expect(getRemainingBudget(b).tokens).toBe(0);
  });
});

describe('CycleBudget - utilisation', () => {
  it('returns 0 for an unused dimension', () => {
    expect(utilisation(makeBudget(), 'tokens')).toBe(0);
  });

  it('returns the ratio for partial consumption', () => {
    const b = makeBudget({ maxTokens: 100 });
    consumeTokens(b, 50);
    expect(utilisation(b, 'tokens')).toBe(0.5);
  });

  it('caps at 1 when over budget', () => {
    const b = makeBudget({ maxTokens: 10 });
    consumeTokens(b, 30);
    expect(utilisation(b, 'tokens')).toBe(1);
  });

  it('treats a zero limit as immediately exhausted when anything spent', () => {
    const b = makeBudget({ maxTokens: 0 });
    consumeTokens(b, 0);
    expect(utilisation(b, 'tokens')).toBe(0);
  });

  it('treats a zero limit as 1 when spending pushes it over', () => {
    const b = makeBudget({ maxTokens: 0 });
    // Forcefully set spent via consumeTokens allowed > limit path
    consumeTokens(b, 1);
    expect(utilisation(b, 'tokens')).toBe(1);
  });
});

describe('CycleBudget - snapshot / restore', () => {
  it('captures the current spent values', () => {
    const b = makeBudget();
    consumeTokens(b, 20);
    consumeCost(b, 3);
    consumeTime(b, 100);
    const snap = snapshotBudget(b);
    expect(snap.spent.tokens).toBe(20);
    expect(snap.spent.cost).toBe(3);
    expect(snap.spent.timeMs).toBe(100);
  });

  it('captures the cycleId', () => {
    const b = makeBudget({}, 'cycle-x');
    const snap = snapshotBudget(b);
    expect(snap.cycleId).toBe('cycle-x');
  });

  it('snapshot config is decoupled from the live budget', () => {
    const b = makeBudget({ maxTokens: 100 });
    const snap = snapshotBudget(b);
    b.config.maxTokens = 999;
    expect(snap.config.maxTokens).toBe(100);
  });

  it('restoreBudget overwrites spent and config', () => {
    const b = makeBudget();
    consumeTokens(b, 80);
    const snap = snapshotBudget(b);
    // Mutate the budget after the snapshot.
    consumeTokens(b, 100);
    expect(b.spent.tokens).toBe(180);
    restoreBudget(b, snap);
    expect(b.spent.tokens).toBe(80);
  });

  it('restoreBudget rejects non-object snapshots', () => {
    const b = makeBudget();
    // @ts-expect-error testing runtime guard
    expect(() => restoreBudget(b, null)).toThrow();
  });

  it('restoreBudget copies config values', () => {
    const b = makeBudget({ maxTokens: 100 });
    const snap = snapshotBudget(b);
    b.config.maxTokens = 999;
    restoreBudget(b, snap);
    expect(b.config.maxTokens).toBe(100);
  });

  it('uses custom time source for snapshot timestamp', () => {
    const b = makeBudget();
    let t = 12345;
    const snap = snapshotBudget(b, () => t);
    expect(snap.recordedAt).toBe(12345);
  });
});

describe('CycleBudget - history', () => {
  it('getHistory returns defensive copies', () => {
    const b = makeBudget();
    consumeTokens(b, 5);
    const h = getHistory(b);
    expect(h.length).toBe(1);
    h.push({
      dimension: 'tokens',
      amount: 999,
      remaining: 0,
      recordedAt: 0,
      cycleId: 'fake',
    });
    expect(b.history.length).toBe(1);
  });

  it('historyTotal sums across events of one dimension', () => {
    const b = makeBudget();
    consumeTokens(b, 5);
    consumeTokens(b, 7);
    consumeCost(b, 2);
    expect(historyTotal(b, 'tokens')).toBe(12);
    expect(historyTotal(b, 'cost')).toBe(2);
    expect(historyTotal(b, 'time')).toBe(0);
  });

  it('historyLength reports total events', () => {
    const b = makeBudget();
    consumeTokens(b, 1);
    consumeCost(b, 1);
    consumeTime(b, 1);
    expect(historyLength(b)).toBe(3);
  });
});