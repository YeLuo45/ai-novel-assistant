/**
 * V2086 TarjanSCCCore tests - 40 tests covering algorithm correctness, edge cases, and cycle detection.
 */

import { describe, it, expect } from 'vitest';
import {
  findSCCs,
  validateGraph,
  buildAdjacency,
  initTarjanState,
  strongconnect,
  getNontrivialSCCs,
  getTrivialSCCs,
  isNodeInCycle,
  getCycleOfNode,
  getAllCycleNodes,
  computeStats,
  buildGraph,
  type DirectedGraph,
} from '../TarjanSCCCore';

describe('TarjanSCCCore - validateGraph', () => {
  it('accepts empty graph', () => {
    expect(() => validateGraph({ nodes: [], edges: [] })).not.toThrow();
  });

  it('accepts valid graph with no duplicates', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    expect(() => validateGraph(g)).not.toThrow();
  });

  it('rejects duplicate node ids', () => {
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }, { id: 'a' }],
      edges: [],
    };
    expect(() => validateGraph(g)).toThrow(/Duplicate/);
  });

  it('rejects edge referencing unknown source node', () => {
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }],
      edges: [{ from: 'x', to: 'a' }],
    };
    expect(() => validateGraph(g)).toThrow(/unknown node/);
  });

  it('rejects edge referencing unknown target node', () => {
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }],
      edges: [{ from: 'a', to: 'x' }],
    };
    expect(() => validateGraph(g)).toThrow(/unknown node/);
  });
});

describe('TarjanSCCCore - buildAdjacency', () => {
  it('builds empty adjacency for empty graph', () => {
    const adj = buildAdjacency({ nodes: [], edges: [] });
    expect(adj.size).toBe(0);
  });

  it('initializes all nodes with empty lists', () => {
    const adj = buildAdjacency(buildGraph(['a', 'b', 'c'], []));
    expect(adj.size).toBe(3);
    expect(adj.get('a')).toEqual([]);
    expect(adj.get('b')).toEqual([]);
    expect(adj.get('c')).toEqual([]);
  });

  it('populates adjacency from edges', () => {
    const adj = buildAdjacency(buildGraph(['a', 'b'], [['a', 'b']]));
    expect(adj.get('a')).toEqual(['b']);
    expect(adj.get('b')).toEqual([]);
  });

  it('handles multiple edges from same source', () => {
    const adj = buildAdjacency(
      buildGraph(['a', 'b', 'c'], [['a', 'b'], ['a', 'c']])
    );
    expect(adj.get('a')).toEqual(['b', 'c']);
  });

  it('handles self-loops in adjacency', () => {
    const adj = buildAdjacency(buildGraph(['a'], [['a', 'a']]));
    expect(adj.get('a')).toEqual(['a']);
  });
});

describe('TarjanSCCCore - initTarjanState', () => {
  it('initializes all fields correctly', () => {
    const s = initTarjanState(5);
    expect(s.index).toBe(0);
    expect(s.stack).toEqual([]);
    expect(s.onStack.size).toBe(0);
    expect(s.indices.size).toBe(0);
    expect(s.lowlinks.size).toBe(0);
    expect(s.components).toEqual([]);
  });
});

describe('TarjanSCCCore - strongconnect', () => {
  it('processes single isolated node', () => {
    const adj = buildAdjacency(buildGraph(['a'], []));
    const state = initTarjanState(1);
    strongconnect('a', adj, state);
    expect(state.indices.get('a')).toBe(0);
    expect(state.lowlinks.get('a')).toBe(0);
    expect(state.components).toEqual([['a']]);
  });

  it('processes two-node cycle', () => {
    const adj = buildAdjacency(buildGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]));
    const state = initTarjanState(2);
    strongconnect('a', adj, state);
    expect(state.components.length).toBe(1);
    expect(state.components[0].sort()).toEqual(['a', 'b']);
  });

  it('processes linear chain (no cycles)', () => {
    const adj = buildAdjacency(
      buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']])
    );
    const state = initTarjanState(3);
    strongconnect('a', adj, state);
    expect(state.components.length).toBe(3);
  });

  it('handles cross-edge to already-finished SCC', () => {
    // a->b->c, then a->c creates cross-edge to already-processed node
    const adj = buildAdjacency(
      buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['a', 'c']])
    );
    const state = initTarjanState(3);
    strongconnect('a', adj, state);
    // b's SCC is finished before a's recursion, so a->c is a cross-edge
    expect(state.components.length).toBe(3);
  });

  it('handles node with no outgoing edges', () => {
    const adj = buildAdjacency(buildGraph(['a', 'b'], [['a', 'b']]));
    const state = initTarjanState(2);
    strongconnect('a', adj, state);
    expect(state.components.length).toBe(2);
  });

  it('processes complex graph with multiple branches', () => {
    // Diamond pattern: a->b, a->c, b->d, c->d (DAG, no cycles)
    const adj = buildAdjacency(
      buildGraph(
        ['a', 'b', 'c', 'd'],
        [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']]
      )
    );
    const state = initTarjanState(4);
    strongconnect('a', adj, state);
    expect(state.components.length).toBe(4);
  });
});

describe('TarjanSCCCore - findSCCs', () => {
  it('returns empty for empty graph', () => {
    const r = findSCCs({ nodes: [], edges: [] });
    expect(r.components).toEqual([]);
    expect(r.totalNodes).toBe(0);
    expect(r.totalEdges).toBe(0);
    expect(r.hasCycles).toBe(false);
  });

  it('detects no cycle in linear chain', () => {
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const r = findSCCs(g);
    expect(r.components.length).toBe(3);
    expect(r.hasCycles).toBe(false);
    expect(r.trivialCount).toBe(3);
    expect(r.nontrivialCount).toBe(0);
  });

  it('detects 2-node cycle', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = findSCCs(g);
    expect(r.components.length).toBe(1);
    expect(r.components[0].sort()).toEqual(['a', 'b']);
    expect(r.hasCycles).toBe(true);
    expect(r.nontrivialCount).toBe(1);
  });

  it('detects 3-node cycle', () => {
    const g = buildGraph(
      ['a', 'b', 'c'],
      [['a', 'b'], ['b', 'c'], ['c', 'a']]
    );
    const r = findSCCs(g);
    expect(r.components.length).toBe(1);
    expect(r.components[0].sort()).toEqual(['a', 'b', 'c']);
    expect(r.hasCycles).toBe(true);
  });

  it('detects self-loop as cycle', () => {
    const g = buildGraph(['a'], [['a', 'a']]);
    const r = findSCCs(g);
    expect(r.hasSelfLoops).toBe(true);
    expect(r.hasCycles).toBe(true);
    expect(r.nontrivialCount).toBe(1);
  });

  it('detects multiple disjoint cycles', () => {
    const g = buildGraph(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'a'], ['c', 'd'], ['d', 'c']]
    );
    const r = findSCCs(g);
    expect(r.components.length).toBe(2);
    expect(r.nontrivialCount).toBe(2);
  });

  it('builds nodeToComponent map', () => {
    const g = buildGraph(
      ['a', 'b', 'c'],
      [['a', 'b'], ['b', 'a']]
    );
    const r = findSCCs(g);
    expect(r.nodeToComponent.get('a')).toBe(0);
    expect(r.nodeToComponent.get('b')).toBe(0);
    expect(r.nodeToComponent.get('c')).toBeDefined();
  });

  it('handles complex graph with cycle + tail', () => {
    const g = buildGraph(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'a'], ['a', 'c'], ['c', 'd']]
    );
    const r = findSCCs(g);
    expect(r.components.length).toBe(3); // {a,b}, {c}, {d}
    expect(r.nontrivialCount).toBe(1);
    expect(r.trivialCount).toBe(2);
  });

  it('handles diamond DAG (no cycle)', () => {
    const g = buildGraph(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']]
    );
    const r = findSCCs(g);
    expect(r.hasCycles).toBe(false);
    expect(r.components.length).toBe(4);
  });
});

describe('TarjanSCCCore - getNontrivialSCCs', () => {
  it('filters trivial single-node SCCs', () => {
    const g = buildGraph(
      ['a', 'b', 'c'],
      [['a', 'b'], ['b', 'a']]
    );
    const r = findSCCs(g);
    const nontrivial = getNontrivialSCCs(r);
    expect(nontrivial.length).toBe(1);
    expect(nontrivial[0].sort()).toEqual(['a', 'b']);
  });

  it('returns empty when no nontrivial SCCs exist', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    const r = findSCCs(g);
    expect(getNontrivialSCCs(r)).toEqual([]);
  });

  it('keeps self-loops as nontrivial', () => {
    const g = buildGraph(['a'], [['a', 'a']]);
    const r = findSCCs(g);
    expect(getNontrivialSCCs(r).length).toBe(1);
  });
});

describe('TarjanSCCCore - getTrivialSCCs', () => {
  it('returns all single-node SCCs without self-loops', () => {
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b']]);
    const r = findSCCs(g);
    const trivial = getTrivialSCCs(r);
    expect(trivial.length).toBe(3);
  });
});

describe('TarjanSCCCore - isNodeInCycle', () => {
  it('returns true for node in 2-cycle', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = findSCCs(g);
    expect(isNodeInCycle(r, 'a')).toBe(true);
    expect(isNodeInCycle(r, 'b')).toBe(true);
  });

  it('returns false for node not in cycle', () => {
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const r = findSCCs(g);
    expect(isNodeInCycle(r, 'a')).toBe(false);
    expect(isNodeInCycle(r, 'b')).toBe(false);
    expect(isNodeInCycle(r, 'c')).toBe(false);
  });

  it('returns true for self-loop node', () => {
    const g = buildGraph(['a'], [['a', 'a']]);
    const r = findSCCs(g);
    expect(isNodeInCycle(r, 'a')).toBe(true);
  });

  it('returns false for unknown node', () => {
    const g = buildGraph(['a'], []);
    const r = findSCCs(g);
    expect(isNodeInCycle(r, 'z')).toBe(false);
  });
});

describe('TarjanSCCCore - getCycleOfNode', () => {
  it('returns the SCC for node in cycle', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = findSCCs(g);
    const cycle = getCycleOfNode(r, 'a');
    expect(cycle).not.toBeNull();
    expect(cycle!.sort()).toEqual(['a', 'b']);
  });

  it('returns null for node not in cycle', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    const r = findSCCs(g);
    expect(getCycleOfNode(r, 'a')).toBeNull();
  });

  it('returns [nodeId] for self-loop node', () => {
    const g = buildGraph(['a'], [['a', 'a']]);
    const r = findSCCs(g);
    expect(getCycleOfNode(r, 'a')).toEqual(['a']);
  });

  it('returns null for unknown node', () => {
    const g = buildGraph(['a'], []);
    const r = findSCCs(g);
    expect(getCycleOfNode(r, 'z')).toBeNull();
  });
});

describe('TarjanSCCCore - getAllCycleNodes', () => {
  it('returns all nodes in nontrivial cycles', () => {
    const g = buildGraph(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'a'], ['c', 'd'], ['d', 'c']]
    );
    const r = findSCCs(g);
    const cycleNodes = getAllCycleNodes(r);
    expect(cycleNodes.size).toBe(4);
    expect(cycleNodes.has('a')).toBe(true);
    expect(cycleNodes.has('b')).toBe(true);
    expect(cycleNodes.has('c')).toBe(true);
    expect(cycleNodes.has('d')).toBe(true);
  });

  it('returns empty when no cycles', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    const r = findSCCs(g);
    expect(getAllCycleNodes(r).size).toBe(0);
  });
});

describe('TarjanSCCCore - computeStats', () => {
  it('computes correct stats for graph with cycles', () => {
    const g = buildGraph(
      ['a', 'b', 'c'],
      [['a', 'b'], ['b', 'a']]
    );
    const r = findSCCs(g);
    const s = computeStats(r);
    expect(s.totalComponents).toBe(2); // {a,b}, {c}
    expect(s.trivialComponents).toBe(1);
    expect(s.nontrivialComponents).toBe(1);
    expect(s.largestComponentSize).toBe(2);
    expect(s.smallestNontrivialSize).toBe(2);
  });

  it('computes stats for empty graph', () => {
    const r = findSCCs({ nodes: [], edges: [] });
    const s = computeStats(r);
    expect(s.totalComponents).toBe(0);
    expect(s.avgComponentSize).toBe(0);
  });

  it('handles Infinity smallestNontrivial for empty nontrivial SCCs', () => {
    // Graph with only trivial SCCs (no cycles)
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const r = findSCCs(g);
    const s = computeStats(r);
    expect(s.nontrivialComponents).toBe(0);
    expect(s.smallestNontrivialSize).toBe(0);
  });

  it('computes avg size correctly', () => {
    // 2-node cycle + 2 trivial = avg 1.5
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'a']]);
    const r = findSCCs(g);
    const s = computeStats(r);
    expect(s.totalComponents).toBe(2);
    expect(s.avgComponentSize).toBeCloseTo(1.5, 5);
  });
});

describe('TarjanSCCCore - buildGraph', () => {
  it('builds graph from ids and pairs', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    expect(g.nodes).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(g.edges).toEqual([{ from: 'a', to: 'b' }]);
  });
});
