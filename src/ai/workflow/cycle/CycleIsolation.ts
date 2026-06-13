/**
 * V2093 Direction A Iteration 8/30 Round 6: CycleIsolation
 *
 * Cycle isolation — keeps the state inside a strongly connected component
 * from leaking into the parent execution context. Provides boundary helpers
 * and isolation-mode checks.
 *
 * Inspired by:
 * - thunderbolt-design: sync isolation between parallel sub-graphs
 * - ruflo-design: federation context boundary
 * - nanobot-design: sandbox boundary on cycle entry
 */

export type IsolationLevel = 'strict' | 'shared' | 'none';

export interface IsolationContext {
  cycleId: string;
  level: IsolationLevel;
  parent: IsolationContext | null;
  variables: Map<string, unknown>;
  createdAt: number;
  promoted: Set<string>;
}

/**
 * Create a new isolation context for a cycle. `parent` may be null for the
 * outermost cycle.
 */
export function createIsolationContext(
  cycleId: string,
  parent: IsolationContext | null,
  level: IsolationLevel = 'strict',
  now: () => number = () => Date.now()
): IsolationContext {
  if (level !== 'strict' && level !== 'shared' && level !== 'none') {
    throw new Error(`invalid isolation level: ${level}`);
  }
  return {
    cycleId,
    level,
    parent,
    variables: new Map<string, unknown>(),
    createdAt: now(),
    promoted: new Set<string>(),
  };
}

/**
 * Check whether the given context represents a cycle boundary (i.e. its
 * level is strict and it has a parent).
 */
export function isIsolated(ctx: IsolationContext): boolean {
  return ctx.level === 'strict' && ctx.parent !== null;
}

/**
 * Store a value in the isolated variable store of the context.
 */
export function isolateVariable(
  ctx: IsolationContext,
  key: string,
  value: unknown
): void {
  if (!key) throw new Error('variable key must be a non-empty string');
  ctx.variables.set(key, value);
}

/**
 * Retrieve a value from the isolated variable store, walking up to the
 * parent only when the current context is in `shared` mode.
 */
export function retrieveVariable(
  ctx: IsolationContext,
  key: string
): unknown | undefined {
  if (ctx.variables.has(key)) return ctx.variables.get(key);
  if (ctx.level === 'shared' && ctx.parent) {
    return retrieveVariable(ctx.parent, key);
  }
  return undefined;
}

/**
 * Promote a variable from the isolated context into its parent. Throws when
 * there is no parent or when the context is not strict.
 */
export function promoteToParent(ctx: IsolationContext, key: string): boolean {
  if (!ctx.parent) return false;
  if (ctx.level !== 'strict') return false;
  if (!ctx.variables.has(key)) return false;
  const value = ctx.variables.get(key);
  ctx.parent.variables.set(key, value);
  ctx.promoted.add(key);
  return true;
}

/**
 * Build an isolation boundary marker between a child cycle and its parent
 * context. Returns a lightweight snapshot used for logging.
 */
export interface IsolationBoundary {
  cycleId: string;
  parentId: string | null;
  level: IsolationLevel;
  variableCount: number;
  promotedKeys: string[];
  createdAt: number;
}

export function createIsolationBoundary(
  cycle: IsolationContext,
  parent: IsolationContext | null
): IsolationBoundary {
  return {
    cycleId: cycle.cycleId,
    parentId: parent ? parent.cycleId : null,
    level: cycle.level,
    variableCount: cycle.variables.size,
    promotedKeys: Array.from(cycle.promoted),
    createdAt: cycle.createdAt,
  };
}

/**
 * Determine whether two contexts share the same isolation ancestry. Used by
 * cycle-aware executor to decide whether two cycles may share state.
 */
export function isInSameIsolation(
  a: IsolationContext,
  b: IsolationContext
): boolean {
  if (a === b) return true;
  if (a.level === 'none' || b.level === 'none') return true;
  const chainA = new Set<string>();
  let cur: IsolationContext | null = a;
  while (cur) {
    chainA.add(cur.cycleId);
    cur = cur.parent;
  }
  cur = b;
  while (cur) {
    if (chainA.has(cur.cycleId)) return true;
    cur = cur.parent;
  }
  return false;
}

/**
 * Merge variables from a child context back into the parent when in `shared`
 * mode. No-op in `strict` or `none` modes.
 */
export function mergeSharedVariables(
  child: IsolationContext,
  parent: IsolationContext
): number {
  if (child.level !== 'shared' || parent.level !== 'shared') return 0;
  let merged = 0;
  for (const [key, value] of child.variables) {
    if (!parent.variables.has(key)) {
      parent.variables.set(key, value);
      merged += 1;
    }
  }
  return merged;
}
