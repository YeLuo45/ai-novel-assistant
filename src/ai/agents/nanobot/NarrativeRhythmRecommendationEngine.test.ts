/**
 * NarrativeRhythmRecommendationEngine Tests — V522
 * Comprehensive tests for RhythmAnalyzer, RecommendationEngine, AdaptationTracker
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Rhythm Analyzer
  normalizeSpeedValue,
  calculateCombinedScore,
  determineRhythmState,
  calculateConsistencyScore,
  analyzeRhythm,
  RhythmAnalysisInput,
  
  // Recommendation Engine
  generateRecommendation,
  calculatePriority,
  calculateTargetAdjustment,
  DEFAULT_RECOMMENDATION_THRESHOLDS,
  
  // Adaptation Tracker
  createEmptyAdaptationMetrics,
  createEmptyRhythmState,
  recordRecommendation,
  applyRecommendation,
  rejectRecommendation,
  completeRecommendation,
  supersedeRecommendation,
  calculateAdaptationMetrics,
  addMetricsToHistory,
  
  // Query Functions
  getLatestMetrics,
  getActiveRecommendations,
  getRecommendationById,
  getAdaptationByRecommendationId,
  getRecentRecommendations,
  getRecommendationsBySuggestion,
  getAdaptationSummary,
  
  // Full Pipeline
  analyzeAndRecommend,
  processSessionResult,
  
  // Types
  RhythmMetrics,
  RhythmRecommendation,
  AdaptationRecord,
  NarrativeRhythmState
} from './NarrativeRhythmRecommendationEngine'

// ============================================================
// RHYTHM ANALYZER TESTS
// ============================================================

describe('RhythmAnalyzer', () => {
  describe('normalizeSpeedValue', () => {
    it('should normalize speed value to 0-1 scale', () => {
      expect(normalizeSpeedValue(250)).toBeCloseTo(1, 2)
      expect(normalizeSpeedValue(125)).toBeCloseTo(0.5, 2)
      expect(normalizeSpeedValue(500)).toBeCloseTo(1, 2) // cap at 1
    })
    
    it('should handle zero and negative speeds', () => {
      expect(normalizeSpeedValue(0)).toBe(0)
      expect(normalizeSpeedValue(-100)).toBe(0)
    })
    
    it('should use custom baseline', () => {
      expect(normalizeSpeedValue(200, 200)).toBeCloseTo(1, 2)
      expect(normalizeSpeedValue(100, 200)).toBeCloseTo(0.5, 2)
    })
  })
  
  describe('calculateCombinedScore', () => {
    it('should return high score for balanced metrics', () => {
      const score = calculateCombinedScore(0.5, 0.7, 0.5)
      expect(score).toBeGreaterThan(70)
    })
    
    it('should penalize extreme entropy values', () => {
      const balancedScore = calculateCombinedScore(0.5, 0.7, 0.5)
      const extremeScore = calculateCombinedScore(0.1, 0.7, 0.5)
      expect(balancedScore).toBeGreaterThan(extremeScore)
    })
    
    it('should penalize very slow speeds', () => {
      const score = calculateCombinedScore(0.5, 0.3, 0.5)
      expect(score).toBeLessThan(85) // formula-based penalty is moderate
    })
    
    it('should penalize very fast speeds', () => {
      const score = calculateCombinedScore(0.5, 0.95, 0.5)
      expect(score).toBeLessThan(85)
    })
    
    it('should return score in 0-100 range', () => {
      const score = calculateCombinedScore(0.5, 0.7, 0.5)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
  
  describe('determineRhythmState', () => {
    it('should identify rushing state', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.9,
        densityValue: 0.5,
        combinedScore: 75,
        rhythmState: 'balanced',
        consistencyScore: 0.7
      }
      expect(determineRhythmState(metrics)).toBe('rushing')
    })
    
    it('should identify dragging state', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.3,
        densityValue: 0.5,
        combinedScore: 35,
        rhythmState: 'balanced',
        consistencyScore: 0.7
      }
      expect(determineRhythmState(metrics)).toBe('dragging')
    })
    
    it('should identify balanced state', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.6,
        densityValue: 0.5,
        combinedScore: 75,
        rhythmState: 'balanced',
        consistencyScore: 0.8
      }
      expect(determineRhythmState(metrics)).toBe('balanced')
    })
    
    it('should default to steady state', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.6,
        speedValue: 0.6,
        densityValue: 0.6,
        combinedScore: 55,
        rhythmState: 'balanced',
        consistencyScore: 0.5
      }
      expect(determineRhythmState(metrics)).toBe('steady')
    })
  })
  
  describe('calculateConsistencyScore', () => {
    it('should return 1.0 for empty history', () => {
      expect(calculateConsistencyScore([])).toBe(1.0)
    })
    
    it('should return 1.0 for single metric', () => {
      const metrics: RhythmMetrics[] = [{
        entropyValue: 0.5,
        speedValue: 0.5,
        densityValue: 0.5,
        combinedScore: 50,
        rhythmState: 'balanced',
        consistencyScore: 1.0
      }]
      expect(calculateConsistencyScore(metrics)).toBe(1.0)
    })
    
    it('should return lower score for varying metrics', () => {
      const metrics: RhythmMetrics[] = [
        { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 },
        { entropyValue: 0.7, speedValue: 0.7, densityValue: 0.7, combinedScore: 80, rhythmState: 'balanced', consistencyScore: 1.0 },
        { entropyValue: 0.3, speedValue: 0.3, densityValue: 0.3, combinedScore: 30, rhythmState: 'balanced', consistencyScore: 1.0 },
      ]
      expect(calculateConsistencyScore(metrics)).toBeLessThan(1.0)
    })
  })
  
  describe('analyzeRhythm', () => {
    it('should analyze balanced rhythm', () => {
      const input: RhythmAnalysisInput = {
        entropyValue: 0.5,
        speedValue: 250,
        densityValue: 0.5
      }
      const result = analyzeRhythm(input)
      expect(result.currentMetrics).toBeDefined()
      expect(result.alerts).toHaveLength(0)
      expect(result.isAnomalous).toBe(false)
    })
    
    it('should detect rushing anomaly', () => {
      const input: RhythmAnalysisInput = {
        entropyValue: 0.5,
        speedValue: 400,
        densityValue: 0.5
      }
      const result = analyzeRhythm(input)
      expect(result.isAnomalous).toBe(true)
      expect(result.anomalyType).toBe('rushing')
    })
    
    it('should detect dragging anomaly', () => {
      const input: RhythmAnalysisInput = {
        entropyValue: 0.5,
        speedValue: 80,
        densityValue: 0.5
      }
      const result = analyzeRhythm(input)
      expect(result.isAnomalous).toBe(true)
      expect(result.anomalyType).toBe('dragging')
    })
    
    it('should use default values when inputs are missing', () => {
      const result = analyzeRhythm({})
      expect(result.currentMetrics.entropyValue).toBe(0.5)
      expect(result.currentMetrics.speedValue).toBeCloseTo(0.7, 1)
    })
    
    it('should generate alerts for dense prose', () => {
      const input: RhythmAnalysisInput = {
        entropyValue: 0.85,
        speedValue: 100,
        densityValue: 0.7
      }
      const result = analyzeRhythm(input)
      expect(result.alerts.some(a => a.includes('Dense prose'))).toBe(true)
    })
    
    it('should include analysis timestamp', () => {
      const result = analyzeRhythm({})
      expect(result.analysisTimestamp).toBeGreaterThan(0)
    })
  })
})

// ============================================================
// RECOMMENDATION ENGINE TESTS
// ============================================================

describe('RecommendationEngine', () => {
  describe('calculatePriority', () => {
    it('should return base priority for maintain suggestions', () => {
      const priority = calculatePriority('maintain', 0.5, false, null)
      expect(priority).toBe(3) // base 5 - 2
    })
    
    it('should increase priority for anomalies', () => {
      const priority = calculatePriority('accelerate', 0.5, true, 'rushing')
      expect(priority).toBeGreaterThanOrEqual(8)
    })
    
    it('should increase priority for high confidence', () => {
      const lowConf = calculatePriority('accelerate', 0.4, false, null)
      const highConf = calculatePriority('accelerate', 0.9, false, null)
      expect(highConf).toBeGreaterThan(lowConf)
    })
    
    it('should cap priority at 10', () => {
      const priority = calculatePriority('accelerate', 1.0, true, 'rushing')
      expect(priority).toBeLessThanOrEqual(10)
    })
  })
  
  describe('calculateTargetAdjustment', () => {
    it('should return positive adjustment for accelerate', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.3,
        densityValue: 0.5,
        combinedScore: 40,
        rhythmState: 'dragging',
        consistencyScore: 0.5
      }
      const adjustment = calculateTargetAdjustment('accelerate', metrics)
      expect(adjustment).toBeGreaterThan(0)
    })
    
    it('should return negative adjustment for decelerate', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.9,
        densityValue: 0.5,
        combinedScore: 75,
        rhythmState: 'rushing',
        consistencyScore: 0.5
      }
      const adjustment = calculateTargetAdjustment('decelerate', metrics)
      expect(adjustment).toBeLessThan(0)
    })
    
    it('should return zero for analyze', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.5,
        densityValue: 0.5,
        combinedScore: 50,
        rhythmState: 'steady',
        consistencyScore: 0.5
      }
      expect(calculateTargetAdjustment('analyze', metrics)).toBe(0)
    })
  })
  
  describe('generateRecommendation', () => {
    it('should generate decelerate recommendation for rushing', () => {
      const analysis = analyzeRhythm({
        entropyValue: 0.5,
        speedValue: 400,
        densityValue: 0.5
      })
      const rec = generateRecommendation(analysis)
      expect(rec.suggestion).toBe('decelerate')
      expect(rec.confidence).toBeGreaterThan(0.5)
    })
    
    it('should generate accelerate recommendation for dragging', () => {
      const analysis = analyzeRhythm({
        entropyValue: 0.5,
        speedValue: 80,
        densityValue: 0.5
      })
      const rec = generateRecommendation(analysis)
      expect(rec.suggestion).toBe('accelerate')
      expect(rec.confidence).toBeGreaterThan(0.5)
    })
    
    it('should generate maintain recommendation for balanced rhythm', () => {
      const analysis = analyzeRhythm({
        entropyValue: 0.5,
        speedValue: 250,
        densityValue: 0.5
      })
      const rec = generateRecommendation(analysis)
      expect(rec.suggestion).toBe('maintain')
      expect(rec.confidence).toBeGreaterThan(0.7)
    })
    
    it('should include metrics in recommendation', () => {
      const analysis = analyzeRhythm({
        entropyValue: 0.5,
        speedValue: 250,
        densityValue: 0.5
      })
      const rec = generateRecommendation(analysis)
      expect(rec.metrics).toBeDefined()
      expect(rec.metrics.combinedScore).toBeDefined()
    })
    
    it('should generate unique ids', () => {
      const analysis = analyzeRhythm({})
      const rec1 = generateRecommendation(analysis)
      const rec2 = generateRecommendation(analysis)
      expect(rec1.id).not.toBe(rec2.id)
    })
    
    it('should accept custom tags', () => {
      const analysis = analyzeRhythm({ entropyValue: 0.8, speedValue: 300, densityValue: 0.6 })
      const tags = ['climax', 'high_tension']
      const rec = generateRecommendation(analysis, DEFAULT_RECOMMENDATION_THRESHOLDS, tags)
      expect(rec.tags).toEqual(tags)
    })
  })
})

// ============================================================
// ADAPTATION TRACKER TESTS
// ============================================================

describe('AdaptationTracker', () => {
  let state: NarrativeRhythmState
  
  beforeEach(() => {
    state = createEmptyRhythmState()
  })
  
  describe('createEmptyRhythmState', () => {
    it('should create empty state with zero counts', () => {
      expect(state.metricsHistory).toHaveLength(0)
      expect(state.recommendations).toHaveLength(0)
      expect(state.adaptations).toHaveLength(0)
      expect(state.adaptationMetrics.totalRecommendations).toBe(0)
    })
  })
  
  describe('recordRecommendation', () => {
    it('should add recommendation to state', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.5,
        densityValue: 0.5,
        combinedScore: 50,
        rhythmState: 'balanced',
        consistencyScore: 1.0
      }
      const recommendation: RhythmRecommendation = {
        id: 'test_rec_1',
        suggestion: 'maintain',
        confidence: 0.8,
        reason: 'Test',
        targetAdjustment: 0,
        priority: 5,
        createdAt: Date.now(),
        metrics,
        tags: []
      }
      const newState = recordRecommendation(state, recommendation)
      expect(newState.recommendations).toHaveLength(1)
      expect(newState.recommendations[0].id).toBe('test_rec_1')
    })
  })
  
  describe('applyRecommendation', () => {
    it('should mark recommendation as applied', () => {
      state = recordRecommendation(state, {
        id: 'rec_1',
        suggestion: 'accelerate',
        confidence: 0.7,
        reason: 'Test',
        targetAdjustment: 20,
        priority: 5,
        createdAt: Date.now(),
        metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 },
        tags: []
      })
      const newState = applyRecommendation(state, 'rec_1', 'Applied for testing')
      const adaptation = newState.adaptations.find(a => a.recommendationId === 'rec_1')
      expect(adaptation?.status).toBe('applied')
      expect(adaptation?.appliedAt).toBeGreaterThan(0)
    })
  })
  
  describe('rejectRecommendation', () => {
    it('should mark recommendation as rejected with reason', () => {
      state = recordRecommendation(state, {
        id: 'rec_2',
        suggestion: 'decelerate',
        confidence: 0.6,
        reason: 'Test',
        targetAdjustment: -20,
        priority: 5,
        createdAt: Date.now(),
        metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 },
        tags: []
      })
      const newState = rejectRecommendation(state, 'rec_2', 'Not appropriate for current scene')
      const adaptation = newState.adaptations.find(a => a.recommendationId === 'rec_2')
      expect(adaptation?.status).toBe('rejected')
      expect(adaptation?.rejectionReason).toBe('Not appropriate for current scene')
    })
  })
  
  describe('completeRecommendation', () => {
    it('should mark recommendation as completed with effect score', () => {
      state = applyRecommendation(state, 'rec_3')
      const newState = completeRecommendation(state, 'rec_3', 45, 'Improved pacing')
      const adaptation = newState.adaptations.find(a => a.recommendationId === 'rec_3')
      expect(adaptation?.status).toBe('completed')
      expect(adaptation?.effectScore).toBe(45)
    })
    
    it('should cap effect score at 100', () => {
      state = applyRecommendation(state, 'rec_4')
      const newState = completeRecommendation(state, 'rec_4', 150)
      const adaptation = newState.adaptations.find(a => a.recommendationId === 'rec_4')
      expect(adaptation?.effectScore).toBe(100)
    })
  })
  
  describe('supersedeRecommendation', () => {
    it('should mark recommendation as superseded', () => {
      // First add recommendation to state
      state = recordRecommendation(state, {
        id: 'rec_old',
        suggestion: 'accelerate',
        confidence: 0.7,
        reason: 'Test',
        targetAdjustment: 20,
        priority: 5,
        createdAt: Date.now(),
        metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 },
        tags: []
      })
      const newState = supersedeRecommendation(state, 'rec_old', 'rec_new')
      const adaptation = newState.adaptations.find(a => a.recommendationId === 'rec_old')
      expect(adaptation?.status).toBe('superseded')
    })
  })
  
  describe('addMetricsToHistory', () => {
    it('should add metrics to history', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.5,
        densityValue: 0.5,
        combinedScore: 50,
        rhythmState: 'balanced',
        consistencyScore: 1.0
      }
      const newState = addMetricsToHistory(state, metrics)
      expect(newState.metricsHistory).toHaveLength(1)
    })
    
    it('should cap history at 50 entries', () => {
      const metrics: RhythmMetrics = {
        entropyValue: 0.5,
        speedValue: 0.5,
        densityValue: 0.5,
        combinedScore: 50,
        rhythmState: 'balanced',
        consistencyScore: 1.0
      }
      let newState = state
      for (let i = 0; i < 60; i++) {
        newState = addMetricsToHistory(newState, { ...metrics, combinedScore: i })
      }
      expect(newState.metricsHistory).toHaveLength(50)
    })
  })
  
  describe('calculateAdaptationMetrics', () => {
    it('should return empty metrics for empty state', () => {
      const metrics = calculateAdaptationMetrics([], [])
      expect(metrics.totalRecommendations).toBe(0)
      expect(metrics.adoptionRate).toBe(0)
    })
    
    it('should calculate adoption rate', () => {
      const recommendations: RhythmRecommendation[] = [
        { id: 'r1', suggestion: 'accelerate', confidence: 0.7, reason: 'Test', targetAdjustment: 10, priority: 5, createdAt: Date.now(), metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 }, tags: [] },
        { id: 'r2', suggestion: 'decelerate', confidence: 0.6, reason: 'Test', targetAdjustment: -10, priority: 5, createdAt: Date.now(), metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 }, tags: [] }
      ]
      const adaptations: AdaptationRecord[] = [
        { recommendationId: 'r1', status: 'applied', appliedAt: Date.now(), completedAt: null, effectScore: null, rejectionReason: null, notes: '' }
      ]
      const metrics = calculateAdaptationMetrics(recommendations, adaptations)
      expect(metrics.adoptionRate).toBeCloseTo(0.5, 1)
    })
    
    it('should identify most effective suggestion', () => {
      const recommendations: RhythmRecommendation[] = [
        { id: 'r1', suggestion: 'accelerate', confidence: 0.7, reason: 'Test', targetAdjustment: 10, priority: 5, createdAt: Date.now(), metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 }, tags: [] }
      ]
      const adaptations: AdaptationRecord[] = [
        { recommendationId: 'r1', status: 'completed', appliedAt: Date.now(), completedAt: Date.now(), effectScore: 75, rejectionReason: null, notes: '' }
      ]
      const metrics = calculateAdaptationMetrics(recommendations, adaptations)
      expect(metrics.mostEffectiveSuggestion).toBe('accelerate')
    })
  })
})

// ============================================================
// QUERY FUNCTION TESTS
// ============================================================

describe('QueryFunctions', () => {
  let state: NarrativeRhythmState
  
  beforeEach(() => {
    state = createEmptyRhythmState()
    // Add some test data
    const metrics: RhythmMetrics = {
      entropyValue: 0.5,
      speedValue: 0.5,
      densityValue: 0.5,
      combinedScore: 50,
      rhythmState: 'balanced',
      consistencyScore: 1.0
    }
    state = addMetricsToHistory(state, metrics)
    state = recordRecommendation(state, {
      id: 'rec_1',
      suggestion: 'accelerate',
      confidence: 0.7,
      reason: 'Test accelerate',
      targetAdjustment: 20,
      priority: 5,
      createdAt: Date.now() - 1000,
      metrics,
      tags: []
    })
    state = recordRecommendation(state, {
      id: 'rec_2',
      suggestion: 'decelerate',
      confidence: 0.6,
      reason: 'Test decelerate',
      targetAdjustment: -20,
      priority: 6,
      createdAt: Date.now(),
      metrics,
      tags: ['urgent']
    })
  })
  
  describe('getLatestMetrics', () => {
    it('should return latest metrics from history', () => {
      const latest = getLatestMetrics(state)
      expect(latest).not.toBeNull()
      expect(latest?.combinedScore).toBe(50)
    })
    
    it('should return null for empty history', () => {
      const emptyState = createEmptyRhythmState()
      expect(getLatestMetrics(emptyState)).toBeNull()
    })
  })
  
  describe('getRecommendationById', () => {
    it('should find existing recommendation', () => {
      const rec = getRecommendationById(state, 'rec_1')
      expect(rec).not.toBeNull()
      expect(rec?.suggestion).toBe('accelerate')
    })
    
    it('should return null for non-existent id', () => {
      expect(getRecommendationById(state, 'non_existent')).toBeNull()
    })
  })
  
  describe('getRecentRecommendations', () => {
    it('should return recommendations sorted by date', () => {
      const recent = getRecentRecommendations(state, 10)
      expect(recent[0].id).toBe('rec_2') // Most recent first
    })
    
    it('should limit to requested count', () => {
      const recent = getRecentRecommendations(state, 1)
      expect(recent).toHaveLength(1)
    })
  })
  
  describe('getRecommendationsBySuggestion', () => {
    it('should filter by suggestion type', () => {
      const accelerateRecs = getRecommendationsBySuggestion(state, 'accelerate')
      const decelerateRecs = getRecommendationsBySuggestion(state, 'decelerate')
      expect(accelerateRecs).toHaveLength(1)
      expect(decelerateRecs).toHaveLength(1)
    })
  })
  
  describe('getAdaptationSummary', () => {
    it('should summarize adaptation counts', () => {
      state = applyRecommendation(state, 'rec_1')
      const summary = getAdaptationSummary(state)
      expect(summary.total).toBe(1)
      expect(summary.applied).toBe(1)
    })
    
    it('should calculate adoption rate', () => {
      state = applyRecommendation(state, 'rec_1')
      const summary = getAdaptationSummary(state)
      expect(summary.adoptionRatePercent).toBe('100.0%')
    })
  })
})

// ============================================================
// FULL PIPELINE TESTS
// ============================================================

describe('FullPipeline', () => {
  let state: NarrativeRhythmState
  
  beforeEach(() => {
    state = createEmptyRhythmState()
  })
  
  describe('analyzeAndRecommend', () => {
    it('should run complete analysis pipeline', () => {
      const input: RhythmAnalysisInput = {
        entropyValue: 0.5,
        speedValue: 250,
        densityValue: 0.5
      }
      const result = analyzeAndRecommend(state, input)
      expect(result.state).toBeDefined()
      expect(result.analysis).toBeDefined()
      expect(result.recommendation).toBeDefined()
    })
    
    it('should update state with metrics and recommendation', () => {
      const result = analyzeAndRecommend(state, {})
      expect(result.state.metricsHistory).toHaveLength(1)
      expect(result.state.recommendations).toHaveLength(1)
    })
    
    it('should accept custom tags', () => {
      const result = analyzeAndRecommend(state, { entropyValue: 0.7, speedValue: 300, densityValue: 0.6 }, ['test_tag'])
      expect(result.recommendation.tags).toContain('test_tag')
    })
    
    it('should increment adaptation metrics', () => {
      const result = analyzeAndRecommend(state, { entropyValue: 0.5, speedValue: 250, densityValue: 0.5 })
      expect(result.state.adaptationMetrics.totalRecommendations).toBe(1)
    })
  })
  
  describe('processSessionResult', () => {
    it('should process session result and update metrics', () => {
      state = recordRecommendation(state, {
        id: 'rec_test',
        suggestion: 'accelerate',
        confidence: 0.7,
        reason: 'Test',
        targetAdjustment: 20,
        priority: 5,
        createdAt: Date.now(),
        metrics: { entropyValue: 0.5, speedValue: 0.5, densityValue: 0.5, combinedScore: 50, rhythmState: 'balanced', consistencyScore: 1.0 },
        tags: []
      })
      state = applyRecommendation(state, 'rec_test')
      const newState = processSessionResult(state, 'rec_test', 60, 'Good improvement')
      expect(newState.adaptationMetrics.totalRecommendations).toBe(1)
    })
  })
})