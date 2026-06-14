import { describe, it, expect } from 'vitest';
import { createGraphCompactionState, enqueueNode, enqueueEdge, runGraphCompaction, graphCompactionHealth } from './GraphCompaction';

describe('V2187 GraphCompaction', () => {
  it('should create empty state', () => {
    const s = createGraphCompactionState();
    expect(s.compacted).toEqual([]);
  });

  it('should enqueue node', () => {
    let s = createGraphCompactionState();
    s = enqueueNode(s, 'a', 'A');
    expect(s.pendingNodes.size).toBe(1);
  });

  it('should enqueue edge', () => {
    let s = createGraphCompactionState();
    s = enqueueEdge(s, 'a', 'b');
    expect(s.pendingEdges).toHaveLength(1);
  });

  it('should run compaction', () => {
    let s = createGraphCompactionState();
    s = enqueueNode(s, 'a', 'Alice');
    s = enqueueNode(s, 'b', 'Bob');
    s = enqueueEdge(s, 'a', 'b');
    s = runGraphCompaction(s);
    expect(s.compacted).toHaveLength(1);
  });

  it('should not compact empty', () => {
    let s = createGraphCompactionState();
    s = runGraphCompaction(s);
    expect(s.compacted).toEqual([]);
  });

  it('should dedupe edges', () => {
    let s = createGraphCompactionState();
    s = enqueueEdge(s, 'a', 'b');
    s = enqueueEdge(s, 'a', 'b');
    s = runGraphCompaction(s);
    expect(s.compacted[0].edgeCount).toBe(1);
  });

  it('should compute health', () => {
    const s = createGraphCompactionState();
    const h = graphCompactionHealth(s);
    expect(h.health).toBe(0.5);
  });
});
