/**
 * V742 GoalDrivenEngine — Direction A Iter 3/9 (Round 3)
 * Goal-driven engine: autonomous goal pursuit + sub-goal decomposition
 * Sources: generic-agent goal + ruflo hierarchical + thunderbolt
 */

export type GoalType = 'short_term' | 'medium_term' | 'long_term' | 'aspirational';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'failed' | 'abandoned';
export type GoalPriority = 'critical' | 'high' | 'medium' | 'low';
export type SubGoalRelation = 'sequential' | 'parallel' | 'optional' | 'blocking';

export interface SubGoal {
  subgoalId: string;
  description: string;
  status: GoalStatus;
  relation: SubGoalRelation;
  progress: number;
  parentGoalId: string;
}

export interface Goal {
  goalId: string;
  name: string;
  description: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;
  target: number;
  current: number;
  parentGoalId: string | null;
  createdAt: number;
  deadline: number | null;
}

export interface GoalDrivenEngineState {
  goals: Map<string, Goal>;
  subgoals: Map<string, SubGoal>;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  averageProgress: number;
  goalAchievementRate: number;
  topPriorityGoal: string | null;
}

// Factory
export function createGoalDrivenEngineState(): GoalDrivenEngineState {
  return {
    goals: new Map(),
    subgoals: new Map(),
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    averageProgress: 0,
    goalAchievementRate: 0,
    topPriorityGoal: null,
  };
}

// Create goal
export function createGoal(
  state: GoalDrivenEngineState,
  goalId: string,
  name: string,
  description: string,
  type: GoalType,
  priority: GoalPriority = 'medium',
  target: number = 100,
  deadline: number | null = null,
  parentGoalId: string | null = null
): GoalDrivenEngineState {
  const goal: Goal = {
    goalId,
    name,
    description,
    type,
    priority,
    status: 'active',
    progress: 0,
    target,
    current: 0,
    parentGoalId,
    createdAt: Date.now(),
    deadline,
  };
  const goals = new Map(state.goals).set(goalId, goal);
  return recomputeGoals({ ...state, goals, totalGoals: goals.size, activeGoals: state.activeGoals + 1 });
}

// Update progress
export function updateGoalProgress(state: GoalDrivenEngineState, goalId: string, current: number): GoalDrivenEngineState {
  const goal = state.goals.get(goalId);
  if (!goal) return state;

  const progress = Math.min(1, Math.max(0, current / goal.target));
  const updated: Goal = { ...goal, current, progress };
  const goals = new Map(state.goals).set(goalId, updated);
  return recomputeGoals({ ...state, goals });
}

// Set goal status
export function setGoalStatus(state: GoalDrivenEngineState, goalId: string, status: GoalStatus): GoalDrivenEngineState {
  const goal = state.goals.get(goalId);
  if (!goal) return state;

  const updated: Goal = { ...goal, status };
  const goals = new Map(state.goals).set(goalId, updated);
  return recomputeGoals({ ...state, goals });
}

// Add subgoal
export function addSubGoal(
  state: GoalDrivenEngineState,
  subgoalId: string,
  parentGoalId: string,
  description: string,
  relation: SubGoalRelation = 'sequential'
): GoalDrivenEngineState {
  const subgoal: SubGoal = {
    subgoalId,
    description,
    status: 'active',
    relation,
    progress: 0,
    parentGoalId,
  };
  const subgoals = new Map(state.subgoals).set(subgoalId, subgoal);
  return { ...state, subgoals };
}

// Update subgoal
export function updateSubGoal(state: GoalDrivenEngineState, subgoalId: string, progress: number, status?: GoalStatus): GoalDrivenEngineState {
  const subgoal = state.subgoals.get(subgoalId);
  if (!subgoal) return state;

  const updated: SubGoal = { ...subgoal, progress, status: status || subgoal.status };
  const subgoals = new Map(state.subgoals).set(subgoalId, updated);
  return { ...state, subgoals };
}

// Get goals by type
export function getGoalsByType(state: GoalDrivenEngineState, type: GoalType): Goal[] {
  return Array.from(state.goals.values()).filter(g => g.type === type);
}

// Get goals by status
export function getGoalsByStatus(state: GoalDrivenEngineState, status: GoalStatus): Goal[] {
  return Array.from(state.goals.values()).filter(g => g.status === status);
}

// Get subgoals for goal
export function getSubGoalsForGoal(state: GoalDrivenEngineState, goalId: string): SubGoal[] {
  return Array.from(state.subgoals.values()).filter(s => s.parentGoalId === goalId);
}

// Get goal report
export function getGoalReport(state: GoalDrivenEngineState): {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  averageProgress: number;
  goalAchievementRate: number;
  topPriorityGoal: string | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGoals === 0) recommendations.push('No goals — define goals');
  if (state.goalAchievementRate < 0.5) recommendations.push('Low achievement rate — review goals');
  if (state.activeGoals > 5) recommendations.push('Too many active goals — focus on priorities');

  return {
    totalGoals: state.totalGoals,
    completedGoals: state.completedGoals,
    activeGoals: state.activeGoals,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    goalAchievementRate: Math.round(state.goalAchievementRate * 100) / 100,
    topPriorityGoal: state.topPriorityGoal,
    recommendations,
  };
}

// Recompute metrics
function recomputeGoals(state: GoalDrivenEngineState): GoalDrivenEngineState {
  const goals = Array.from(state.goals.values());
  const completed = goals.filter(g => g.status === 'completed');
  const active = goals.filter(g => g.status === 'active');
  const averageProgress = goals.length > 0
    ? goals.reduce((s, g) => s + g.progress, 0) / goals.length
    : 0;
  const goalAchievementRate = goals.length === 0 ? 0 : completed.length / goals.length;

  let topPriorityGoal: string | null = null;
  let topPriority = -1;
  const priorityMap: Record<GoalPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  goals.forEach(g => {
    if (g.status === 'active' && priorityMap[g.priority] > topPriority) {
      topPriority = priorityMap[g.priority];
      topPriorityGoal = g.name;
    }
  });

  return { ...state, completedGoals: completed.length, activeGoals: active.length, averageProgress, goalAchievementRate, topPriorityGoal };
}

// Reset goal state
export function resetGoalDrivenEngineState(): GoalDrivenEngineState {
  return createGoalDrivenEngineState();
}