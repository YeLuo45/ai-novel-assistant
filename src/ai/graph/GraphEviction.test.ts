import { describe, it, expect } from 'vitest';
import { createGraphEvictionState, putEvictableGraphNode, accessGraphEvictable, graphEvictionItemCount, graphEvictionHealth } from './GraphEviction';

describe('V2188 GraphEviction', () => {
  it('should create empty state', () => {
    const s = createGraphEvictionState(10);
    expect(graphEvictionItemCount(s)).toBe(0);
  });

  it('should put node', () => {
    let s = createGraphEvictionState(10);
    s = putEvictableGraphNode(s, 'a', 100);
    expect(graphEvictionItemCount(s)).toBe(1);
  });

  it('should evict LRU when over capacity', () => {
    let s = createGraphEvictionState(2, 'lru');
    s = putEvictableGraphNode(s, 'a', 100);
    s = putEvictableGraphNode(s, 'b', 100);
    s = putEvictableGraphNode(s, 'c', 100);
    expect(graphEvictionItemCount(s)).toBe(2);
    expect(s.evictionCount).toBe(1);
  });

  it('should access and update access time', () => {
    let s = createGraphEvictionState(10);
    s = putEvictableGraphNode(s, 'a', 100);
    s = accessGraphEvictable(s, 'a');
    expect(s.items.get('a')?.accessCount).toBe(1);
  });

  it('should compute health', () => {
    let s = createGraphEvictionState(10);
    s = putEvictableGraphNode(s, 'a', 100);
    const h = graphEvictionHealth(s);
    expect(h.health).toBe(1);
  });
});
