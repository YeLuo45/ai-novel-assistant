/**
 * V2087 CycleDetector tests - 35 tests covering cycle detection on workflow graphs.
 */

import { describe, it, expect } from 'vitest';
import {
  toDirectedGraph,
  findEntryNodes,
  findExitNodes,
  findIsolatedNodes,
  detectCycles,
  hasCycles,
  isWorkflowNodeInCycle,
  getWorkflowCycleNodes,
  toDAG,
  type WorkflowGraph,
} from '../CycleDetector';

function makeWorkflow(
  nodeIds: string[],
  edges: Array<[string, string]>
): WorkflowGraph {
  return {
    nodes: nodeIds.map((id) => ({ id, type: 'task' })),
    edges: edges.map(([from, to]) => ({ from, to })),
  };
}

describe('CycleDetector - toDirectedGraph', () => {
  it('converts workflow to directed graph', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    const d = toDirectedGraph(w);
    expect(d.nodes.length).toBe(2);
    expect(d.edges.length).toBe(1);
  });

  it('preserves metadata', () => {
    const w: WorkflowGraph = {
      nodes: [{ id: 'a', type: 'task', metadata: { x: 1 } }],
      edges: [],
    };
    const d = toDirectedGraph(w);
    expect(d.nodes[0].metadata).toEqual({ x: 1 });
  });
});

describe('CycleDetector - findEntryNodes', () => {
  it('finds single entry node', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    expect(findEntryNodes(w)).toEqual(['a']);
  });

  it('finds multiple entry nodes', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['b', 'c']]);
    const entries = findEntryNodes(w).sort();
    expect(entries).toEqual(['a', 'b']);
  });

  it('returns all nodes when no edges', () => {
    const w = makeWorkflow(['a', 'b', 'c'], []);
    expect(findEntryNodes(w).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('CycleDetector - findExitNodes', () => {
  it('finds single exit node', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    expect(findExitNodes(w)).toEqual(['b']);
  });

  it('finds multiple exit nodes', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b']]);
    const exits = findExitNodes(w).sort();
    expect(exits).toEqual(['b', 'c']);
  });

  it('returns empty when graph has only cycles', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    expect(findExitNodes(w)).toEqual([]);
  });
});

describe('CycleDetector - findIsolatedNodes', () => {
  it('finds isolated nodes', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b']]);
    expect(findIsolatedNodes(w)).toEqual(['c']);
  });

  it('returns empty for fully connected graph', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    expect(findIsolatedNodes(w)).toEqual([]);
  });

  it('returns all for empty graph', () => {
    const w = makeWorkflow(['a', 'b'], []);
    expect(findIsolatedNodes(w).sort()).toEqual(['a', 'b']);
  });
});

describe('CycleDetector - detectCycles', () => {
  it('returns no cycles for DAG', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const r = detectCycles(w);
    expect(r.hasCycles).toBe(false);
    expect(r.cycleCount).toBe(0);
    expect(r.cycleNodes).toEqual([]);
  });

  it('detects 2-node cycle', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = detectCycles(w);
    expect(r.hasCycles).toBe(true);
    expect(r.cycleCount).toBe(1);
    expect(r.cycleNodes.sort()).toEqual(['a', 'b']);
    expect(r.longestCycleLength).toBe(2);
  });

  it('finds entry and exit nodes', () => {
    const w = makeWorkflow(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'c'], ['c', 'a']]
    );
    const r = detectCycles(w);
    // d is the only node with no incoming edges (entry) and no outgoing (exit)
    // a/b/c form a cycle (a receives from c), so none of them are entries/exits
    expect(r.entryNodes).toEqual(['d']);
    expect(r.exitNodes).toEqual(['d']);
  });

  it('identifies longest cycle', () => {
    const w = makeWorkflow(
      ['a', 'b', 'c', 'd', 'e'],
      [['a', 'b'], ['b', 'c'], ['c', 'a'], ['d', 'e'], ['e', 'd']]
    );
    const r = detectCycles(w);
    expect(r.cycleCount).toBe(2);
    expect(r.longestCycleLength).toBe(3);
  });
});

describe('CycleDetector - hasCycles', () => {
  it('returns true for cyclic graph', () => {
    expect(hasCycles(makeWorkflow(['a', 'b'], [['a', 'b'], ['b', 'a']]))).toBe(true);
  });
  it('returns false for DAG', () => {
    expect(hasCycles(makeWorkflow(['a', 'b'], [['a', 'b']]))).toBe(false);
  });
});

describe('CycleDetector - isWorkflowNodeInCycle', () => {
  it('returns true for node in cycle', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    expect(isWorkflowNodeInCycle(w, 'a')).toBe(true);
  });
  it('returns false for node not in cycle', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    expect(isWorkflowNodeInCycle(w, 'a')).toBe(false);
  });
});

describe('CycleDetector - getWorkflowCycleNodes', () => {
  it('returns cycle nodes set', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b'], ['b', 'a']]);
    const nodes = getWorkflowCycleNodes(w);
    expect(nodes.size).toBe(2);
    expect(nodes.has('a')).toBe(true);
    expect(nodes.has('b')).toBe(true);
    expect(nodes.has('c')).toBe(false);
  });
});

describe('CycleDetector - toDAG', () => {
  it('replaces SCC with super node', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b'], ['b', 'a'], ['a', 'c']]);
    const result = toDAG(w);
    expect(result.removedNodes.sort()).toEqual(['a', 'b']);
    expect(result.superNodeMap.get('a')).toBe('__super_0');
    expect(result.superNodeMap.get('b')).toBe('__super_0');
  });

  it('produces DAG with super node', () => {
    const w = makeWorkflow(['a', 'b', 'c'], [['a', 'b'], ['b', 'a'], ['a', 'c']]);
    const result = toDAG(w);
    // Now should be: __super_0 -> c
    expect(result.graph.edges.length).toBe(1);
    expect(result.graph.edges[0].from).toBe('__super_0');
    expect(result.graph.edges[0].to).toBe('c');
  });

  it('handles DAG without changes', () => {
    const w = makeWorkflow(['a', 'b'], [['a', 'b']]);
    const result = toDAG(w);
    expect(result.removedNodes).toEqual([]);
    expect(result.superNodeMap.size).toBe(0);
    expect(result.graph.nodes.length).toBe(2);
  });

  it('handles multiple disjoint cycles', () => {
    const w = makeWorkflow(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'a'], ['c', 'd'], ['d', 'c']]
    );
    const result = toDAG(w);
    expect(result.removedNodes.sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(result.superNodeMap.get('a')).toBe('__super_0');
    expect(result.superNodeMap.get('c')).toBe('__super_1');
  });
});
