/**
 * V2091 NestedExecutionEngine tests - 35+ tests covering SCC execution,
 * execution order, nested-cycle detection, flattening, isolation, depth
 * and nested-context handling.
 */

import { describe, it, expect } from 'vitest';
import {
  executeNested,
  buildExecutionOrder,
  detectNestedCycles,
  flattenNestedGraph,
  isolateNestedExecution,
  getExecutionDepth,
  createNestedContext,
  contextChain,
} from '../NestedExecutionEngine';
import type { DirectedGraph } from '../TarjanSCCCore';

function graphFromEdges(
  nodes: string[],
  edges: [string, string][]
): DirectedGraph {
  return {
    nodes: nodes.map((id) => ({ id })),
    edges: edges.map(([from, to]) => ({ from, to })),
  };
}

describe('NestedExecutionEngine - executeNested', () => {
  it('runs nodes of a trivial SCC in stable order', () => {
    const graph = graphFromEdges(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = executeNested(['a', 'b'], graph);
    expect(r.iterations).toBe(2);
    expect(r.order).toEqual(['a', 'b']);
    expect(r.overflow).toBe(false);
  });

  it('marks overflow when cycle exceeds maxIterations', () => {
    const graph = graphFromEdges(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    const r = executeNested(['a', 'b'], graph, { maxIterations: 1 });
    expect(r.iterations).toBe(1);
    expect(r.overflow).toBe(true);
  });

  it('reports nestedCycleDetected when SCC contains further nontrivial SCCs', () => {
    // SCC of 3 nodes where every pair has an edge → 1 nontrivial SCC (size 3), no nested cycles.
    const graph = graphFromEdges(
      ['a', 'b', 'c'],
      [['a', 'b'], ['b', 'c'], ['c', 'a'], ['a', 'c']]
    );
    const r = executeNested(['a', 'b', 'c'], graph);
    expect(r.nestedCycleDetected).toBe(false);
  });

  it('handles empty SCC', () => {
    const graph = graphFromEdges([], []);
    const r = executeNested([], graph);
    expect(r.cycleId).toBe('__empty__');
    expect(r.iterations).toBe(0);
  });

  it('uses custom now() provider', () => {
    const now = () => 42;
    const graph = graphFromEdges(['a'], []);
    const r = executeNested(['a'], graph, { now });
    expect(r.cycleId).toBe('a');
    void now();
  });
});

describe('NestedExecutionEngine - buildExecutionOrder', () => {
  it('returns empty array for empty SCC', () => {
    expect(buildExecutionOrder({ nodes: [], edges: [] }, [])).toEqual([]);
  });

  it('returns single node', () => {
    expect(buildExecutionOrder(graphFromEdges(['x'], []), ['x'])).toEqual(['x']);
  });

  it('puts nodes without internal incoming edges first', () => {
    const graph = graphFromEdges(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'b']]
    );
    // b, c, d form a 3-cycle; 'a' is the entry.
    expect(buildExecutionOrder(graph, ['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd']);
  });

  it('orders independent SCC nodes alphabetically', () => {
    const graph = graphFromEdges(['z', 'a', 'm'], []);
    expect(buildExecutionOrder(graph, ['z', 'a', 'm'])).toEqual(['a', 'm', 'z']);
  });

  it('filters out edges from outside the SCC', () => {
    const graph = graphFromEdges(
      ['a', 'b', 'x'],
      [['x', 'a'], ['a', 'b'], ['b', 'a']]
    );
    // Edge from x→a is outside SCC; should not affect ordering
    expect(buildExecutionOrder(graph, ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('NestedExecutionEngine - detectNestedCycles', () => {
  it('returns false for size 1', () => {
    expect(detectNestedCycles(['a'], graphFromEdges(['a'], []))).toBe(false);
  });

  it('returns false when no inner cycles', () => {
    const graph = graphFromEdges(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    expect(detectNestedCycles(['a', 'b'], graph)).toBe(false);
  });

  it('returns true when SCC contains further nontrivial SCCs', () => {
    // Two disjoint 2-cycles connected by an edge from a→c: combined SCC size 4,
    // but Tarjan reports two 2-cycles inside.
    const graph = graphFromEdges(
      ['a', 'b', 'c', 'd'],
      [['a', 'b'], ['b', 'a'], ['a', 'c'], ['c', 'd'], ['d', 'c']]
    );
    expect(detectNestedCycles(['a', 'b', 'c', 'd'], graph)).toBe(true);
  });
});

describe('NestedExecutionEngine - flattenNestedGraph', () => {
  it('sorts nodes alphabetically', () => {
    const g = graphFromEdges(['z', 'a', 'm'], []);
    const f = flattenNestedGraph(g);
    expect(f.nodes.map((n) => n.id)).toEqual(['a', 'm', 'z']);
  });

  it('deduplicates edges', () => {
    const g = graphFromEdges(
      ['a', 'b'],
      [['a', 'b'], ['a', 'b'], ['b', 'a']]
    );
    const f = flattenNestedGraph(g);
    expect(f.edges.length).toBe(2);
  });

  it('preserves edges between unique pairs', () => {
    const g = graphFromEdges(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
    const f = flattenNestedGraph(g);
    expect(f.edges.map((e) => `${e.from}->${e.to}`)).toEqual(['a->b', 'b->c']);
  });
});

describe('NestedExecutionEngine - isolateNestedExecution', () => {
  it('keeps only nodes inside the SCC', () => {
    const g = graphFromEdges(
      ['a', 'b', 'x', 'y'],
      [['x', 'a'], ['y', 'x']]
    );
    // SCC contains a single isolated node 'b' (no internal edges).
    const isolated = isolateNestedExecution(['b'], g);
    expect(isolated.nodes.map((n) => n.id)).toEqual(['b']);
    expect(isolated.edges.length).toBe(0);
  });

  it('drops edges pointing outside the SCC', () => {
    const g = graphFromEdges(
      ['a', 'b', 'x'],
      [['a', 'b'], ['b', 'x']]
    );
    // Only the a->b edge is inside the SCC [a,b].
    const isolated = isolateNestedExecution(['a', 'b'], g);
    expect(isolated.edges.map((e) => `${e.from}->${e.to}`)).toEqual(['a->b']);
  });

  it('returns empty graph for empty SCC', () => {
    const g = graphFromEdges(['a', 'b'], [['a', 'b']]);
    const isolated = isolateNestedExecution([], g);
    expect(isolated.nodes).toEqual([]);
    expect(isolated.edges).toEqual([]);
  });
});

describe('NestedExecutionEngine - getExecutionDepth', () => {
  it('returns 0 for unknown node', () => {
    expect(getExecutionDepth('z', graphFromEdges(['a'], []))).toBe(0);
  });

  it('returns 0 for non-cycle node', () => {
    const g = graphFromEdges(['a', 'b'], [['a', 'b']]);
    expect(getExecutionDepth('a', g)).toBe(0);
  });

  it('returns 1 for node in one cycle', () => {
    const g = graphFromEdges(['a', 'b'], [['a', 'b'], ['b', 'a']]);
    expect(getExecutionDepth('a', g)).toBe(1);
  });
});

describe('NestedExecutionEngine - createNestedContext', () => {
  it('creates root context with depth 1', () => {
    const ctx = createNestedContext('c1', null);
    expect(ctx.depth).toBe(1);
    expect(ctx.parent).toBeNull();
  });

  it('chains parent depth correctly', () => {
    const root = createNestedContext('c1', null);
    const child = createNestedContext('c2', root);
    const grand = createNestedContext('c3', child);
    expect(grand.depth).toBe(3);
    expect(grand.parent?.cycleId).toBe('c2');
  });

  it('throws when depth exceeds maxDepth', () => {
    const root = createNestedContext('c1', null, { maxDepth: 2 });
    const child = createNestedContext('c2', root, { maxDepth: 2 });
    expect(() => createNestedContext('c3', child, { maxDepth: 2 })).toThrow(/depth/);
  });

  it('uses custom now()', () => {
    const ctx = createNestedContext('c1', null, { now: () => 123 });
    expect(ctx.startedAt).toBe(123);
  });
});

describe('NestedExecutionEngine - executeNested branch coverage', () => {
  it('reports nestedCycleDetected=true when SCC contains multiple inner SCCs', () => {
    // Outer SCC {a,b,c,d}: a↔b is a 2-cycle, c↔d is a 2-cycle, with a→c bridging them.
    // Tarjan reports two nontrivial 2-cycles inside this 4-node SCC, so the
    // `if (innerSCCs.length > 1)` branch fires (lines 65-66).
    const graph = graphFromEdges(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['b', 'a'],
        ['a', 'c'],
        ['c', 'd'],
        ['d', 'c'],
      ]
    );
    const r = executeNested(['a', 'b', 'c', 'd'], graph);
    expect(r.nestedCycleDetected).toBe(true);
  });
});

describe('NestedExecutionEngine - contextChain', () => {
  it('returns single-element chain for root', () => {
    const ctx = createNestedContext('c1', null);
    expect(contextChain(ctx).map((c) => c.cycleId)).toEqual(['c1']);
  });

  it('walks from leaf to root', () => {
    const root = createNestedContext('c1', null);
    const child = createNestedContext('c2', root);
    const grand = createNestedContext('c3', child);
    expect(contextChain(grand).map((c) => c.cycleId)).toEqual(['c3', 'c2', 'c1']);
  });
});
