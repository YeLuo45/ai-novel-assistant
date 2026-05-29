import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createArc,
  createThread,
  addMilestone,
  achieveMilestone,
  updateThreadProgress,
  generateEvolutionPlan,
  validateStoryStructure,
  getThreadPriorityOrder,
  getArcCompletion,
  suggestNextActions,
} from './AdaptiveNarrativePlanner'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.arcs.size).toBe(0)
    expect(state.threads.size).toBe(0)
    expect(state.evolutionPlan).toBeNull()
    expect(state.typeAlias).toEqual({})
  })
})

describe('createArc', () => {
  it('should create narrative arc', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main Arc', 1, 20, 'thread1', ['thread2'])
    expect(state.arcs.get('arc1')!.name).toBe('Main Arc')
    expect(state.arcs.get('arc1')!.endChapter).toBe(20)
  })
})

describe('createThread', () => {
  it('should create plot thread', () => {
    let state = createEmptyState()
    state = createThread(state, 't1', 'Main Plot', 9, [], [])
    expect(state.threads.get('t1')!.priority).toBe(9)
    expect(state.threads.get('t1')!.chapters.size).toBe(0)
  })

  it('should support dependencies', () => {
    let state = createEmptyState()
    state = createThread(state, 't1', 'Setup', 5)
    state = createThread(state, 't2', 'Payoff', 8, ['t1'])
    expect(state.threads.get('t2')!.dependencyIds).toContain('t1')
  })
})

describe('addMilestone', () => {
  it('should add milestone to arc', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 10, 't1')
    state = addMilestone(state, 'arc1', 5, 'First climax')
    expect(state.arcs.get('arc1')!.milestones.length).toBe(1)
    expect(state.arcs.get('arc1')!.milestones[0].event).toBe('First climax')
  })
})

describe('achieveMilestone', () => {
  it('should mark milestone as achieved', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 10, 't1')
    state = addMilestone(state, 'arc1', 5, 'Climax')
    state = achieveMilestone(state, 'arc1', 0)
    expect(state.arcs.get('arc1')!.milestones[0].achieved).toBe(true)
    expect(state.completedMilestones).toContain('arc1:0')
  })
})

describe('updateThreadProgress', () => {
  it('should update thread with chapter summary', () => {
    let state = createEmptyState()
    state = createThread(state, 't1', 'Plot', 8)
    state = updateThreadProgress(state, 't1', 3, 'Character introduced')
    expect(state.threads.get('t1')!.chapters.get(3)).toBe('Character introduced')
  })
})

describe('generateEvolutionPlan', () => {
  it('should generate plan with no arcs', () => {
    let state = createEmptyState()
    const plan = generateEvolutionPlan(state, 1, 5)
    expect(plan.nextChapters.length).toBe(4)
  })

  it('should generate plan based on arc milestones', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 10, 't1')
    state = createThread(state, 't1', 'Plot', 8)
    state = addMilestone(state, 'arc1', 5, 'Midpoint')
    const plan = generateEvolutionPlan(state, 1, 8)
    expect(plan.nextChapters.length).toBe(7)
    expect(plan.adaptationTriggers.length).toBeGreaterThanOrEqual(0)
  })
})

describe('validateStoryStructure', () => {
  it('should pass valid structure', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 20, 't1')
    state = createThread(state, 't1', 'Main', 9)
    const result = validateStoryStructure(state)
    expect(result.valid).toBe(true)
    expect(result.issues.length).toBe(0)
  })

  it('should detect missing arcs', () => {
    let state = createEmptyState()
    state = createThread(state, 't1', 'Plot', 8)
    const result = validateStoryStructure(state)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('arc'))).toBe(true)
  })
})

describe('getThreadPriorityOrder', () => {
  it('should return threads sorted by priority', () => {
    let state = createEmptyState()
    state = createThread(state, 't1', 'Low', 3)
    state = createThread(state, 't2', 'High', 9)
    state = createThread(state, 't3', 'Medium', 6)
    const order = getThreadPriorityOrder(state)
    expect(order).toEqual(['t2', 't3', 't1'])
  })
})

describe('getArcCompletion', () => {
  it('should return 0 for unknown arc', () => {
    const state = createEmptyState()
    expect(getArcCompletion(state, 'unknown', 5)).toBe(0)
  })

  it('should calculate completion based on chapter progress', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 10, 't1')
    state = addMilestone(state, 'arc1', 5, 'Midpoint')
    state = achieveMilestone(state, 'arc1', 0)
    const completion = getArcCompletion(state, 'arc1', 6)
    expect(completion).toBeGreaterThan(0)
    expect(completion).toBeLessThan(100)
  })
})

describe('suggestNextActions', () => {
  it('should suggest actions for upcoming milestones', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 20, 't1')
    state = createThread(state, 't1', 'Plot', 9)
    state = addMilestone(state, 'arc1', 3, 'First turning point')
    const actions = suggestNextActions(state, 1)
    expect(actions.length).toBeGreaterThan(0)
  })

  it('should prioritize by urgency', () => {
    let state = createEmptyState()
    state = createArc(state, 'arc1', 'Main', 1, 20, 't1')
    state = createThread(state, 't1', 'Plot', 9)
    const actions = suggestNextActions(state, 10)
    const priorities = actions.map(a => a.priority)
    expect(priorities[0]).toBeGreaterThanOrEqual(priorities[1] || 0)
  })
})
