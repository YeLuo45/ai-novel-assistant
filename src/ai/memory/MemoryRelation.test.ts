import { describe, it, expect } from 'vitest';
import { createMemoryRelationState, addNode, addEdge, removeEdge, edgesFrom, edgesTo, edgesByKind, causalChain, relatedCount, memoryRelationHealth } from './MemoryRelation';

describe('V2152 MemoryRelation', () => {
  it('should create empty state', () => {
    const s = createMemoryRelationState();
    expect(s.edges).toEqual([]);
  });

  it('should add node', () => {
    let s = createMemoryRelationState();
    s = addNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add edge', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    expect(s.edges).toHaveLength(1);
    expect(s.nodes.size).toBe(2);
  });

  it('should not add duplicate edge', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = addEdge(s, 'a', 'b', 'causal');
    expect(s.edges).toHaveLength(1);
  });

  it('should remove edge', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = removeEdge(s, 'a', 'b', 'causal');
    expect(s.edges).toHaveLength(0);
  });

  it('should find edges from', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = addEdge(s, 'a', 'c', 'temporal');
    expect(edgesFrom(s, 'a')).toHaveLength(2);
  });

  it('should find edges by kind', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = addEdge(s, 'b', 'c', 'temporal');
    expect(edgesByKind(s, 'causal')).toHaveLength(1);
  });

  it('should trace causal chain', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = addEdge(s, 'b', 'c', 'causal');
    const chain = causalChain(s, 'a');
    expect(chain).toEqual(['a', 'b', 'c']);
  });

  it('should count related', () => {
    let s = createMemoryRelationState();
    s = addEdge(s, 'a', 'b', 'causal');
    s = addEdge(s, 'c', 'a', 'temporal');
    expect(relatedCount(s, 'a')).toBe(2);
  });

  it('should compute health', () => {
    const s = createMemoryRelationState();
    const h = memoryRelationHealth(s);
    expect(h.health).toBe(0);
  });
});
