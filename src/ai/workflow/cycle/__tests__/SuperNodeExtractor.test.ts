/**
 * V2088 SuperNodeExtractor tests.
 * Covers: mergeSuperNodes, extractSuperNodes, buildSuperNodeGraph,
 * getSuperNodeOf, getSuperNodeMembers, isInSuperNode, validateSuperNodes,
 * getCycleSuperNodes, countSuperNodes.
 */

import { describe, it, expect } from 'vitest';
import {
  mergeSuperNodes,
  extractSuperNodes,
  buildSuperNodeGraph,
  buildSuperNodeEdges,
  getSuperNodeOf,
  getSuperNodeMembers,
  isInSuperNode,
  validateSuperNodes,
  getCycleSuperNodes,
  countSuperNodes,
  type SuperNodeGraph,
} from '../SuperNodeExtractor';
import { buildGraph, type DirectedGraph } from '../TarjanSCCCore';

// ---------------------------------------------------------------------------
// mergeSuperNodes — auto-generated IDs
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - mergeSuperNodes auto mode', () => {
  it('produces one super node per SCC', () => {
    const sccs = [['a', 'b'], ['c'], ['d', 'e', 'f']];
    const graph = mergeSuperNodes(sccs);
    expect(graph.superNodes.length).toBe(3);
    expect(graph.superNodeEdges).toEqual([]);
  });

  it('assigns sequential auto IDs by default prefix sn', () => {
    const sccs = [['a'], ['b'], ['c']];
    const graph = mergeSuperNodes(sccs);
    const ids = graph.superNodes.map((s) => s.id);
    expect(ids).toEqual(['sn_0', 'sn_1', 'sn_2']);
  });

  it('honors custom idPrefix', () => {
    const sccs = [['x'], ['y']];
    const graph = mergeSuperNodes(sccs, { idPrefix: 'cyc' });
    expect(graph.superNodes.map((s) => s.id)).toEqual(['cyc_0', 'cyc_1']);
  });

  it('populates nodeToSuper for every original node', () => {
    const sccs = [['a', 'b'], ['c']];
    const graph = mergeSuperNodes(sccs);
    expect(graph.nodeToSuper.size).toBe(3);
    expect(graph.nodeToSuper.get('a')).toBe('sn_0');
    expect(graph.nodeToSuper.get('b')).toBe('sn_0');
    expect(graph.nodeToSuper.get('c')).toBe('sn_1');
  });

  it('marks multi-node SCCs as cycle and single-node as non-cycle', () => {
    const sccs = [['a', 'b'], ['c']];
    const graph = mergeSuperNodes(sccs);
    const cycle = graph.superNodes.find((s) => s.id === 'sn_0')!;
    const trivial = graph.superNodes.find((s) => s.id === 'sn_1')!;
    expect(cycle.isCycle).toBe(true);
    expect(trivial.isCycle).toBe(false);
  });

  it('handles empty SCC list', () => {
    const graph = mergeSuperNodes([]);
    expect(graph.superNodes).toEqual([]);
    expect(graph.nodeToSuper.size).toBe(0);
    expect(graph.superNodeEdges).toEqual([]);
  });

  it('rejects duplicate node IDs across SCCs', () => {
    expect(() => mergeSuperNodes([['a'], ['a', 'b']])).toThrow(/Duplicate/);
  });
});

// ---------------------------------------------------------------------------
// mergeSuperNodes — explicit nodeMap
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - mergeSuperNodes explicit nodeMap', () => {
  it('uses explicit node-to-super assignments', () => {
    const nodeMap = new Map<string, string>([
      ['a', 'big'],
      ['b', 'big'],
      ['c', 'small'],
    ]);
    const graph = mergeSuperNodes([['a'], ['b'], ['c']], { nodeMap });
    expect(graph.superNodes.length).toBe(2);
    const big = graph.superNodes.find((s) => s.id === 'big')!;
    const small = graph.superNodes.find((s) => s.id === 'small')!;
    expect(big.members.sort()).toEqual(['a', 'b']);
    expect(small.members).toEqual(['c']);
    expect(big.isCycle).toBe(true);
  });

  it('throws when explicit nodeMap is missing a node', () => {
    const nodeMap = new Map<string, string>([['a', 'big']]);
    expect(() =>
      mergeSuperNodes([['a'], ['b']], { nodeMap })
    ).toThrow(/missing from explicit nodeMap/);
  });

  it('throws when explicit nodeMap has extra keys', () => {
    const nodeMap = new Map<string, string>([
      ['a', 'big'],
      ['x', 'extra'],
    ]);
    expect(() => mergeSuperNodes([['a']], { nodeMap })).toThrow(
      /not present in sccs/
    );
  });
});

// ---------------------------------------------------------------------------
// mergeSuperNodes — partial nodeMap
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - mergeSuperNodes partialNodeMap', () => {
  it('overrides only the listed nodes', () => {
    const partial = new Map<string, string>([
      ['a', 'shared'],
      ['b', 'shared'],
    ]);
    const graph = mergeSuperNodes(
      [['a'], ['b'], ['c']],
      { partialNodeMap: partial }
    );
    const shared = graph.superNodes.find((s) => s.id === 'shared')!;
    expect(shared.members.sort()).toEqual(['a', 'b']);
    expect(graph.nodeToSuper.get('a')).toBe('shared');
    expect(graph.nodeToSuper.get('b')).toBe('shared');
    expect(graph.nodeToSuper.get('c')).toBe('sn_2');
  });

  it('throws when partial map references a node not in sccs', () => {
    const partial = new Map<string, string>([['zz', 'whatever']]);
    expect(() =>
      mergeSuperNodes([['a']], { partialNodeMap: partial })
    ).toThrow(/not in sccs/);
  });
});

// ---------------------------------------------------------------------------
// extractSuperNodes
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - extractSuperNodes', () => {
  it('produces super nodes for a trivial DAG', () => {
    const g = buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const result = extractSuperNodes(g);
    expect(result.superNodes.length).toBe(3);
    const aSuper = result.nodeToSuper.get('a')!;
    const bSuper = result.nodeToSuper.get('b')!;
    const cSuper = result.nodeToSuper.get('c')!;
    // The edges should match the original graph contracted to super-node IDs.
    const sortedActual = [...result.superNodeEdges].sort(
      (x, y) => `${x.from}${x.to}`.localeCompare(`${y.from}${y.to}`)
    );
    const sortedExpected = [
      { from: aSuper, to: bSuper },
      { from: bSuper, to: cSuper },
    ].sort((x, y) => `${x.from}${x.to}`.localeCompare(`${y.from}${y.to}`));
    expect(sortedActual).toEqual(sortedExpected);
    expect(result.superNodes.every((s) => s.isCycle === false)).toBe(true);
  });

  it('merges a 2-node cycle into one super node', () => {
    const g = buildGraph(['a', 'b', 'c'], [
      ['a', 'b'],
      ['b', 'a'],
      ['b', 'c'],
    ]);
    const result = extractSuperNodes(g);
    const cycle = result.superNodes.find((s) => s.isCycle)!;
    expect(cycle.members.sort()).toEqual(['a', 'b']);
    const cSuper = result.nodeToSuper.get('c')!;
    // The edge from cycle to c should be the only outgoing edge.
    expect(result.superNodeEdges).toEqual([
      { from: cycle.id, to: cSuper },
    ]);
  });

  it('marks a self-loop SCC as a cycle', () => {
    const g = buildGraph(['a', 'b'], [['a', 'a'], ['a', 'b']]);
    const result = extractSuperNodes(g);
    const aNode = result.superNodes.find((s) =>
      s.members.includes('a')
    )!;
    expect(aNode.isCycle).toBe(true);
  });

  it('deduplicates parallel super-node edges', () => {
    const g = buildGraph(['a', 'b', 'c'], [
      ['a', 'b'],
      ['a', 'b'],
      ['a', 'b'],
    ]);
    const result = extractSuperNodes(g);
    expect(result.superNodeEdges.length).toBe(1);
  });

  it('omits intra-super self-loop edges', () => {
    const g = buildGraph(['a', 'b', 'c'], [
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'c'],
      ['c', 'a'],
    ]);
    const result = extractSuperNodes(g);
    // Cycle {a,b} is one super node, plus c.
    expect(result.superNodeEdges).toEqual([]);
  });

  it('handles empty graph', () => {
    const g = buildGraph([], []);
    const result = extractSuperNodes(g);
    expect(result.superNodes).toEqual([]);
    expect(result.superNodeEdges).toEqual([]);
  });

  it('throws on duplicate node IDs in graph', () => {
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }, { id: 'a' }],
      edges: [],
    };
    expect(() => extractSuperNodes(g)).toThrow(/Duplicate/);
  });

  it('throws on edge referencing unknown node', () => {
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }],
      edges: [{ from: 'a', to: 'x' }],
    };
    expect(() => extractSuperNodes(g)).toThrow(/unknown node/);
  });

  it('produces acyclic super-node graph for a cyclic input', () => {
    const g = buildGraph(['a', 'b', 'c', 'd'], [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
      ['c', 'd'],
    ]);
    const result = extractSuperNodes(g);
    const cycleSuper = result.nodeToSuper.get('a')!;
    const dSuper = result.nodeToSuper.get('d')!;
    // The {a,b,c} SCC becomes one super node; the edges among them disappear.
    expect(result.superNodeEdges).toEqual([
      { from: cycleSuper, to: dSuper },
    ]);
    expect(result.superNodes.find((s) => s.id === cycleSuper)!.isCycle).toBe(true);
  });
});

describe('SuperNodeExtractor - buildSuperNodeEdges', () => {
  it('contracts edges and skips internal super edges', () => {
    const map = new Map<string, string>([
      ['a', 's1'],
      ['b', 's1'],
      ['c', 's2'],
    ]);
    const edges = [
      { from: 'a', to: 'b' },   // internal
      { from: 'b', to: 'c' },   // external
      { from: 'a', to: 'c' },   // external (duplicate target)
    ];
    const result = buildSuperNodeEdges(edges, map);
    expect(result).toEqual([{ from: 's1', to: 's2' }]);
  });

  it('skips edges whose endpoints are not in the mapping', () => {
    const map = new Map<string, string>([['a', 's1']]);
    const edges = [
      { from: 'a', to: 'ghost' },
      { from: 'ghost', to: 'a' },
      { from: 'ghost', to: 'ghost2' },
    ];
    const result = buildSuperNodeEdges(edges, map);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildSuperNodeGraph
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - buildSuperNodeGraph', () => {
  it('attaches super-node edges to a pre-built mapping', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    const merged = mergeSuperNodes([['a'], ['b']]);
    const result = buildSuperNodeGraph(g, merged);
    expect(result.superNodeEdges).toEqual([
      { from: 'sn_0', to: 'sn_1' },
    ]);
  });

  it('returns input unchanged when edges are already built', () => {
    const g = buildGraph(['a', 'b'], [['a', 'b']]);
    const first = extractSuperNodes(g);
    const second = buildSuperNodeGraph(g, first);
    expect(second).toBe(first);
  });

  it('throws on invalid graph', () => {
    const bad: DirectedGraph = {
      nodes: [{ id: 'a' }, { id: 'a' }],
      edges: [],
    };
    const merged = mergeSuperNodes([['a']]);
    expect(() => buildSuperNodeGraph(bad, merged)).toThrow(/Duplicate/);
  });
});

// ---------------------------------------------------------------------------
// getSuperNodeOf
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - getSuperNodeOf', () => {
  it('returns the super node ID for a known node', () => {
    const g = mergeSuperNodes([['a', 'b'], ['c']]);
    expect(getSuperNodeOf(g, 'a')).toBe('sn_0');
    expect(getSuperNodeOf(g, 'c')).toBe('sn_1');
  });

  it('returns null for an unknown node', () => {
    const g = mergeSuperNodes([['a']]);
    expect(getSuperNodeOf(g, 'zzz')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getSuperNodeMembers
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - getSuperNodeMembers', () => {
  it('returns a copy of the members list', () => {
    const g = mergeSuperNodes([['a', 'b', 'c']]);
    const members = getSuperNodeMembers(g, 'sn_0');
    expect(members.sort()).toEqual(['a', 'b', 'c']);
    // Should be a copy.
    members.push('mutated');
    expect(getSuperNodeMembers(g, 'sn_0').length).toBe(3);
  });

  it('returns empty array for unknown super node', () => {
    const g = mergeSuperNodes([['a']]);
    expect(getSuperNodeMembers(g, 'nope')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isInSuperNode
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - isInSuperNode', () => {
  it('returns true for a mapped node', () => {
    const g = mergeSuperNodes([['a']]);
    expect(isInSuperNode(g, 'a')).toBe(true);
  });

  it('returns false for an unmapped node', () => {
    const g = mergeSuperNodes([['a']]);
    expect(isInSuperNode(g, 'unknown')).toBe(false);
  });

  it('returns false for an empty mapping', () => {
    const g = mergeSuperNodes([]);
    expect(isInSuperNode(g, 'anything')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateSuperNodes
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - validateSuperNodes', () => {
  it('accepts a well-formed graph', () => {
    const result = validateSuperNodes(
      [
        { id: 's1', members: ['a', 'b'], isCycle: true },
        { id: 's2', members: ['c'], isCycle: false },
      ],
      [{ from: 's1', to: 's2' }]
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags duplicate super node IDs', () => {
    const result = validateSuperNodes(
      [
        { id: 's1', members: ['a'], isCycle: false },
        { id: 's1', members: ['b'], isCycle: false },
      ],
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /Duplicate/.test(e))).toBe(true);
  });

  it('flags empty super nodes', () => {
    const result = validateSuperNodes(
      [{ id: 's1', members: [], isCycle: false }],
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /no members/.test(e))).toBe(true);
  });

  it('flags empty super node IDs', () => {
    const result = validateSuperNodes(
      [{ id: '', members: ['a'], isCycle: false }],
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /empty id/.test(e))).toBe(true);
  });

  it('flags a node assigned to multiple super nodes', () => {
    const result = validateSuperNodes(
      [
        { id: 's1', members: ['a'], isCycle: false },
        { id: 's2', members: ['a'], isCycle: false },
      ],
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /both/.test(e))).toBe(true);
  });

  it('flags edges referencing unknown super nodes (from side)', () => {
    const result = validateSuperNodes(
      [{ id: 's1', members: ['a'], isCycle: false }],
      [{ from: 'ghost', to: 's1' }]
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /ghost/.test(e))).toBe(true);
  });

  it('flags self-loop edges on super nodes', () => {
    const result = validateSuperNodes(
      [{ id: 's1', members: ['a', 'b'], isCycle: true }],
      [{ from: 's1', to: 's1' }]
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /Self-loop edge/.test(e))).toBe(true);
  });

  it('reports multiple errors at once', () => {
    const result = validateSuperNodes(
      [
        { id: 's1', members: [], isCycle: false },
        { id: 's2', members: ['x'], isCycle: false },
      ],
      [{ from: 's2', to: 'missing' }]
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// getCycleSuperNodes / countSuperNodes
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - getCycleSuperNodes', () => {
  it('returns only cycle-flagged super nodes', () => {
    const graph = extractSuperNodes(
      buildGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'a'], ['b', 'c']])
    );
    const cycles = getCycleSuperNodes(graph);
    expect(cycles.length).toBe(1);
    expect(cycles[0].members.sort()).toEqual(['a', 'b']);
  });

  it('returns empty array when no cycles', () => {
    const graph = extractSuperNodes(
      buildGraph(['a', 'b'], [['a', 'b']])
    );
    expect(getCycleSuperNodes(graph)).toEqual([]);
  });
});

describe('SuperNodeExtractor - countSuperNodes', () => {
  it('counts super nodes including trivial ones', () => {
    const graph = extractSuperNodes(
      buildGraph(['a', 'b', 'c', 'd'], [['a', 'b'], ['b', 'c'], ['c', 'a']])
    );
    expect(countSuperNodes(graph)).toBe(2);
  });

  it('returns 0 for empty graph', () => {
    expect(countSuperNodes(mergeSuperNodes([]))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Integration: extractSuperNodes + query + validate
// ---------------------------------------------------------------------------

describe('SuperNodeExtractor - integration', () => {
  it('produces a graph that passes validateSuperNodes', () => {
    const g = buildGraph(
      ['a', 'b', 'c', 'd', 'e'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
        ['c', 'd'],
        ['d', 'e'],
      ]
    );
    const snGraph = extractSuperNodes(g);
    const result = validateSuperNodes(
      snGraph.superNodes,
      snGraph.superNodeEdges
    );
    expect(result.valid).toBe(true);
    // Every original node should be queryable.
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(isInSuperNode(snGraph, id)).toBe(true);
      expect(getSuperNodeOf(snGraph, id)).not.toBeNull();
    }
  });
});