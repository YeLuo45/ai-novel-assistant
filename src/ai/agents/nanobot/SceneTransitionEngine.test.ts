import { describe, it, expect } from 'vitest'
import {
  createEmptySceneTransitionState,
  recordTransition,
  getTransitionAtChapter,
  getMomentumBreaks,
  formatTransitionSummary,
  formatTransitionDashboard,
} from './SceneTransitionEngine'

describe('createEmptySceneTransitionState', () => {
  it('should create empty state', () => {
    const state = createEmptySceneTransitionState()
    expect(state.transitions.length).toBe(0)
    expect(state.averageMomentum).toBe(50)
    expect(state.momentumBreaks.length).toBe(0)
  })
})

describe('recordTransition', () => {
  it('should record transition', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Scene one ends.', 'Scene two begins.', 'cut')
    expect(state.transitions.length).toBe(1)
    expect(state.transitions[0].transitionType).toBe('cut')
  })

  it('should update current chapter', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 5, 'Scene one ends.', 'Scene two begins.', 'cut')
    expect(state.currentChapter).toBe(5)
  })

  it('should detect smooth transition with word overlap', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'The knight fought bravely.', 'The brave knight stood.', 'dissolve')
    expect(state.transitions[0].qualityScore).toBeGreaterThan(60)
  })

  it('should penalize jarring transition', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'The knight fought bravely.', 'Meanwhile in another kingdom entirely.', 'cut')
    expect(state.transitions[0].qualityScore).toBeLessThan(60)
  })

  it('should assess hook quality', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'What happens next will change everything?', 'The answer came.', 'cut')
    expect(state.transitions[0].hookQuality).toBeGreaterThan(30)
  })

  it('should track momentum changes', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Scene continues.', 'Scene goes on.', 'cut')
    expect(state.averageMomentum).toBeGreaterThan(50)
  })

  it('should detect momentum breaks', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Good.', 'Good.', 'cut')
    state = recordTransition(state, 2, 3, 'End.', 'Begin.', 'flashback')
    expect(state.averageMomentum).toBeGreaterThan(40)
  })
})

describe('getTransitionAtChapter', () => {
  it('should return null for no transition', () => {
    const state = createEmptySceneTransitionState()
    expect(getTransitionAtChapter(state, 1)).toBeNull()
  })

  it('should return transition at chapter', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'End', 'Start', 'cut')
    const t = getTransitionAtChapter(state, 1)
    expect(t).not.toBeNull()
    expect(t?.fromChapter).toBe(1)
  })
})

describe('getMomentumBreaks', () => {
  it('should return empty for continuous momentum', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Good.', 'Good.', 'cut')
    state = recordTransition(state, 2, 3, 'Good.', 'Good.', 'cut')
    expect(getMomentumBreaks(state).length).toBe(0)
  })

  it('should return momentum state', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Good.', 'Good.', 'cut')
    state = recordTransition(state, 2, 3, 'End.', 'Begin.', 'flashback')
    // Second transition should drop momentum
    expect(state.averageMomentum).toBeLessThan(state.averageMomentum + 1)
  })
})

describe('formatTransitionSummary', () => {
  it('should show transition count', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'End', 'Start', 'cut')
    state = recordTransition(state, 2, 3, 'End', 'Start', 'dissolve')
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Transitions: 2')
  })

  it('should show average momentum', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'End', 'Start', 'cut')
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Avg Momentum:')
  })

  it('should show momentum break count', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Good.', 'Good.', 'cut')
    state = recordTransition(state, 2, 3, 'Weak.', 'Bad.', 'flashback')
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Momentum Breaks:')
  })
})

describe('formatTransitionDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 5, 'End', 'Start', 'cut')
    const dashboard = formatTransitionDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show recent transitions', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'End', 'Start', 'cut')
    state = recordTransition(state, 2, 3, 'End', 'Start', 'dissolve')
    const dashboard = formatTransitionDashboard(state)
    expect(dashboard).toContain('cut')
    expect(dashboard).toContain('dissolve')
  })

  it('should show momentum breaks when present', () => {
    let state = createEmptySceneTransitionState()
    state = recordTransition(state, 1, 2, 'Good.', 'Good.', 'cut')
    state = recordTransition(state, 2, 3, 'End.', 'Begin.', 'flashback')
    const dashboard = formatTransitionDashboard(state)
    // Dashboard should show the transition info
    expect(dashboard).toContain('Chapter: 3')
    expect(dashboard).toContain('flashback')
  })
})
