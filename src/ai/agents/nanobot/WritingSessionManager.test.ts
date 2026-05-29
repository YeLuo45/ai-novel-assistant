import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  updateContext,
  addMessage,
  createTask,
  updateTask,
  completeTask,
  getBlockedTasks,
  unblockTasks,
  getConversationSummary,
  detectContextSwitch,
  recordContextSwitch,
  getTaskProgress,
  searchHistory,
  getMessagesByRole,
  pruneMessages,
} from './WritingSessionManager'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState('proj1')
    expect(state.context.projectId).toBe('proj1')
    expect(state.conversationHistory.length).toBe(0)
    expect(state.activeTasks.size).toBe(0)
    expect(state.typeAlias).toEqual({})
  })
})

describe('updateContext', () => {
  it('should update context fields', () => {
    let state = createEmptyState()
    state = updateContext(state, { currentChapter: 5, sceneFocus: 'battle' })
    expect(state.context.currentChapter).toBe(5)
    expect(state.context.sceneFocus).toBe('battle')
  })
})

describe('addMessage', () => {
  it('should add user message', () => {
    let state = createEmptyState()
    state = addMessage(state, 'user', 'Hello')
    expect(state.conversationHistory.length).toBe(1)
    expect(state.conversationHistory[0].role).toBe('user')
    expect(state.sessionMetrics.totalMessages).toBe(1)
  })

  it('should capture context snapshot', () => {
    let state = createEmptyState('proj1')
    state = updateContext(state, { currentChapter: 3 })
    state = addMessage(state, 'assistant', 'What next?')
    expect(state.conversationHistory[0].contextSnapshot?.currentChapter).toBe(3)
  })
})

describe('createTask', () => {
  it('should create pending task', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1')
    expect(state.activeTasks.get('t1')!.status).toBe('pending')
    expect(state.activeTasks.get('t1')!.description).toBe('Write chapter 1')
  })

  it('should create blocked task', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1', ['t0'])
    expect(state.activeTasks.get('t1')!.status).toBe('blocked')
    expect(state.activeTasks.get('t1')!.blockedBy).toContain('t0')
  })
})

describe('updateTask', () => {
  it('should update task fields', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1')
    state = updateTask(state, 't1', { status: 'in_progress', progress: 50 })
    const task = state.activeTasks.get('t1')
    expect(task!.status).toBe('in_progress')
    expect(task!.progress).toBe(50)
  })
})

describe('completeTask', () => {
  it('should remove from active and add to completed', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1')
    state = completeTask(state, 't1', 'Done')
    expect(state.activeTasks.has('t1')).toBe(false)
    expect(state.completedTaskIds).toContain('t1')
    expect(state.sessionMetrics.tasksCompleted).toBe(1)
  })
})

describe('getBlockedTasks', () => {
  it('should find tasks blocked by given task', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1')
    state = createTask(state, 't2', 'Edit chapter 1', ['t1'])
    const blocked = getBlockedTasks(state, 't1')
    expect(blocked).toContain('t2')
  })
})

describe('unblockTasks', () => {
  it('should unblock tasks when blocker completes', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Write chapter 1')
    state = createTask(state, 't2', 'Edit chapter 1', ['t1'])
    state = completeTask(state, 't1')
    state = unblockTasks(state, 't1')
    expect(state.activeTasks.get('t2')!.status).toBe('pending')
  })
})

describe('getConversationSummary', () => {
  it('should return conversation summary', () => {
    let state = createEmptyState()
    state = updateContext(state, { currentChapter: 5, sceneFocus: 'battle' })
    state = addMessage(state, 'user', 'Hello')
    state = addMessage(state, 'assistant', 'Hi')
    const summary = getConversationSummary(state, 5)
    expect(summary.recentMessages.length).toBe(2)
    expect(summary.activeTasksCount).toBe(0)
    expect(summary.currentChapter).toBe(5)
  })
})

describe('detectContextSwitch', () => {
  it('should detect chapter change', () => {
    const state = createEmptyState()
    expect(detectContextSwitch(state, 2, '')).toBe(true)
  })

  it('should detect scene change', () => {
    let state = createEmptyState()
    state = updateContext(state, { sceneFocus: 'battle' })
    expect(detectContextSwitch(state, 1, 'dialogue')).toBe(true)
  })

  it('should not detect when unchanged', () => {
    const state = createEmptyState()
    expect(detectContextSwitch(state, 1, '')).toBe(false)
  })
})

describe('recordContextSwitch', () => {
  it('should update context and increment switch count', () => {
    let state = createEmptyState()
    state = recordContextSwitch(state, { currentChapter: 3, sceneFocus: 'battle' })
    expect(state.context.currentChapter).toBe(3)
    expect(state.sessionMetrics.contextSwitches).toBe(1)
  })
})

describe('getTaskProgress', () => {
  it('should return task progress summary', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Task 1')
    state = createTask(state, 't2', 'Task 2')
    state = updateTask(state, 't1', { status: 'in_progress' })
    state = completeTask(state, 't1')
    const progress = getTaskProgress(state)
    expect(progress.pending).toBe(1)  // t2 is still pending
    expect(progress.inProgress).toBe(0)  // t1 completed and removed
    expect(progress.completed).toBe(1)  // t1 in completedTaskIds
  })

  it('should calculate overall progress', () => {
    let state = createEmptyState()
    state = createTask(state, 't1', 'Task 1')
    state = updateTask(state, 't1', { status: 'in_progress', progress: 50 })
    const progress = getTaskProgress(state)
    expect(progress.overallProgress).toBeGreaterThan(0)
  })
})

describe('searchHistory', () => {
  it('should find messages by keyword', () => {
    let state = createEmptyState()
    state = addMessage(state, 'user', 'Write about dragons')
    state = addMessage(state, 'assistant', 'Dragons are great')
    state = addMessage(state, 'user', 'What about magic?')
    const results = searchHistory(state, 'dragons', 5)
    expect(results.length).toBe(2)
  })
})

describe('getMessagesByRole', () => {
  it('should filter messages by role', () => {
    let state = createEmptyState()
    state = addMessage(state, 'user', 'Hello')
    state = addMessage(state, 'assistant', 'Hi')
    state = addMessage(state, 'user', 'Again')
    const userMsgs = getMessagesByRole(state, 'user')
    expect(userMsgs.length).toBe(2)
  })
})

describe('pruneMessages', () => {
  it('should prune old messages beyond limit', () => {
    let state = createEmptyState()
    for (let i = 0; i < 120; i++) {
      state = addMessage(state, 'user', `Message ${i}`)
    }
    state = pruneMessages(state, 50)
    expect(state.conversationHistory.length).toBe(50)
  })

  it('should not prune when under limit', () => {
    let state = createEmptyState()
    state = addMessage(state, 'user', 'Hello')
    state = addMessage(state, 'user', 'Again')
    const pruned = pruneMessages(state, 50)
    expect(pruned.conversationHistory.length).toBe(2)
  })
})
