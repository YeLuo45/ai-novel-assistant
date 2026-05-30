import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordEngagement,
  calculateEngagementScore,
  detectAnomalies,
  assessDropoutRisk,
  getEngagementTrend,
  predictLikelihoodToFinish,
  getRecommendedInterventions,
  compareReaders,
  getSessionSummary,
} from './ReaderEngagementAnalyzer'

describe('createEmptyState', () => {
  it('should create empty engagement state', () => {
    const s = createEmptyState()
    expect(s.readerId).toBeTruthy()
    expect(s.points).toEqual([])
    expect(s.engagementScore).toBe(0)
    expect(s.dropoutRisk).toBe('low')
    expect(s.typeAlias).toEqual({})
  })

  it('should accept custom reader id', () => {
    const s = createEmptyState('reader_abc')
    expect(s.readerId).toBe('reader_abc')
  })
})

describe('recordEngagement', () => {
  it('should add engagement point', () => {
    let s = createEmptyState()
    s = recordEngagement(s, 75, 30, 5, 50)
    expect(s.points.length).toBe(1)
    expect(s.avgScrollDepth).toBe(75)
  })

  it('should calculate running averages', () => {
    let s = createEmptyState()
    s = recordEngagement(s, 60, 20, 3, 40)
    s = recordEngagement(s, 80, 40, 6, 60)
    expect(s.avgScrollDepth).toBe(70)
    expect(s.avgReadingTime).toBe(30)
  })
})

describe('calculateEngagementScore', () => {
  it('should return 0 for empty points', () => {
    expect(calculateEngagementScore([])).toBe(0)
  })

  it('should calculate score based on scroll, time, interaction', () => {
    const points = [
      { timestamp: Date.now(), scrollDepth: 80, readingTime: 45, interactionCount: 5, emotionalResponse: 60 },
      { timestamp: Date.now(), scrollDepth: 75, readingTime: 40, interactionCount: 4, emotionalResponse: 55 },
    ]
    const score = calculateEngagementScore(points)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('detectAnomalies', () => {
  it('should return existing alerts for insufficient data', () => {
    const points = [
      { timestamp: Date.now(), scrollDepth: 60, readingTime: 20, interactionCount: 3, emotionalResponse: 40 },
      { timestamp: Date.now(), scrollDepth: 55, readingTime: 18, interactionCount: 2, emotionalResponse: 35 },
    ]
    const alerts = detectAnomalies([], points)
    expect(alerts.length).toBe(0)
  })

  it('should detect sudden drop in scroll depth', () => {
    const now = Date.now()
    const points = [
      { timestamp: now - 10000, scrollDepth: 80, readingTime: 30, interactionCount: 4, emotionalResponse: 50 },
      { timestamp: now - 8000, scrollDepth: 78, readingTime: 28, interactionCount: 4, emotionalResponse: 48 },
      { timestamp: now - 6000, scrollDepth: 75, readingTime: 25, interactionCount: 3, emotionalResponse: 45 },
      { timestamp: now - 4000, scrollDepth: 70, readingTime: 22, interactionCount: 3, emotionalResponse: 40 },
      { timestamp: now - 2000, scrollDepth: 20, readingTime: 5, interactionCount: 0, emotionalResponse: 10 },
    ]
    const alerts = detectAnomalies([], points)
    expect(alerts.some(a => a.type === 'sudden_drop')).toBe(true)
  })

  it('should detect gradual decline', () => {
    const now = Date.now()
    const points = Array.from({ length: 10 }, (_, i) => ({
      timestamp: now - (10 - i) * 3000,
      scrollDepth: 85 - i * 8,
      readingTime: 40 - i * 3,
      interactionCount: 5,
      emotionalResponse: 60 - i * 5,
    }))
    const alerts = detectAnomalies([], points)
    expect(alerts.some(a => a.type === 'gradual_decline')).toBe(true)
  })
})

describe('assessDropoutRisk', () => {
  it('should return low for insufficient data', () => {
    const s = createEmptyState()
    expect(assessDropoutRisk(s.points)).toBe('low')
  })

  it('should assess high risk for low engagement', () => {
    const points = [
      { timestamp: Date.now(), scrollDepth: 10, readingTime: 3, interactionCount: 0, emotionalResponse: -20 },
      { timestamp: Date.now(), scrollDepth: 12, readingTime: 2, interactionCount: 0, emotionalResponse: -15 },
      { timestamp: Date.now(), scrollDepth: 8, readingTime: 1, interactionCount: 0, emotionalResponse: -25 },
    ]
    expect(assessDropoutRisk(points)).toBe('high')
  })

  it('should assess medium risk', () => {
    const points = [
      { timestamp: Date.now(), scrollDepth: 35, readingTime: 12, interactionCount: 2, emotionalResponse: 30 },
      { timestamp: Date.now(), scrollDepth: 30, readingTime: 10, interactionCount: 1, emotionalResponse: 25 },
      { timestamp: Date.now(), scrollDepth: 32, readingTime: 11, interactionCount: 1, emotionalResponse: 28 },
    ]
    expect(assessDropoutRisk(points)).toBe('medium')
  })
})

describe('getEngagementTrend', () => {
  it('should return stable for insufficient data', () => {
    const s = createEmptyState()
    expect(getEngagementTrend(s)).toBe('stable')
  })

  it('should detect improving trend', () => {
    let s = createEmptyState()
    for (let i = 0; i < 8; i++) {
      s = recordEngagement(s, 40 + i * 5, 15 + i, 3 + Math.floor(i / 2), 30 + i * 5)
    }
    expect(getEngagementTrend(s)).toBe('improving')
  })

  it('should detect declining trend', () => {
    let s = createEmptyState()
    for (let i = 0; i < 8; i++) {
      s = recordEngagement(s, 80 - i * 6, 40 - i * 3, 4, 55 - i * 5)
    }
    expect(getEngagementTrend(s)).toBe('declining')
  })
})

describe('predictLikelihoodToFinish', () => {
  it('should return 0 for empty state', () => {
    const s = createEmptyState()
    expect(predictLikelihoodToFinish(s)).toBe(0)
  })

  it('should predict based on depth and time', () => {
    let s = createEmptyState()
    s = recordEngagement(s, 70, 35, 5, 50)
    const likelihood = predictLikelihoodToFinish(s)
    expect(likelihood).toBeGreaterThan(0)
  })
})

describe('getRecommendedInterventions', () => {
  it('should return empty for healthy engagement', () => {
    const s = createEmptyState()
    const recs = getRecommendedInterventions(s)
    expect(Array.isArray(recs)).toBe(true)
  })

  it('should recommend for high dropout risk', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordEngagement(s, 15, 5, 0, -10)
    }
    const recs = getRecommendedInterventions(s)
    expect(recs.some(r => r.includes('interactive'))).toBe(true)
  })
})

describe('compareReaders', () => {
  it('should identify more engaged reader', () => {
    let s1 = createEmptyState('r1')
    let s2 = createEmptyState('r2')
    s1 = recordEngagement(s1, 80, 45, 6, 60)
    s2 = recordEngagement(s2, 40, 15, 2, 20)
    const result = compareReaders(s1, s2)
    expect(result.moreEngaged).toBe('r1')
    expect(result.engagementDiff).toBeGreaterThan(0)
  })
})

describe('getSessionSummary', () => {
  it('should return comprehensive summary', () => {
    let s = createEmptyState()
    s = recordEngagement(s, 65, 25, 4, 45)
    const summary = getSessionSummary(s)
    expect(summary.readerId).toBeTruthy()
    expect(summary.engagementScore).toBeGreaterThan(0)
    expect(summary.totalPoints).toBe(1)
  })
})
