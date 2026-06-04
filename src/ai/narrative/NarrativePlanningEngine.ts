/**
 * V656 NarrativePlanningEngine — Direction E Iter 5/9
 * Narrative planning engine: goal decomposition + plan generation
 * Sources: ruflo hierarchical + thunderbolt pipeline + chatdev planning
 */

export type PlanPhase = 'analysis' | 'design' | 'execution' | 'review' | 'revision';
export type PlanStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface PlanNode {
  nodeId: string;
  description: string;
  phase: PlanPhase;
  priority: number;
  dependencies: string[];
  status: PlanStatus;
  estimatedDuration: number;
  actualDuration: number;
}

export interface NarrativePlanningState {
  planNodes: Map<string, PlanNode>;
  currentPhase: PlanPhase;
  totalNodes: number;
  completedNodes: number;
  planEfficiency: number;
}

export interface PlanningRecommendation {
  nextNodeId: string;
  priority: number;
  reasoning: string;
}

// Factory
export function createNarrativePlanningState(): NarrativePlanningState {
  return {
    planNodes: new Map(),
    currentPhase: 'analysis',
    totalNodes: 0,
    completedNodes: 0,
    planEfficiency: 0.8,
  };
}

// Add plan node
export function addPlanNode(
  state: NarrativePlanningState,
  nodeId: string,
  description: string,
  phase: PlanPhase,
  priority: number = 1,
  dependencies: string[] = []
): NarrativePlanningState {
  const node: PlanNode = {
    nodeId,
    description,
    phase,
    priority,
    dependencies,
    status: 'active',
    estimatedDuration: 0,
    actualDuration: 0,
  };

  const planNodes = new Map(state.planNodes).set(nodeId, node);
  return recomputeMetrics({ ...state, planNodes, totalNodes: state.totalNodes + 1 });
}

// Activate plan node
export function activatePlanNode(state: NarrativePlanningState, nodeId: string): NarrativePlanningState {
  const node = state.planNodes.get(nodeId);
  if (!node) return state;

  const updatedNode: PlanNode = { ...node, status: 'active' };
  const planNodes = new Map(state.planNodes).set(nodeId, updatedNode);
  return { ...state, planNodes };
}

// Complete plan node
export function completePlanNode(state: NarrativePlanningState, nodeId: string): NarrativePlanningState {
  const node = state.planNodes.get(nodeId);
  if (!node) return state;

  const updatedNode: PlanNode = { ...node, status: 'completed' };
  const planNodes = new Map(state.planNodes).set(nodeId, updatedNode);
  return recomputeMetrics({ ...state, planNodes, completedNodes: state.completedNodes + 1 });
}

// Get planning recommendation
export function getPlanningRecommendation(state: NarrativePlanningState): PlanningRecommendation[] {
  const recommendations: PlanningRecommendation[] = [];

  state.planNodes.forEach((node, nodeId) => {
    if (node.status === 'active') {
      const unmetDeps = node.dependencies.filter(depId => {
        const depNode = state.planNodes.get(depId);
        return !depNode || depNode.status !== 'completed';
      });

      if (unmetDeps.length === 0) {
        recommendations.push({
          nextNodeId: nodeId,
          priority: node.priority,
          reasoning: `${node.description} — no unmet dependencies`,
        });
      }
    }
  });

  return recommendations.sort((a, b) => b.priority - a.priority);
}

// Set planning phase
export function setPlanningPhase(state: NarrativePlanningState, phase: PlanPhase): NarrativePlanningState {
  return { ...state, currentPhase: phase };
}

// Get planning report
export function getPlanningReport(state: NarrativePlanningState): {
  totalNodes: number;
  completedNodes: number;
  currentPhase: PlanPhase;
  planEfficiency: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  const completionRate = state.totalNodes > 0 ? state.completedNodes / state.totalNodes : 0;
  if (completionRate < 0.3 && state.totalNodes > 3) recommendations.push('Low completion rate — prioritize active nodes');
  if (state.currentPhase === 'analysis') recommendations.push('Still in analysis phase — move to design when ready');
  if (state.planEfficiency < 0.6) recommendations.push('Low plan efficiency — review node dependencies');

  return {
    totalNodes: state.totalNodes,
    completedNodes: state.completedNodes,
    currentPhase: state.currentPhase,
    planEfficiency: Math.round(state.planEfficiency * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMetrics(state: NarrativePlanningState): NarrativePlanningState {
  const completionRate = state.totalNodes > 0 ? state.completedNodes / state.totalNodes : 0;
  const planEfficiency = completionRate * 0.6 + 0.4;
  return { ...state, planEfficiency };
}

// Reset planning state
export function resetNarrativePlanningState(): NarrativePlanningState {
  return createNarrativePlanningState();
}