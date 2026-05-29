import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionArcState,
  addEmotionArcPoint,
  getEmotionArcPhase,
  getEmotionAtChapter,
  getArcRange,
  getArcVolatility,
  formatEmotionArcSummary,
  formatEmotionArcDashboard,
} from './NarrativeEmotionArcMapperEngine'

describe('createEmptyEmotionArcState', () => {
  it('should create empty state', () => {
    const state = createEmptyEmotionArcState()
    expect(state.arcPoints.length).toBe(0)
    expect(state.currentArc).toBe('stable')
  })
})

describe('addEmotionArcPoint', () => {
  it('should add emotion arc point', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 60)
    expect(state.arcPoints.length).toBe(1)
    expect(state.arcPoints[0].chapter).toBe(1)
  })

  it('should detect positive polarity', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 70)
    expect(state.arcPoints[0].polarity).toBe(1)
  })

  it('should detect negative polarity', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'anger', 70)
    expect(state.arcPoints[0].polarity).toBe(-1)
  })

  it('should track peak chapter', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 50)
    state = addEmotionArcPoint(state, 2, 'joy', 80)
    expect(state.peakChapter).toBe(2)
  })

  it('should track low chapter', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 70)
    state = addEmotionArcPoint(state, 2, 'sadness', 30)
    expect(state.lowChapter).toBe(2)
  })
})

describe('addEmotionArcPoint trajectory detection', () => {
  it('should detect ascending trajectory', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'sadness', 40)
    state = addEmotionArcPoint(state, 2, 'anticipation', 60)
    state = addEmotionArcPoint(state, 3, 'joy', 80)
    expect(state.currentArc).toBe('ascending')
  })

  it('should detect descending trajectory', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 80)
    state = addEmotionArcPoint(state, 2, 'sadness', 50)
    state = addEmotionArcPoint(state, 3, 'anger', 20)
    expect(state.currentArc).toBe('descending')
  })

  it('should detect stable trajectory', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'trust', 50)
    state = addEmotionArcPoint(state, 2, 'trust', 52)
    state = addEmotionArcPoint(state, 3, 'trust', 51)
    expect(state.currentArc).toBe('stable')
  })
})

describe('getEmotionArcPhase', () => {
  it('should return null for insufficient points', () => {
    const state = createEmptyEmotionArcState()
    expect(getEmotionArcPhase(state, 1)).toBeNull()
  })

  it('should return introduction for early chapter', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 50)
    state = addEmotionArcPoint(state, 2, 'anticipation', 60)
    const phase = getEmotionArcPhase(state, 1)
    expect(phase).toBe('introduction')
  })
})

describe('getEmotionAtChapter', () => {
  it('should return point at chapter', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 5, 'joy', 70)
    const point = getEmotionAtChapter(state, 5)
    expect(point).not.toBeNull()
    expect(point?.chapter).toBe(5)
  })

  it('should return null for missing chapter', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 70)
    const point = getEmotionAtChapter(state, 99)
    expect(point).toBeNull()
  })
})

describe('getArcRange', () => {
  it('should return 0 for insufficient points', () => {
    const state = createEmptyEmotionArcState()
    expect(getArcRange(state)).toBe(0)
  })

  it('should return chapter range', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 2, 'joy', 60)
    state = addEmotionArcPoint(state, 7, 'joy', 80)
    expect(getArcRange(state)).toBe(5)
  })
})

describe('getArcVolatility', () => {
  it('should return 0 for insufficient points', () => {
    const state = createEmptyEmotionArcState()
    expect(getArcVolatility(state)).toBe(0)
  })

  it('should calculate volatility', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 50)
    state = addEmotionArcPoint(state, 2, 'sadness', 80)
    state = addEmotionArcPoint(state, 3, 'joy', 50)
    const vol = getArcVolatility(state)
    expect(vol).toBeGreaterThan(0)
  })
})

describe('formatEmotionArcSummary', () => {
  it('should show arc summary', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 60)
    const summary = formatEmotionArcSummary(state)
    expect(summary).toContain('Arc Points: 1')
  })
})

describe('formatEmotionArcDashboard', () => {
  it('should show arc dashboard', () => {
    let state = createEmptyEmotionArcState()
    state = addEmotionArcPoint(state, 1, 'joy', 60)
    const dash = formatEmotionArcDashboard(state)
    expect(dash).toContain('Total Points: 1')
  })
})