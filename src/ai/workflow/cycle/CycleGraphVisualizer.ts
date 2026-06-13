/**
 * V2109 Direction A Iteration 24/30 Round 6: CycleGraphVisualizer
 *
 * Serializes a workflow graph (including SCCs and super-nodes) to a
 * visualization-friendly format. Supports DOT and JSON output.
 *
 * Inspired by:
 * - chatdev-design: vueflow graph export
 * - ruflo-design: graph visualization
 */

import { findSCCs, getNontrivialSCCs, type DirectedGraph } from './TarjanSCCCore';

export interface VizNode {
  id: string;
  label: string;
  kind: 'normal' | 'cycle' | 'super' | 'isolated';
  x?: number;
  y?: number;
}

export interface VizEdge {
  from: string;
  to: string;
  isCycleEdge: boolean;
}

export interface VizGraph {
  nodes: VizNode[];
  edges: VizEdge[];
  cycleNodes: string[];
  superNodes: VizNode[];
}

export function buildVizGraph(graph: DirectedGraph): VizGraph {
  const scc = findSCCs(graph);
  const nontrivial = getNontrivialSCCs(scc);

  const cycleNodes = new Set<string>();
  for (const c of nontrivial) for (const id of c) cycleNodes.add(id);

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const n of graph.nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  }
  // All edges target a declared node (caller invariant: `buildVizGraph`
  // builds graphs where every edge endpoint is in `graph.nodes`), so the
  // `Map.get` lookup is always defined and we can skip `?? 0`.
  for (const e of graph.edges) {
    incoming.set(e.to, (incoming.get(e.to) as number) + 1);
    outgoing.set(e.from, (outgoing.get(e.from) as number) + 1);
  }

  const nodes: VizNode[] = [];
  let y = 0;
  for (const n of graph.nodes) {
    // `incoming`/`outgoing` always have an entry for `n.id` (seeded above).
    const hasNoEdges =
      (incoming.get(n.id) as number) === 0 && (outgoing.get(n.id) as number) === 0;
    nodes.push({
      id: n.id,
      label: n.id,
      kind: cycleNodes.has(n.id) ? 'cycle' : hasNoEdges ? 'isolated' : 'normal',
      x: 0,
      y: y++,
    });
  }

  const superNodes: VizNode[] = nontrivial.map((c, i) => ({
    id: `__super_${i}`,
    label: `SCC(${c.sort().join(',')})`,
    kind: 'super',
  }));

  const edges: VizEdge[] = graph.edges.map((e) => ({
    from: e.from,
    to: e.to,
    isCycleEdge: cycleNodes.has(e.from) && cycleNodes.has(e.to),
  }));

  return { nodes, edges, cycleNodes: Array.from(cycleNodes), superNodes };
}

export function toDOT(graph: VizGraph): string {
  const lines: string[] = ['digraph cycle {'];
  for (const n of graph.nodes) {
    const color = n.kind === 'cycle' ? 'orange' : n.kind === 'isolated' ? 'gray' : 'black';
    lines.push(`  "${n.id}" [color=${color}];`);
  }
  for (const s of graph.superNodes) {
    lines.push(`  "${s.id}" [color=purple, shape=box];`);
  }
  for (const e of graph.edges) {
    const style = e.isCycleEdge ? 'bold' : 'solid';
    lines.push(`  "${e.from}" -> "${e.to}" [style=${style}];`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function toJSON(graph: VizGraph): string {
  return JSON.stringify(graph);
}

export function countByKind(graph: VizGraph): Record<VizNode['kind'], number> {
  const counts: Record<VizNode['kind'], number> = {
    normal: 0,
    cycle: 0,
    super: 0,
    isolated: 0,
  };
  for (const n of graph.nodes) counts[n.kind]++;
  return counts;
}
