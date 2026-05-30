import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionWheelState,
  addEmotionPoint,
  getEmotionsByChapter,
  getDominantEmotion,
  getEmotionFrequency,
  formatEmotionWheelSummary,
  formatEmotionWheelDashboard,
} from './SceneTransitionMomentum'

describe('createEmptyEmotionWheelState', () => {
  it('should create empty state', () => {
    const state = createEmptyEmotionWheelState()
    expect(state.emotionPoints.length).toBe(0)
    expect(state.dominantEmotion).toBeNull()
  })
})

describe('addEmotionPoint', () => {
  it('should add first emotion point', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 80)
    expect(state.emotionPoints.length).toBe(1)
    expect(state.emotionPoints[0].primary).toBe('joy')
  })

  it('should update histogram', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 80)
    state = addEmotionPoint(state, 2, 'joy', 60)
    expect(getEmotionFrequency(state, 'joy')).toBe(2)
  })

  it('should track emotional range', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 80)
    state = addEmotionPoint(state, 2, 'sadness', 20)
    expect(state.emotionalRange).toBe(60)
  })
})

describe('getEmotionsByChapter', () => {
  it('should filter by chapter', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 3, 'joy', 80)
    state = addEmotionPoint(state, 5, 'anger', 80)
    const ch3 = getEmotionsByChapter(state, 3)
    expect(ch3.length).toBe(1)
  })
})

describe('getDominantEmotion', () => {
  it('should return null for empty state', () => {
    const state = createEmptyEmotionWheelState()
    expect(getDominantEmotion(state)).toBeNull()
  })

  it('should return highest intensity emotion', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 60)
    state = addEmotionPoint(state, 2, 'anger', 90)
    expect(getDominantEmotion(state)).toBe('anger')
  })
})

describe('getEmotionFrequency', () => {
  it('should return 0 for unknown emotion', () => {
    const state = createEmptyEmotionWheelState()
    expect(getEmotionFrequency(state, 'joy')).toBe(0)
  })
})

describe('formatEmotionWheelSummary', () => {
  it('should show point count', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 80)
    const summary = formatEmotionWheelSummary(state)
    expect(summary).toContain('Emotion Points: 1')
  })

  it('should show dominant emotion', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'fear', 80)
    const summary = formatEmotionWheelSummary(state)
    expect(summary).toContain('fear')
  })
})

describe('formatEmotionWheelDashboard', () => {
  it('should show points count', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'joy', 80)
    const dash = formatEmotionWheelDashboard(state)
    expect(dash).toContain('Points: 1')
  })

  it('should show dominant', () => {
    let state = createEmptyEmotionWheelState()
    state = addEmotionPoint(state, 1, 'anticipation', 80)
    const dash = formatEmotionWheelDashboard(state)
    expect(dash).toContain('anticipation')
  })
})
