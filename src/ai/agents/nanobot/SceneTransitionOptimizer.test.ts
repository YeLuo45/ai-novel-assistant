import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSceneConnection,
  calculateTransitionQuality,
  getRecommendedTransitionType,
  getTransitionSuggestions,
  smoothTemporalGaps,
  getCharacterContinuityScore,
  getTransitionStatistics,
  optimizeTransitionOrder,
} from './SceneTransitionOptimizer'

describe('createEmptyState', () => {
  it('should create empty scene optimizer state', () => {
    const s = createEmptyState()
    expect(s.connections).toEqual([])
    expect(s.avgTransitionQuality).toBe(0)
    expect(s.smoothnessTrend).toBe('stable')
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerSceneConnection', () => {
  it('should register a connection', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 'scene1', 'scene2', 'cut', ['alice', 'bob'], 3600)
    expect(s.connections.length).toBe(1)
    expect(s.connections[0].transitionType).toBe('cut')
  })

  it('should track average quality', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'cut', [], 3600)
    s = registerSceneConnection(s, 's2', 's3', 'match_cut', ['alice'], 30)
    expect(s.avgTransitionQuality).toBeGreaterThan(0)
  })

  it('should record transition type in history', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'dissolve', [], 60)
    expect(s.transitionHistory).toContain('dissolve')
  })
})

describe('calculateTransitionQuality', () => {
  it('should score match_cut high with shared characters', () => {
    const s = createEmptyState()
    const q = calculateTransitionQuality('match_cut', ['alice', 'bob'], 30, s)
    expect(q).toBeGreaterThan(70)
  })

  it('should penalize large temporal jumps', () => {
    const s = createEmptyState()
    const q = calculateTransitionQuality('cut', [], 86400 * 60, s)
    expect(q).toBeLessThan(30)
  })

  it('should penalize flashback/dream', () => {
    const s = createEmptyState()
    const q = calculateTransitionQuality('flashback', [], 0, s)
    expect(q).toBeLessThan(50)
  })
})

describe('getRecommendedTransitionType', () => {
  it('should recommend match_cut for shared characters', () => {
    const s = createEmptyState()
    const rec = getRecommendedTransitionType(s, ['alice', 'bob', 'charlie'], 30)
    expect(rec).toBe('match_cut')
  })

  it('should recommend fade for long temporal jumps', () => {
    const s = createEmptyState()
    const rec = getRecommendedTransitionType(s, [], 86400 * 60)
    expect(rec).toBe('fade')
  })

  it('should recommend cut for immediate transitions', () => {
    const s = createEmptyState()
    const rec = getRecommendedTransitionType(s, [], 30)
    expect(rec).toBe('cut')
  })
})

describe('getTransitionSuggestions', () => {
  it('should return suggestions for declining trend', () => {
    let s = createEmptyState()
    // Need 4+ connections for trend detection; register 6 with worsening quality
    s = registerSceneConnection(s, 's0', 's1', 'match_cut', [], 30)   // q=75
    s = registerSceneConnection(s, 's1', 's2', 'dissolve', [], 30)   // q=60
    s = registerSceneConnection(s, 's2', 's3', 'cut', [], 3600)      // q=45
    s = registerSceneConnection(s, 's3', 's4', 'cut', [], 3600 * 2)  // q=40
    s = registerSceneConnection(s, 's4', 's5', 'flashback', [], 0)   // q=30
    s = registerSceneConnection(s, 's5', 's6', 'dream_sequence', [], 0) // q=20
    const suggestions = getTransitionSuggestions(s)
    expect(suggestions.some(sug => sug.toLowerCase().includes('match') || sug.toLowerCase().includes('quality'))).toBe(true)
  })

  it('should warn about too many hard cuts', () => {
    let s = createEmptyState()
    for (let i = 0; i < 8; i++) {
      s = registerSceneConnection(s, `s${i}`, `s${i + 1}`, 'cut', [], 3600)
    }
    const suggestions = getTransitionSuggestions(s)
    expect(suggestions.some(s => s.toLowerCase().includes('cut'))).toBe(true)
  })
})

describe('smoothTemporalGaps', () => {
  it('should filter by max gap', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'cut', [], 3600)
    s = registerSceneConnection(s, 's2', 's3', 'dissolve', [], 86400 * 60)
    const smoothed = smoothTemporalGaps(s, 7200)
    expect(smoothed.length).toBe(1)
    expect(smoothed[0].temporalJump).toBeLessThanOrEqual(7200)
  })
})

describe('getCharacterContinuityScore', () => {
  it('should return 0 for unknown character', () => {
    const s = createEmptyState()
    expect(getCharacterContinuityScore(s, 'unknown')).toBe(0)
  })

  it('should calculate score for known character', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'cut', ['alice'], 3600)
    s = registerSceneConnection(s, 's2', 's3', 'match_cut', ['alice'], 60)
    const score = getCharacterContinuityScore(s, 'alice')
    expect(score).toBeGreaterThan(0)
  })
})

describe('getTransitionStatistics', () => {
  it('should return comprehensive stats', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'cut', [], 3600)
    s = registerSceneConnection(s, 's2', 's3', 'dissolve', ['alice'], 60)
    const stats = getTransitionStatistics(s)
    expect(stats.totalTransitions).toBe(2)
    expect(stats.avgQuality).toBeGreaterThan(0)
    expect(stats.typeDistribution.cut).toBe(1)
    expect(stats.typeDistribution.dissolve).toBe(1)
  })
})

describe('optimizeTransitionOrder', () => {
  it('should return scene order', () => {
    let s = createEmptyState()
    s = registerSceneConnection(s, 's1', 's2', 'cut', [], 3600)
    s = registerSceneConnection(s, 's2', 's3', 'dissolve', [], 60)
    const order = optimizeTransitionOrder(s)
    expect(order.length).toBeGreaterThan(0)
  })
})
