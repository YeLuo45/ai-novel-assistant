/**
 * V734 NarrativeOrchestrationCore — Direction E Iter 8/9 (Round 2)
 * Narrative orchestration core: orchestrates all intelligence modules
 * Sources: thunderbolt pipeline + chatdev coordination + generic-agent
 */

export type OrchestrationPhase = 'planning' | 'dispatching' | 'executing' | 'monitoring' | 'completing';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface OrchestrationTask {
  taskId: string;
  name: string;
  module: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependsOn: string[];
  progress: number;
  result: string;
  startTime: number | null;
  endTime: number | null;
}

export interface OrchestrationWorkflow {
  workflowId: string;
  name: string;
  phase: OrchestrationPhase;
  tasks: string[];
  startTime: number;
  endTime: number | null;
  status: 'active' | 'paused' | 'completed' | 'failed';
}

export interface NarrativeOrchestrationCoreState {
  workflows: Map<string, OrchestrationWorkflow>;
  tasks: Map<string, OrchestrationTask>;
  totalWorkflows: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProgress: number;
  orchestrationEfficiency: number;
}

// Factory
export function createNarrativeOrchestrationCoreState(): NarrativeOrchestrationCoreState {
  return {
    workflows: new Map(),
    tasks: new Map(),
    totalWorkflows: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProgress: 0,
    orchestrationEfficiency: 0.7,
  };
}

// Create workflow
export function createWorkflow(
  state: NarrativeOrchestrationCoreState,
  workflowId: string,
  name: string
): NarrativeOrchestrationCoreState {
  const workflow: OrchestrationWorkflow = {
    workflowId,
    name,
    phase: 'planning',
    tasks: [],
    startTime: Date.now(),
    endTime: null,
    status: 'active',
  };
  const workflows = new Map(state.workflows).set(workflowId, workflow);
  return recomputeOrchestration({ ...state, workflows, totalWorkflows: workflows.size });
}

// Add task
export function addOrchestrationTask(
  state: NarrativeOrchestrationCoreState,
  workflowId: string,
  taskId: string,
  name: string,
  module: string,
  priority: TaskPriority = 'medium',
  dependsOn: string[] = []
): NarrativeOrchestrationCoreState {
  const task: OrchestrationTask = {
    taskId,
    name,
    module,
    priority,
    status: 'pending',
    dependsOn,
    progress: 0,
    result: '',
    startTime: null,
    endTime: null,
  };
  const tasks = new Map(state.tasks).set(taskId, task);

  const workflow = state.workflows.get(workflowId);
  let workflows = state.workflows;
  if (workflow) {
    const updated: OrchestrationWorkflow = { ...workflow, tasks: [...workflow.tasks, taskId] };
    workflows = new Map(state.workflows).set(workflowId, updated);
  }

  return recomputeOrchestration({ ...state, workflows, tasks, totalTasks: tasks.size });
}

// Update task status
export function updateOrchestrationTaskStatus(
  state: NarrativeOrchestrationCoreState,
  taskId: string,
  status: TaskStatus,
  progress: number = 0,
  result: string = ''
): NarrativeOrchestrationCoreState {
  const task = state.tasks.get(taskId);
  if (!task) return state;

  const updated: OrchestrationTask = {
    ...task,
    status,
    progress: Math.min(1, Math.max(0, progress)),
    result: result || task.result,
    startTime: status === 'in_progress' && !task.startTime ? Date.now() : task.startTime,
    endTime: (status === 'completed' || status === 'failed' || status === 'cancelled') ? Date.now() : task.endTime,
  };
  const tasks = new Map(state.tasks).set(taskId, updated);

  const completedTasks = status === 'completed' ? state.completedTasks + 1 : state.completedTasks;
  const failedTasks = status === 'failed' ? state.failedTasks + 1 : state.failedTasks;

  return recomputeOrchestration({ ...state, tasks, completedTasks, failedTasks });
}

// Advance workflow phase
export function advanceWorkflowPhase(
  state: NarrativeOrchestrationCoreState,
  workflowId: string,
  phase: OrchestrationPhase
): NarrativeOrchestrationCoreState {
  const workflow = state.workflows.get(workflowId);
  if (!workflow) return state;

  const updated: OrchestrationWorkflow = {
    ...workflow,
    phase,
    endTime: phase === 'completing' ? Date.now() : workflow.endTime,
    status: phase === 'completing' ? 'completed' : workflow.status,
  };
  const workflows = new Map(state.workflows).set(workflowId, updated);
  return recomputeOrchestration({ ...state, workflows });
}

// Get ready tasks (no unmet dependencies)
export function getReadyTasks(state: NarrativeOrchestrationCoreState, workflowId: string): OrchestrationTask[] {
  const workflow = state.workflows.get(workflowId);
  if (!workflow) return [];

  return workflow.tasks
    .map(taskId => state.tasks.get(taskId))
    .filter((t): t is OrchestrationTask => t !== undefined && t.status === 'pending')
    .filter(t => t.dependsOn.every(depId => state.tasks.get(depId)?.status === 'completed'));
}

// Get orchestration report
export function getOrchestrationReport(state: NarrativeOrchestrationCoreState): {
  totalWorkflows: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProgress: number;
  orchestrationEfficiency: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTasks === 0) recommendations.push('No tasks — add tasks');
  if (state.failedTasks > 0) recommendations.push(`${state.failedTasks} failed tasks — review`);
  if (state.orchestrationEfficiency < 0.5) recommendations.push('Low efficiency — review workflow');

  return {
    totalWorkflows: state.totalWorkflows,
    totalTasks: state.totalTasks,
    completedTasks: state.completedTasks,
    failedTasks: state.failedTasks,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    orchestrationEfficiency: Math.round(state.orchestrationEfficiency * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeOrchestration(state: NarrativeOrchestrationCoreState): NarrativeOrchestrationCoreState {
  const tasks = Array.from(state.tasks.values());
  const averageProgress = tasks.length > 0
    ? tasks.reduce((s, t) => s + t.progress, 0) / tasks.length
    : 0;
  const orchestrationEfficiency = tasks.length === 0
    ? 0.7
    : state.completedTasks / tasks.length;

  return { ...state, averageProgress, orchestrationEfficiency };
}

// Reset orchestration state
export function resetNarrativeOrchestrationCoreState(): NarrativeOrchestrationCoreState {
  return createNarrativeOrchestrationCoreState();
}