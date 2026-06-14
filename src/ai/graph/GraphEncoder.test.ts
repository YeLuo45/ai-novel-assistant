import { describe, it, expect } from 'vitest';
import { createGraphEncoderState, encodeNode, markIndexed, markStale, archiveNode, setNodeWeight, nodeCount, activeNodeCount, graphEncoderHealth } from './GraphEncoder';

describe('V2176 GraphEncoder', () => {
  it('should create empty state', () => {
    const s = createGraphEncoderState();
    expect(nodeCount(s)).toBe(0);
  });

  it('should encode node', () => {
    const { state, node } = encodeNode(createGraphEncoderState(), 'Alice');
    expect(node.vec.length).toBe(8);
    expect(node.tags).toContain('alice');
  });

  it('should mark indexed', () => {
    let s = createGraphEncoderState();
    const { state, node } = encodeNode(s, 'Bob');
    s = markIndexed(state, node.id);
    expect(s.nodes.get(node.id)?.aspect).toBe('indexed');
  });

  it('should mark stale and reduce weight', () => {
    let s = createGraphEncoderState();
    const { state, node } = encodeNode(s, 'Eve');
    s = markStale(state, node.id);
    expect(s.nodes.get(node.id)?.aspect).toBe('stale');
    expect(s.nodes.get(node.id)?.weight).toBe(0.5);
  });

  it('should archive node', () => {
    let s = createGraphEncoderState();
    const { state, node } = encodeNode(s, 'x');
    s = archiveNode(state, node.id);
    expect(s.nodes.get(node.id)?.aspect).toBe('archived');
  });

  it('should set weight clamped 0-1', () => {
    let s = createGraphEncoderState();
    const { state, node } = encodeNode(s, 'x');
    s = setNodeWeight(state, node.id, 0.7);
    expect(s.nodes.get(node.id)?.weight).toBe(0.7);
    s = setNodeWeight(s, node.id, 5);
    expect(s.nodes.get(node.id)?.weight).toBe(1);
  });

  it('should count active nodes', () => {
    let s = createGraphEncoderState();
    const a = encodeNode(s, 'a'); s = a.state;
    const b = encodeNode(s, 'b'); s = b.state;
    s = archiveNode(s, a.node.id);
    expect(activeNodeCount(s)).toBe(1);
  });

  it('should compute health', () => {
    let s = createGraphEncoderState();
    s = encodeNode(s, 'x').state;
    const h = graphEncoderHealth(s);
    expect(h.total).toBe(1);
    expect(h.health).toBe(1);
  });
});
