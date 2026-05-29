import { describe, it, expect } from 'vitest'
import {
  createEmptyNarrativeIntelligenceState,
  getAllNarrativeScores,
  getOverallNarrativeHealth,
  formatNarrativeSummary,
  formatNarrativeDashboard,
  getWeakestScores,
} from './NarrativeIntelligenceHub'

describe('createEmptyNarrativeIntelligenceState', () => {
  it('should create empty state', () => {
    const state = createEmptyNarrativeIntelligenceState()
    expect(state.arcRefinement.arcs.length).toBe(0)
    expect(state.currentChapter).toBe(0)
    expect(state.lastUpdated).toBeTruthy()
  })

  it('should have empty sub-states', () => {
    const state = createEmptyNarrativeIntelligenceState()
    expect(state.settingWorld.locations.size).toBe(0)
    expect(state.conflictDramatic.conflicts.length).toBe(0)
    expect(state.symbolMotif.symbols.size).toBe(0)
  })
})

describe('getAllNarrativeScores', () => {
  it('should return 10 scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    expect(scores.length).toBe(10)
  })

  it('should return scores with category', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    for (const score of scores) {
      expect(score.category).toBeTruthy()
      expect(score.score).toBeGreaterThanOrEqual(0)
      expect(score.label).toBeTruthy()
    }
  })

  it('should return arc integrity score', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    const arcScore = scores.find(s => s.category === 'arc')
    expect(arcScore).toBeTruthy()
    expect(arcScore?.score).toBe(100)  // empty state has perfect integrity
  })

  it('should return setting consistency score', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    const settingScore = scores.find(s => s.category === 'setting')
    expect(settingScore).toBeTruthy()
    expect(settingScore?.score).toBe(100)
  })
})

describe('getOverallNarrativeHealth', () => {
  it('should return overall health score', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const health = getOverallNarrativeHealth(state)
    expect(health).toBeGreaterThan(0)
    expect(health).toBeLessThanOrEqual(100)
  })

  it('should aggregate scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    const health = getOverallNarrativeHealth(state)
    const avg = scores.reduce((s, sc) => s + sc.score, 0) / scores.length
    expect(health).toBeLessThanOrEqual(Math.round(avg) + 1)
  })
})

describe('getWeakestScores', () => {
  it('should return specified number of weakest scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const weakest = getWeakestScores(state, 3)
    expect(weakest.length).toBe(3)
  })

  it('should return scores sorted by ascending score', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const weakest = getWeakestScores(state, 3)
    for (let i = 1; i < weakest.length; i++) {
      expect(weakest[i].score).toBeGreaterThanOrEqual(weakest[i - 1].score)
    }
  })

  it('should return empty array for zero count', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const weakest = getWeakestScores(state, 0)
    expect(weakest.length).toBe(0)
  })
})

describe('formatNarrativeSummary', () => {
  it('should show chapter', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const summary = formatNarrativeSummary(state)
    expect(summary).toContain('Chapter: 0')
  })

  it('should show overall health', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const summary = formatNarrativeSummary(state)
    expect(summary).toContain('Overall Health:')
  })

  it('should show score breakdown', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const summary = formatNarrativeSummary(state)
    expect(summary).toContain('Score Breakdown')
  })

  it('should include all score labels', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const scores = getAllNarrativeScores(state)
    const summary = formatNarrativeSummary(state)
    for (const score of scores) {
      expect(summary).toContain(score.label)
    }
  })
})

describe('formatNarrativeDashboard', () => {
  it('should show chapter', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const dashboard = formatNarrativeDashboard(state)
    expect(dashboard).toContain('Chapter:')
  })

  it('should show overall health', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const dashboard = formatNarrativeDashboard(state)
    expect(dashboard).toContain('Overall Health:')
  })

  it('should show top scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const dashboard = formatNarrativeDashboard(state)
    expect(dashboard).toContain('Top Scores')
  })

  it('should show bottom scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const dashboard = formatNarrativeDashboard(state)
    expect(dashboard).toContain('Bottom Scores')
  })

  it('should use visual bars for scores', () => {
    const state = createEmptyNarrativeIntelligenceState()
    const dashboard = formatNarrativeDashboard(state)
    expect(dashboard).toContain('█')
  })
})
