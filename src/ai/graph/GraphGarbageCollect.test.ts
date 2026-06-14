import { describe, it, expect } from 'vitest';
import { createGraphGCState, addGCGraphNode, addGraphRoot, removeGraphRoot, runGraphGC, graphGCHealth } from './GraphGarbageCollect';

describe('V2189 GraphGarbageCollect', () => {
  it('should create empty state', () => {
    const s = createGraphGCState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node', () => {
    let s = createGraphGCState();
    s = addGCGraphNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add root', () => {
    let s = createGraphGCState();
    s = addGCGraphNode(s, 'a');
    s = addGraphRoot(s, 'a');
    expect(s.roots.size).toBe(1);
  });

  it('should remove root', () => {
    let s = createGraphGCState();
    s = addGCGraphNode(s, 'a');
    s = addGraphRoot(s, 'a');
    s = removeGraphRoot(s, 'a');
    expect(s.roots.size).toBe(0);
  });

  it('should GC unreachable nodes', () => {
    let s = createGraphGCState();
    s = addGCGraphNode(s, 'a', ['b']);
    s = addGCGraphNode(s, 'b');
    s = addGCGraphNode(s, 'c'); // unreachable
    s = addGraphRoot(s, 'a');
    s = runGraphGC(s);
    expect(s.nodes.size).toBe(2);
  });

  it('should not add duplicate node', () => {
    let s = createGraphGCState();
    s = addGCGraphNode(s, 'a');
    s = addGCGraphNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should compute health', () => {
    const s = createGraphGCState();
    const h = graphGCHealth(s);
    expect(h.health).toBe(0.5);
  });
});
