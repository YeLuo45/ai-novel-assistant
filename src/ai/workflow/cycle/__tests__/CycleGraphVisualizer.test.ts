import { describe, it, expect } from 'vitest';
import { buildVizGraph, toDOT, toJSON, countByKind } from '../CycleGraphVisualizer';
import type { DirectedGraph } from '../TarjanSCCCore';

function makeGraph(nodes: string[], edges: [string, string][]): DirectedGraph {
  return {
    nodes: nodes.map((id) => ({ id })),
    edges: edges.map(([from, to]) => ({ from, to })),
  };
}

describe('CycleGraphVisualizer - buildVizGraph', () => {
  it('marks cycle nodes', () => {
    const v = buildVizGraph(makeGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]));
    expect(v.nodes.find((n) => n.id === 'a')?.kind).toBe('cycle');
    expect(v.cycleNodes.sort()).toEqual(['a', 'b']);
  });

  it('marks normal nodes', () => {
    const v = buildVizGraph(makeGraph(['a', 'b'], [['a', 'b']]));
    expect(v.nodes.find((n) => n.id === 'a')?.kind).toBe('normal');
  });

  it('marks isolated nodes', () => {
    const v = buildVizGraph(makeGraph(['a', 'b'], []));
    expect(v.nodes[0].kind).toBe('isolated');
  });

  it('flags cycle edges', () => {
    const v = buildVizGraph(makeGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'a'], ['b', 'c']]));
    const cycleEdges = v.edges.filter((e) => e.isCycleEdge);
    expect(cycleEdges.length).toBe(2);
    expect(v.edges.find((e) => e.from === 'b' && e.to === 'c')?.isCycleEdge).toBe(false);
  });

  it('builds super nodes for nontrivial SCCs', () => {
    const v = buildVizGraph(makeGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]));
    expect(v.superNodes.length).toBe(1);
    expect(v.superNodes[0].id).toBe('__super_0');
  });
});

describe('CycleGraphVisualizer - toDOT', () => {
  it('produces a digraph string', () => {
    const v = buildVizGraph(makeGraph(['a', 'b'], [['a', 'b']]));
    const dot = toDOT(v);
    expect(dot.startsWith('digraph cycle {')).toBe(true);
    expect(dot.endsWith('}')).toBe(true);
    expect(dot).toContain('"a" -> "b"');
  });

  it('colors cycle nodes orange and isolated nodes gray', () => {
    // a<->b is a cycle (orange), c is isolated (gray).
    const v = buildVizGraph(makeGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'a']]));
    const dot = toDOT(v);
    expect(dot).toMatch(/"a"\s*\[color=orange\]/);
    expect(dot).toMatch(/"b"\s*\[color=orange\]/);
    expect(dot).toMatch(/"c"\s*\[color=gray\]/);
  });

  it('emits super-nodes and bold cycle edges', () => {
    // a<->b forms a nontrivial SCC → super node + bold cycle edges.
    const v = buildVizGraph(makeGraph(['a', 'b'], [['a', 'b'], ['b', 'a']]));
    const dot = toDOT(v);
    expect(dot).toMatch(/__super_0"\s*\[color=purple/);
    expect(dot).toMatch(/"a"\s*->\s*"b"\s*\[style=bold\]/);
    expect(dot).toMatch(/"b"\s*->\s*"a"\s*\[style=bold\]/);
  });
});

describe('CycleGraphVisualizer - toJSON', () => {
  it('returns JSON string', () => {
    const v = buildVizGraph(makeGraph(['a'], []));
    const j = toJSON(v);
    const parsed = JSON.parse(j);
    expect(parsed.nodes.length).toBe(1);
  });
});

describe('CycleGraphVisualizer - countByKind', () => {
  it('counts nodes by kind', () => {
    // a<->b forms a cycle (SCC); c->d is a normal DAG edge.
    const v = buildVizGraph(makeGraph(['a', 'b', 'c', 'd'], [['a', 'b'], ['b', 'a'], ['c', 'd']]));
    const c = countByKind(v);
    expect(c.cycle).toBe(2);
    expect(c.normal).toBe(2);
  });
});
