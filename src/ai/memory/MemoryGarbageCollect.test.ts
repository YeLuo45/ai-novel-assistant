import { describe, it, expect } from 'vitest';
import { createMemoryGCState, addGCNode, addRoot, removeRoot, runGC, reachableCount, memoryGCHealth } from './MemoryGarbageCollect';

describe('V2160 MemoryGarbageCollect', () => {
  it('should create empty state', () => {
    const s = createMemoryGCState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should not add duplicate node', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a');
    s = addGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add root', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a');
    s = addRoot(s, 'a');
    expect(s.roots.size).toBe(1);
  });

  it('should remove root', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a');
    s = addRoot(s, 'a');
    s = removeRoot(s, 'a');
    expect(s.roots.size).toBe(0);
  });

  it('should GC unreachable nodes', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a', ['b']);
    s = addGCNode(s, 'b');
    s = addGCNode(s, 'c'); // unreachable
    s = addRoot(s, 'a');
    s = runGC(s);
    expect(s.nodes.size).toBe(2);
    expect(s.collectedCount).toBe(1);
  });

  it('should count reachable', () => {
    let s = createMemoryGCState();
    s = addGCNode(s, 'a', ['b']);
    s = addGCNode(s, 'b');
    s = addRoot(s, 'a');
    s = runGC(s);
    expect(reachableCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createMemoryGCState();
    const h = memoryGCHealth(s);
    expect(h.health).toBe(0.5);
  });
});
