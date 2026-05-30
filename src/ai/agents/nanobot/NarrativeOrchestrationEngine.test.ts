import { describe, it, expect } from 'vitest'
import {
  createEmptyOrchestrationState,
  createThread,
  updateThreadProgress,
  resolveThread,
  getActiveThreads,
  getThreadById,
  formatOrchestrationSummary,
  formatOrchestrationDashboard,
} from './NarrativeOrchestrationEngine'

describe('createEmptyOrchestrationState', () => {
  it('should create empty state', () => {
    const state = createEmptyOrchestrationState()
    expect(state.threads.length).toBe(0)
    expect(state.overallCoherence).toBe(100)
    expect(state.activeThreadCount).toBe(0)
  })
})

describe('createThread', () => {
  it('should create first thread', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Main Plot')
    expect(state.threads.length).toBe(1)
    expect(state.activeThreadCount).toBe(1)
  })

  it('should set thread name and priority', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Romance', 8)
    expect(state.threads[0].name).toBe('Romance')
    expect(state.threads[0].priority).toBe(8)
  })

  it('should set default priority', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Subplot')
    expect(state.threads[0].priority).toBe(5)
  })

  it('should track multiple threads', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    state = createThread(state, 'Plot B')
    expect(state.threads.length).toBe(2)
    expect(state.activeThreadCount).toBe(2)
  })

  it('should set initial coherence', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    expect(state.threads[0].coherenceScore).toBe(100)
  })
})

describe('updateThreadProgress', () => {
  it('should update thread last chapter', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const threadId = state.threads[0].threadId
    state = updateThreadProgress(state, threadId, 5)
    expect(state.threads[0].lastChapter).toBe(5)
  })

  it('should not decrease chapter', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const threadId = state.threads[0].threadId
    state = updateThreadProgress(state, threadId, 5)
    state = updateThreadProgress(state, threadId, 3)
    expect(state.threads[0].lastChapter).toBe(5)
  })

  it('should update current chapter', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const threadId = state.threads[0].threadId
    state = updateThreadProgress(state, threadId, 7)
    expect(state.currentChapter).toBe(7)
  })
})

describe('resolveThread', () => {
  it('should change thread status to resolved', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const threadId = state.threads[0].threadId
    state = resolveThread(state, threadId)
    expect(state.threads[0].status).toBe('resolved')
  })

  it('should decrease active thread count', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    state = createThread(state, 'Plot B')
    const threadId = state.threads[0].threadId
    state = resolveThread(state, threadId)
    expect(state.activeThreadCount).toBe(1)
  })
})

describe('getActiveThreads', () => {
  it('should return empty for no threads', () => {
    const state = createEmptyOrchestrationState()
    expect(getActiveThreads(state).length).toBe(0)
  })

  it('should return only active threads', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    state = createThread(state, 'Plot B')
    const threadId = state.threads[0].threadId
    state = resolveThread(state, threadId)
    const active = getActiveThreads(state)
    expect(active.length).toBe(1)
    expect(active[0].name).toBe('Plot B')
  })
})

describe('getThreadById', () => {
  it('should return null for unknown thread', () => {
    const state = createEmptyOrchestrationState()
    expect(getThreadById(state, 'unknown')).toBeNull()
  })

  it('should return thread by id', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    const threadId = state.threads[0].threadId
    const thread = getThreadById(state, threadId)
    expect(thread).not.toBeNull()
    expect(thread?.name).toBe('Plot A')
  })
})

describe('formatOrchestrationSummary', () => {
  it('should show thread count', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    state = createThread(state, 'Plot B')
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('Threads: 2')
  })

  it('should show active thread count', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('active: 1')
  })

  it('should show coherence', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('Overall Coherence:')
  })
})

describe('formatOrchestrationDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot')
    const threadId = state.threads[0].threadId
    state = updateThreadProgress(state, threadId, 5)
    const dashboard = formatOrchestrationDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show active threads', () => {
    let state = createEmptyOrchestrationState()
    state = createThread(state, 'Plot A')
    state = createThread(state, 'Plot B')
    const dashboard = formatOrchestrationDashboard(state)
    expect(dashboard).toContain('Active Threads')
  })
})
