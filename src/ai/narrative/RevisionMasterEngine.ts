/**
 * V806 RevisionMasterEngine — Direction D Iter 8/9 (Round 3)
 * Revision master engine: comprehensive revision + change tracking
 * Sources: thunderbolt revision + chatdev + nanobot
 */

export type RevisionType = 'structural' | 'content' | 'style' | 'grammar' | 'format' | 'consistency';
export type RevisionScope = 'chapter' | 'section' | 'paragraph' | 'sentence' | 'word' | 'global';
export type RevisionStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'reverted';

export interface RevisionTask {
  taskId: string;
  type: RevisionType;
  scope: RevisionScope;
  description: string;
  status: RevisionStatus;
  priority: number;
  estimatedEffort: number;
  actualEffort: number;
  createdAt: number;
  completedAt: number | null;
}

export interface RevisionChange {
  changeId: string;
  taskId: string;
  location: string;
  before: string;
  after: string;
  reason: string;
  timestamp: number;
}

export interface RevisionMasterEngineState {
  tasks: Map<string, RevisionTask>;
  changes: Map<string, RevisionChange>;
  totalTasks: number;
  totalChanges: number;
  completedTasks: number;
  verifiedTasks: number;
  totalEstimatedEffort: number;
  totalActualEffort: number;
  efficiencyRatio: number;
  averagePriority: number;
  revisionCompleteness: number;
}

// Factory
export function createRevisionMasterEngineState(): RevisionMasterEngineState {
  return {
    tasks: new Map(),
    changes: new Map(),
    totalTasks: 0,
    totalChanges: 0,
    completedTasks: 0,
    verifiedTasks: 0,
    totalEstimatedEffort: 0,
    totalActualEffort: 0,
    efficiencyRatio: 1,
    averagePriority: 1,
    revisionCompleteness: 0,
  };
}

// Create revision task
export function createRevisionTask(
  state: RevisionMasterEngineState,
  taskId: string,
  type: RevisionType,
  scope: RevisionScope,
  description: string,
  estimatedEffort: number = 1,
  priority: number = 1
): RevisionMasterEngineState {
  const task: RevisionTask = {
    taskId, type, scope, description, status: 'pending',
    priority, estimatedEffort, actualEffort: 0,
    createdAt: Date.now(), completedAt: null,
  };
  const tasks = new Map(state.tasks).set(taskId, task);
  return recomputeRevision({ ...state, tasks, totalTasks: tasks.size });
}

// Update task status
export function updateRevisionStatus(state: RevisionMasterEngineState, taskId: string, status: RevisionStatus, actualEffort: number = 0): RevisionMasterEngineState {
  const task = state.tasks.get(taskId);
  if (!task) return state;

  const completedTasks = status === 'completed' && task.status !== 'completed' ? state.completedTasks + 1 : state.completedTasks;
  const verifiedTasks = status === 'verified' && task.status !== 'verified' ? state.verifiedTasks + 1 : state.verifiedTasks;
  const updated: RevisionTask = {
    ...task, status,
    actualEffort: actualEffort > 0 ? actualEffort : task.actualEffort,
    completedAt: status === 'completed' ? Date.now() : task.completedAt,
  };
  const tasks = new Map(state.tasks).set(taskId, updated);
  return recomputeRevision({ ...state, tasks, completedTasks, verifiedTasks });
}

// Record change
export function recordRevisionChange(
  state: RevisionMasterEngineState,
  changeId: string,
  taskId: string,
  location: string,
  before: string,
  after: string,
  reason: string
): RevisionMasterEngineState {
  const change: RevisionChange = { changeId, taskId, location, before, after, reason, timestamp: Date.now() };
  const changes = new Map(state.changes).set(changeId, change);
  return recomputeRevision({ ...state, changes, totalChanges: changes.size });
}

// Get tasks by type
export function getTasksByType(state: RevisionMasterEngineState, type: RevisionType): RevisionTask[] {
  return Array.from(state.tasks.values()).filter(t => t.type === type);
}

// Get revision report
export function getRevisionMasterReport(state: RevisionMasterEngineState): {
  totalTasks: number;
  totalChanges: number;
  completedTasks: number;
  verifiedTasks: number;
  efficiencyRatio: number;
  revisionCompleteness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTasks === 0) recommendations.push('No tasks — create revision tasks');
  if (state.revisionCompleteness < 0.3) recommendations.push('Low completeness — complete more tasks');
  if (state.efficiencyRatio < 0.7) recommendations.push('Low efficiency — improve estimation');

  return {
    totalTasks: state.totalTasks,
    totalChanges: state.totalChanges,
    completedTasks: state.completedTasks,
    verifiedTasks: state.verifiedTasks,
    efficiencyRatio: Math.round(state.efficiencyRatio * 100) / 100,
    revisionCompleteness: Math.round(state.revisionCompleteness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRevision(state: RevisionMasterEngineState): RevisionMasterEngineState {
  const tasks = Array.from(state.tasks.values());
  const totalEstimatedEffort = tasks.reduce((s, t) => s + t.estimatedEffort, 0);
  const totalActualEffort = tasks.reduce((s, t) => s + t.actualEffort, 0);
  const efficiencyRatio = totalActualEffort === 0 ? 1
    : Math.max(0, 1 - Math.abs(totalEstimatedEffort - totalActualEffort) / totalEstimatedEffort);
  const averagePriority = tasks.length === 0 ? 1
    : tasks.reduce((s, t) => s + t.priority, 0) / tasks.length;

  const verified = state.verifiedTasks;
  const revisionCompleteness = state.totalTasks === 0 ? 0 : verified / state.totalTasks;

  return { ...state, totalEstimatedEffort, totalActualEffort, efficiencyRatio, averagePriority, revisionCompleteness };
}

// Reset revision state
export function resetRevisionMasterEngineState(): RevisionMasterEngineState {
  return createRevisionMasterEngineState();
}