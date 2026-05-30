/**
 * NarrativeQualityController Tests - V163
 * Tests for Narrative Quality Closed-Loop Controller
 */

import { describe, it, expect } from 'vitest'
import {
  createController,
  DEFAULT_CONFIG,
  assessQuality,
  calculateOverallScore,
  evaluateGate,
  updateControllerState,
  registerSubsystemScore,
  addOptimization,
  completeOptimization,
  formatGateResult,
  formatControllerDashboard,
} from './NarrativeQualityController'

describe('createController', () => {
  it('should create controller with default config', () => {
    const ctrl = createController()
    expect(ctrl.controllerId).toBeTruthy()
    expect(ctrl.currentGate).toBe('alpha')
    expect(ctrl.state).toBe('monitoring')
    expect(ctrl.config.alphaThreshold).toBe(50)
  })

  it('should accept custom config', () => {
    const ctrl = createController({ alphaThreshold: 60, autoOptimize: false })
    expect(ctrl.config.alphaThreshold).toBe(60)
    expect(ctrl.config.autoOptimize).toBe(false)
  })
})

describe('assessQuality', () => {
  it('should assess all dimensions', () => {
    const scores: Record<string, number> = {
      coherence: 75, engagement: 70, clarity: 72, consistency: 68, emotional_impact: 65, pacing: 70
    }
    const result = assessQuality(scores as any, DEFAULT_CONFIG)
    expect(result.length).toBe(6)
    expect(result.find(s => s.dimension === 'coherence')?.score).toBe(75)
  })

  it('should mark failing dimensions', () => {
    const scores: Record<string, number> = {
      coherence: 30, engagement: 25, clarity: 35, consistency: 40, emotional_impact: 20, pacing: 30
    }
    const result = assessQuality(scores as any, DEFAULT_CONFIG)
    const failCount = result.filter(s => s.status === 'fail').length
    expect(failCount).toBeGreaterThan(0)
  })
})

describe('calculateOverallScore', () => {
  it('should calculate weighted overall score', () => {
    const scores = [
      { dimension: 'coherence' as const, score: 80, delta: 0, threshold: 55, status: 'pass' as const },
      { dimension: 'engagement' as const, score: 70, delta: 0, threshold: 50, status: 'pass' as const },
      { dimension: 'clarity' as const, score: 75, delta: 0, threshold: 55, status: 'pass' as const },
      { dimension: 'consistency' as const, score: 72, delta: 0, threshold: 55, status: 'pass' as const },
      { dimension: 'emotional_impact' as const, score: 65, delta: 0, threshold: 45, status: 'pass' as const },
      { dimension: 'pacing' as const, score: 68, delta: 0, threshold: 50, status: 'pass' as const },
    ]
    const overall = calculateOverallScore(scores)
    expect(overall).toBeGreaterThan(70)
    expect(overall).toBeLessThan(80)
  })
})

describe('evaluateGate', () => {
  it('should pass when above threshold', () => {
    const ctrl = createController()
    const dimensionScores: Record<string, number> = {
      coherence: 75, engagement: 70, clarity: 72, consistency: 68, emotional_impact: 65, pacing: 70
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    expect(result.gate).toBe('alpha')
    expect(result.overallScore).toBeGreaterThan(50)
  })

  it('should fail when below threshold', () => {
    const ctrl = createController()
    const dimensionScores: Record<string, number> = {
      coherence: 30, engagement: 25, clarity: 35, consistency: 30, emotional_impact: 20, pacing: 25
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    expect(result.passed).toBe(false)
    expect(result.blockingIssues.length).toBeGreaterThan(0)
  })

  it('should generate recommendations for failed dimensions', () => {
    const ctrl = createController()
    const dimensionScores: Record<string, number> = {
      coherence: 45, engagement: 40, clarity: 50, consistency: 55, emotional_impact: 35, pacing: 40
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })
})

describe('updateControllerState', () => {
  it('should escalate on failure', () => {
    const ctrl = createController()
    const result = evaluateGate(ctrl, { coherence: 30, engagement: 25, clarity: 35, consistency: 30, emotional_impact: 20, pacing: 25 } as any)
    const updated = updateControllerState(ctrl, result)
    expect(updated.state).toBe('escalating')
    expect(updated.escalationLevel).toBeGreaterThan(0)
  })

  it('should stabilize when consistently passing', () => {
    const ctrl = createController()
    const dimensionScores: Record<string, number> = {
      coherence: 90, engagement: 85, clarity: 88, consistency: 87, emotional_impact: 82, pacing: 80
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    const updated = updateControllerState(ctrl, result)
    expect(updated.state).toBe('stable')
  })

  it('should advance gate on strong pass', () => {
    const ctrl = createController({ alphaThreshold: 40, betaThreshold: 60 })
    const dimensionScores: Record<string, number> = {
      coherence: 80, engagement: 75, clarity: 78, consistency: 76, emotional_impact: 70, pacing: 72
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    const updated = updateControllerState(ctrl, result)
    expect(updated.currentGate).toBe('beta')
  })

  it('should not advance gate on marginal pass', () => {
    const ctrl = createController()
    const dimensionScores: Record<string, number> = {
      coherence: 55, engagement: 50, clarity: 52, consistency: 51, emotional_impact: 45, pacing: 48
    }
    const result = evaluateGate(ctrl, dimensionScores as any)
    const updated = updateControllerState(ctrl, result)
    expect(updated.currentGate).toBe('alpha')
  })
})

describe('registerSubsystemScore', () => {
  it('should register subsystem score', () => {
    let ctrl = createController()
    ctrl = registerSubsystemScore(ctrl, 'AutonomousGoalDecomposer', 85)
    expect(ctrl.subsystemScores.get('AutonomousGoalDecomposer')).toBe(85)
  })

  it('should update existing subsystem score', () => {
    let ctrl = createController()
    ctrl = registerSubsystemScore(ctrl, 'AutonomousPlanOptimizer', 80)
    ctrl = registerSubsystemScore(ctrl, 'AutonomousPlanOptimizer', 88)
    expect(ctrl.subsystemScores.get('AutonomousPlanOptimizer')).toBe(88)
  })
})

describe('addOptimization', () => {
  it('should add optimization', () => {
    let ctrl = createController()
    ctrl = addOptimization(ctrl, 'improve_coherence')
    expect(ctrl.activeOptimizations).toContain('improve_coherence')
  })

  it('should not duplicate optimization', () => {
    let ctrl = createController()
    ctrl = addOptimization(ctrl, 'improve_pacing')
    ctrl = addOptimization(ctrl, 'improve_pacing')
    expect(ctrl.activeOptimizations.filter(o => o === 'improve_pacing').length).toBe(1)
  })
})

describe('completeOptimization', () => {
  it('should remove completed optimization', () => {
    let ctrl = createController()
    ctrl = addOptimization(ctrl, 'improve_coherence')
    ctrl = completeOptimization(ctrl, 'improve_coherence')
    expect(ctrl.activeOptimizations).not.toContain('improve_coherence')
  })
})

describe('formatGateResult', () => {
  it('should format gate result', () => {
    const ctrl = createController()
    const result = evaluateGate(ctrl, { coherence: 75, engagement: 70, clarity: 72, consistency: 68, emotional_impact: 65, pacing: 70 } as any)
    const formatted = formatGateResult(result)
    expect(formatted).toContain('ALPHA')
    expect(formatted).toContain('Overall Score')
    expect(formatted).toContain('coherence')
  })

  it('should show blocking issues', () => {
    const ctrl = createController()
    const result = evaluateGate(ctrl, { coherence: 30, engagement: 25, clarity: 35, consistency: 30, emotional_impact: 20, pacing: 25 } as any)
    const formatted = formatGateResult(result)
    expect(formatted).toContain('FAILED')
    expect(formatted).toContain('Blocking Issues')
  })
})

describe('formatControllerDashboard', () => {
  it('should show controller info', () => {
    const ctrl = createController()
    const dashboard = formatControllerDashboard(ctrl)
    expect(dashboard).toContain('Narrative Quality Controller')
    expect(dashboard).toContain('ALPHA')
    expect(dashboard).toContain('monitoring')
  })

  it('should show subsystem scores', () => {
    let ctrl = createController()
    ctrl = registerSubsystemScore(ctrl, 'AutonomousGoalDecomposer', 88)
    ctrl = registerSubsystemScore(ctrl, 'WriterStyleProfileAnalyzer', 82)
    const dashboard = formatControllerDashboard(ctrl)
    expect(dashboard).toContain('Subsystem Scores')
    expect(dashboard).toContain('AutonomousGoalDecomposer')
  })

  it('should show active optimizations', () => {
    let ctrl = createController()
    ctrl = addOptimization(ctrl, 'improve_pacing')
    ctrl = addOptimization(ctrl, 'boost_engagement')
    const dashboard = formatControllerDashboard(ctrl)
    expect(dashboard).toContain('Active Optimizations')
    expect(dashboard).toContain('improve_pacing')
  })

  it('should show latest assessment after evaluation', () => {
    let ctrl = createController()
    const result = evaluateGate(ctrl, { coherence: 70, engagement: 65, clarity: 68, consistency: 72, emotional_impact: 60, pacing: 62 } as any)
    ctrl = updateControllerState(ctrl, result)
    const dashboard = formatControllerDashboard(ctrl)
    expect(dashboard).toContain('Latest Assessment')
  })
})
