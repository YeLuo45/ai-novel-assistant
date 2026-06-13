/**
 * V2087 Direction A Iteration 2/30 Round 6: CycleDetector
 *
 * Workflow DAG Cycle Detector - high-level wrapper around TarjanSCCCore
 * for detecting cycles in workflow node graphs.
 *
 * Inspired by:
 * - chatdev-design: DAG-based workflow with cycle detection
 * - nanobot-design: message bus routing with cycle prevention
 * - thunderbolt-design: feedback loops with cycle isolation
 */

import {
  findSCCs,
  isNodeInCycle,
  getAllCycleNodes,
  getNontrivialSCCs,
  type DirectedGraph,
  type SCCResult,
} from './TarjanSCCCore';

export interface WorkflowNode {
  id: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface CycleReport {
  hasCycles: boolean;
  cycleCount: number;
  cycleNodes: string[];
  entryNodes: string[];
  exitNodes: string[];
  longestCycleLength: number;
  isolatedNodes: string[];
}

/**
 * Convert WorkflowGraph to DirectedGraph for SCC analysis.
 */
export function toDirectedGraph(graph: WorkflowGraph): DirectedGraph {
  return {
    nodes: graph.nodes.map((n) => ({ id: n.id, metadata: n.metadata })),
    edges: graph.edges.map((e) => ({ from: e.from, to: e.to })),
  };
}

/**
 * Find all entry nodes (nodes with no incoming edges).
 */
export function findEntryNodes(graph: WorkflowGraph): string[] {
  const hasIncoming = new Set<string>();
  for (const edge of graph.edges) {
    hasIncoming.add(edge.to);
  }
  return graph.nodes.map((n) => n.id).filter((id) => !hasIncoming.has(id));
}

/**
 * Find all exit nodes (nodes with no outgoing edges).
 */
export function findExitNodes(graph: WorkflowGraph): string[] {
  const hasOutgoing = new Set<string>();
  for (const edge of graph.edges) {
    hasOutgoing.add(edge.from);
  }
  return graph.nodes.map((n) => n.id).filter((id) => !hasOutgoing.has(id));
}

/**
 * Find isolated nodes (no incoming AND no outgoing edges).
 */
export function findIsolatedNodes(graph: WorkflowGraph): string[] {
  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();
  for (const edge of graph.edges) {
    hasIncoming.add(edge.to);
    hasOutgoing.add(edge.from);
  }
  return graph.nodes
    .map((n) => n.id)
    .filter((id) => !hasIncoming.has(id) && !hasOutgoing.has(id));
}

/**
 * Detect cycles in a workflow graph and return a detailed report.
 */
export function detectCycles(graph: WorkflowGraph): CycleReport {
  const directed = toDirectedGraph(graph);
  const sccResult = findSCCs(directed);
  const nontrivialSCCs = getNontrivialSCCs(sccResult);
  const cycleNodes = Array.from(getAllCycleNodes(sccResult));
  const longestCycleLength =
    nontrivialSCCs.length > 0
      ? nontrivialSCCs.reduce((max, c) => Math.max(max, c.length), 0)
      : 0;

  return {
    hasCycles: sccResult.hasCycles,
    cycleCount: nontrivialSCCs.length,
    cycleNodes,
    entryNodes: findEntryNodes(graph),
    exitNodes: findExitNodes(graph),
    longestCycleLength,
    isolatedNodes: findIsolatedNodes(graph),
  };
}

/**
 * Quick check: does the graph have any cycles?
 */
export function hasCycles(graph: WorkflowGraph): boolean {
  return detectCycles(graph).hasCycles;
}

/**
 * Check if a specific workflow node is part of a cycle.
 */
export function isWorkflowNodeInCycle(
  graph: WorkflowGraph,
  nodeId: string
): boolean {
  const directed = toDirectedGraph(graph);
  const sccResult = findSCCs(directed);
  return isNodeInCycle(sccResult, nodeId);
}

/**
 * Get all cycle node IDs from a workflow graph.
 */
export function getWorkflowCycleNodes(graph: WorkflowGraph): Set<string> {
  const directed = toDirectedGraph(graph);
  const sccResult = findSCCs(directed);
  return getAllCycleNodes(sccResult);
}

/**
 * Filter out cycles from a workflow graph to make it a pure DAG.
 * Replaces each SCC (size >= 2) with a single super node ID.
 * Returns the modified graph and the mapping from SCC node IDs to super node ID.
 */
export interface DAGConversionResult {
  graph: WorkflowGraph;
  superNodeMap: Map<string, string>;
  removedNodes: string[];
}

export function toDAG(graph: WorkflowGraph): DAGConversionResult {
  const directed = toDirectedGraph(graph);
  const sccResult = findSCCs(directed);
  const nontrivialSCCs = getNontrivialSCCs(sccResult);

  const superNodeMap = new Map<string, string>();
  const removedNodes: string[] = [];

  // Map each SCC node to a super node ID
  for (let i = 0; i < nontrivialSCCs.length; i++) {
    const scc = nontrivialSCCs[i];
    const superId = `__super_${i}`;
    for (const nodeId of scc) {
      superNodeMap.set(nodeId, superId);
    }
  }

  // Collect nodes to keep (non-cycle nodes + one super node per SCC)
  const keptNodes = new Map<string, WorkflowNode>();
  for (const node of graph.nodes) {
    if (superNodeMap.has(node.id)) {
      const superId = superNodeMap.get(node.id)!;
      if (!keptNodes.has(superId)) {
        keptNodes.set(superId, {
          id: superId,
          type: 'super_cycle',
          metadata: { originalNodes: nontrivialSCCs[parseInt(superId.split('_')[2])] },
        });
      }
      removedNodes.push(node.id);
    } else {
      keptNodes.set(node.id, node);
    }
  }

  // Rebuild edges, replacing SCC nodes with super nodes
  const seenEdges = new Set<string>();
  const newEdges: WorkflowEdge[] = [];
  for (const edge of graph.edges) {
    const fromSuper = superNodeMap.get(edge.from) ?? edge.from;
    const toSuper = superNodeMap.get(edge.to) ?? edge.to;
    const edgeKey = `${fromSuper}->${toSuper}`;
    if (fromSuper === toSuper) continue; // self-loop on super node is implicit
    if (!seenEdges.has(edgeKey)) {
      seenEdges.add(edgeKey);
      newEdges.push({ from: fromSuper, to: toSuper });
    }
  }

  return {
    graph: { nodes: Array.from(keptNodes.values()), edges: newEdges },
    superNodeMap,
    removedNodes,
  };
}
