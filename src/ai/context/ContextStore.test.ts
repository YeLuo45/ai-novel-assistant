import { describe, it, expect } from 'vitest';
import { createContextStoreState, contextSet, contextGet, contextDelete, contextHas, contextSize, totalContextTokens, contextStoreHealth } from './ContextStore';

describe('V2267 ContextStore', () => {
  it('should create empty store', () => {
    const s = createContextStoreState();
    expect(contextSize(s)).toBe(0);
  });

  it('should set context', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'hello');
    expect(s.totalSets).toBe(1);
  });

  it('should get context (hit)', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'hello');
    s = contextGet(s, 'k1');
    expect(s.totalHits).toBe(1);
  });

  it('should get miss', () => {
    let s = createContextStoreState();
    s = contextGet(s, 'nope');
    expect(s.totalMisses).toBe(1);
  });

  it('should delete', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'x');
    s = contextDelete(s, 'k1');
    expect(contextSize(s)).toBe(0);
  });

  it('should check has', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'x');
    expect(contextHas(s, 'k1')).toBe(true);
  });

  it('should total tokens', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'hello world');
    expect(totalContextTokens(s)).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createContextStoreState();
    s = contextSet(s, 'k1', 'x');
    s = contextGet(s, 'k1');
    const h = contextStoreHealth(s);
    expect(h.hitRate).toBe(1);
  });
});
