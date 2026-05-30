import { describe, it, expect } from 'vitest'
import {
  createEmptyEndgameState,
  setupForeshadowing,
  resolveForeshadowing,
  calculateMetrics,
  getResolutionScore,
  getForeshadowingRecallRate,
  formatEndgameSummary,
  formatEndgameDashboard,
} from './NarrativeEndgameEngine'

describe('createEmptyEndgameState', () => {
  it('should create empty state', () => {
    const state = createEmptyEndgameState()
    expect(state.resolvedThreads.length).toBe(0)
    expect(state.unresolvedThreads.length).toBe(0)
    expect(state.endingType).toBe('closed')
    expect(state.metrics).toBeNull()
  })
})

describe('setupForeshadowing', () => {
  it('should add unresolved thread', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'The mysterious key will be important')
    expect(state.unresolvedThreads.length).toBe(1)
    expect(state.unresolvedThreads[0].importance).toBe('major')
  })

  it('should allow minor importance', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'Minor detail', 'minor')
    expect(state.unresolvedThreads[0].importance).toBe('minor')
  })

  it('should update current chapter', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 5, 'Setup', 'minor')
    expect(state.currentChapter).toBe(5)
  })
})

describe('resolveForeshadowing', () => {
  it('should add resolved thread and remove from unresolved', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'The mysterious key')
    state = resolveForeshadowing(state, 'The mysterious key', 7, 'She found the key')
    expect(state.resolvedThreads.length).toBe(1)
    expect(state.unresolvedThreads.length).toBe(0)
  })

  it('should calculate quality score', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'The mysterious key was found', 7, 'Finally she found the key in the locked chest')
    expect(state.resolvedThreads[0].qualityScore).toBeGreaterThan(50)
  })

  it('should set payoff chapter', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup', 8, 'Payoff')
    expect(state.resolvedThreads[0].payoffChapter).toBe(8)
  })

  it('should work even without matching unresolved thread', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup description', 8, 'Payoff description')
    expect(state.resolvedThreads.length).toBe(1)
  })
})

describe('calculateMetrics', () => {
  it('should calculate resolution score from quality', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup', 5, 'Payoff with good quality details and finally resolved')
    state = calculateMetrics(state, 'Closed ending')
    expect(state.metrics?.resolutionScore).toBeGreaterThan(0)
  })

  it('should calculate foreshadowing recall rate', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'Thread 1', 'major')
    state = setupForeshadowing(state, 4, 'Thread 2', 'major')
    state = resolveForeshadowing(state, 'Thread 1', 8, 'Payoff 1')
    state = calculateMetrics(state, 'Closed')
    expect(state.metrics?.foreshadowingRecallRate).toBe(50)
  })

  it('should detect triumphant ending', () => {
    let state = createEmptyEndgameState()
    state = calculateMetrics(state, 'They lived happily ever after')
    expect(state.metrics?.endingType).toBe('triumphant')
  })

  it('should detect open ending', () => {
    let state = createEmptyEndgameState()
    state = calculateMetrics(state, 'Some questions remained unanswered')
    expect(state.metrics?.endingType).toBe('open')
  })

  it('should detect tragic ending', () => {
    let state = createEmptyEndgameState()
    state = calculateMetrics(state, 'It ended in tragedy and death')
    expect(state.metrics?.endingType).toBe('tragic')
  })

  it('should set unresolved major threads count', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'Major thread', 'major')
    state = setupForeshadowing(state, 4, 'Minor thread', 'minor')
    state = resolveForeshadowing(state, 'Major thread', 8, 'Payoff')
    state = calculateMetrics(state, 'Open')
    expect(state.metrics?.unresolvedMajorThreads).toBe(0)
  })

  it('should calculate pacing score', () => {
    let state = createEmptyEndgameState()
    state = { ...state, totalChapters: 10, currentChapter: 8 }
    state = calculateMetrics(state, 'Ending')
    expect(state.metrics?.pacingScore).toBe(80)
  })
})

describe('getResolutionScore', () => {
  it('should return 0 when no metrics', () => {
    const state = createEmptyEndgameState()
    expect(getResolutionScore(state)).toBe(0)
  })

  it('should return metrics resolution score', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup', 5, 'Payoff')
    state = calculateMetrics(state, 'Ending')
    expect(getResolutionScore(state)).toBeGreaterThan(0)
  })
})

describe('getForeshadowingRecallRate', () => {
  it('should return 0 when no metrics', () => {
    const state = createEmptyEndgameState()
    expect(getForeshadowingRecallRate(state)).toBe(0)
  })
})

describe('formatEndgameSummary', () => {
  it('should show resolved count', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup', 5, 'Payoff')
    const summary = formatEndgameSummary(state)
    expect(summary).toContain('Resolved: 1')
  })

  it('should show ending type', () => {
    let state = createEmptyEndgameState()
    state = calculateMetrics(state, 'Triumphant ending')
    const summary = formatEndgameSummary(state)
    expect(summary).toContain('triumphant')
  })

  it('should show recall rate', () => {
    let state = createEmptyEndgameState()
    state = setupForeshadowing(state, 3, 'Thread', 'major')
    state = resolveForeshadowing(state, 'Thread', 8, 'Payoff')
    state = calculateMetrics(state, 'Ending')
    const summary = formatEndgameSummary(state)
    expect(summary).toContain('Recall Rate: 100%')
  })
})

describe('formatEndgameDashboard', () => {
  it('should show chapter progress', () => {
    let state = createEmptyEndgameState()
    state = { ...state, currentChapter: 5, totalChapters: 10 }
    state = calculateMetrics(state, 'Ending')
    const dashboard = formatEndgameDashboard(state)
    expect(dashboard).toMatch(/Chapter: \d+\/10/)
  })

  it('should show ending type', () => {
    let state = createEmptyEndgameState()
    state = { ...state, totalChapters: 10 }
    state = calculateMetrics(state, 'Open ending with questions')
    const dashboard = formatEndgameDashboard(state)
    expect(dashboard).toMatch(/open|triumphant|bittersweet|closed|tragic/)
  })

  it('should show resolved threads', () => {
    let state = createEmptyEndgameState()
    state = resolveForeshadowing(state, 'Setup', 5, 'Payoff')
    state = calculateMetrics(state, 'Ending')
    const dashboard = formatEndgameDashboard(state)
    expect(dashboard).toContain('Resolved Threads')
  })
})
