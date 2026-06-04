/**
 * V710 RevisionEngine — Direction D Iter 5/9 (Round 2)
 * Revision engine: revision tracking + revision suggestions
 * Sources: thunderbolt feedback + generic-agent + ruflo
 */

export type RevisionType = 'content' | 'structure' | 'style' | 'grammar' | 'consistency' | 'clarity';
export type RevisionPriority = 'critical' | 'high' | 'medium' | 'low';
export type RevisionStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface Revision {
  revisionId: string;
  type: RevisionType;
  priority: RevisionPriority;
  status: RevisionStatus;
  location: string;
  description: string;
  suggestion: string;
  position: number;
  accepted: boolean;
}

export interface RevisionPlan {
  planId: string;
  workId: string;
  revisions: Revision[];
  totalRevisions: number;
  completedRevisions: number;
  startTime: number;
  endTime: number | null;
  status: 'planning' | 'executing' | 'reviewing' | 'completed';
}

export interface RevisionEngineState {
  plans: Map<string, RevisionPlan>;
  revisions: Map<string, Revision>;
  totalPlans: number;
  totalRevisions: number;
  completedRevisions: number;
  pendingRevisions: number;
  averageAcceptanceRate: number;
  revisionEfficiency: number;
}

// Factory
export function createRevisionEngineState(): RevisionEngineState {
  return {
    plans: new Map(),
    revisions: new Map(),
    totalPlans: 0,
    totalRevisions: 0,
    completedRevisions: 0,
    pendingRevisions: 0,
    averageAcceptanceRate: 0,
    revisionEfficiency: 0.7,
  };
}

// Create plan
export function createPlan(state: RevisionEngineState, planId: string, workId: string): RevisionEngineState {
  const plan: RevisionPlan = {
    planId,
    workId,
    revisions: [],
    totalRevisions: 0,
    completedRevisions: 0,
    startTime: Date.now(),
    endTime: null,
    status: 'planning',
  };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeRevision({ ...state, plans, totalPlans: plans.size });
}

// Add revision
export function addRevision(
  state: RevisionEngineState,
  revisionId: string,
  planId: string,
  type: RevisionType,
  priority: RevisionPriority,
  location: string,
  description: string,
  suggestion: string,
  position: number = 0
): RevisionEngineState {
  const revision: Revision = {
    revisionId,
    type,
    priority,
    status: 'pending',
    location,
    description,
    suggestion,
    position,
    accepted: false,
  };
  const revisions = new Map(state.revisions).set(revisionId, revision);

  const plan = state.plans.get(planId);
  let plans = state.plans;
  if (plan) {
    const updatedPlan: RevisionPlan = { ...plan, revisions: [...plan.revisions, revision], totalRevisions: plan.totalRevisions + 1 };
    plans = new Map(state.plans).set(planId, updatedPlan);
  }

  return recomputeRevision({ ...state, plans, revisions, totalRevisions: revisions.size, pendingRevisions: state.pendingRevisions + 1 });
}

// Update revision status
export function updateRevisionStatus(
  state: RevisionEngineState,
  revisionId: string,
  status: RevisionStatus,
  accepted: boolean = false
): RevisionEngineState {
  const revision = state.revisions.get(revisionId);
  if (!revision) return state;

  const updated: Revision = { ...revision, status, accepted };
  const revisions = new Map(state.revisions).set(revisionId, updated);

  let plans = state.plans;
  state.plans.forEach((plan, planId) => {
    const updatedRevisions = plan.revisions.map(r => r.revisionId === revisionId ? updated : r);
    if (updatedRevisions !== plan.revisions) {
      const completedCount = updatedRevisions.filter(r => r.status === 'completed').length;
      const planStatus = plan.status;
      const newPlan: RevisionPlan = {
        ...plan,
        revisions: updatedRevisions,
        completedRevisions: completedCount,
        status: planStatus === 'completed' ? 'completed' : planStatus,
        endTime: completedCount === updatedRevisions.length ? Date.now() : plan.endTime,
      };
      plans = new Map(plans).set(planId, newPlan);
    }
  });

  const pendingRevisions = Array.from(revisions.values()).filter(r => r.status === 'pending').length;
  const completedCount = Array.from(revisions.values()).filter(r => r.status === 'completed').length;

  return recomputeRevision({ ...state, plans, revisions, completedRevisions: completedCount, pendingRevisions });
}

// Get revisions by type
export function getRevisionsByType(state: RevisionEngineState, type: RevisionType): Revision[] {
  return Array.from(state.revisions.values()).filter(r => r.type === type);
}

// Get revisions by priority
export function getRevisionsByPriority(state: RevisionEngineState, priority: RevisionPriority): Revision[] {
  return Array.from(state.revisions.values()).filter(r => r.priority === priority);
}

// Accept/reject revision
export function acceptRevision(state: RevisionEngineState, revisionId: string): RevisionEngineState {
  const revision = state.revisions.get(revisionId);
  if (!revision) return state;
  return updateRevisionStatus(state, revisionId, 'completed', true);
}

export function rejectRevision(state: RevisionEngineState, revisionId: string): RevisionEngineState {
  const revision = state.revisions.get(revisionId);
  if (!revision) return state;
  return updateRevisionStatus(state, revisionId, 'rejected', false);
}

// Get revision report
export function getRevisionReport(state: RevisionEngineState): {
  totalPlans: number;
  totalRevisions: number;
  completedRevisions: number;
  pendingRevisions: number;
  averageAcceptanceRate: number;
  revisionEfficiency: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRevisions === 0) recommendations.push('No revisions — review content');
  if (state.pendingRevisions > 10) recommendations.push('Many pending revisions — prioritize');
  if (state.averageAcceptanceRate < 0.5) recommendations.push('Low acceptance — improve suggestion quality');

  return {
    totalPlans: state.totalPlans,
    totalRevisions: state.totalRevisions,
    completedRevisions: state.completedRevisions,
    pendingRevisions: state.pendingRevisions,
    averageAcceptanceRate: Math.round(state.averageAcceptanceRate * 100) / 100,
    revisionEfficiency: Math.round(state.revisionEfficiency * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRevision(state: RevisionEngineState): RevisionEngineState {
  const revisions = Array.from(state.revisions.values());
  const completed = revisions.filter(r => r.status === 'completed');
  const accepted = completed.filter(r => r.accepted).length;
  const averageAcceptanceRate = completed.length > 0 ? accepted / completed.length : 0;
  const revisionEfficiency = state.totalRevisions === 0 ? 0.7 :
    state.completedRevisions / state.totalRevisions;

  return { ...state, averageAcceptanceRate, revisionEfficiency };
}

// Reset revision state
export function resetRevisionEngineState(): RevisionEngineState {
  return createRevisionEngineState();
}