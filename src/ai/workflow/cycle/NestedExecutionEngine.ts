/**
 * V2091 Direction A Iteration 6/30 Round 6: NestedExecutionEngine
 *
 * Nested execution engine — runs a strongly connected component (SCC) as an
 * isolated subgraph. Detects additional cycles inside the SCC, flattens
 * nested graphs, and tracks execution depth.
 *
 * Inspired by:
 * - chatdev-design: subgraph execution with recursive cycle handling
 * - ruflo-design: hierarchical worker execution with isolation contexts
 * - nanobot-design: nested AgentLoop with depth limits
 */

import { findSCCs, getNontrivialSCCs, type DirectedGraph } from './TarjanSCCCore';

/** Result of executing a single SCC in isolation. */
export interface NestedExecutionResult {
  cycleId: string;
  nodes: string[];
  iterations: number;
  order: string[];
  nestedCycleDetected: boolean;
  overflow: boolean;
}

/** Execution context for nested subgraph runs. */
export interface NestedContext {
  cycleId: string;
  depth: number;
  parent: NestedContext | null;
  startedAt: number;
}

/** Options for executeNested / buildExecutionOrder. */
export interface NestedExecutionOptions {
  /** Maximum recursive depth (default 8). */
  maxDepth?: number;
  /** Maximum iterations inside the nested run (default 64). */
  maxIterations?: number;
  /** Time provider for tests. */
  now?: () => number;
}

/**
 * Execute the nodes of a strongly connected component sequentially inside an
 * isolated context. If additional cycles are found inside the SCC, marks
 * `nestedCycleDetected = true` but still runs in iteration order.
 */
export function executeNested(
  scc: string[],
  subgraph: DirectedGraph,
  options: NestedExecutionOptions = {}
): NestedExecutionResult {
  const maxIterations = options.maxIterations ?? 64;
  const now = options.now ?? (() => Date.now());
  const order = buildExecutionOrder(subgraph, scc);

  let nestedCycleDetected = false;
  const inner = findSCCs({
    nodes: scc.map((id) => ({ id })),
    edges: subgraph.edges.filter((e) => scc.includes(e.from) && scc.includes(e.to)),
  });
  const innerSCCs = getNontrivialSCCs(inner);
  if (innerSCCs.length > 1) {
    nestedCycleDetected = true;
  }

  const iterations = Math.min(maxIterations, order.length);
  const overflow = iterations < order.length;
  void now();
  return {
    cycleId: scc.slice().sort().join('+') || '__empty__',
    nodes: [...scc],
    iterations,
    order: order.slice(0, iterations),
    nestedCycleDetected,
    overflow,
  };
}

/**
 * Build a stable execution order for an SCC, falling back to a stable sort
 * of the original SCC nodes when the subgraph has no internal edges.
 */
export function buildExecutionOrder(subgraph: DirectedGraph, scc: string[]): string[] {
  if (scc.length === 0) return [];
  const sccSet = new Set(scc);
  const incoming = new Map<string, number>();
  for (const id of scc) incoming.set(id, 0);
  for (const edge of subgraph.edges) {
    if (sccSet.has(edge.from) && sccSet.has(edge.to)) {
      const cur = incoming.get(edge.to);
      if (cur !== undefined) incoming.set(edge.to, cur + 1);
    }
  }
  // Stable order: nodes with no incoming internal edges first, then by id.
  const noIncoming: string[] = [];
  const hasIncoming: string[] = [];
  for (const n of scc) {
    const count = incoming.get(n);
    if (count === undefined || count === 0) noIncoming.push(n);
    else hasIncoming.push(n);
  }
  noIncoming.sort();
  hasIncoming.sort();
  return [...noIncoming, ...hasIncoming];
}

/**
 * Detect whether a given SCC contains further cycles (more than one
 * nontrivial SCC inside).
 */
export function detectNestedCycles(scc: string[], subgraph: DirectedGraph): boolean {
  if (scc.length < 2) return false;
  const inner = findSCCs({
    nodes: scc.map((id) => ({ id })),
    edges: subgraph.edges.filter((e) => scc.includes(e.from) && scc.includes(e.to)),
  });
  const innerSCCs = getNontrivialSCCs(inner);
  return innerSCCs.length > 1;
}

/**
 * Flatten a nested graph into a single-layer DAG-like structure. The output
 * preserves original node ids and replaces SCC edges with a stable sort.
 */
export function flattenNestedGraph(graph: DirectedGraph): DirectedGraph {
  const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const flatEdges = graph.edges.filter((e) => {
    const key = `${e.from}->${e.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { nodes: sortedNodes, edges: flatEdges };
}

/**
 * Isolate the execution of an SCC by creating a directed graph that contains
 * only nodes inside the SCC plus stub edges pointing outside.
 */
export function isolateNestedExecution(
  scc: string[],
  graph: DirectedGraph
): DirectedGraph {
  const sccSet = new Set(scc);
  const isolatedNodes = graph.nodes
    .filter((n) => sccSet.has(n.id))
    .map((n) => ({ ...n }));
  const isolatedEdges = graph.edges
    .filter((e) => sccSet.has(e.from) && sccSet.has(e.to))
    .map((e) => ({ ...e }));
  return { nodes: isolatedNodes, edges: isolatedEdges };
}

/**
 * Compute the maximum nesting depth of a node based on how many SCCs the
 * node participates in (transitively).
 */
export function getExecutionDepth(nodeId: string, graph: DirectedGraph): number {
  if (!graph.nodes.some((n) => n.id === nodeId)) return 0;
  const scc = findSCCs(graph);
  const nontrivial = getNontrivialSCCs(scc);
  let depth = 0;
  for (const component of nontrivial) {
    if (component.includes(nodeId)) depth += 1;
  }
  return depth;
}

/**
 * Create a nested context. Throws when `maxDepth` is exceeded.
 */
export function createNestedContext(
  cycleId: string,
  parent: NestedContext | null,
  options: NestedExecutionOptions = {}
): NestedContext {
  const maxDepth = options.maxDepth ?? 8;
  const depth = (parent?.depth ?? 0) + 1;
  if (depth > maxDepth) {
    throw new Error(`nested context depth ${depth} exceeds max ${maxDepth}`);
  }
  const now = options.now ?? (() => Date.now());
  return {
    cycleId,
    depth,
    parent,
    startedAt: now(),
  };
}

/**
 * Walk the chain of nested contexts from leaf to root, returning the path.
 */
export function contextChain(ctx: NestedContext): NestedContext[] {
  const chain: NestedContext[] = [];
  let cur: NestedContext | null = ctx;
  while (cur) {
    chain.push(cur);
    cur = cur.parent;
  }
  return chain;
}
