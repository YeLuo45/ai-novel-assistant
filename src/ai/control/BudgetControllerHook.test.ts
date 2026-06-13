import { describe, it, expect } from 'vitest';
import {
  createBudgetHookState,
  addBudget,
  consume,
  registerHook,
  remaining,
  utilization,
  listBudgets,
  resetBudget,
  budgetHealth,
} from './BudgetControllerHook';

describe('V2140 BudgetControllerHook', () => {
  it('should create empty budget state', () => {
    const s = createBudgetHookState();
    expect(s.budgets.size).toBe(0);
  });

  it('should add budget', () => {
    const s = addBudget(createBudgetHookState(), { budgetId: 'b1', kind: 'tokens', limit: 1000, used: 0, resetAt: Date.now() + 86400000 });
    expect(s.budgets.size).toBe(1);
  });

  it('should consume within limit', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 0, resetAt: Date.now() + 86400000 });
    const r = consume(s, 'b1', 50);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(50);
  });

  it('should deny consume over limit', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 0, resetAt: Date.now() + 86400000 });
    const r = consume(s, 'b1', 150);
    expect(r.ok).toBe(false);
  });

  it('should trigger hook on denial', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 0, resetAt: Date.now() + 86400000 });
    s = registerHook(s, 'h1', 'b1', 'notify');
    const r = consume(s, 'b1', 150);
    expect(r.ok).toBe(false);
    expect(r.triggeredHook).toBe('h1');
  });

  it('should return remaining', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 30, resetAt: Date.now() + 86400000 });
    expect(remaining(s, 'b1')).toBe(70);
  });

  it('should compute utilization', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 25, resetAt: Date.now() + 86400000 });
    expect(utilization(s, 'b1')).toBeCloseTo(0.25);
  });

  it('should list budgets', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 0, resetAt: Date.now() + 86400000 });
    expect(listBudgets(s)).toHaveLength(1);
  });

  it('should reset budget', () => {
    let s = createBudgetHookState();
    s = addBudget(s, { budgetId: 'b1', kind: 'tokens', limit: 100, used: 80, resetAt: Date.now() + 86400000 });
    s = resetBudget(s, 'b1');
    expect(remaining(s, 'b1')).toBe(100);
  });

  it('should compute budget health', () => {
    const s = createBudgetHookState();
    const h = budgetHealth(s);
    expect(h.totalBudgets).toBe(0);
  });
});
