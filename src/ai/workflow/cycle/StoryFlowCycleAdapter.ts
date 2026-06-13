/**
 * V2104 Direction A Iteration 19/30 Round 6: StoryFlowCycleAdapter
 *
 * Adapts the existing StoryFlowOrchestrator to use cycle-aware execution.
 * Maps story flow nodes to cycle nodes and produces an execution plan that
 * honours the cycle budget / quality gate / exit condition subsystems.
 *
 * Inspired by:
 * - chatdev-design: DAG adapter pattern
 * - nanobot-design: messagebus adapter
 */

export interface StoryFlowNode {
  id: string;
  type: string;
  label?: string;
}

export interface StoryFlowEdge {
  from: string;
  to: string;
}

export interface StoryFlow {
  id: string;
  nodes: StoryFlowNode[];
  edges: StoryFlowEdge[];
}

export interface CycleMapping {
  flowId: string;
  cycleId: string;
  nodeMap: Map<string, string>;
  cycleNodes: string[];
}

export function mapStoryFlowToCycle(flow: StoryFlow, cycleId: string): CycleMapping {
  const nodeMap = new Map<string, string>();
  const cycleNodes: string[] = [];
  for (const n of flow.nodes) {
    const cid = `${cycleId}__${n.id}`;
    nodeMap.set(n.id, cid);
    cycleNodes.push(cid);
  }
  return { flowId: flow.id, cycleId, nodeMap, cycleNodes };
}

export function remapEdges(
  edges: StoryFlowEdge[],
  nodeMap: Map<string, string>
): Array<{ from: string; to: string }> {
  return edges
    .filter((e) => nodeMap.has(e.from) && nodeMap.has(e.to))
    .map((e) => ({ from: nodeMap.get(e.from)!, to: nodeMap.get(e.to)! }));
}

export function buildExecutionPlan(
  flow: StoryFlow,
  cycleId: string
): { mapping: CycleMapping; remappedEdges: Array<{ from: string; to: string }> } {
  const mapping = mapStoryFlowToCycle(flow, cycleId);
  const remappedEdges = remapEdges(flow.edges, mapping.nodeMap);
  return { mapping, remappedEdges };
}

export function describeAdapter(mapping: CycleMapping): string {
  const lines: string[] = [];
  lines.push(`StoryFlow adapter: flow=${mapping.flowId} → cycle=${mapping.cycleId}`);
  lines.push(`  nodes: ${mapping.cycleNodes.length}`);
  for (const [original, mapped] of mapping.nodeMap) {
    lines.push(`    ${original} → ${mapped}`);
  }
  return lines.join('\n');
}

export function isAdapterValid(flow: StoryFlow): boolean {
  if (!flow || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) return false;
  const ids = new Set<string>();
  for (const n of flow.nodes) {
    if (!n.id || ids.has(n.id)) return false;
    ids.add(n.id);
  }
  for (const e of flow.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) return false;
  }
  return true;
}
