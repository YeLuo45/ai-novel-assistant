import { describe, it, expect } from 'vitest';
import { createEvictionState, putEvictable, accessEvictable, setPolicy, itemCount, memoryEvictionHealth } from './MemoryEviction';

describe('V2159 MemoryEviction', () => {
  it('should create empty state', () => {
    const s = createEvictionState(10);
    expect(itemCount(s)).toBe(0);
  });

  it('should put item', () => {
    let s = createEvictionState(10);
    s = putEvictable(s, 'a', 100);
    expect(itemCount(s)).toBe(1);
  });

  it('should evict LRU', () => {
    let s = createEvictionState(2, 'lru');
    s = putEvictable(s, 'a', 100);
    s = putEvictable(s, 'b', 100);
    s = putEvictable(s, 'c', 100);
    expect(itemCount(s)).toBe(2);
    expect(s.evictionCount).toBe(1);
  });

  it('should evict LFU', () => {
    let s = createEvictionState(2, 'lfu');
    s = putEvictable(s, 'a', 100);
    s = putEvictable(s, 'b', 100);
    s = accessEvictable(s, 'a');
    s = accessEvictable(s, 'a');
    s = putEvictable(s, 'c', 100);
    expect(s.evictionCount).toBe(1);
  });

  it('should evict by TTL', () => {
    let s = createEvictionState(2, 'ttl');
    s = putEvictable(s, 'a', 100, 100);
    s = putEvictable(s, 'b', 100, 0);
    s = putEvictable(s, 'c', 100, 0);
    expect(itemCount(s)).toBe(2);
  });

  it('should access item', () => {
    let s = createEvictionState(10);
    s = putEvictable(s, 'a', 100);
    s = accessEvictable(s, 'a');
    expect(s.items.get('a')?.accessCount).toBe(1);
  });

  it('should set policy', () => {
    const s = setPolicy(createEvictionState(10), 'fifo');
    expect(s.policy).toBe('fifo');
  });

  it('should compute health', () => {
    let s = createEvictionState(10);
    s = putEvictable(s, 'a', 100);
    const h = memoryEvictionHealth(s);
    expect(h.health).toBe(1);
  });
});
