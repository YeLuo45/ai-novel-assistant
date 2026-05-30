/**
 * SceneTransitionValidator Tests - V155
 * Tests for Scene Continuity & Transition Validation Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyValidatorState,
  createSceneElement,
  registerScene,
  validateTransition,
  validateScenePair,
  validateAllTransitions,
  getTransitionReport,
  formatTransitionValidation,
  formatTransitionDashboard,
} from './SceneTransitionValidator'

describe('createEmptyValidatorState', () => {
  it('should create empty state', () => {
    const state = createEmptyValidatorState()
    expect(state.scenes.size).toBe(0)
    expect(state.transitions.size).toBe(0)
    expect(state.validationHistory.length).toBe(0)
    expect(state.lastValidatedTransition).toBeNull()
  })
})

describe('createSceneElement', () => {
  it('should create scene element', () => {
    const scene = createSceneElement('s1', 'forest', 'night', ['Alice'], 'dark', 500)
    expect(scene.sceneId).toBe('s1')
    expect(scene.location).toBe('forest')
    expect(scene.timeOfDay).toBe('night')
    expect(scene.characters).toContain('Alice')
    expect(scene.mood).toBe('dark')
    expect(scene.duration).toBe(500)
  })

  it('should default duration to 0', () => {
    const scene = createSceneElement('s2', 'office', 'morning', ['Bob'], 'tense')
    expect(scene.duration).toBe(0)
  })
})

describe('registerScene', () => {
  it('should register scene in state', () => {
    let state = createEmptyValidatorState()
    const scene = createSceneElement('s1', 'forest', 'night', ['Alice'], 'dark', 500)
    state = registerScene(state, scene)
    expect(state.scenes.size).toBe(1)
    expect(state.scenes.get('s1')).toBeTruthy()
  })

  it('should set current story id', () => {
    let state = createEmptyValidatorState()
    const scene = createSceneElement('story1_s1', 'forest', 'night', [], 'dark')
    state = registerScene(state, scene)
    expect(state.currentStoryId).toBe('story1')
  })
})

describe('validateTransition', () => {
  it('should validate seamless transition', () => {
    const from = createSceneElement('s1', 'forest', 'night', ['Alice'], 'dark', 200)
    const to = createSceneElement('s2', 'forest', 'night', ['Alice'], 'dark', 300)
    const result = validateTransition(from, to)
    expect(result.quality).toBe('seamless')
    expect(result.continuityScore).toBeGreaterThanOrEqual(85)
  })

  it('should detect location change issues', () => {
    const from = createSceneElement('s1', 'indoor', 'morning', ['Alice'], 'calm', 100)
    const to = createSceneElement('s2', 'outdoor', 'morning', ['Alice'], 'calm', 100)
    const result = validateTransition(from, to)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('should detect time jump issues', () => {
    const from = createSceneElement('s1', 'office', 'morning', ['Bob'], 'busy', 150)
    const to = createSceneElement('s2', 'office', 'midnight', ['Bob'], 'tense', 200)
    const result = validateTransition(from, to)
    expect(result.continuityScore).toBeLessThan(100)
  })

  it('should detect low character continuity', () => {
    const from = createSceneElement('s1', 'city', 'afternoon', ['Alice', 'Bob'], 'tense', 200)
    const to = createSceneElement('s2', 'village', 'evening', ['Charlie', 'Diana'], 'peaceful', 150)
    const result = validateTransition(from, to)
    expect(result.issues.some(i => i.includes('character'))).toBeTruthy()
  })

  it('should calculate continuity score', () => {
    const from = createSceneElement('s1', 'indoor', 'evening', ['Alice'], 'calm', 100)
    const to = createSceneElement('s2', 'indoor', 'night', ['Alice'], 'calm', 150)
    const result = validateTransition(from, to)
    expect(result.continuityScore).toBeGreaterThan(0)
    expect(result.continuityScore).toBeLessThanOrEqual(100)
  })
})

describe('validateScenePair', () => {
  it('should validate and store transition', () => {
    let state = createEmptyValidatorState()
    const s1 = createSceneElement('s1', 'forest', 'night', ['Alice'], 'dark')
    const s2 = createSceneElement('s2', 'forest', 'night', ['Alice'], 'dark')
    state = registerScene(state, s1)
    state = registerScene(state, s2)
    state = validateScenePair(state, 's1', 's2')
    expect(state.transitions.size).toBe(1)
    expect(state.lastValidatedTransition).toBe('s1→s2')
  })

  it('should update validation history', () => {
    let state = createEmptyValidatorState()
    const s1 = createSceneElement('s1', 'forest', 'night', [], 'dark')
    const s2 = createSceneElement('s2', 'forest', 'night', [], 'dark')
    state = registerScene(state, s1)
    state = registerScene(state, s2)
    state = validateScenePair(state, 's1', 's2')
    expect(state.validationHistory.length).toBe(1)
    expect(state.validationHistory[0].from).toBe('s1')
  })

  it('should return unchanged state for missing scenes', () => {
    const state = createEmptyValidatorState()
    const result = validateScenePair(state, 'nonexistent', 'also_nonexistent')
    expect(result).toBe(state)
  })
})

describe('validateAllTransitions', () => {
  it('should validate all scene pairs', () => {
    let state = createEmptyValidatorState()
    const s1 = createSceneElement('s1', 'forest', 'night', ['A'], 'dark')
    s1.transitionTo = 's2'
    const s2 = createSceneElement('s2', 'forest', 'night', ['A'], 'dark')
    s2.transitionTo = 's3'
    const s3 = createSceneElement('s3', 'cave', 'night', ['A'], 'tense')
    state = registerScene(state, s1)
    state = registerScene(state, s2)
    state = registerScene(state, s3)
    state = validateAllTransitions(state)
    expect(state.transitions.size).toBe(2)
  })

  it('should handle empty state', () => {
    const state = createEmptyValidatorState()
    const result = validateAllTransitions(state)
    expect(result.transitions.size).toBe(0)
  })
})

describe('getTransitionReport', () => {
  it('should return zero report for empty state', () => {
    const state = createEmptyValidatorState()
    const report = getTransitionReport(state)
    expect(report.total).toBe(0)
    expect(report.avgScore).toBe(0)
  })

  it('should count transition qualities', () => {
    let state = createEmptyValidatorState()
    const s1 = createSceneElement('s1', 'forest', 'night', ['A'], 'dark')
    const s2 = createSceneElement('s2', 'forest', 'night', ['A'], 'dark')
    state = registerScene(state, s1)
    state = registerScene(state, s2)
    state = validateScenePair(state, 's1', 's2')
    const report = getTransitionReport(state)
    expect(report.total).toBe(1)
  })
})

describe('formatTransitionValidation', () => {
  it('should format validation result', () => {
    const from = createSceneElement('s1', 'forest', 'night', ['Alice'], 'dark')
    const to = createSceneElement('s2', 'forest', 'night', ['Alice'], 'dark')
    const validation = validateTransition(from, to)
    const formatted = formatTransitionValidation(validation)
    expect(formatted).toContain('Transition:')
    expect(formatted).toContain('Quality:')
  })

  it('should include issues if any', () => {
    const from = createSceneElement('s1', 'indoor', 'morning', [], 'calm')
    const to = createSceneElement('s2', 'outdoor', 'morning', [], 'calm')
    const validation = validateTransition(from, to)
    const formatted = formatTransitionValidation(validation)
    expect(formatted).toContain('Issues:')
  })
})

describe('formatTransitionDashboard', () => {
  it('should show scene count', () => {
    const state = createEmptyValidatorState()
    const dashboard = formatTransitionDashboard(state)
    expect(dashboard).toContain('Scenes registered: 0')
  })

  it('should show transition summary', () => {
    let state = createEmptyValidatorState()
    const s1 = createSceneElement('s1', 'forest', 'night', ['A'], 'dark')
    const s2 = createSceneElement('s2', 'forest', 'night', ['A'], 'dark')
    state = registerScene(state, s1)
    state = registerScene(state, s2)
    state = validateScenePair(state, 's1', 's2')
    const dashboard = formatTransitionDashboard(state)
    expect(dashboard).toContain('Transition Quality Summary')
  })
})
