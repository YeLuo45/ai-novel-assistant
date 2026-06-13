import { describe, it, expect } from 'vitest';
import {
  createConflictResolver,
  resolveLWW,
  resolveCRDT,
  recordResolution,
  hasConflict,
  conflictsByActor,
  resolutionHealth,
} from './ConflictResolver';

describe('V2120 ConflictResolver', () => {
  it('should initialize empty resolver', () => {
    const s = createConflictResolver();
    expect(s.history).toEqual([]);
  });

  it('should resolve with LWW (latest wins)', () => {
    const ops = [
      { opId: 'a', entityId: 'e1', value: 1, timestamp: 100, actor: 'alice' },
      { opId: 'b', entityId: 'e1', value: 2, timestamp: 200, actor: 'bob' },
    ];
    const r = resolveLWW(ops);
    expect(r.winner.opId).toBe('b');
    expect(r.losers).toHaveLength(1);
    expect(r.strategy).toBe('lww');
  });

  it('should resolve CRDT merge of object values', () => {
    const ops = [
      { opId: 'a', entityId: 'e1', value: { a: 1 }, timestamp: 100, actor: 'alice' },
      { opId: 'b', entityId: 'e1', value: { b: 2 }, timestamp: 200, actor: 'bob' },
    ];
    const r = resolveCRDT(ops);
    expect(r.strategy).toBe('crdt_merge');
    expect((r.winner.value as any).a).toBe(1);
    expect((r.winner.value as any).b).toBe(2);
  });

  it('should throw on empty conflict list for LWW', () => {
    expect(() => resolveLWW([])).toThrow();
  });

  it('should resolve CRDT merge with non-object value', () => {
    const ops = [
      { opId: 'a', entityId: 'e1', value: 1, timestamp: 100, actor: 'alice' },
      { opId: 'b', entityId: 'e1', value: 2, timestamp: 200, actor: 'bob' },
    ];
    const r = resolveCRDT(ops);
    expect((r.winner.value as any)['e1']).toBe(1);
  });

  it('should throw on empty conflict list for CRDT', () => {
    expect(() => resolveCRDT([])).toThrow();
  });

  it('should record resolution in history', () => {
    let s = createConflictResolver();
    const r = resolveLWW([{ opId: 'a', entityId: 'e', value: 1, timestamp: 1, actor: 'x' }]);
    s = recordResolution(s, r);
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict when multiple actors', () => {
    const ops = [
      { opId: 'a', entityId: 'e', value: 1, timestamp: 1, actor: 'alice' },
      { opId: 'b', entityId: 'e', value: 2, timestamp: 2, actor: 'bob' },
    ];
    expect(hasConflict(ops)).toBe(true);
  });

  it('should not detect conflict with single actor', () => {
    const ops = [
      { opId: 'a', entityId: 'e', value: 1, timestamp: 1, actor: 'alice' },
      { opId: 'b', entityId: 'e', value: 2, timestamp: 2, actor: 'alice' },
    ];
    expect(hasConflict(ops)).toBe(false);
  });

  it('should count conflicts by actor', () => {
    const ops = [
      { opId: 'a', entityId: 'e', value: 1, timestamp: 1, actor: 'alice' },
      { opId: 'b', entityId: 'e', value: 2, timestamp: 2, actor: 'bob' },
      { opId: 'c', entityId: 'e', value: 3, timestamp: 3, actor: 'alice' },
    ];
    const counts = conflictsByActor(ops);
    expect(counts.alice).toBe(2);
    expect(counts.bob).toBe(1);
  });

  it('should compute resolution health', () => {
    let s = createConflictResolver();
    s = recordResolution(s, resolveLWW([{ opId: 'a', entityId: 'e', value: 1, timestamp: 1, actor: 'x' }]));
    s = recordResolution(s, resolveLWW([{ opId: 'b', entityId: 'e', value: 1, timestamp: 1, actor: 'x' }]));
    const h = resolutionHealth(s);
    expect(h.totalResolved).toBe(2);
    expect(h.lwwCount).toBe(2);
    expect(h.healthScore).toBe(1);
  });
});
