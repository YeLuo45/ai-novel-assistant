import { describe, it, expect } from 'vitest'
import {
  createEmptyTransitionQualityState,
  evaluateTransition,
  getTransitionScore,
  getTransitionGrade,
  getAverageTransitionQuality,
  formatTransitionSummary,
  formatTransitionDashboard,
} from './SceneTransitionQualityEngine'

describe('createEmptyTransitionQualityState', () => {
  it('should create empty state', () => {
    const state = createEmptyTransitionQualityState()
    expect(state.evaluations.length).toBe(0)
  })
})

describe('evaluateTransition', () => {
  it('should evaluate transition with high flow', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 'scene_1', 'scene_2', 85, 80, 90)
    expect(state.evaluations.length).toBe(1)
    expect(state.averageQuality).toBeGreaterThan(0)
  })

  it('should calculate coherence score', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 'scene_a', 'scene_b', 70, 75, 60)
    expect(state.evaluations[0].coherenceScore).toBeGreaterThan(0)
  })
})

describe('getTransitionScore', () => {
  it('should return score for transition', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 's1', 's2', 80, 85, 90)
    const score = getTransitionScore(state, 's1', 's2')
    expect(score).toBeGreaterThan(0)
  })

  it('should return 0 for unknown transition', () => {
    const state = createEmptyTransitionQualityState()
    const score = getTransitionScore(state, 'unknown', 'unknown')
    expect(score).toBe(0)
  })
})

describe('getTransitionGrade', () => {
  it('should return grade based on score', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 's1', 's2', 85, 90, 95)
    const grade = getTransitionGrade(state, 's1', 's2')
    expect(['A', 'B', 'C', 'D', 'F']).toContain(grade)
  })
})

describe('getAverageTransitionQuality', () => {
  it('should return average quality score', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 's1', 's2', 80, 80, 80)
    state = evaluateTransition(state, 's2', 's3', 60, 60, 60)
    const avg = getAverageTransitionQuality(state)
    expect(avg).toBeGreaterThan(0)
  })
})

describe('formatTransitionSummary', () => {
  it('should show evaluation count', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 's1', 's2', 80, 80, 80)
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Transitions: 1')
  })
})

describe('formatTransitionDashboard', () => {
  it('should show average quality', () => {
    let state = createEmptyTransitionQualityState()
    state = evaluateTransition(state, 's1', 's2', 80, 80, 80)
    const dash = formatTransitionDashboard(state)
    expect(dash).toContain('Avg Quality:')
  })
})
