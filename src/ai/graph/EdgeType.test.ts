import { describe, it, expect } from 'vitest';
import { createEdgeTypeState, addTypedEdge, setEdgeWeight, edgesFromNode, edgesToNode, edgesOfKind, removeEdge, countByKind, edgeTypeHealth } from './EdgeType';

describe('V2182 EdgeType', () => {
  it('should create empty state', () => {
    const s = createEdgeTypeState();
    expect(s.edges.size).toBe(0);
  });

  it('should add typed edge', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'relates_to');
    expect(s.edges.size).toBe(1);
  });

  it('should set edge weight', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes', 0.5);
    const id = s.edges.keys().next().value;
    s = setEdgeWeight(s, id, 0.8);
    expect(s.edges.get(id)?.weight).toBe(0.8);
  });

  it('should find edges from', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    s = addTypedEdge(s, 'a', 'c', 'similar_to');
    expect(edgesFromNode(s, 'a')).toHaveLength(2);
  });

  it('should find edges to', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    s = addTypedEdge(s, 'c', 'b', 'causes');
    expect(edgesToNode(s, 'b')).toHaveLength(2);
  });

  it('should filter by kind', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    s = addTypedEdge(s, 'b', 'c', 'relates_to');
    expect(edgesOfKind(s, 'causes')).toHaveLength(1);
  });

  it('should remove edge', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    const id = s.edges.keys().next().value;
    s = removeEdge(s, id);
    expect(s.edges.size).toBe(0);
  });

  it('should count by kind', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    s = addTypedEdge(s, 'b', 'c', 'causes');
    s = addTypedEdge(s, 'c', 'd', 'relates_to');
    const counts = countByKind(s);
    expect(counts.causes).toBe(2);
  });

  it('should compute health', () => {
    let s = createEdgeTypeState();
    s = addTypedEdge(s, 'a', 'b', 'causes');
    const h = edgeTypeHealth(s);
    expect(h.health).toBe(1);
  });
});
