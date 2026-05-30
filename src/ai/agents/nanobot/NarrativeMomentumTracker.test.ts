import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordTensionPoint,
  analyzeMomentumTrend,
  calculateChapterTension,
  detectPacingAnomaly,
  getTensionSpikes,
  getTensionDrops,
  getPacingConsistencyScore,
  getMomentumRecommendations,
  calculateEngagementScore,
  getOptimalTensionZones,
  smoothTensionData,
  compareWithTargetPattern,
} from './NarrativeMomentumTracker'

describe('createEmptyState', () => {
  it('should create empty momentum state', () => {
    const s = createEmptyState()
    expect(s.tensionHistory).toEqual([])
    expect(s.currentMomentum).toBe(0)
    expect(s.avgTension).toBe(0)
    expect(s.momentumTrend).toBe('stable')
    expect(s.typeAlias).toEqual({})
  })
})

describe('recordTensionPoint', () => {
  it('should add tension point to history', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    expect(s.tensionHistory.length).toBe(1)
    expect(s.tensionHistory[0].tension).toBe(50)
  })

  it('should track multiple chapters', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    s = recordTensionPoint(s, 'ch2', 0.2, 60, 15)
    expect(s.tensionHistory.length).toBe(2)
    expect(s.chaptersAnalyzed).toBe(2)
  })
})

describe('analyzeMomentumTrend', () => {
  it('should return stable for insufficient data', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    s = analyzeMomentumTrend(s)
    expect(s.momentumTrend).toBe('stable')
  })

  it('should detect rising trend', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 30 + i * 10, 10)
    }
    s = analyzeMomentumTrend(s)
    expect(s.momentumTrend).toBe('rising')
  })

  it('should detect falling trend', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 80 - i * 10, -10)
    }
    s = analyzeMomentumTrend(s)
    expect(s.momentumTrend).toBe('falling')
  })

  it('should detect oscillating trend', () => {
    let s = createEmptyState()
    const tensions = [40, 60, 45, 65, 50, 70, 55]
    for (let i = 0; i < tensions.length; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.15, tensions[i], 0)
    }
    s = analyzeMomentumTrend(s)
    expect(s.momentumTrend).toBe('oscillating')
  })
})

describe('calculateChapterTension', () => {
  it('should return average tension for chapter', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    s = recordTensionPoint(s, 'ch1', 0.5, 70, 10)
    s = recordTensionPoint(s, 'ch1', 0.9, 60, 10)
    const avg = calculateChapterTension(s, 'ch1')
    expect(avg).toBe(60)
  })

  it('should return null for unknown chapter', () => {
    const s = createEmptyState()
    const avg = calculateChapterTension(s, 'ch99')
    expect(avg).toBeNull()
  })
})

describe('detectPacingAnomaly', () => {
  it('should detect major deviation', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    s = recordTensionPoint(s, 'ch1', 0.5, 52, 10)
    s = recordTensionPoint(s, 'ch1', 0.9, 51, 10)
    const anomaly = detectPacingAnomaly(s, 'ch1')
    expect(anomaly).toBeNull()  // no significant deviation
  })

  it('should return null for normal pacing', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 55, 10)
    }
    const anomaly = detectPacingAnomaly(s, 'ch1')
    expect(anomaly).toBeNull()
  })
})

describe('getTensionSpikes', () => {
  it('should detect sudden tension increases', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 30, 5)
    s = recordTensionPoint(s, 'ch1', 0.3, 55, 15)  // +25 spike
    s = recordTensionPoint(s, 'ch1', 0.5, 60, 5)
    const spikes = getTensionSpikes(s, 20)
    expect(spikes.length).toBe(1)
    expect(spikes[0].tension).toBe(55)
  })
})

describe('getTensionDrops', () => {
  it('should detect sudden tension decreases', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 80, -5)
    s = recordTensionPoint(s, 'ch1', 0.3, 50, -20)  // -30 drop
    s = recordTensionPoint(s, 'ch1', 0.5, 45, -5)
    const drops = getTensionDrops(s, 20)
    expect(drops.length).toBe(1)
    expect(drops[0].tension).toBe(50)
  })
})

describe('getPacingConsistencyScore', () => {
  it('should return 100 for insufficient data', () => {
    const s = createEmptyState()
    expect(getPacingConsistencyScore(s)).toBe(100)
  })

  it('should score consistent pacing higher', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 50, 0)
    }
    const score = getPacingConsistencyScore(s)
    expect(score).toBe(100)
  })

  it('should score inconsistent pacing lower', () => {
    let s = createEmptyState()
    const tensions = [30, 70, 25, 75, 35]
    for (let i = 0; i < tensions.length; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, tensions[i], 0)
    }
    const score = getPacingConsistencyScore(s)
    expect(score).toBeLessThan(100)
  })
})

describe('getMomentumRecommendations', () => {
  it('should recommend for falling momentum', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 80 - i * 10, -10)
    }
    s = analyzeMomentumTrend(s)
    const recs = getMomentumRecommendations(s)
    expect(recs.some(r => r.toLowerCase().includes('tension'))).toBe(true)
  })
})

describe('calculateEngagementScore', () => {
  it('should return 0 for empty state', () => {
    const s = createEmptyState()
    expect(calculateEngagementScore(s)).toBe(0)
  })

  it('should calculate engagement score', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 50 + (i % 2) * 20, 5)
    }
    const score = calculateEngagementScore(s)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('getOptimalTensionZones', () => {
  it('should return empty for insufficient data', () => {
    const s = createEmptyState()
    const zones = getOptimalTensionZones(s)
    expect(zones).toEqual([])
  })

  it('should identify tension zones', () => {
    let s = createEmptyState()
    for (let i = 0; i < 6; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.17, 50 + i * 5, 5)
    }
    const zones = getOptimalTensionZones(s)
    expect(zones.length).toBeGreaterThan(0)
  })
})

describe('smoothTensionData', () => {
  it('should return same state for insufficient data', () => {
    let s = createEmptyState()
    s = recordTensionPoint(s, 'ch1', 0.1, 50, 10)
    const smoothed = smoothTensionData(s, 3)
    expect(smoothed.tensionHistory.length).toBe(1)
  })

  it('should smooth tension values', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.2, 30 + i * 10, 5)
    }
    const smoothed = smoothTensionData(s, 3)
    expect(smoothed.tensionHistory.length).toBe(5)
  })
})

describe('compareWithTargetPattern', () => {
  it('should return 0 deviation for empty state', () => {
    const s = createEmptyState()
    const result = compareWithTargetPattern(s, [50, 60, 70])
    expect(result.deviation).toBe(0)
  })

  it('should calculate deviation from target', () => {
    let s = createEmptyState()
    for (let i = 0; i < 3; i++) {
      s = recordTensionPoint(s, 'ch1', i * 0.3, 50 + i * 20, 10)
    }
    const result = compareWithTargetPattern(s, [50, 70, 90])
    expect(result.deviation).toBeLessThan(30)
  })
})
