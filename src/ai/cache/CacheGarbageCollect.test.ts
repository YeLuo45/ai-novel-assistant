import { describe, it, expect } from 'vitest';
import { createCacheGCState, addCacheGCNode, addCacheRoot, runCacheGC, cacheGCHealth } from './CacheGarbageCollect';

describe('V2250 CacheGarbageCollect', () => {
  it('should create empty state', () => {
    const s = createCacheGCState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node', () => {
    let s = createCacheGCState();
    s = addCacheGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add root', () => {
    let s = createCacheGCState();
    s = addCacheGCNode(s, 'a');
    s = addCacheRoot(s, 'a');
    expect(s.roots.size).toBe(1);
  });

  it('should not add duplicate', () => {
    let s = createCacheGCState();
    s = addCacheGCNode(s, 'a');
    s = addCacheGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should GC unreachable', () => {
    let s = createCacheGCState();
    s = addCacheGCNode(s, 'a', ['b']);
    s = addCacheGCNode(s, 'b');
    s = addCacheGCNode(s, 'c'); // unreachable
    s = addCacheRoot(s, 'a');
    s = runCacheGC(s);
    expect(s.nodes.size).toBe(2);
  });

  it('should compute health', () => {
    const s = createCacheGCState();
    const h = cacheGCHealth(s);
    expect(h.health).toBe(0.5);
  });
});
