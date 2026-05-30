/**
 * AgentTaskRouter Tests - V121
 * Tests for Role-Based Task Routing with Pipeline Feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyTaskRouterState,
  createTask,
  initializePipelineStage,
  routeTask,
  startTask,
  completeTask,
  failTask,
  selectTaskByPriority,
  selectTaskBySkillMatch,
  getPendingTaskCount,
  recordStageFeedback,
  formatRouterSummary,
  formatTaskDetails,
  DEFAULT_ROUTING_POLICY,
} from './AgentTaskRouter'

// =============================================================================
// Helpers
// =============================================================================

function makeTask(overrides: Partial<Parameters<typeof createTask>[1]> = {}): Omit<Parameters<typeof createTask>[1], 'id' | 'createdAt' | 'status' | 'assignedAgentId' | 'startedAt' | 'completedAt' | 'actualDurationMs' | 'feedbackScore' | 'retryCount' | 'blockedReason'> {
  return {
    title: 'Test Task',
    description: 'A test task',
    targetRole: 'writer',
    priority: 'normal',
    phase: 'drafting',
    estimatedDurationMs: 60000,
    dependencies: [],
    tags: ['creative'],
    inputContext: {},
    ...overrides,
  }
}

// =============================================================================
// createEmptyTaskRouterState Tests
// =============================================================================

describe('createEmptyTaskRouterState', () => {
  it('should create empty state', () => {
    const state = createEmptyTaskRouterState()
    expect(state.tasks.size).toBe(0)
    expect(state.taskQueue.length).toBe(0)
    expect(state.pipelineHealth).toBe(100)
  })

  it('should have zero counters', () => {
    const state = createEmptyTaskRouterState()
    expect(state.totalTasksRouted).toBe(0)
    expect(state.totalTasksCompleted).toBe(0)
    expect(state.totalTasksFailed).toBe(0)
  })
})

// =============================================================================
// createTask Tests
// =============================================================================

describe('createTask', () => {
  it('should create a task and add to queue', () => {
    let state = createEmptyTaskRouterState()
    const { state: newState, taskId } = createTask(state, makeTask())

    expect(taskId).toMatch(/^task_/)
    expect(newState.tasks.size).toBe(1)
    expect(newState.taskQueue.length).toBe(1)
  })

  it('should set pending status', () => {
    let state = createEmptyTaskRouterState()
    const { state: newState, taskId } = createTask(state, makeTask())

    expect(newState.tasks.get(taskId)?.status).toBe('pending')
  })

  it('should generate unique ids', () => {
    let state = createEmptyTaskRouterState()
    const { taskId: id1 } = createTask(state, makeTask())
    state = createEmptyTaskRouterState()
    const { taskId: id2 } = createTask(state, makeTask())

    expect(id1).not.toBe(id2)
  })
})

// =============================================================================
// Pipeline Stage Tests
// =============================================================================

describe('initializePipelineStage', () => {
  it('should create a stage', () => {
    let state = createEmptyTaskRouterState()
    state = initializePipelineStage(state, {
      id: 'drafting_writer',
      name: 'Drafting Stage',
      phase: 'drafting',
      responsibleRole: 'writer',
      requiredCapabilities: ['writing', 'creativity'],
    })

    expect(state.stages.size).toBe(1)
    expect(state.stages.get('drafting_writer')?.phase).toBe('drafting')
  })

  it('should initialize stage with empty task lists', () => {
    let state = createEmptyTaskRouterState()
    state = initializePipelineStage(state, {
      id: 'review_editor',
      name: 'Review Stage',
      phase: 'review',
      responsibleRole: 'editor',
      requiredCapabilities: ['editing'],
    })

    const stage = state.stages.get('review_editor')
    expect(stage?.taskQueue.length).toBe(0)
    expect(stage?.completedTasks.length).toBe(0)
  })
})

// =============================================================================
// Task Routing Tests
// =============================================================================

describe('routeTask', () => {
  it('should assign agent to task', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')

    const task = state.tasks.get(taskId)
    expect(task?.assignedAgentId).toBe('agent_writer_1')
    expect(task?.status).toBe('routed')
  })

  it('should remove from queue when routed', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')

    expect(state.taskQueue.find(t => t.id === taskId)).toBeUndefined()
  })

  it('should increment routing counter', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')

    expect(state.totalTasksRouted).toBe(1)
  })
})

describe('startTask', () => {
  it('should change status to in_progress', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)

    expect(state.tasks.get(taskId)?.status).toBe('in_progress')
  })

  it('should record start time', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')
    const before = Date.now()
    state = startTask(state, taskId)
    const after = Date.now()

    const task = state.tasks.get(taskId)
    expect(task?.startedAt).toBeGreaterThanOrEqual(before)
    expect(task?.startedAt).toBeLessThanOrEqual(after)
  })
})

describe('completeTask', () => {
  it('should mark task as completed', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)
    state = completeTask(state, taskId, { result: 'done' })

    expect(state.tasks.get(taskId)?.status).toBe('completed')
  })

  it('should store result', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)
    state = completeTask(state, taskId, { text: 'Chapter 1 completed' })

    expect(state.tasks.get(taskId)?.status).toBe('completed')
    expect(state.tasks.get(taskId)?.outputResult).toBeDefined()
  })

  it('should increment completion counter', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = completeTask(s1, taskId, {})

    expect(state.totalTasksCompleted).toBe(1)
  })

  it('should record feedback score', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = completeTask(s1, taskId, {}, 95)

    expect(state.tasks.get(taskId)?.feedbackScore).toBe(95)
    expect(state.feedbackScores).toContain(95)
  })

  it('should calculate actual duration', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask())
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)
    // Wait a tiny bit then complete
    const before = Date.now()
    state = completeTask(state, taskId, {})
    const after = Date.now()

    const duration = state.tasks.get(taskId)?.actualDurationMs ?? 0
    expect(duration).toBeGreaterThanOrEqual(0)
    expect(duration).toBeLessThanOrEqual(after - before + 10)
  })
})

describe('failTask', () => {
  it('should mark task as failed when max retries exceeded', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask({ maxRetries: 1 }))
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)
    state = failTask(state, taskId, 'Network error') // first fail: retryCount 0 -> pending
    state = failTask(state, taskId, 'Network error') // second fail: retryCount 1 = maxRetries -> failed

    expect(state.tasks.get(taskId)?.status).toBe('failed')
    expect(state.tasks.get(taskId)?.blockedReason).toBe('Network error')
  })

  it('should re-queue for retry when retries remaining', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask({ maxRetries: 3, retryCount: 0 }))
    state = failTask(s1, taskId, 'Temporary failure')

    expect(state.tasks.get(taskId)?.status).toBe('pending')
    expect(state.taskQueue.find(t => t.id === taskId)).toBeDefined()
  })

  it('should increment failure counter when not retrying', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask({ maxRetries: 1 }))
    state = routeTask(s1, taskId, 'agent_writer_1')
    state = startTask(state, taskId)
    state = failTask(state, taskId, 'Network error') // retry
    state = failTask(state, taskId, 'Permanent failure') // now fails

    expect(state.totalTasksFailed).toBe(1)
  })
})

// =============================================================================
// Task Selection Tests
// =============================================================================

describe('selectTaskByPriority', () => {
  it('should select highest priority task', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId: t1 } = createTask(state, makeTask({ title: 'Low', priority: 'low' }))
    state = createEmptyTaskRouterState()
    const { state: s2, taskId: t2 } = createTask(state, makeTask({ title: 'Critical', priority: 'critical' }))
    state = createEmptyTaskRouterState()
    const { state: s3, taskId: t3 } = createTask(state, makeTask({ title: 'Normal', priority: 'normal' }))

    // Merge all into one state
    let merged = createEmptyTaskRouterState()
    const { state: s1b } = createTask(merged, makeTask({ title: 'Low', priority: 'low' }))
    merged = s1b
    const { state: s2b } = createTask(merged, makeTask({ title: 'Critical', priority: 'critical' }))
    merged = s2b
    const { state: s3b } = createTask(merged, makeTask({ title: 'Normal', priority: 'normal' }))
    merged = s3b

    const selected = selectTaskByPriority(merged, 'writer')
    expect(selected).toBeDefined()
    const task = merged.tasks.get(selected!)
    expect(task?.priority).toBe('critical')
  })

  it('should return null when no tasks for role', () => {
    const state = createEmptyTaskRouterState()
    const selected = selectTaskByPriority(state, 'nonexistent_role')
    expect(selected).toBeNull()
  })
})

describe('selectTaskBySkillMatch', () => {
  it('should select task matching agent capabilities', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId: t1 } = createTask(state, makeTask({ tags: ['dialogue'] }))
    state = createEmptyTaskRouterState()
    const { state: s2, taskId: t2 } = createTask(state, makeTask({ tags: ['action', 'dialogue'] }))

    let merged = createEmptyTaskRouterState()
    const { state: s1b } = createTask(merged, makeTask({ tags: ['dialogue'] }))
    merged = s1b
    const { state: s2b } = createTask(merged, makeTask({ tags: ['action', 'dialogue'] }))
    merged = s2b

    // Select task with 'dialogue' match
    const selected = selectTaskBySkillMatch(merged, 'writer', ['dialogue', 'creativity'])
    expect(selected).toBeDefined()
  })
})

describe('getPendingTaskCount', () => {
  it('should count pending tasks for role', () => {
    let state = createEmptyTaskRouterState()
    state = createEmptyTaskRouterState()
    const { state: s1 } = createTask(state, makeTask({ targetRole: 'writer' }))
    const { state: s2 } = createTask(s1, makeTask({ targetRole: 'writer' }))
    const { state: s3 } = createTask(s2, makeTask({ targetRole: 'editor' }))

    expect(getPendingTaskCount(s3, 'writer')).toBe(2)
  })
})

// =============================================================================
// Pipeline Health Tests
// =============================================================================

describe('calculatePipelineHealth', () => {
  it('should return 100 for empty pipeline', () => {
    let state = createEmptyTaskRouterState()
    state = initializePipelineStage(state, {
      id: 'test_stage',
      name: 'Test',
      phase: 'drafting',
      responsibleRole: 'writer',
      requiredCapabilities: [],
    })
    expect(state.pipelineHealth).toBe(100)
  })
})

describe('recordStageFeedback', () => {
  it('should update stage quality score', () => {
    let state = createEmptyTaskRouterState()
    state = initializePipelineStage(state, {
      id: 'stage1',
      name: 'Stage 1',
      phase: 'drafting',
      responsibleRole: 'writer',
      requiredCapabilities: [],
    })
    state = recordStageFeedback(state, 'stage1', 80)

    const score = state.stages.get('stage1')?.qualityScore
    expect(score).toBeGreaterThan(0)
  })

  it('should apply EMA weighting', () => {
    let state = createEmptyTaskRouterState()
    state = initializePipelineStage(state, {
      id: 'stage1',
      name: 'Stage 1',
      phase: 'drafting',
      responsibleRole: 'writer',
      requiredCapabilities: [],
    })
    state = recordStageFeedback(state, 'stage1', 100)
    state = recordStageFeedback(state, 'stage1', 0)

    // EMA: 100*0.7 + 100*0.3 = 100, then 100*0.7 + 0*0.3 = 70
    expect(state.stages.get('stage1')?.qualityScore).toBe(70)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatRouterSummary', () => {
  it('should format summary', () => {
    const state = createEmptyTaskRouterState()
    const summary = formatRouterSummary(state)
    expect(summary).toContain('Task Router Summary')
  })

  it('should show task counts', () => {
    const state = createEmptyTaskRouterState()
    const summary = formatRouterSummary(state)
    expect(summary).toContain('completed')
    expect(summary).toContain('pending')
  })
})

describe('formatTaskDetails', () => {
  it('should format task details', () => {
    let state = createEmptyTaskRouterState()
    const { state: s1, taskId } = createTask(state, makeTask({ title: 'My Task' }))
    state = s1

    const details = formatTaskDetails(state, taskId)
    expect(details).toContain('My Task')
    expect(details).toContain('writer')
  })

  it('should show not found for unknown task', () => {
    const state = createEmptyTaskRouterState()
    const details = formatTaskDetails(state, 'nonexistent')
    expect(details).toContain('not found')
  })
})