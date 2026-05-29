/**
 * NarrativeGoalTracker — V357
 * Story objective management, goal progress tracking, conflict resolution.
 * Inspired by: generic-agent (autonomous goal pursuit), ruflo (hierarchical decomposition)
 */

export type GoalStatus = 'active' | 'achieved' | 'blocked' | 'abandoned'
export type GoalPriority = 'critical' | 'high' | 'medium' | 'low'
export type ConflictType = 'resource' | 'timeline' | 'character' | 'thematic'

export interface Goal {
  id: string
  description: string
  status: GoalStatus
  priority: GoalPriority
  progress: number  // 0-100
  subgoals: string[]
  obstacles: Obstacle[]
  relatedCharacters: string[]
  chapterId?: string
  createdAt: number
  achievedAt?: number
}

export interface Obstacle {
  id: string
  description: string
  severity: number  // 0-100
  resolved: boolean
  resolution?: string
}

export interface NarrativeGoalState {
  goals: Record<string, Goal>
  activeGoalId: string | null
  goalConflicts: GoalConflict[]
  completionRate: number
  typeAlias: Record<string, unknown>
}

export interface GoalConflict {
  goalId1: string
  goalId2: string
  type: ConflictType
  severity: number
  resolution?: string
}

export function createEmptyState(): NarrativeGoalState {
  return {
    goals: {},
    activeGoalId: null,
    goalConflicts: [],
    completionRate: 0,
    typeAlias: {},
  }
}

export function createGoal(
  state: NarrativeGoalState,
  description: string,
  priority: GoalPriority = 'medium',
  relatedCharacters?: string[],
  chapterId?: string
): NarrativeGoalState {
  const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const goal: Goal = {
    id, description, status: 'active', priority,
    progress: 0, subgoals: [], obstacles: [],
    relatedCharacters: relatedCharacters || [],
    chapterId, createdAt: Date.now(),
  }
  const goals = { ...state.goals, [id]: goal }
  return {
    ...state,
    goals,
    activeGoalId: state.activeGoalId || id,
  }
}

export function updateProgress(state: NarrativeGoalState, goalId: string, progress: number): NarrativeGoalState {
  const goal = state.goals[goalId]
  if (!goal) return state
  const newProgress = Math.max(0, Math.min(100, progress))
  const status: GoalStatus = newProgress >= 100 ? 'achieved' : goal.status
  const achievedAt = newProgress >= 100 ? Date.now() : undefined
  const updatedGoal = { ...goal, progress: newProgress, status, achievedAt }
  const goals = { ...state.goals, [goalId]: updatedGoal }
  const completionRate = calculateCompletionRate(goals)
  return { ...state, goals, completionRate }
}

export function addObstacle(
  state: NarrativeGoalState,
  goalId: string,
  description: string,
  severity: number = 50
): NarrativeGoalState {
  const goal = state.goals[goalId]
  if (!goal) return state
  const obstacle: Obstacle = { id: `obs_${Date.now()}`, description, severity, resolved: false }
  const updatedGoal = { ...goal, obstacles: [...goal.obstacles, obstacle] }
  return { ...state, goals: { ...state.goals, [goalId]: updatedGoal } }
}

export function resolveObstacle(state: NarrativeGoalState, goalId: string, obstacleId: string, resolution?: string): NarrativeGoalState {
  const goal = state.goals[goalId]
  if (!goal) return state
  const obstacles = goal.obstacles.map(o => o.id === obstacleId ? { ...o, resolved: true, resolution } : o)
  return { ...state, goals: { ...state.goals, [goalId]: { ...goal, obstacles } } }
}

export function detectConflicts(state: NarrativeGoalState): GoalConflict[] {
  const conflicts: GoalConflict[] = []
  const goalList = Object.values(state.goals).filter(g => g.status === 'active')
  for (let i = 0; i < goalList.length; i++) {
    for (let j = i + 1; j < goalList.length; j++) {
      const g1 = goalList[i], g2 = goalList[j]
      // Character conflicts
      const sharedChars = g1.relatedCharacters.filter(c => g2.relatedCharacters.includes(c))
      if (sharedChars.length > 0) {
        conflicts.push({ goalId1: g1.id, goalId2: g2.id, type: 'character', severity: sharedChars.length * 30 })
      }
      // Timeline conflicts (both need same chapter)
      if (g1.chapterId && g1.chapterId === g2.chapterId && g1.id !== g2.id) {
        conflicts.push({ goalId1: g1.id, goalId2: g2.id, type: 'timeline', severity: 60 })
      }
    }
  }
  return conflicts
}

export function calculateCompletionRate(goals: Record<string, Goal>): number {
  const all = Object.values(goals)
  if (all.length === 0) return 0
  const achieved = all.filter(g => g.status === 'achieved').length
  return Math.round((achieved / all.length) * 100)
}

export function getGoalSummary(state: NarrativeGoalState) {
  const all = Object.values(state.goals)
  const active = all.filter(g => g.status === 'active')
  const achieved = all.filter(g => g.status === 'achieved')
  const blocked = all.filter(g => g.status === 'blocked')
  return {
    total: all.length,
    active: active.length,
    achieved: achieved.length,
    blocked: blocked.length,
    completionRate: state.completionRate,
    topPriorityGoals: active.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    }).slice(0, 5).map(g => ({ id: g.id, description: g.description, priority: g.priority })),
  }
}

export function prioritizeGoals(state: NarrativeGoalState): string[] {
  const active = Object.values(state.goals).filter(g => g.status === 'active')
  return active
    .sort((a, b) => {
      const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority]
      const unresolvedA = a.obstacles.filter(o => !o.resolved).length
      const unresolvedB = b.obstacles.filter(o => !o.resolved).length
      return unresolvedB - unresolvedA
    })
    .map(g => g.id)
}

export function resolveConflict(state: NarrativeGoalState, goalId1: string, goalId2: string, resolution?: string): NarrativeGoalState {
  const conflicts = state.goalConflicts.filter(c => !(c.goalId1 === goalId1 && c.goalId2 === goalId2))
  return { ...state, goalConflicts: conflicts }
}

export function abandonGoal(state: NarrativeGoalState, goalId: string): NarrativeGoalState {
  const goal = state.goals[goalId]
  if (!goal) return state
  return { ...state, goals: { ...state.goals, [goalId]: { ...goal, status: 'abandoned' } } }
}
