import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  plantCallback,
  deliverCallback,
  resolveThread,
  generateMemoryReport,
  getThreadByName,
  getUnresolvedCallbacks,
  compareCallbackSatisfaction,
} from './NarrativeMemoryWeaver'

describe('createEmptyState', () => {
  it('should create empty memory state', () => {
    const s = createEmptyState()
    expect(s.threads).toEqual([])
    expect(s.callbacks).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('plantCallback', () => {
  it('should plant a new callback', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'the red dress', 5, 'Hero sees woman in red dress', 'visual', 70)
    expect(s.threads.length).toBe(1)
    expect(s.callbacks.length).toBe(1)
    expect(s.threads[0].callbacks.length).toBe(1)
  })

  it('should extend existing thread', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'red dress', 5, 'First mention', 'visual', 60)
    s = plantCallback(s, 'red dress', 8, 'Second mention', 'visual', 70)
    expect(s.threads.length).toBe(1)
    expect(s.callbacks.length).toBe(2)
  })
})

describe('deliverCallback', () => {
  it('should deliver callback', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'the prophecy', 3, 'Prophecy mentioned', 'literal', 80)
    const cbId = s.callbacks[0].id
    s = deliverCallback(s, cbId, 20, 'Prophecy fulfilled', 90)
    expect(s.callbacks[0].callbackChapter).toBe(20)
    expect(s.callbacks[0].satisfactionScore).toBe(90)
  })
})

describe('resolveThread', () => {
  it('should resolve thread', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'mystery', 2, 'Mystery introduced', 'thematic', 75)
    const threadId = s.threads[0].id
    s = resolveThread(s, threadId)
    expect(s.threads[0].isResolved).toBe(true)
  })
})

describe('generateMemoryReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateMemoryReport(s)
    expect(report.totalThreads).toBe(0)
    expect(report.avgSatisfaction).toBe(0)
  })

  it('should calculate satisfaction', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'thread1', 2, 'Set up', 'literal', 70)
    const cbId = s.callbacks[0].id
    s = deliverCallback(s, cbId, 15, 'Payoff', 85)
    const report = generateMemoryReport(s)
    expect(report.avgSatisfaction).toBe(85)
    expect(report.totalCallbacks).toBe(1)
  })

  it('should count active threads', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'active thread', 2, 'Active', 'thematic', 60)
    const threadId = s.threads[0].id
    s = resolveThread(s, threadId)
    s = plantCallback(s, 'unresolved', 3, 'Unresolved', 'thematic', 50)
    const report = generateMemoryReport(s)
    expect(report.resolvedThreads).toBe(1)
    expect(report.activeThreads).toBe(1)
  })
})

describe('getThreadByName', () => {
  it('should return thread by name', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'The Lost Sword', 1, 'Sword introduced', 'visual', 80)
    const thread = getThreadByName(s, 'the lost sword')
    expect(thread).not.toBeNull()
    expect(thread!.name).toBe('The Lost Sword')
  })
})

describe('getUnresolvedCallbacks', () => {
  it('should return unresolved callbacks', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'cb1', 2, 'Set up', 'literal', 60)
    s = plantCallback(s, 'cb2', 3, 'Set up 2', 'thematic', 50)
    const cbId = s.callbacks[0].id
    s = deliverCallback(s, cbId, 20, 'Delivered', 80)
    const unresolved = getUnresolvedCallbacks(s)
    expect(unresolved.length).toBe(1)
  })
})

describe('compareCallbackSatisfaction', () => {
  it('should compare satisfaction scores', () => {
    let s = createEmptyState()
    s = plantCallback(s, 'cb1', 2, 'Set up', 'literal', 60)
    s = plantCallback(s, 'cb2', 3, 'Set up 2', 'thematic', 50)
    const [id1, id2] = [s.callbacks[0].id, s.callbacks[1].id]
    s = deliverCallback(s, id1, 20, 'Payoff', 85)
    s = deliverCallback(s, id2, 22, 'Payoff 2', 55)
    const result = compareCallbackSatisfaction(s, id1, id2)
    expect(result.moreSatisfying).toBe(id1)
    expect(result.score1).toBe(85)
  })
})
