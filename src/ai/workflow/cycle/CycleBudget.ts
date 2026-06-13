/**
 * V2101 Direction A Iteration 10/30 Round 7: CycleBudget
 *
 * Cycle budget — controls the resource consumption of a single cycle across
 * three dimensions: token count, monetary cost and wall-clock time. Tracks
 * consumption, exposes exhaustion state and supports snapshotting for
 * checkpoint-based resume.
 *
 * Inspired by:
 * - claude-code-design: per-task budget tracking
 * - nanobot-design: sandbox resource ceiling
 * - ruflo-design: trust-scored resource governor
 */

export type BudgetDimension = 'tokens' | 'cost' | 'time';

export interface CycleBudgetConfig {
  /** Maximum number of tokens allowed (default 100_000). */
  maxTokens?: number;
  /** Maximum monetary cost in minor units (default 5.00). */
  maxCost?: number;
  /** Maximum wall-clock time in milliseconds (default 60_000). */
  maxTimeMs?: number;
}

export interface CycleBudget {
  cycleId: string;
  config: Required<CycleBudgetConfig>;
  spent: { tokens: number; cost: number; timeMs: number };
  history: BudgetEvent[];
}

export interface BudgetEvent {
  dimension: BudgetDimension;
  amount: number;
  remaining: number;
  recordedAt: number;
  cycleId: string;
}

/**
 * Immutable snapshot of a budget's current state.
 */
export interface BudgetSnapshot {
  cycleId: string;
  config: Required<CycleBudgetConfig>;
  spent: { tokens: number; cost: number; timeMs: number };
  recordedAt: number;
}

/* ------------------------------------------------------------------------- */
/* Construction                                                                */
/* ------------------------------------------------------------------------- */

let _budgetCounter = 0;

function nextBudgetId(prefix: string): string {
  _budgetCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_budgetCounter}`;
}

/** Reset the id counter (test helper). */
export function resetBudgetIdCounter(): void {
  _budgetCounter = 0;
}

/** Validate that a config value is a finite, non-negative number. */
function validateLimit(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${name} must be a finite non-negative number, got ${value}`
    );
  }
}

/**
 * Create a new cycle budget. All three dimensions are independently bounded.
 */
export function createCycleBudget(
  config: CycleBudgetConfig = {},
  options: { cycleId?: string; now?: () => number } = {}
): CycleBudget {
  const cfg: Required<CycleBudgetConfig> = {
    maxTokens: config.maxTokens ?? 100_000,
    maxCost: config.maxCost ?? 5.0,
    maxTimeMs: config.maxTimeMs ?? 60_000,
  };
  validateLimit('maxTokens', cfg.maxTokens);
  validateLimit('maxCost', cfg.maxCost);
  validateLimit('maxTimeMs', cfg.maxTimeMs);
  return {
    cycleId: options.cycleId ?? nextBudgetId('budget'),
    config: cfg,
    spent: { tokens: 0, cost: 0, timeMs: 0 },
    history: [],
  };
}

/* ------------------------------------------------------------------------- */
/* Consumption                                                                 */
/* ------------------------------------------------------------------------- */

/** Internal: record a consumption event against a budget dimension. */
function record(
  budget: CycleBudget,
  dimension: BudgetDimension,
  amount: number,
  now: () => number
): BudgetEvent {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(
      `${dimension} consumption must be a finite non-negative number, got ${amount}`
    );
  }
  const limit = limitFor(budget, dimension);
  const spent = spentFor(budget, dimension);
  const next = spent + amount;
  // Allow over-spending but mark the resulting event so callers know.
  budget.spent[spentKey(dimension)] = next;
  const remaining = Math.max(0, limit - next);
  const event: BudgetEvent = {
    dimension,
    amount,
    remaining,
    recordedAt: now(),
    cycleId: budget.cycleId,
  };
  budget.history.push(event);
  return event;
}

function limitFor(b: CycleBudget, d: BudgetDimension): number {
  if (d === 'tokens') return b.config.maxTokens;
  if (d === 'cost') return b.config.maxCost;
  return b.config.maxTimeMs;
}

function spentFor(b: CycleBudget, d: BudgetDimension): number {
  if (d === 'tokens') return b.spent.tokens;
  if (d === 'cost') return b.spent.cost;
  return b.spent.timeMs;
}

function spentKey(d: BudgetDimension): 'tokens' | 'cost' | 'timeMs' {
  if (d === 'tokens') return 'tokens';
  if (d === 'cost') return 'cost';
  return 'timeMs';
}

/**
 * Deduct tokens from the budget.
 */
export function consumeTokens(
  budget: CycleBudget,
  count: number,
  now: () => number = () => Date.now()
): BudgetEvent {
  return record(budget, 'tokens', count, now);
}

/**
 * Deduct cost from the budget.
 */
export function consumeCost(
  budget: CycleBudget,
  amount: number,
  now: () => number = () => Date.now()
): BudgetEvent {
  return record(budget, 'cost', amount, now);
}

/**
 * Deduct wall-clock time from the budget.
 */
export function consumeTime(
  budget: CycleBudget,
  ms: number,
  now: () => number = () => Date.now()
): BudgetEvent {
  return record(budget, 'time', ms, now);
}

/* ------------------------------------------------------------------------- */
/* Inspection                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * True iff any dimension has been consumed up to or beyond its limit.
 */
export function isExhausted(budget: CycleBudget): boolean {
  return (
    budget.spent.tokens >= budget.config.maxTokens ||
    budget.spent.cost >= budget.config.maxCost ||
    budget.spent.timeMs >= budget.config.maxTimeMs
  );
}

/** True iff a single dimension has been consumed up to or beyond its limit. */
export function isDimensionExhausted(
  budget: CycleBudget,
  dimension: BudgetDimension
): boolean {
  return spentFor(budget, dimension) >= limitFor(budget, dimension);
}

/**
 * Compute remaining capacity for every dimension. Negative values are
 * reported as 0 to give callers a simple monotonic view.
 */
export function getRemainingBudget(budget: CycleBudget): {
  tokens: number;
  cost: number;
  timeMs: number;
} {
  return {
    tokens: Math.max(0, budget.config.maxTokens - budget.spent.tokens),
    cost: Math.max(0, budget.config.maxCost - budget.spent.cost),
    timeMs: Math.max(0, budget.config.maxTimeMs - budget.spent.timeMs),
  };
}

/** Return the utilisation ratio (0..1) for one dimension. */
export function utilisation(
  budget: CycleBudget,
  dimension: BudgetDimension
): number {
  const limit = limitFor(budget, dimension);
  if (limit === 0) return spentFor(budget, dimension) > 0 ? 1 : 0;
  return Math.min(1, spentFor(budget, dimension) / limit);
}

/* ------------------------------------------------------------------------- */
/* Snapshot / restore                                                          */
/* ------------------------------------------------------------------------- */

/**
 * Capture an immutable snapshot of the current budget state. The returned
 * object is detached from the live budget so callers can hold on to it.
 */
export function snapshotBudget(
  budget: CycleBudget,
  now: () => number = () => Date.now()
): BudgetSnapshot {
  return {
    cycleId: budget.cycleId,
    config: { ...budget.config },
    spent: { ...budget.spent },
    recordedAt: now(),
  };
}

/**
 * Restore a budget from a previously-taken snapshot. The budget's history
 * is preserved; only the limits and current spend are replaced.
 */
export function restoreBudget(budget: CycleBudget, snapshot: BudgetSnapshot): void {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('snapshot must be an object');
  }
  budget.cycleId = snapshot.cycleId;
  budget.config = { ...snapshot.config };
  budget.spent = { ...snapshot.spent };
}

/**
 * Capture an immutable copy of the history events. Useful for diagnostics.
 */
export function getHistory(budget: CycleBudget): BudgetEvent[] {
  return budget.history.map((e) => ({ ...e }));
}

/** Total amount recorded against a single dimension across history. */
export function historyTotal(
  budget: CycleBudget,
  dimension: BudgetDimension
): number {
  let sum = 0;
  for (const ev of budget.history) {
    if (ev.dimension === dimension) sum += ev.amount;
  }
  return sum;
}

/** Total number of recorded events. */
export function historyLength(budget: CycleBudget): number {
  return budget.history.length;
}