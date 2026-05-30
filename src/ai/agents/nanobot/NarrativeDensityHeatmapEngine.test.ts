/**
 * NarrativeDensityHeatmapEngine Tests — V515
 * Comprehensive tests for DensityCalculator, HeatmapGenerator, AnomalyRegionDetector
 */

import { describe, it, expect } from 'vitest'
import {
  // Density Calculator
  calculateDensityVector,
  calculateOverallDensity,
  calculateSceneDensities,
  calculateDimensionStats,
  calculateDimensionTrend,
  DEFAULT_DENSITY_THRESHOLDS,

  // Heatmap Generator
  generateHeatmap2D,

  // Anomaly Region Detector
  detectAnomalyRegions,
  createEmptyDensityState,
  addDensityPoint,
  setDensityPoints,
  runDensityAnalysis,
  updateThresholds,
  clearDensityState,

  // Utility Functions
  getHeatmapRow,
  getAnomaliesInRange,
  getDimensionHeatmapColumn,
  findHotspots,
  findColdspots,
  analyzeNarrativeDensity,

  // Types for test data creation
  DensityPoint,
  DensityDimension
} from './NarrativeDensityHeatmapEngine'

// ============================================================
// DENSITY CALCULATOR TESTS
// ============================================================

describe('DensityCalculator', () => {
  describe('calculateDensityVector', () => {
    it('should return zero vector for empty text', () => {
      const result = calculateDensityVector('')
      expect(result.action).toBe(0)
      expect(result.dialogue).toBe(0)
      expect(result.description).toBe(0)
      expect(result.interior).toBe(0)
    })

    it('should detect action words', () => {
      const result = calculateDensityVector('He rushed forward and grabbed the sword')
      expect(result.action).toBeGreaterThan(0)
    })

    it('should detect dialogue markers', () => {
      const result = calculateDensityVector('"Hello," she said. "How are you?"')
      expect(result.dialogue).toBeGreaterThan(0)
    })

    it('should detect description words', () => {
      const result = calculateDensityVector('The old wall was tall and the sky was dark')
      expect(result.description).toBeGreaterThan(0)
    })

    it('should detect interior thoughts', () => {
      const result = calculateDensityVector('She thought about the past and remembered her childhood')
      expect(result.interior).toBeGreaterThan(0)
    })

    it('should return scores within 0-100 range', () => {
      const result = calculateDensityVector('Word '.repeat(200))
      expect(result.action).toBeLessThanOrEqual(100)
      expect(result.dialogue).toBeLessThanOrEqual(100)
      expect(result.description).toBeLessThanOrEqual(100)
      expect(result.interior).toBeLessThanOrEqual(100)
    })

    it('should handle mixed content', () => {
      const result = calculateDensityVector(
        '"Come here!" He rushed forward. She noticed the old wall and wondered about the past.'
      )
      expect(result.action).toBeGreaterThan(0)
      expect(result.dialogue).toBeGreaterThan(0)
      expect(result.description).toBeGreaterThan(0)
      expect(result.interior).toBeGreaterThan(0)
    })
  })

  describe('calculateOverallDensity', () => {
    it('should calculate weighted average of all dimensions', () => {
      const vector = { action: 50, dialogue: 50, description: 50, interior: 50 }
      const result = calculateOverallDensity(vector)
      expect(result).toBe(50)
    })

    it('should weight action and dialogue higher', () => {
      const vectorHighAction = { action: 100, dialogue: 0, description: 0, interior: 0 }
      const vectorHighDesc = { action: 0, dialogue: 0, description: 100, interior: 0 }
      const actionResult = calculateOverallDensity(vectorHighAction)
      const descResult = calculateOverallDensity(vectorHighDesc)
      // Action has 0.3 weight, description has 0.2 weight
      expect(actionResult).toBeGreaterThan(descResult)
    })

    it('should return 0 for all zero vector', () => {
      const vector = { action: 0, dialogue: 0, description: 0, interior: 0 }
      expect(calculateOverallDensity(vector)).toBe(0)
    })
  })

  describe('calculateSceneDensities', () => {
    it('should calculate density for multiple scenes', () => {
      const scenes = ['Scene one text', 'Scene two text']
      const results = calculateSceneDensities(scenes)
      expect(results).toHaveLength(2)
      expect(results[0].sceneIndex).toBe(0)
      expect(results[1].sceneIndex).toBe(1)
    })

    it('should assign correct scene indices', () => {
      const scenes = ['First', 'Second', 'Third']
      const results = calculateSceneDensities(scenes)
      expect(results[0].sceneIndex).toBe(0)
      expect(results[1].sceneIndex).toBe(1)
      expect(results[2].sceneIndex).toBe(2)
    })

    it('should handle empty scenes array', () => {
      const results = calculateSceneDensities([])
      expect(results).toEqual([])
    })
  })

  describe('calculateDimensionStats', () => {
    it('should calculate average and stdDev for dimension', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 20, dialogue: 20, description: 20, interior: 20 }, overall: 20 },
        { sceneIndex: 1, vector: { action: 40, dialogue: 40, description: 40, interior: 40 }, overall: 40 },
        { sceneIndex: 2, vector: { action: 60, dialogue: 60, description: 60, interior: 60 }, overall: 60 }
      ]
      const stats = calculateDimensionStats(points, 'action')
      expect(stats.avg).toBe(40)
      expect(stats.stdDev).toBeGreaterThan(0)
    })

    it('should return zeros for empty points array', () => {
      const stats = calculateDimensionStats([], 'action')
      expect(stats.avg).toBe(0)
      expect(stats.stdDev).toBe(0)
    })
  })

  describe('calculateDimensionTrend', () => {
    it('should detect increasing trend', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 10, dialogue: 10, description: 10, interior: 10 }, overall: 10 },
        { sceneIndex: 1, vector: { action: 20, dialogue: 20, description: 20, interior: 20 }, overall: 20 },
        { sceneIndex: 2, vector: { action: 30, dialogue: 30, description: 30, interior: 30 }, overall: 30 },
        { sceneIndex: 3, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 4, vector: { action: 70, dialogue: 70, description: 70, interior: 70 }, overall: 70 }
      ]
      expect(calculateDimensionTrend(points, 'action')).toBe('increasing')
    })

    it('should detect decreasing trend', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 70, dialogue: 70, description: 70, interior: 70 }, overall: 70 },
        { sceneIndex: 1, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 2, vector: { action: 30, dialogue: 30, description: 30, interior: 30 }, overall: 30 },
        { sceneIndex: 3, vector: { action: 20, dialogue: 20, description: 20, interior: 20 }, overall: 20 },
        { sceneIndex: 4, vector: { action: 10, dialogue: 10, description: 10, interior: 10 }, overall: 10 }
      ]
      expect(calculateDimensionTrend(points, 'action')).toBe('decreasing')
    })

    it('should return stable for insufficient data', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ]
      expect(calculateDimensionTrend(points, 'action')).toBe('stable')
    })
  })
})

// ============================================================
// HEATMAP GENERATOR TESTS
// ============================================================

describe('HeatmapGenerator', () => {
  describe('generateHeatmap2D', () => {
    it('should generate empty heatmap for empty points', () => {
      const heatmap = generateHeatmap2D([], [])
      expect(heatmap.rows).toEqual([])
      expect(heatmap.columns).toEqual(['action', 'dialogue', 'description', 'interior'])
      expect(heatmap.maxValue).toBe(0)
      expect(heatmap.minValue).toBe(0)
    })

    it('should generate heatmap with correct structure', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 60, dialogue: 60, description: 60, interior: 60 }, overall: 60 }
      ]
      const heatmap = generateHeatmap2D(points, ['Scene 1', 'Scene 2'])
      expect(heatmap.rows).toHaveLength(2)
      expect(heatmap.maxValue).toBe(60)
      expect(heatmap.minValue).toBe(50)
    })

    it('should detect high density anomalies', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 95, dialogue: 95, description: 95, interior: 95 }, overall: 95 }
      ]
      const heatmap = generateHeatmap2D(points, ['Scene 1', 'Scene 2'], DEFAULT_DENSITY_THRESHOLDS)
      expect(heatmap.rows[1].isAnomalous).toBe(true)
      expect(heatmap.rows[1].anomalyType).toBe('high')
    })

    it('should detect low density anomalies', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 5, dialogue: 5, description: 5, interior: 5 }, overall: 5 }
      ]
      const heatmap = generateHeatmap2D(points, ['Scene 1', 'Scene 2'], DEFAULT_DENSITY_THRESHOLDS)
      expect(heatmap.rows[1].isAnomalous).toBe(true)
      expect(heatmap.rows[1].anomalyType).toBe('low')
    })

    it('should use default scene labels when not provided', () => {
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ]
      const heatmap = generateHeatmap2D(points, [])
      expect(heatmap.rows[0].sceneLabel).toBe('Scene 1')
    })
  })
})

// ============================================================
// ANOMALY REGION DETECTOR TESTS
// ============================================================

describe('AnomalyRegionDetector', () => {
  describe('detectAnomalyRegions', () => {
    it('should detect consecutive high density regions', () => {
      const heatmap = generateHeatmap2D([
        { sceneIndex: 0, vector: { action: 90, dialogue: 90, description: 90, interior: 90 }, overall: 90 },
        { sceneIndex: 1, vector: { action: 95, dialogue: 95, description: 95, interior: 95 }, overall: 95 },
        { sceneIndex: 2, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 3, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ], ['S1', 'S2', 'S3', 'S4'])
      const regions = detectAnomalyRegions(heatmap)
      expect(regions.length).toBeGreaterThan(0)
      const highRegion = regions.find(r => r.type === 'high_density')
      expect(highRegion).toBeDefined()
      expect(highRegion!.startScene).toBe(0)
      expect(highRegion!.endScene).toBe(1)
    })

    it('should detect consecutive low density regions', () => {
      const heatmap = generateHeatmap2D([
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 10, dialogue: 10, description: 10, interior: 10 }, overall: 10 },
        { sceneIndex: 2, vector: { action: 15, dialogue: 15, description: 15, interior: 15 }, overall: 15 },
        { sceneIndex: 3, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ], ['S1', 'S2', 'S3', 'S4'])
      const regions = detectAnomalyRegions(heatmap)
      const lowRegion = regions.find(r => r.type === 'low_density')
      expect(lowRegion).toBeDefined()
    })

    it('should ignore single anomalies below minConsecutive', () => {
      const heatmap = generateHeatmap2D([
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 95, dialogue: 95, description: 95, interior: 95 }, overall: 95 },
        { sceneIndex: 2, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ], ['S1', 'S2', 'S3'])
      const regions = detectAnomalyRegions(heatmap, DEFAULT_DENSITY_THRESHOLDS, 2)
      expect(regions.length).toBe(0)
    })
  })
})

// ============================================================
// STATE MANAGEMENT TESTS
// ============================================================

describe('StateManagement', () => {
  describe('createEmptyDensityState', () => {
    it('should create empty state with default thresholds', () => {
      const state = createEmptyDensityState()
      expect(state.points).toEqual([])
      expect(state.heatmap).toBeNull()
      expect(state.anomalies).toEqual([])
      expect(state.report).toBeNull()
      expect(state.thresholds).toEqual(DEFAULT_DENSITY_THRESHOLDS)
    })

    it('should accept custom thresholds', () => {
      const state = createEmptyDensityState({ highUpper: 90 })
      expect(state.thresholds.highUpper).toBe(90)
    })
  })

  describe('addDensityPoint', () => {
    it('should add a density point to state', () => {
      const state = createEmptyDensityState()
      const point: DensityPoint = {
        sceneIndex: 0,
        vector: { action: 50, dialogue: 50, description: 50, interior: 50 },
        overall: 50
      }
      const newState = addDensityPoint(state, point, 'Scene 1')
      expect(newState.points).toHaveLength(1)
      expect(newState.sceneLabels).toContain('Scene 1')
    })

    it('should auto-generate label when not provided', () => {
      const state = createEmptyDensityState()
      const point: DensityPoint = {
        sceneIndex: 0,
        vector: { action: 50, dialogue: 50, description: 50, interior: 50 },
        overall: 50
      }
      const newState = addDensityPoint(state, point)
      expect(newState.sceneLabels).toContain('Scene 1')
    })
  })

  describe('setDensityPoints', () => {
    it('should set multiple points at once', () => {
      const state = createEmptyDensityState()
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
        { sceneIndex: 1, vector: { action: 60, dialogue: 60, description: 60, interior: 60 }, overall: 60 }
      ]
      const newState = setDensityPoints(state, points, ['S1', 'S2'])
      expect(newState.points).toHaveLength(2)
    })
  })

  describe('updateThresholds', () => {
    it('should update specific threshold values', () => {
      const state = createEmptyDensityState()
      const newState = updateThresholds(state, { highUpper: 85, lowLower: 15 })
      expect(newState.thresholds.highUpper).toBe(85)
      expect(newState.thresholds.lowLower).toBe(15)
      expect(newState.thresholds.deviationFactor).toBe(DEFAULT_DENSITY_THRESHOLDS.deviationFactor)
    })
  })

  describe('clearDensityState', () => {
    it('should clear points but keep thresholds', () => {
      const state = createEmptyDensityState({ highUpper: 85 })
      const point: DensityPoint = {
        sceneIndex: 0,
        vector: { action: 50, dialogue: 50, description: 50, interior: 50 },
        overall: 50
      }
      const stateWithPoint = addDensityPoint(state, point)
      const clearedState = clearDensityState(stateWithPoint)
      expect(clearedState.points).toEqual([])
      expect(clearedState.thresholds.highUpper).toBe(85)
    })
  })
})

// ============================================================
// UTILITY FUNCTION TESTS
// ============================================================

describe('UtilityFunctions', () => {
  const sampleHeatmap = generateHeatmap2D([
    { sceneIndex: 0, vector: { action: 30, dialogue: 30, description: 30, interior: 30 }, overall: 30 },
    { sceneIndex: 1, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 },
    { sceneIndex: 2, vector: { action: 80, dialogue: 80, description: 80, interior: 80 }, overall: 80 },
    { sceneIndex: 3, vector: { action: 10, dialogue: 10, description: 10, interior: 10 }, overall: 10 }
  ], ['S1', 'S2', 'S3', 'S4'])

  describe('getHeatmapRow', () => {
    it('should return correct row for scene index', () => {
      const row = getHeatmapRow(sampleHeatmap, 1)
      expect(row).toBeDefined()
      expect(row!.overall).toBe(50)
    })

    it('should return null for invalid scene index', () => {
      const row = getHeatmapRow(sampleHeatmap, 99)
      expect(row).toBeNull()
    })
  })

  describe('getAnomaliesInRange', () => {
    it('should find anomalies within range', () => {
      const anomalies: any[] = [
        { startScene: 0, endScene: 1, type: 'high_density', severity: 50, avgDensity: 90, dimension: 'action', description: '' },
        { startScene: 3, endScene: 3, type: 'low_density', severity: 50, avgDensity: 10, dimension: 'action', description: '' }
      ]
      const result = getAnomaliesInRange(anomalies, 0, 1)
      expect(result).toHaveLength(1)
    })
  })

  describe('getDimensionHeatmapColumn', () => {
    it('should return dimension values for all scenes', () => {
      const column = getDimensionHeatmapColumn(sampleHeatmap, 'action')
      expect(column).toHaveLength(4)
      expect(column[0].value).toBe(30)
      expect(column[2].value).toBe(80)
    })
  })

  describe('findHotspots', () => {
    it('should find scenes above threshold', () => {
      const hotspots = findHotspots(sampleHeatmap, 70)
      expect(hotspots).toHaveLength(1)
      expect(hotspots[0].sceneIndex).toBe(2)
    })
  })

  describe('findColdspots', () => {
    it('should find scenes below threshold', () => {
      const coldspots = findColdspots(sampleHeatmap, 20)
      expect(coldspots.length).toBeGreaterThan(0)
    })
  })
})

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('Integration', () => {
  describe('analyzeNarrativeDensity', () => {
    it('should perform complete analysis', () => {
      const scenes = [
        'He rushed forward. "Hello!" she said. The old wall was tall.',
        'She thought about the past. He grabbed the sword. The sky was blue.',
        'They ran together. "Come with me," he whispered. The floor was cold.'
      ]
      const report = analyzeNarrativeDensity(scenes, ['Scene 1', 'Scene 2', 'Scene 3'])
      expect(report.heatmap).toBeDefined()
      expect(report.heatmap.rows).toHaveLength(3)
      expect(report.overallHealth).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty scenes array', () => {
      const report = analyzeNarrativeDensity([], [])
      expect(report.heatmap.rows).toEqual([])
      expect(report.overallHealth).toBe(50)
    })

    it('should include dimension breakdown', () => {
      const report = analyzeNarrativeDensity(['Scene with some content here and there'])
      expect(report.dimensionBreakdown).toBeDefined()
      expect(report.dimensionBreakdown.action).toBeDefined()
      expect(report.dimensionBreakdown.dialogue).toBeDefined()
      expect(report.dimensionBreakdown.description).toBeDefined()
      expect(report.dimensionBreakdown.interior).toBeDefined()
    })
  })

  describe('runDensityAnalysis', () => {
    it('should update state with full analysis', () => {
      const state = createEmptyDensityState()
      const points: DensityPoint[] = [
        { sceneIndex: 0, vector: { action: 50, dialogue: 50, description: 50, interior: 50 }, overall: 50 }
      ]
      const stateWithPoints = setDensityPoints(state, points, ['Scene 1'])
      const analyzedState = runDensityAnalysis(stateWithPoints)
      expect(analyzedState.heatmap).not.toBeNull()
      expect(analyzedState.report).not.toBeNull()
    })
  })
})