import { describe, it, expect } from 'vitest';
import { createNodeTypeState, addTypedGraphNode, accessGraphNode, byKind, totalByKind, mostAccessed, nodeTypeHealth } from './NodeType';

describe('V2181 NodeType', () => {
  it('should create empty state', () => {
    const s = createNodeTypeState();
    expect(s.byKind.size).toBe(0);
  });

  it('should add typed node', () => {
    let s = createNodeTypeState();
    s = addTypedGraphNode(s, { id: 'n1', kind: 'entity', label: 'Alice', createdAt: 0 });
    expect(byKind(s, 'entity')).toHaveLength(1);
  });

  it('should access and bump count', () => {
    let s = createNodeTypeState();
    s = addTypedGraphNode(s, { id: 'n1', kind: 'event', label: 'E', createdAt: 0 });
    s = accessGraphNode(s, 'n1');
    s = accessGraphNode(s, 'n1');
    expect(byKind(s, 'event')[0].accessCount).toBe(2);
  });

  it('should count by kind', () => {
    let s = createNodeTypeState();
    s = addTypedGraphNode(s, { id: 'a', kind: 'entity', label: 'a', createdAt: 0 });
    s = addTypedGraphNode(s, { id: 'b', kind: 'concept', label: 'b', createdAt: 0 });
    s = addTypedGraphNode(s, { id: 'c', kind: 'entity', label: 'c', createdAt: 0 });
    const counts = totalByKind(s);
    expect(counts.entity).toBe(2);
  });

  it('should rank most accessed', () => {
    let s = createNodeTypeState();
    s = addTypedGraphNode(s, { id: 'a', kind: 'entity', label: 'a', createdAt: 0 });
    s = addTypedGraphNode(s, { id: 'b', kind: 'entity', label: 'b', createdAt: 0 });
    s = accessGraphNode(s, 'a');
    s = accessGraphNode(s, 'a');
    const top = mostAccessed(s, 1);
    expect(top[0].id).toBe('a');
  });

  it('should access unknown idempotently', () => {
    const s = createNodeTypeState();
    const r = accessGraphNode(s, 'nope');
    expect(r).toBe(s);
  });

  it('should compute health', () => {
    let s = createNodeTypeState();
    s = addTypedGraphNode(s, { id: 'a', kind: 'entity', label: 'a', createdAt: 0 });
    const h = nodeTypeHealth(s);
    expect(h.health).toBe(1);
  });
});
