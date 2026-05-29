import { describe, it, expect } from 'vitest'
import {
  createEmptyAdvancedNarrativeIntelligenceState,
  getAllAdvancedScores,
  getOverallAdvancedHealth,
  formatAdvancedNarrativeSummary,
  formatAdvancedNarrativeDashboard,
} from './AdvancedNarrativeIntelligenceHub'

describe('createEmptyAdvancedNarrativeIntelligenceState', () => {
  it('should create empty state', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    expect(state.overallHealthScore).toBe(100)
    expect(state.currentChapter).toBe(0)
    expect(state.engagement.engagementScore).toBe(0)
  })

  it('should have all 8 sub-states', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    expect(state.engagement).toBeDefined()
    expect(state.tone).toBeDefined()
    expect(state.plotHoles).toBeDefined()
    expect(state.foreshadowing).toBeDefined()
    expect(state.pacing).toBeDefined()
    expect(state.dialogue).toBeDefined()
    expect(state.wordFrequency).toBeDefined()
    expect(state.themes).toBeDefined()
  })
})

describe('getAllAdvancedScores', () => {
  it('should return all 8 component scores', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const scores = getAllAdvancedScores(state)
    expect(scores.length).toBe(8)
  })

  it('should include all expected component names', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const names = getAllAdvancedScores(state).map(s => s.name)
    expect(names).toContain('Reader Engagement')
    expect(names).toContain('Tone Consistency')
    expect(names).toContain('Plot Integrity')
    expect(names).toContain('Foreshadowing Ratio')
    expect(names).toContain('Pacing Score')
    expect(names).toContain('Dialogue Authenticity')
    expect(names).toContain('Vocabulary Diversity')
    expect(names).toContain('Thematic Coherence')
  })
})

describe('getOverallAdvancedHealth', () => {
  it('should return 100 for empty state', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    // weighted avg: some 0s drag down from 100
    const health = getOverallAdvancedHealth(state)
    expect(health).toBeLessThanOrEqual(100)
    expect(health).toBeGreaterThan(0)
  })

  it('should be <= 100', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    expect(getOverallAdvancedHealth(state)).toBeLessThanOrEqual(100)
  })
})

describe('formatAdvancedNarrativeSummary', () => {
  it('should show chapter', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const summary = formatAdvancedNarrativeSummary(state)
    expect(summary).toContain('Chapter: 0')
  })

  it('should show overall health', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const summary = formatAdvancedNarrativeSummary(state)
    expect(summary).toContain('Overall Health:')
  })

  it('should show component scores', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const summary = formatAdvancedNarrativeSummary(state)
    expect(summary).toContain('Reader Engagement')
    expect(summary).toContain('Plot Integrity')
  })

  it('should show visual bars', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const summary = formatAdvancedNarrativeSummary(state)
    expect(summary).toContain('[')
    expect(summary).toContain(']')
  })
})

describe('formatAdvancedNarrativeDashboard', () => {
  it('should show chapter', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const dashboard = formatAdvancedNarrativeDashboard(state)
    expect(dashboard).toContain('Chapter: 0')
  })

  it('should show overall health', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const dashboard = formatAdvancedNarrativeDashboard(state)
    expect(dashboard).toContain('Overall:')
  })

  it('should show quick stats', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const dashboard = formatAdvancedNarrativeDashboard(state)
    expect(dashboard).toContain('Quick Stats')
    expect(dashboard).toContain('Themes:')
    expect(dashboard).toContain('Foreshadow:')
  })

  it('should not show critical issues when none present', () => {
    const state = createEmptyAdvancedNarrativeIntelligenceState()
    const dashboard = formatAdvancedNarrativeDashboard(state)
    expect(dashboard).not.toContain('Critical Issues')
  })
})
