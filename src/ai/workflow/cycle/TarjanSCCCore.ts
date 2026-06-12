/**
 * V2086 Direction A Iteration 1/30 Round 6: TarjanSCCCore
 *
 * Tarjan Strongly Connected Components Algorithm Core.
 * Detects strongly connected components (SCCs) in a directed graph.
 *
 * Inspired by:
 * - chatdev-design: Tarjan SCC cycle engine for circular workflow execution
 * - nanobot-design: async messagebus routing with cycle detection
 * - ruflo-design: Hook lifecycle + cycle isolation
 *
 * Algorithm: Classic Tarjan's SCC (1972) - O(V+E) using DFS + lowlink values.
 * Single-pass DFS assigns discovery indices and tracks lowlinks.
 * Nodes with lowlink == index form SCC roots.
 */

export interface GraphNode {
  id: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}

export interface DirectedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SCCResult {
  /** List of strongly connected components, each is array of node IDs */
  components: string[][];
  /** Map from node ID to its SCC index */
  nodeToComponent: Map<string, number>;
  /** Set of node IDs that have self-loops */
  selfLoopNodes: Set<string>;
  /** Whether the graph contains any cycles (SCCs of size >= 2 or self-loops) */
  hasCycles: boolean;
  /** Whether the graph contains self-loops */
  hasSelfLoops: boolean;
  /** Count of trivial SCCs (single node, no self-loop) */
  trivialCount: number;
  /** Count of nontrivial SCCs (size >= 2 or self-loop) */
  nontrivialCount: number;
  /** Total nodes processed */
  totalNodes: number;
  /** Total edges processed */
  totalEdges: number;
}

export interface TarjanState {
  index: number;
  stack: string[];
  onStack: Set<string>;
  indices: Map<string, number>;
  lowlinks: Map<string, number>;
  components: string[][];
}

/**
 * Validate graph structure.
 * Throws on invalid input (duplicate node IDs, edge references unknown nodes).
 */
export function validateGraph(graph: DirectedGraph): void {
  const seen = new Set<string>();
  for (const node of graph.nodes) {
    if (seen.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    seen.add(node.id);
  }
  for (const edge of graph.edges) {
    if (!seen.has(edge.from)) {
      throw new Error(`Edge references unknown node: ${edge.from}`);
    }
    if (!seen.has(edge.to)) {
      throw new Error(`Edge references unknown node: ${edge.to}`);
    }
  }
}

/**
 * Build adjacency map for fast lookup.
 */
export function buildAdjacency(graph: DirectedGraph): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    const list = adj.get(edge.from);
    if (list) {
      list.push(edge.to);
    }
  }
  return adj;
}

/**
 * Initialize Tarjan state.
 */
export function initTarjanState(nodeCount: number): TarjanState {
  return {
    index: 0,
    stack: [],
    onStack: new Set(),
    indices: new Map(),
    lowlinks: new Map(),
    components: [],
  };
}

/**
 * Strongconnect - recursive DFS for Tarjan's algorithm.
 */
export function strongconnect(
  v: string,
  adj: Map<string, string[]>,
  state: TarjanState
): void {
  state.indices.set(v, state.index);
  state.lowlinks.set(v, state.index);
  state.index += 1;
  state.stack.push(v);
  state.onStack.add(v);

  const successors = adj.get(v)!;
  for (const w of successors) {
    if (!state.indices.has(w)) {
      strongconnect(w, adj, state);
      const wLow = state.lowlinks.get(w) as number;
      const vLow = state.lowlinks.get(v) as number;
      state.lowlinks.set(v, Math.min(vLow, wLow));
    } else if (state.onStack.has(w)) {
      const wIdx = state.indices.get(w) as number;
      const vLow = state.lowlinks.get(v) as number;
      state.lowlinks.set(v, Math.min(vLow, wIdx));
    }
    // Cross-edge to already-finished SCC: skip (w visited, not on stack)
  }

  // If v is a root node, pop the stack and generate an SCC
  const vIdx = state.indices.get(v) as number;
  const vLow = state.lowlinks.get(v) as number;
  if (vLow === vIdx) {
    const component: string[] = [];
    let w: string | undefined;
    do {
      w = state.stack.pop();
      if (w !== undefined) {
        state.onStack.delete(w);
        component.push(w);
      }
    } while (w !== undefined && w !== v);
    state.components.push(component);
  }
}

/**
 * Run Tarjan's SCC algorithm on a directed graph.
 * Returns SCCs and cycle detection metadata.
 */
export function findSCCs(graph: DirectedGraph): SCCResult {
  validateGraph(graph);
  const adj = buildAdjacency(graph);
  const state = initTarjanState(graph.nodes.length);

  for (const node of graph.nodes) {
    if (!state.indices.has(node.id)) {
      strongconnect(node.id, adj, state);
    }
  }

  // Build nodeToComponent map
  const nodeToComponent = new Map<string, number>();
  state.components.forEach((component, idx) => {
    for (const nodeId of component) {
      nodeToComponent.set(nodeId, idx);
    }
  });

  // Detect self-loops
  const selfLoopNodes = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === edge.to) {
      selfLoopNodes.add(edge.from);
    }
  }
  const hasSelfLoops = selfLoopNodes.size > 0;

  // Classify components
  let trivialCount = 0;
  let nontrivialCount = 0;
  for (const component of state.components) {
    if (component.length >= 2) {
      nontrivialCount++;
    } else if (component.length === 1) {
      const nodeId = component[0];
      if (selfLoopNodes.has(nodeId)) {
        nontrivialCount++;
      } else {
        trivialCount++;
      }
    }
  }

  return {
    components: state.components,
    nodeToComponent,
    selfLoopNodes,
    hasCycles: hasSelfLoops || nontrivialCount > 0,
    hasSelfLoops,
    trivialCount,
    nontrivialCount,
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
  };
}

/**
 * Get all nontrivial SCCs (cycles) from result.
 * Filters out trivial single-node SCCs without self-loops.
 */
export function getNontrivialSCCs(result: SCCResult): string[][] {
  return result.components.filter((component) => {
    // Multi-node SCC is always nontrivial
    if (component.length >= 2) return true;
    // Single-node SCC: nontrivial only if it has a self-loop
    return result.selfLoopNodes.has(component[0]);
  });
}

/**
 * Get all trivial SCCs (acyclic single nodes).
 */
export function getTrivialSCCs(result: SCCResult): string[][] {
  return result.components.filter((c) => c.length === 1);
}

/**
 * Detect if a specific node is part of a cycle.
 * A node is in a cycle if it's part of a multi-node SCC or has a self-loop.
 */
export function isNodeInCycle(result: SCCResult, nodeId: string): boolean {
  if (result.selfLoopNodes.has(nodeId)) return true;
  const compIdx = result.nodeToComponent.get(nodeId);
  if (compIdx === undefined) return false;
  const component = result.components[compIdx];
  return component.length >= 2;
}

/**
 * Get the cycle (SCC) containing a specific node.
 * Returns null if node is not in a nontrivial cycle.
 * For self-loop nodes, returns [nodeId].
 */
export function getCycleOfNode(result: SCCResult, nodeId: string): string[] | null {
  if (result.selfLoopNodes.has(nodeId)) return [nodeId];
  const compIdx = result.nodeToComponent.get(nodeId);
  if (compIdx === undefined) return null;
  const component = result.components[compIdx];
  return component.length >= 2 ? component : null;
}

/**
 * Get all cycle nodes across all nontrivial SCCs.
 */
export function getAllCycleNodes(result: SCCResult): Set<string> {
  const cycleNodes = new Set<string>();
  for (const component of getNontrivialSCCs(result)) {
    for (const nodeId of component) {
      cycleNodes.add(nodeId);
    }
  }
  return cycleNodes;
}

/**
 * Compute statistics about the SCC decomposition.
 */
export interface SCCStats {
  totalComponents: number;
  trivialComponents: number;
  nontrivialComponents: number;
  largestComponentSize: number;
  smallestNontrivialSize: number;
  avgComponentSize: number;
}

export function computeStats(result: SCCResult): SCCStats {
  const total = result.components.length;
  const nontrivial = getNontrivialSCCs(result);
  const largest = result.components.reduce(
    (max, c) => Math.max(max, c.length),
    0
  );
  const avg =
    total > 0
      ? result.components.reduce((sum, c) => sum + c.length, 0) / total
      : 0;
  return {
    totalComponents: total,
    trivialComponents: result.trivialCount,
    nontrivialComponents: result.nontrivialCount,
    largestComponentSize: largest,
    smallestNontrivialSize:
      nontrivial.length > 0 ? nontrivial.reduce((min, c) => Math.min(min, c.length), Infinity) : 0,
    avgComponentSize: avg,
  };
}

/**
 * Convenience: Build a graph from node IDs and edge pairs.
 */
export function buildGraph(nodeIds: string[], edgePairs: Array<[string, string]>): DirectedGraph {
  return {
    nodes: nodeIds.map((id) => ({ id })),
    edges: edgePairs.map(([from, to]) => ({ from, to })),
  };
}
