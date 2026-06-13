/**
 * V2088 Direction A Iteration 3/30 Round 6: SuperNodeExtractor
 *
 * High-level abstraction that collapses SCC groups into super nodes.
 * Builds on TarjanSCCCore (V2086) for SCC decomposition and
 * CycleDetector (V2087) for cycle reporting.
 *
 * Inspired by:
 * - chatdev-design: collapsing cycle groups into super-nodes for higher-level routing
 * - nanobot-design: super-node pattern for compressed message-bus topology
 * - ruflo-design: hierarchical graph contraction
 *
 * Concept: each SCC (size >= 2 or self-loop) becomes a "super node" containing
 * all of its original members. Trivial SCCs (single acyclic node) are also
 * kept as super nodes (each containing one member). The resulting super-node
 * graph is acyclic by construction (because internal SCC edges are absorbed).
 */

import {
  findSCCs,
  validateGraph,
  type DirectedGraph,
  type GraphEdge,
} from './TarjanSCCCore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A super node: an abstract container for one or more original graph nodes.
 * - `isCycle` is true if the super node represents a nontrivial SCC
 *   (size >= 2 or contains a self-loop).
 * - `members` lists the original node IDs in stable insertion order.
 */
export interface SuperNode {
  /** Stable super node ID (e.g., "sn_0", "sn_1", or explicit override). */
  id: string;
  /** Original node IDs grouped into this super node. */
  members: string[];
  /** True iff the super node corresponds to a nontrivial SCC (cycle). */
  isCycle: boolean;
}

/**
 * Edge between two super nodes in the contracted graph.
 * Self-loops on a super node are omitted (they are implicit because the
 * members form a cycle).
 */
export interface SuperNodeEdge {
  from: string;
  to: string;
}

/**
 * A complete contracted super-node graph produced by extraction.
 */
export interface SuperNodeGraph {
  superNodes: SuperNode[];
  nodeToSuper: Map<string, string>;
  superNodeEdges: SuperNodeEdge[];
}

/**
 * Options controlling how super nodes are formed from SCCs.
 */
export interface MergeOptions {
  /**
   * Optional explicit node-to-super mapping. If provided, every original
   * node must appear as a key. Any SCC node not in the map is placed in an
   * auto-generated super node keyed by its own ID.
   */
  nodeMap?: Map<string, string>;
  /**
   * Optional explicit node-to-super mapping that allows only a *subset* of
   * nodes to be overridden. Unmapped nodes keep their SCC grouping.
   */
  partialNodeMap?: Map<string, string>;
  /**
   * Prefix for auto-generated super node IDs. Default: "sn".
   */
  idPrefix?: string;
}

/**
 * Validation result returned by validateSuperNodes.
 */
export interface SuperNodeValidation {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build sequential IDs for super nodes that don't have one yet.
 * Returns a fresh Map keyed by an SCC-index-like position to ensure
 * deterministic ordering across runs.
 */
function buildAutoSuperId(index: number, prefix: string): string {
  return `${prefix}_${index}`;
}

/**
 * Deduplicate super node edges. Preserves insertion order so the result is
 * deterministic for snapshot-style testing.
 */
function dedupEdges(edges: SuperNodeEdge[]): SuperNodeEdge[] {
  const seen = new Set<string>();
  const out: SuperNodeEdge[] = [];
  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }
  return out;
}

/**
 * Build super-node edges from the original graph by replacing each endpoint
 * with its super node ID and dropping intra-super self-loops.
 * Exposed for direct testing.
 */
export function buildSuperNodeEdges(
  edges: GraphEdge[],
  nodeToSuper: Map<string, string>
): SuperNodeEdge[] {
  const result: SuperNodeEdge[] = [];
  for (const edge of edges) {
    const fromSuper = nodeToSuper.get(edge.from);
    const toSuper = nodeToSuper.get(edge.to);
    if (fromSuper === undefined || toSuper === undefined) continue;
    if (fromSuper === toSuper) continue; // implicit internal edge
    result.push({ from: fromSuper, to: toSuper });
  }
  return dedupEdges(result);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Construct the super-node mapping from a list of SCCs.
 *
 * Each SCC is collapsed into a single super node whose ID is auto-generated
 * (`{prefix}_{index}`). If `opts.nodeMap` is provided, every original node
 * must be assigned a super node ID explicitly. If `opts.partialNodeMap` is
 * provided, only the listed nodes are remapped; the rest keep their SCC ID.
 *
 * The returned graph has no edges unless the caller supplies them later.
 *
 * @throws if `nodeMap` is partial (missing entries for SCC members).
 */
export function mergeSuperNodes(
  sccs: string[][],
  opts: MergeOptions = {}
): SuperNodeGraph {
  const prefix = opts.idPrefix ?? 'sn';

  // Collect every original node mentioned in the SCCs.
  const allNodes = new Set<string>();
  for (const scc of sccs) {
    for (const nodeId of scc) {
      if (allNodes.has(nodeId)) {
        throw new Error(`Duplicate node in SCC input: ${nodeId}`);
      }
      allNodes.add(nodeId);
    }
  }

  const nodeToSuper = new Map<string, string>();

  if (opts.nodeMap !== undefined) {
    // Strict mode: every node must be in nodeMap.
    for (const nodeId of allNodes) {
      if (!opts.nodeMap.has(nodeId)) {
        throw new Error(
          `mergeSuperNodes: node ${nodeId} missing from explicit nodeMap`
        );
      }
    }
    // Also reject extra keys not in sccs.
    for (const nodeId of opts.nodeMap.keys()) {
      if (!allNodes.has(nodeId)) {
        throw new Error(
          `mergeSuperNodes: nodeMap key ${nodeId} not present in sccs`
        );
      }
    }
    for (const [nodeId, superId] of opts.nodeMap) {
      nodeToSuper.set(nodeId, superId);
    }
  } else {
    // Default mode: one super node per SCC.
    for (let i = 0; i < sccs.length; i++) {
      const scc = sccs[i];
      const superId = buildAutoSuperId(i, prefix);
      for (const nodeId of scc) {
        nodeToSuper.set(nodeId, superId);
      }
    }
    // Optional partial remap.
    if (opts.partialNodeMap !== undefined) {
      for (const [nodeId, superId] of opts.partialNodeMap) {
        if (!allNodes.has(nodeId)) {
          throw new Error(
            `mergeSuperNodes: partialNodeMap key ${nodeId} not in sccs`
          );
        }
        nodeToSuper.set(nodeId, superId);
      }
    }
  }

  // Group members by super node ID (preserving insertion order).
  const memberOrder: string[] = [];
  const seenSuper = new Set<string>();
  for (const nodeId of allNodes) {
    const superId = nodeToSuper.get(nodeId)!;
    if (!seenSuper.has(superId)) {
      seenSuper.add(superId);
      memberOrder.push(superId);
    }
  }

  const superNodes: SuperNode[] = memberOrder.map((superId) => {
    const members: string[] = [];
    for (const nodeId of allNodes) {
      if (nodeToSuper.get(nodeId) === superId) {
        members.push(nodeId);
      }
    }
    // Without self-loop info we treat each super node as a cycle iff size >= 2.
    return {
      id: superId,
      members,
      isCycle: members.length >= 2,
    };
  });

  return {
    superNodes,
    nodeToSuper,
    superNodeEdges: [],
  };
}

/**
 * Build the super-node edges between super nodes by contracting the original
 * graph. This is a separate function so `mergeSuperNodes` (which only knows
 * about SCCs) can still produce a complete super-node graph when given a
 * graph.
 */
export function buildSuperNodeGraph(
  graph: DirectedGraph,
  mapping: SuperNodeGraph
): SuperNodeGraph {
  validateGraph(graph);
  if (mapping.superNodeEdges.length > 0) {
    // Already built; return as-is for idempotence.
    return mapping;
  }
  return {
    superNodes: mapping.superNodes,
    nodeToSuper: mapping.nodeToSuper,
    superNodeEdges: buildSuperNodeEdges(graph.edges, mapping.nodeToSuper),
  };
}

/**
 * High-level entry point: extract super nodes from a directed graph.
 * Combines SCC decomposition and edge contraction in one call.
 *
 * @throws if the graph has invalid structure (duplicate nodes, dangling edges).
 */
export function extractSuperNodes(graph: DirectedGraph): SuperNodeGraph {
  validateGraph(graph);
  const sccResult = findSCCs(graph);
  const merged = mergeSuperNodes(sccResult.components);
  // Refine cycle flags using the SCC result's self-loop information.
  const refinedSuperNodes: SuperNode[] = merged.superNodes.map((sn) => {
    const isCycle = sn.members.some((m) => sccResult.selfLoopNodes.has(m))
      || sn.members.length >= 2;
    return {
      id: sn.id,
      members: sn.members,
      isCycle,
    };
  });
  return {
    superNodes: refinedSuperNodes,
    nodeToSuper: merged.nodeToSuper,
    superNodeEdges: buildSuperNodeEdges(graph.edges, merged.nodeToSuper),
  };
}

/**
 * Query which super node contains the given original node ID.
 * Returns null if the node is not present in the mapping.
 */
export function getSuperNodeOf(
  graph: SuperNodeGraph,
  nodeId: string
): string | null {
  const superId = graph.nodeToSuper.get(nodeId);
  return superId === undefined ? null : superId;
}

/**
 * Query the original member node IDs of a given super node.
 * Returns an empty array if the super node is not present.
 */
export function getSuperNodeMembers(
  graph: SuperNodeGraph,
  superId: string
): string[] {
  for (const sn of graph.superNodes) {
    if (sn.id === superId) return [...sn.members];
  }
  return [];
}

/**
 * Convenience boolean check: is the given original node in any super node?
 */
export function isInSuperNode(graph: SuperNodeGraph, nodeId: string): boolean {
  return graph.nodeToSuper.has(nodeId);
}

/**
 * Validate the integrity of a super-node graph.
 *
 * Checks:
 *  - No duplicate super node IDs.
 *  - No empty super nodes.
 *  - No original node assigned to multiple super nodes.
 *  - All edge endpoints reference known super node IDs.
 *  - No self-loop edges on super nodes (implicit in definition).
 */
export function validateSuperNodes(
  superNodes: SuperNode[],
  edges: SuperNodeEdge[]
): SuperNodeValidation {
  const errors: string[] = [];

  // Duplicate / empty check.
  const seenIds = new Set<string>();
  for (const sn of superNodes) {
    if (sn.id === '') {
      errors.push('Super node has empty id');
    }
    if (seenIds.has(sn.id)) {
      errors.push(`Duplicate super node id: ${sn.id}`);
    }
    seenIds.add(sn.id);
    if (sn.members.length === 0) {
      errors.push(`Super node ${sn.id} has no members`);
    }
  }

  // Duplicate member check.
  const memberOwner = new Map<string, string>();
  for (const sn of superNodes) {
    for (const member of sn.members) {
      const previous = memberOwner.get(member);
      if (previous !== undefined) {
        errors.push(
          `Node ${member} appears in both ${previous} and ${sn.id}`
        );
      } else {
        memberOwner.set(member, sn.id);
      }
    }
  }

  // Edge endpoint + self-loop check.
  for (const edge of edges) {
    if (!seenIds.has(edge.from)) {
      errors.push(`Edge references unknown super node: ${edge.from}`);
    }
    if (!seenIds.has(edge.to)) {
      errors.push(`Edge references unknown super node: ${edge.to}`);
    }
    if (edge.from === edge.to) {
      errors.push(`Self-loop edge on super node: ${edge.from}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get all super nodes that represent nontrivial SCCs (cycles).
 */
export function getCycleSuperNodes(graph: SuperNodeGraph): SuperNode[] {
  return graph.superNodes.filter((sn) => sn.isCycle);
}

/**
 * Count the number of super nodes (including trivial single-node ones).
 */
export function countSuperNodes(graph: SuperNodeGraph): number {
  return graph.superNodes.length;
}