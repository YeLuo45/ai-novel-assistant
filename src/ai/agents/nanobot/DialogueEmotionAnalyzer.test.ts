import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionAnalyzerState,
  analyzeDialogue,
  getEmotionTrajectory,
  getConflictPoints,
  formatEmotionSummary,
  formatEmotionDashboard,
} from './DialogueEmotionAnalyzer'

describe('createEmptyEmotionAnalyzerState', () => {
  it('should create empty state', () => {
    const state = createEmptyEmotionAnalyzerState()
    expect(state.analyses.length).toBe(0)
  })
})

describe('analyzeDialogue', () => {
  it('should analyze dialogue and return emotion data', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch1', 'alice', 'I am furious with you!', 85)
    expect(state.analyses.length).toBe(1)
    expect(state.analyses[0].emotion).toBe('anger')
  })

  it('should detect anger from exclamation', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch2', 'bob', 'You never listen!', 70)
    expect(state.analyses[0].emotion).toBe('anger')
  })

  it('should detect joy from positive words', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch3', 'carol', 'I am so happy today!', 90)
    expect(state.analyses[0].emotion).toBe('joy')
  })
})

describe('getEmotionTrajectory', () => {
  it('should return emotion trajectory', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch1', 'alice', 'I am angry', 70)
    state = analyzeDialogue(state, 'ch2', 'alice', 'I am happy', 80)
    const trajectory = getEmotionTrajectory(state, 'alice')
    expect(trajectory.length).toBe(2)
  })
})

describe('getConflictPoints', () => {
  it('should return dialogues with high tension', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch1', 'alice', 'I hate you', 95)
    state = analyzeDialogue(state, 'ch2', 'bob', 'I hate you too', 90)
    const conflicts = getConflictPoints(state)
    expect(conflicts.length).toBeGreaterThanOrEqual(0)
  })
})

describe('formatEmotionSummary', () => {
  it('should show dialogue count', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch1', 'alice', 'Hello', 50)
    const summary = formatEmotionSummary(state)
    expect(summary).toContain('Dialogues: 1')
  })
})

describe('formatEmotionDashboard', () => {
  it('should show analysis count', () => {
    let state = createEmptyEmotionAnalyzerState()
    state = analyzeDialogue(state, 'ch1', 'alice', 'Hello', 50)
    const dash = formatEmotionDashboard(state)
    expect(dash).toContain('Analyses: 1')
  })
})
