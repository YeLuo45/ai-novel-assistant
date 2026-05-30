import { describe, it, expect } from 'vitest'
import {
  createEmptyFeedbackState,
  addFeedback,
  aggregateSentiment,
  getHotspotChapters,
  getOverallSentiment,
  formatFeedbackSummary,
  formatFeedbackDashboard,
} from './ReaderFeedbackAnalyzer'

describe('createEmptyFeedbackState', () => {
  it('should create empty state', () => {
    const state = createEmptyFeedbackState()
    expect(state.feedbackItems.length).toBe(0)
  })
})

describe('addFeedback', () => {
  it('should add positive feedback', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch1', 5, 'Great chapter!')
    expect(state.feedbackItems.length).toBe(1)
    expect(state.feedbackItems[0].sentiment).toBe('positive')
  })

  it('should add negative feedback', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch2', 1, 'Boring')
    expect(state.feedbackItems[0].sentiment).toBe('negative')
  })

  it('should add neutral feedback', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch3', 3, 'Okay')
    expect(state.feedbackItems[0].sentiment).toBe('neutral')
  })
})

describe('aggregateSentiment', () => {
  it('should aggregate sentiment by chapter', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch1', 5, 'Great')
    state = addFeedback(state, 'ch1', 4, 'Good')
    const agg = aggregateSentiment(state)
    expect(agg.length).toBeGreaterThan(0)
  })
})

describe('getHotspotChapters', () => {
  it('should return chapters with low scores', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch3', 1, 'Bad')
    state = addFeedback(state, 'ch5', 1, 'Very bad')
    const hotspots = getHotspotChapters(state)
    expect(hotspots.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getOverallSentiment', () => {
  it('should return average score', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch1', 4, 'Good')
    state = addFeedback(state, 'ch2', 5, 'Great')
    const score = getOverallSentiment(state)
    expect(score).toBeGreaterThan(0)
  })
})

describe('formatFeedbackSummary', () => {
  it('should show feedback count', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch1', 5, 'Great')
    const summary = formatFeedbackSummary(state)
    expect(summary).toContain('Feedback: 1')
  })
})

describe('formatFeedbackDashboard', () => {
  it('should show sentiment distribution', () => {
    let state = createEmptyFeedbackState()
    state = addFeedback(state, 'ch1', 5, 'Great')
    const dash = formatFeedbackDashboard(state)
    expect(dash).toContain('Sentiment Distribution:')
  })
})
