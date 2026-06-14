import { describe, it, expect } from 'vitest';
import { createGraphStorageState, addNode, addEdge, neighborsOf, getNode, setProp, removeNode, removeEdge, nodeCount, edgeCount, graphStorageHealth } from './GraphStorage';

describe('V2177 GraphStorage', () => {
  it('should create empty state', () => {
    const s = createGraphStorageState();
    expect(nodeCount(s)).toBe(0);
  });

  it('should add node', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Alice');
    expect(s.nodes.size).toBe(1);
  });

  it('should not add duplicate node', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Alice');
    s = addNode(s, 'a', 'Alice2');
    expect(s.nodes.size).toBe(1);
  });

  it('should add edge', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Alice');
    s = addNode(s, 'b', 'Bob');
    s = addEdge(s, 'a', 'b');
    expect(edgeCount(s)).toBe(1);
  });

  it('should not add edge if nodes missing', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addEdge(s, 'a', 'missing');
    expect(edgeCount(s)).toBe(0);
  });

  it('should get neighbors', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addEdge(s, 'a', 'b');
    expect(neighborsOf(s, 'a')).toEqual(['b']);
  });

  it('should set property', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = setProp(s, 'a', 'age', 30);
    expect(getNode(s, 'a')?.props.age).toBe(30);
  });

  it('should remove node and connected edges', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addEdge(s, 'a', 'b');
    s = removeNode(s, 'a');
    expect(edgeCount(s)).toBe(0);
  });

  it('should remove edge', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addEdge(s, 'a', 'b');
    s = removeEdge(s, 'a', 'b');
    expect(edgeCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    const h = graphStorageHealth(s);
    expect(h.health).toBe(1);
  });
});
