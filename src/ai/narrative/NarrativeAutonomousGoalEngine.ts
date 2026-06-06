/**
 * V976 NarrativeAutonomousGoalEngine — Direction A Iter 6/15 (Round 5)
 * Autonomous goal engine: autonomous goal pursuit
 * Sources: generic-agent autonomous + thunderbolt + nanobot
 */

export type GoalType = 'craft' | 'commercial' | 'artistic' | 'thematic' | 'structural' | 'emotional';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical' | 'essential';
export type GoalStatus = 'pending' | 'active' | 'in_progress' | 'achieved' | 'abandoned' | 'blocked';

export interface NarrativeGoal {
  goalId: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  description: string;
  progress: number;
  targetValue: number;
  currentValue: number;
  chapter: number;
}

export interface GoalStrategy {
  strategyId: string,
  name: string,
  goalIds: string[],
  effectiveness: number,
  usage: number,
}

export interface NarrativeAutonomousGoalEngineState {
  goals: Map<string, NarrativeGoal>;
  strategies: Map<string, GoalStrategy>;
  totalGoals: number;
  totalStrategies: number;
  achievedGoals: number;
  averageProgress: number;
  goalAlignment: number;
  goalPursuitMastery: number;
}

// Factory
export function createNarrativeAutonomousGoalEngineState(): NarrativeAutonomousGoalEngineState {
  return {
    goals: new Map(),
    strategies: new Map(),
    totalGoals: 0,
    totalStrategies: 0,
    achievedGoals: 0,
    averageProgress: 0.5,
    goalAlignment: 0.5,
    goalPursuitMastery: 0.5,
  };
}

// Add goal
export function addNarrativeGoal(
  state: NarrativeAutonomousGoalEngineState,
  goalId: string,
  type: GoalType,
  priority: GoalPriority,
  description: string,
  targetValue: number,
  currentValue: number,
  chapter: number
): NarrativeAutonomousGoalEngineState {
  const status: GoalStatus = 'pending';
  const progress = targetValue === 0 ? 0 : Math.min(1, currentValue / targetValue);
  const goal: NarrativeGoal = { goalId, type, priority, status, description, progress, targetValue, currentValue, chapter };
  const goals = new Map(state.goals).set(goalId, goal);
  return recomputeGoal({ ...state, goals, totalGoals: goals.size });
}

// Update goal
export function updateNarrativeGoal(state: NarrativeAutonomousGoalEngineState, goalId: string, currentValue: number): NarrativeAutonomousGoalEngineState {
  const goal = state.goals.get(goalId);
  if (!goal) return state;

  const progress = goal.targetValue === 0 ? 0 : Math.min(1, currentValue / goal.targetValue);
  const status: GoalStatus = progress === 1 ? 'achieved'
    : progress === 0 ? 'pending'
    : progress < 0.3 ? 'active'
    : progress < 0.9 ? 'in_progress'
    : 'in_progress';
  const updated: NarrativeGoal = { ...goal, currentValue, progress, status };
  const goals = new Map(state.goals).set(goalId, updated);
  const achievedGoals = updated.status === 'achieved' && goal.status !== 'achieved' ? state.achievedGoals + 1 : state.achievedGoals;
  return recomputeGoal({ ...state, goals, achievedGoals });
}

// Add strategy
export function addGoalStrategy(
  state: NarrativeAutonomousGoalEngineState,
  strategyId: string,
  name: string,
  goalIds: string[]
): NarrativeAutonomousGoalEngineState {
  const goals = goalIds.map(id => state.goals.get(id)).filter((g): g is NarrativeGoal => g !== undefined);
  const effectiveness = goals.length === 0 ? 0.5
    : goals.reduce((s, g) => s + g.progress, 0) / goals.length;
  const strategy: GoalStrategy = { strategyId, name, goalIds, effectiveness, usage: 0 };
  const strategies = new Map(state.strategies).set(strategyId, strategy);
  return recomputeGoal({ ...state, strategies, totalStrategies: strategies.size });
}

// Get goals by type
export function getGoalsByType(state: NarrativeAutonomousGoalEngineState, type: GoalType): NarrativeGoal[] {
  return Array.from(state.goals.values()).filter(g => g.type === type);
}

// Get goal report
export function getGoalReport(state: NarrativeAutonomousGoalEngineState): {
  totalGoals: number;
  achievedGoals: number;
  averageProgress: number;
  goalAlignment: number;
  goalPursuitMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGoals === 0) recommendations.push('No goals — set goals');
  if (state.averageProgress < 0.3) recommendations.push('Low progress — push forward');
  if (state.goalPursuitMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalGoals: state.totalGoals,
    achievedGoals: state.achievedGoals,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    goalAlignment: Math.round(state.goalAlignment * 100) / 100,
    goalPursuitMastery: Math.round(state.goalPursuitMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeGoal(state: NarrativeAutonomousGoalEngineState): NarrativeAutonomousGoalEngineState {
  const goals = Array.from(state.goals.values());
  const totalProgress = goals.reduce((s, g) => s + g.progress, 0);
  const averageProgress = goals.length === 0 ? 0.5
    : totalProgress / goals.length;

  // Goal alignment: how well progress correlates with priority
  const priorityMap: Record<GoalPriority, number> = { low: 0.2, medium: 0.4, high: 0.6, critical: 0.8, essential: 1.0 };
  const goalAlignment = goals.length === 0 ? 0.5
    : goals.reduce((s, g) => s + (g.progress * priorityMap[g.priority] + (1 - g.progress) * (1 - priorityMap[g.priority])) / 2, 0) / goals.length;

  const strategies = Array.from(state.strategies.values());
  const strategyEffectiveness = strategies.length === 0 ? 0.5
    : strategies.reduce((s, st) => s + st.effectiveness, 0) / strategies.length;

  const goalPursuitMastery = (averageProgress * 0.4 + goalAlignment * 0.3 + strategyEffectiveness * 0.3);

  return { ...state, averageProgress, goalAlignment, goalPursuitMastery };
}

// Reset
export function resetNarrativeAutonomousGoalEngineState(): NarrativeAutonomousGoalEngineState {
  return createNarrativeAutonomousGoalEngineState();
}