import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  updateMomentumMetrics,
  recordTensionSegment,
  detectPacingDeviation,
  detectClimaxPosition,
  updateBaseline,
  generateMomentumAlert,
  getMomentumSummary,
  predictClimaxReach,
  analyzeTensionCurveShape,
} from './NarrativeMomentumTracker'

describe('createEmptyState', () => {
  it('should create empty state with default metrics', () => {
    const state = createEmptyState()
    expect(state.currentMetrics.energyLevel).toBe(50)
    expect(state.currentMetrics.pacingIndex).toBe(1.0)
    expect(state.currentMetrics.momentumTrend).toBe('stable')
    expect(state.baseline.avgSceneLength).toBe(500)
    expect(state.typeAlias).toEqual({})
  })
})

describe('updateMomentumMetrics', () => {
  it('should update energy and tension', () => {
    let state = createEmptyState()
    state = updateMomentumMetrics(state, 75, 60, 400, 10, 3)
    expect(state.currentMetrics.energyLevel).toBe(75)
    expect(state.currentMetrics.tensionScore).toBe(60)
  })

  it('should calculate pacing index vs baseline', () => {
    let state = createEmptyState()
    state = updateMomentumMetrics(state, 50, 50, 250, 5, 2)  // shorter scene = faster = index > 1
    expect(state.currentMetrics.pacingIndex).toBeGreaterThan(1)
  })

  it('should detect rising trend', () => {
    let state = createEmptyState()
    // Add history
    const history = Array.from({ length: 5 }, (_, i) => ({
      timestamp: Date.now() - (5 - i) * 60000,
      energy: 40 + i * 8,
    }))
    state = { ...state, recentEnergyHistory: history }
    state = updateMomentumMetrics(state, 72, 50, 500, 5, 2)
    expect(state.currentMetrics.momentumTrend).toBe('rising')
  })
})

describe('recordTensionSegment', () => {
  it('should add tension segment to chapter', () => {
    let state = createEmptyState()
    state = recordTensionSegment(state, 'ch1', 0.1, 40, 'setup')
    state = recordTensionSegment(state, 'ch1', 0.3, 55, 'rising')
    const curve = state.tensionCurves.get('ch1')
    expect(curve).not.toBeUndefined()
    expect(curve!.segments.length).toBe(2)
  })

  it('should sort segments by position', () => {
    let state = createEmptyState()
    state = recordTensionSegment(state, 'ch1', 0.5, 70, 'peak')
    state = recordTensionSegment(state, 'ch1', 0.2, 30, 'setup')
    const curve = state.tensionCurves.get('ch1')
    expect(curve!.segments[0].position).toBeLessThan(curve!.segments[1].position)
  })
})

describe('detectPacingDeviation', () => {
  it('should detect normal pacing', () => {
    let state = createEmptyState()
    state = updateBaseline(state, 500, 3000, 0.3, 5)
    const result = detectPacingDeviation(state, 480, 2900, 0.32)
    expect(result.severity).toBe('normal')
  })

  it('should detect critical deviation', () => {
    let state = createEmptyState()
    state = updateBaseline(state, 500, 3000, 0.3, 5)
    const result = detectPacingDeviation(state, 100, 5000, 0.6)
    expect(result.severity).toBe('critical')
  })

  it('should return recommendation', () => {
    let state = createEmptyState()
    const result = detectPacingDeviation(state, 800, 5000, 0.5)
    expect(result.recommendation.length).toBeGreaterThan(0)
  })
})

describe('detectClimaxPosition', () => {
  it('should return false when no curve', () => {
    const state = createEmptyState()
    const result = detectClimaxPosition(state, 'unknown')
    expect(result.detected).toBe(false)
  })

  it('should detect climax from high tension segment', () => {
    let state = createEmptyState()
    state = recordTensionSegment(state, 'ch1', 0.7, 85, 'peak')
    const result = detectClimaxPosition(state, 'ch1')
    expect(result.detected).toBe(true)
    expect(result.position).toBe(0.7)
  })
})

describe('updateBaseline', () => {
  it('should update baseline with new data', () => {
    let state = createEmptyState()
    state = updateBaseline(state, 600, 3500, 0.35, 6)
    expect(state.baseline.avgSceneLength).toBeGreaterThan(500)
  })
})

describe('generateMomentumAlert', () => {
  it('should add alert', () => {
    let state = createEmptyState()
    state = generateMomentumAlert(state, 'energy_collapse', 'ch1')
    expect(state.climaxAlerts.length).toBe(1)
    expect(state.climaxAlerts[0].alertType).toBe('energy_collapse')
  })

  it('should cap alerts at 20', () => {
    let state = createEmptyState()
    for (let i = 0; i < 25; i++) {
      state = generateMomentumAlert(state, 'tension_flatline', `ch${i}`)
    }
    expect(state.climaxAlerts.length).toBe(20)
  })
})

describe('getMomentumSummary', () => {
  it('should return momentum summary', () => {
    let state = createEmptyState()
    state = updateMomentumMetrics(state, 35, 50, 700, 3, 1)
    const summary = getMomentumSummary(state)
    expect(summary.energy).toBe(35)
    expect(summary.trend).toBe('stable')
    expect(summary.recommendation.length).toBeGreaterThan(0)
  })

  it('should warn about low energy falling', () => {
    let state = createEmptyState()
    const history = Array.from({ length: 5 }, (_, i) => ({
      timestamp: Date.now() - (5 - i) * 60000,
      energy: 45 - i * 5,
    }))
    state = { ...state, recentEnergyHistory: history }
    state = updateMomentumMetrics(state, 35, 30, 500, 5, 2)
    const summary = getMomentumSummary(state)
    expect(summary.recommendation).toContain('low')
  })
})

describe('predictClimaxReach', () => {
  it('should predict climax will not be reached with falling trend', () => {
    let state = createEmptyState()
    state = updateMomentumMetrics(state, 50, 40, 500, 5, 2)
    const result = predictClimaxReach(state, 85, 0.5)
    expect(result.willReach).toBe(false)
    expect(result.gapAnalysis.length).toBeGreaterThan(0)
  })

  it('should predict climax will be reached with rising trend', () => {
    let state = createEmptyState()
    const history = Array.from({ length: 5 }, (_, i) => ({
      timestamp: Date.now() - (5 - i) * 60000,
      energy: 50 + i * 5,
    }))
    state = { ...state, recentEnergyHistory: history }
    state = updateMomentumMetrics(state, 75, 70, 400, 8, 4)
    const result = predictClimaxReach(state, 85, 0.3)
    expect(result.willReach).toBe(true)
  })
})

describe('analyzeTensionCurveShape', () => {
  it('should return insufficient data for unknown chapter', () => {
    const state = createEmptyState()
    const result = analyzeTensionCurveShape(state, 'unknown')
    expect(result.shape).toBe('linear')
    expect(result.health).toBe('needs_review')
  })

  it('should detect exponential shape', () => {
    let state = createEmptyState()
    for (const [pos, tension] of [[0.1, 20], [0.3, 25], [0.5, 35], [0.7, 60], [0.9, 85]] as [number, number][]) {
      state = recordTensionSegment(state, 'ch1', pos, tension, 'rising')
    }
    const result = analyzeTensionCurveShape(state, 'ch1')
    expect(result.shape).toBe('exponential')
    expect(result.health).toBe('good')
  })

  it('should detect linear shape', () => {
    let state = createEmptyState()
    for (const [pos, tension] of [[0.1, 45], [0.3, 48], [0.5, 52], [0.7, 56], [0.9, 58]] as [number, number][]) {
      state = recordTensionSegment(state, 'ch2', pos, tension, 'rising')
    }
    const result = analyzeTensionCurveShape(state, 'ch2')
    expect(result.shape).toBe('linear')
    expect(result.health).toBe('good')
  })
})
