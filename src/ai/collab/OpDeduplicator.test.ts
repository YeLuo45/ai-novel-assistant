import { describe, it, expect } from 'vitest';
import { createOpDedupeState, isNewOp, recordOp, dedupeOps, clearDedupes, dedupeHealth } from './OpDeduplicator';

describe('V2219 OpDeduplicator', () => {
  it('should create empty state', () => {
    const s = createOpDedupeState();
    expect(s.seen.size).toBe(0);
  });

  it('should check new', () => {
    const s = createOpDedupeState();
    expect(isNewOp(s, 'op1')).toBe(true);
  });

  it('should record op', () => {
    const s = recordOp(createOpDedupeState(), 'op1');
    expect(s.seen.size).toBe(1);
  });

  it('should detect duplicate', () => {
    let s = createOpDedupeState();
    s = recordOp(s, 'op1');
    s = recordOp(s, 'op1');
    expect(s.duplicates).toBe(1);
  });

  it('should dedupe batch', () => {
    const s = createOpDedupeState();
    const r = dedupeOps(s, ['op1', 'op2', 'op1', 'op3']);
    expect(r.unique).toEqual(['op1', 'op2', 'op3']);
    expect(r.dups).toEqual(['op1']);
  });

  it('should clear', () => {
    let s = createOpDedupeState();
    s = recordOp(s, 'op1');
    s = clearDedupes(s);
    expect(s.seen.size).toBe(0);
  });

  it('should compute health', () => {
    let s = createOpDedupeState();
    s = recordOp(s, 'op1');
    const h = dedupeHealth(s);
    expect(h.health).toBe(1);
  });
});
