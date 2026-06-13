// V2140 BudgetControllerHook - Direction A Iter 25/30
// 预算控制钩子 - 资源限制
// Source: chatdev (resource budget)

export type ResourceKind = 'tokens' | 'calls' | 'bytes' | 'timeMs';

export interface Budget {
  budgetId: string;
  kind: ResourceKind;
  limit: number;
  used: number;
  resetAt: number;
}

export interface BudgetHookState {
  budgets: Map<string, Budget>;
  hooks: { hookId: string; budgetId: string; callback: string }[];
}

export function createBudgetHookState(): BudgetHookState {
  return { budgets: new Map(), hooks: [] };
}

export function addBudget(state: BudgetHookState, budget: Budget): BudgetHookState {
  const budgets = new Map(state.budgets);
  budgets.set(budget.budgetId, budget);
  return { ...state, budgets };
}

export function consume(state: BudgetHookState, budgetId: string, amount: number, now = Date.now()): { state: BudgetHookState; ok: boolean; remaining: number; triggeredHook?: string } {
  const b = state.budgets.get(budgetId);
  if (!b) return { state, ok: false, remaining: 0 };
  if (now >= b.resetAt) {
    // Reset
    const reset: Budget = { ...b, used: 0, resetAt: now + 86400000 };
    const budgets = new Map(state.budgets);
    budgets.set(budgetId, reset);
    return consume({ ...state, budgets }, budgetId, amount, now);
  }
  if (b.used + amount > b.limit) {
    const triggeredHook = state.hooks.find((h) => h.budgetId === budgetId)?.hookId;
    return { state, ok: false, remaining: b.limit - b.used, triggeredHook };
  }
  const updated: Budget = { ...b, used: b.used + amount };
  const budgets = new Map(state.budgets);
  budgets.set(budgetId, updated);
  return { state: { ...state, budgets }, ok: true, remaining: b.limit - updated.used };
}

export function registerHook(state: BudgetHookState, hookId: string, budgetId: string, callback: string): BudgetHookState {
  return { ...state, hooks: [...state.hooks, { hookId, budgetId, callback }] };
}

export function remaining(state: BudgetHookState, budgetId: string): number {
  const b = state.budgets.get(budgetId);
  return b ? b.limit - b.used : 0;
}

export function utilization(state: BudgetHookState, budgetId: string): number {
  const b = state.budgets.get(budgetId);
  return b ? b.used / b.limit : 0;
}

export function listBudgets(state: BudgetHookState): Budget[] {
  return Array.from(state.budgets.values());
}

export function resetBudget(state: BudgetHookState, budgetId: string, now = Date.now()): BudgetHookState {
  const b = state.budgets.get(budgetId);
  if (!b) return state;
  const budgets = new Map(state.budgets);
  budgets.set(budgetId, { ...b, used: 0, resetAt: now + 86400000 });
  return { ...state, budgets };
}

export function budgetHealth(state: BudgetHookState): { totalBudgets: number; avgUtil: number; health: number } {
  const list = listBudgets(state);
  const avg = list.length > 0 ? list.reduce((s, b) => s + b.used / b.limit, 0) / list.length : 0;
  return { totalBudgets: list.length, avgUtil: avg, health: avg < 0.9 ? 1 : 0.5 };
}
