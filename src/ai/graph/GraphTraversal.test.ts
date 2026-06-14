import { describe, it, expect } from 'vitest';
import { createTraversalState, traverse, shortestPath, reachableFrom, graphTraversalHealth } from './GraphTraversal';
import { createGraphStorageState, addNode, addEdge } from './GraphStorage';

describe('V2179 GraphTraversal', () => {
  it('should create empty state', () => {
    const s = createTraversalState();
    expect(s.visited.size).toBe(0);
  });

  it('should BFS traverse', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addNode(s, 'c', 'C');
    s = addEdge(s, 'a', 'b');
    s = addEdge(s, 'a', 'c');
    const t = traverse(s, 'a', 'bfs');
    expect(t.order).toContain('a');
    expect(t.order).toContain('b');
    expect(t.order).toContain('c');
  });

  it('should DFS traverse', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addEdge(s, 'a', 'b');
    const t = traverse(s, 'a', 'dfs');
    expect(t.order.length).toBe(2);
  });

  it('should respect max depth', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addNode(s, 'c', 'C');
    s = addEdge(s, 'a', 'b');
    s = addEdge(s, 'b', 'c');
    const t = traverse(s, 'a', 'bfs', 1);
    expect(t.order).toEqual(['a', 'b']);
  });

  it('should return empty for unknown start', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    const t = traverse(s, 'unknown', 'bfs');
    expect(t.order).toEqual([]);
  });

  it('should find shortest path', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addNode(s, 'c', 'C');
    s = addEdge(s, 'a', 'b');
    s = addEdge(s, 'b', 'c');
    const path = shortestPath(s, 'a', 'c');
    expect(path).toEqual(['a', 'b', 'c']);
  });

  it('should return single for same start/end', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    const path = shortestPath(s, 'a', 'a');
    expect(path).toEqual(['a']);
  });

  it('should find reachable nodes', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    s = addNode(s, 'b', 'B');
    s = addEdge(s, 'a', 'b');
    expect(reachableFrom(s, 'a')).toEqual(['a', 'b']);
  });

  it('should compute health', () => {
    const s = createTraversalState();
    const h = graphTraversalHealth(s);
    expect(h.health).toBe(0);
  });
});
