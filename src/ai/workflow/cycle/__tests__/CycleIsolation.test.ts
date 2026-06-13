/**
 * V2093 CycleIsolation tests - 35+ tests covering context creation, isolation
 * checks, variable storage / retrieval, promotion, boundary markers and
 * shared-mode merging.
 */

import { describe, it, expect } from 'vitest';
import {
  createIsolationContext,
  isIsolated,
  isolateVariable,
  retrieveVariable,
  promoteToParent,
  createIsolationBoundary,
  isInSameIsolation,
  mergeSharedVariables,
} from '../CycleIsolation';

describe('CycleIsolation - createIsolationContext', () => {
  it('creates a strict context with parent', () => {
    const parent = createIsolationContext('p', null);
    const ctx = createIsolationContext('c', parent);
    expect(ctx.cycleId).toBe('c');
    expect(ctx.level).toBe('strict');
    expect(ctx.parent).toBe(parent);
  });

  it('accepts the three valid isolation levels', () => {
    const parent = createIsolationContext('p', null);
    expect(createIsolationContext('s', parent, 'strict').level).toBe('strict');
    expect(createIsolationContext('sh', parent, 'shared').level).toBe('shared');
    expect(createIsolationContext('n', parent, 'none').level).toBe('none');
  });

  it('rejects unknown levels', () => {
    const parent = createIsolationContext('p', null);
    expect(() =>
      createIsolationContext('c', parent, 'invalid' as 'strict')
    ).toThrow();
  });

  it('uses now() provider for createdAt', () => {
    const ctx = createIsolationContext('c', null, 'strict', () => 9_999);
    expect(ctx.createdAt).toBe(9_999);
  });

  it('starts with empty variables and promoted set', () => {
    const ctx = createIsolationContext('c', null);
    expect(ctx.variables.size).toBe(0);
    expect(ctx.promoted.size).toBe(0);
  });
});

describe('CycleIsolation - isIsolated', () => {
  it('returns true for strict context with a parent', () => {
    const parent = createIsolationContext('p', null);
    const ctx = createIsolationContext('c', parent, 'strict');
    expect(isIsolated(ctx)).toBe(true);
  });

  it('returns false for strict context without parent', () => {
    const ctx = createIsolationContext('c', null, 'strict');
    expect(isIsolated(ctx)).toBe(false);
  });

  it('returns false for shared context with parent', () => {
    const parent = createIsolationContext('p', null);
    const ctx = createIsolationContext('c', parent, 'shared');
    expect(isIsolated(ctx)).toBe(false);
  });

  it('returns false for none context with parent', () => {
    const parent = createIsolationContext('p', null);
    const ctx = createIsolationContext('c', parent, 'none');
    expect(isIsolated(ctx)).toBe(false);
  });
});

describe('CycleIsolation - isolateVariable / retrieveVariable', () => {
  it('stores and retrieves a value in the same context', () => {
    const ctx = createIsolationContext('c', null);
    isolateVariable(ctx, 'answer', 42);
    expect(retrieveVariable(ctx, 'answer')).toBe(42);
  });

  it('retrieves from parent when context is shared', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'shared');
    isolateVariable(parent, 'origin', 'shared-data');
    expect(retrieveVariable(child, 'origin')).toBe('shared-data');
  });

  it('does NOT walk up to parent when context is strict', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'strict');
    isolateVariable(parent, 'secret', 'parent-only');
    expect(retrieveVariable(child, 'secret')).toBeUndefined();
  });

  it('returns undefined for missing key in strict context', () => {
    const ctx = createIsolationContext('c', null);
    expect(retrieveVariable(ctx, 'missing')).toBeUndefined();
  });

  it('rejects empty key on isolate', () => {
    const ctx = createIsolationContext('c', null);
    expect(() => isolateVariable(ctx, '', 1)).toThrow();
  });

  it('overwrites prior value', () => {
    const ctx = createIsolationContext('c', null);
    isolateVariable(ctx, 'k', 1);
    isolateVariable(ctx, 'k', 2);
    expect(retrieveVariable(ctx, 'k')).toBe(2);
  });

  it('prefers current context value over parent value in shared mode', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'shared');
    isolateVariable(parent, 'k', 'parent');
    isolateVariable(child, 'k', 'child');
    expect(retrieveVariable(child, 'k')).toBe('child');
  });
});

describe('CycleIsolation - promoteToParent', () => {
  it('promotes a variable to parent and tracks the promotion', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'strict');
    isolateVariable(child, 'value', 'x');
    expect(promoteToParent(child, 'value')).toBe(true);
    expect(retrieveVariable(parent, 'value')).toBe('x');
    expect(child.promoted.has('value')).toBe(true);
  });

  it('returns false when there is no parent', () => {
    const ctx = createIsolationContext('c', null);
    isolateVariable(ctx, 'k', 1);
    expect(promoteToParent(ctx, 'k')).toBe(false);
  });

  it('returns false when context is shared', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'shared');
    isolateVariable(child, 'k', 1);
    expect(promoteToParent(child, 'k')).toBe(false);
  });

  it('returns false when variable does not exist', () => {
    const parent = createIsolationContext('p', null);
    const child = createIsolationContext('c', parent, 'strict');
    expect(promoteToParent(child, 'missing')).toBe(false);
  });
});

describe('CycleIsolation - createIsolationBoundary', () => {
  it('produces a snapshot with cycleId and parentId', () => {
    const parent = createIsolationContext('p', null);
    const cycle = createIsolationContext('c', parent);
    isolateVariable(cycle, 'a', 1);
    const b = createIsolationBoundary(cycle, parent);
    expect(b.cycleId).toBe('c');
    expect(b.parentId).toBe('p');
    expect(b.variableCount).toBe(1);
    expect(b.promotedKeys).toEqual([]);
  });

  it('records promoted keys', () => {
    const parent = createIsolationContext('p', null);
    const cycle = createIsolationContext('c', parent);
    isolateVariable(cycle, 'a', 1);
    promoteToParent(cycle, 'a');
    const b = createIsolationBoundary(cycle, parent);
    expect(b.promotedKeys).toEqual(['a']);
  });

  it('uses null parentId when no parent', () => {
    const cycle = createIsolationContext('c', null);
    const b = createIsolationBoundary(cycle, null);
    expect(b.parentId).toBeNull();
  });
});

describe('CycleIsolation - isInSameIsolation', () => {
  it('returns true for identical context', () => {
    const ctx = createIsolationContext('c', null);
    expect(isInSameIsolation(ctx, ctx)).toBe(true);
  });

  it('returns true for level=none regardless of parents', () => {
    const a = createIsolationContext('a', null, 'none');
    const b = createIsolationContext('b', null, 'none');
    expect(isInSameIsolation(a, b)).toBe(true);
  });

  it('returns false for unrelated strict contexts', () => {
    const a = createIsolationContext('a', null);
    const b = createIsolationContext('b', null);
    expect(isInSameIsolation(a, b)).toBe(false);
  });

  it('returns true when one is ancestor of the other', () => {
    const root = createIsolationContext('r', null);
    const child = createIsolationContext('c', root);
    expect(isInSameIsolation(root, child)).toBe(true);
    expect(isInSameIsolation(child, root)).toBe(true);
  });

  it('returns true when contexts share an ancestor', () => {
    const root = createIsolationContext('r', null);
    const a = createIsolationContext('a', root);
    const b = createIsolationContext('b', root);
    expect(isInSameIsolation(a, b)).toBe(true);
  });

  it('returns false for disjoint strict trees', () => {
    const r1 = createIsolationContext('r1', null);
    const r2 = createIsolationContext('r2', null);
    const a = createIsolationContext('a', r1);
    const b = createIsolationContext('b', r2);
    expect(isInSameIsolation(a, b)).toBe(false);
  });
});

describe('CycleIsolation - mergeSharedVariables', () => {
  it('merges variables from child into parent in shared mode', () => {
    const parent = createIsolationContext('p', null, 'shared');
    const child = createIsolationContext('c', parent, 'shared');
    isolateVariable(child, 'a', 1);
    isolateVariable(child, 'b', 2);
    expect(mergeSharedVariables(child, parent)).toBe(2);
    expect(retrieveVariable(parent, 'a')).toBe(1);
    expect(retrieveVariable(parent, 'b')).toBe(2);
  });

  it('does not overwrite existing parent values', () => {
    const parent = createIsolationContext('p', null, 'shared');
    const child = createIsolationContext('c', parent, 'shared');
    isolateVariable(parent, 'a', 'parent-a');
    isolateVariable(child, 'a', 'child-a');
    expect(mergeSharedVariables(child, parent)).toBe(0);
    expect(retrieveVariable(parent, 'a')).toBe('parent-a');
  });

  it('returns 0 when not in shared mode', () => {
    const parent = createIsolationContext('p', null, 'strict');
    const child = createIsolationContext('c', parent, 'strict');
    isolateVariable(child, 'a', 1);
    expect(mergeSharedVariables(child, parent)).toBe(0);
  });
});
