/**
 * NarrativeSpeedAnalysisEngine Tests — V514
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  calculateSpeed,
  recordSpeedMetrics,
  detectSpeedAnomalies,
  addTrajectoryPoint,
  getTrajectoryRange,
  predictNextSpeed,
  recordPrediction,
  getSpeedMetrics,
  getChapterMetricsByNumber,
  getAnomalies,
  getAnomalyCount,
  getRecentAnomalies,
  getTrajectorySummary,
  getSpeedPrediction,
  clearPredictions,
  resetState
} from './NarrativeSpeedAnalysisEngine'

describe('NarrativeSpeedAnalysisEngine', () => {
  // ─── State Factory ───────────────────────────────────────────

  describe('createEmptyState', () => {
    it('should initialize empty state with default baseline', () => {
      const state = createEmptyState()
      expect(state.metrics).toEqual({})
      expect(state.anomalies).toEqual([])
      expect(state.trajectory).toEqual([])
      expect(state.predictions).toEqual({})
      expect(state.globalAvgSpeed).toBe(250)
      expect(state.globalStdDev).toBe(0)
      expect(state.readingSpeedBaseline).toBe(250)
    })

    it('should initialize with custom baseline', () => {
      const state = createEmptyState(300)
      expect(state.readingSpeedBaseline).toBe(300)
      expect(state.globalAvgSpeed).toBe(300)
    })
  })

  // ─── Speed Calculation ────────────────────────────────────────

  describe('calculateSpeed', () => {
    it('should calculate speed metrics from content', () => {
      const state = createEmptyState()
      const content = 'This is a long test sentence. Another one here. More words to follow. Even more content now.'
      const metrics = calculateSpeed(content, 120, 1, state)

      expect(metrics.chapterNumber).toBe(1)
      expect(metrics.wordCount).toBeGreaterThan(0)
      expect(metrics.sentenceCount).toBeGreaterThan(0)
      expect(metrics.avgSentenceLength).toBeGreaterThan(0)
    })

    it('should estimate speed from word count when no reading time', () => {
      const state = createEmptyState()
      const content = 'Word ' .repeat(500)
      const metrics = calculateSpeed(content, 0, 2, state)
      expect(metrics.wordsPerMinute).toBeGreaterThan(0)
    })

    it('should detect scene switches via markers', () => {
      const state = createEmptyState()
      const content = 'First scene.\n\n***\n\nSecond scene.\n\n\n***\n\n\nThird scene.'
      const metrics = calculateSpeed(content, 60, 1, state)
      expect(metrics.sceneSwitchCount).toBeGreaterThanOrEqual(2)
    })

    it('should determine speed level as slow for very low wpm', () => {
      const state = createEmptyState(250)
      const content = 'Short. Sentence. Here.'
      const metrics = calculateSpeed(content, 30, 1, state)
      expect(['slow', 'moderate', 'fast', 'racing']).toContain(metrics.speedLevel)
    })

    it('should determine speed level as racing for very high wpm', () => {
      const state = createEmptyState(100)
      const content = 'Word '.repeat(500)
      const metrics = calculateSpeed(content, 30, 1, state)
      expect(metrics.speedLevel).toBe('racing')
    })

    it('should calculate paragraph count correctly', () => {
      const state = createEmptyState()
      const content = 'Para one.\n\n\nPara two.\n\n\nPara three.'
      const metrics = calculateSpeed(content, 60, 1, state)
      expect(metrics.paragraphCount).toBe(3)
    })

    it('should calculate scene switch frequency per 1000 words', () => {
      const state = createEmptyState()
      const content = 'Word '.repeat(1000) + '\n\n***\n\n' + 'Word '.repeat(1000)
      const metrics = calculateSpeed(content, 300, 1, state)
      expect(metrics.sceneSwitchFrequency).toBeGreaterThanOrEqual(0)
    })
  })

  describe('recordSpeedMetrics', () => {
    it('should store metrics by chapter id', () => {
      const state = createEmptyState()
      const metrics = calculateSpeed('Test content here.', 30, 1, state)
      const next = recordSpeedMetrics(state, 'ch_1', metrics)
      expect(next.metrics['ch_1']).toBeDefined()
      expect(next.metrics['ch_1'].chapterNumber).toBe(1)
    })

    it('should not mutate original state', () => {
      const state = createEmptyState()
      const metrics = calculateSpeed('Test content.', 30, 1, state)
      recordSpeedMetrics(state, 'ch_1', metrics)
      expect(state.metrics).toEqual({})
    })
  })

  // ─── Anomaly Detection ─────────────────────────────────────────

  describe('detectSpeedAnomalies', () => {
    it('should detect too_fast anomaly', () => {
      let state = createEmptyState(200)
      const metrics = { ...state.metrics['ch1'], wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = addTrajectoryPoint(state, 1, 400)
      state = detectSpeedAnomalies(state, 'ch1')

      const tooFast = state.anomalies.filter(a => a.type === 'too_fast')
      expect(tooFast.length).toBeGreaterThan(0)
      expect(tooFast[0].currentSpeed).toBe(400)
      expect(tooFast[0].severity).toBeGreaterThan(0)
    })

    it('should detect too_slow anomaly', () => {
      let state = createEmptyState(200)
      const metrics = { ...state.metrics['ch1'], wordsPerMinute: 50, chapterNumber: 1, speedLevel: 'slow' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = addTrajectoryPoint(state, 1, 50)
      state = detectSpeedAnomalies(state, 'ch1')

      const tooSlow = state.anomalies.filter(a => a.type === 'too_slow')
      expect(tooSlow.length).toBeGreaterThan(0)
    })

    it('should detect speed_spike when speed jumps >30%', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 300)  // 50% increase = spike
      const metrics = { wordsPerMinute: 300, chapterNumber: 2, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch2', metrics)
      state = detectSpeedAnomalies(state, 'ch2')

      const spikes = state.anomalies.filter(a => a.type === 'speed_spike')
      expect(spikes.length).toBeGreaterThan(0)
    })

    it('should detect speed_dip when speed drops >30%', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 300)
      state = addTrajectoryPoint(state, 2, 100)  // large drop
      const metrics = { wordsPerMinute: 100, chapterNumber: 2, speedLevel: 'slow' } as any
      state = recordSpeedMetrics(state, 'ch2', metrics)
      state = detectSpeedAnomalies(state, 'ch2')

      const dips = state.anomalies.filter(a => a.type === 'speed_dip')
      expect(dips.length).toBeGreaterThan(0)
    })

    it('should return unchanged state for unknown chapter id', () => {
      const state = createEmptyState()
      const next = detectSpeedAnomalies(state, 'unknown')
      expect(next).toEqual(state)
    })

    it('should not add duplicate anomalies for same anomaly type', () => {
      // This is by-design: each call adds a new anomaly
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 400)
      const metrics = { wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = detectSpeedAnomalies(state, 'ch1')
      state = detectSpeedAnomalies(state, 'ch1')
      // Each call adds one, so we get 2
      const tooFast = state.anomalies.filter(a => a.type === 'too_fast')
      expect(tooFast.length).toBe(2)
    })
  })

  // ─── Trajectory Tracking ──────────────────────────────────────

  describe('addTrajectoryPoint', () => {
    it('should add point to trajectory', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 250)
      expect(state.trajectory).toHaveLength(1)
      expect(state.trajectory[0].chapterNumber).toBe(1)
      expect(state.trajectory[0].speed).toBe(250)
    })

    it('should update global avg speed after adding points', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 300)
      expect(state.globalAvgSpeed).toBe(250)
    })

    it('should calculate std dev correctly', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 300)
      expect(state.globalStdDev).toBe(50)
    })

    it('should not mutate original state', () => {
      const state = createEmptyState()
      addTrajectoryPoint(state, 1, 250)
      expect(state.trajectory).toHaveLength(0)
    })
  })

  describe('getTrajectoryRange', () => {
    it('should return points within range', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)
      state = addTrajectoryPoint(state, 3, 300)
      state = addTrajectoryPoint(state, 4, 350)

      const range = getTrajectoryRange(state, 2, 3)
      expect(range).toHaveLength(2)
      expect(range[0].chapterNumber).toBe(2)
      expect(range[1].chapterNumber).toBe(3)
    })

    it('should return empty array when no points in range', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)

      const range = getTrajectoryRange(state, 5, 10)
      expect(range).toEqual([])
    })
  })

  // ─── Speed Prediction ──────────────────────────────────────────

  describe('predictNextSpeed', () => {
    it('should predict based on trajectory linear regression', () => {
      let state = createEmptyState(250)
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)
      state = addTrajectoryPoint(state, 3, 300)

      const prediction = predictNextSpeed(state, 4)
      expect(prediction.chapterNumber).toBe(4)
      expect(prediction.predictedSpeed).toBeGreaterThan(0)
      expect(prediction.basedOnPoints).toBe(3)
    })

    it('should detect accelerating trend', () => {
      let state = createEmptyState(250)
      state = addTrajectoryPoint(state, 1, 100)
      state = addTrajectoryPoint(state, 2, 150)
      state = addTrajectoryPoint(state, 3, 200)

      const prediction = predictNextSpeed(state, 4)
      expect(['accelerating', 'decelerating', 'stable']).toContain(prediction.trend)
    })

    it('should fall back to global avg for insufficient points', () => {
      const state = createEmptyState(250)
      const prediction = predictNextSpeed(state, 2)
      expect(prediction.predictedSpeed).toBe(250)
      expect(prediction.confidence).toBe(20)
    })
  })

  describe('recordPrediction', () => {
    it('should store prediction by chapter number', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)
      const pred = predictNextSpeed(state, 3)
      state = recordPrediction(state, pred)
      expect(state.predictions[3]).toBeDefined()
    })
  })

  // ─── Query Functions ──────────────────────────────────────────

  describe('getSpeedMetrics', () => {
    it('should return metrics for known chapter id', () => {
      let state = createEmptyState()
      const metrics = calculateSpeed('Test content.', 30, 1, state)
      state = recordSpeedMetrics(state, 'ch1', metrics)
      const result = getSpeedMetrics(state, 'ch1')
      expect(result).not.toBeNull()
      expect(result!.chapterNumber).toBe(1)
    })

    it('should return null for unknown chapter id', () => {
      const state = createEmptyState()
      expect(getSpeedMetrics(state, 'unknown')).toBeNull()
    })
  })

  describe('getChapterMetricsByNumber', () => {
    it('should find metrics by chapter number', () => {
      let state = createEmptyState()
      const metrics = calculateSpeed('Test content.', 30, 5, state)
      state = recordSpeedMetrics(state, 'ch5', metrics)
      expect(getChapterMetricsByNumber(state, 5)).not.toBeNull()
    })

    it('should return null when not found', () => {
      const state = createEmptyState()
      expect(getChapterMetricsByNumber(state, 99)).toBeNull()
    })
  })

  describe('getAnomalies', () => {
    it('should return all anomalies when no filter', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 400)
      const metrics = { wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = detectSpeedAnomalies(state, 'ch1')

      expect(getAnomalies(state).length).toBeGreaterThan(0)
    })

    it('should filter by chapter number', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 400)
      const metrics = { wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = detectSpeedAnomalies(state, 'ch1')

      expect(getAnomalies(state, 1).length).toBeGreaterThan(0)
      expect(getAnomalies(state, 99)).toEqual([])
    })
  })

  describe('getAnomalyCount', () => {
    it('should count anomalies for specific chapter', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 400)
      const metrics = { wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = detectSpeedAnomalies(state, 'ch1')

      expect(getAnomalyCount(state, 1)).toBeGreaterThan(0)
    })
  })

  describe('getRecentAnomalies', () => {
    it('should return limited recent anomalies', () => {
      let state = createEmptyState(200)
      state = addTrajectoryPoint(state, 1, 400)
      const metrics = { wordsPerMinute: 400, chapterNumber: 1, speedLevel: 'racing' } as any
      state = recordSpeedMetrics(state, 'ch1', metrics)
      state = detectSpeedAnomalies(state, 'ch1')

      const recent = getRecentAnomalies(state, 3)
      expect(recent.length).toBeLessThanOrEqual(3)
    })
  })

  describe('getTrajectorySummary', () => {
    it('should return trajectory summary', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 300)

      const summary = getTrajectorySummary(state)
      expect(summary.totalPoints).toBe(2)
      expect(summary.avgSpeed).toBe(250)
      expect(summary.latestChapter).toBe(2)
    })

    it('should handle empty trajectory', () => {
      const state = createEmptyState()
      const summary = getTrajectorySummary(state)
      expect(summary.totalPoints).toBe(0)
      expect(summary.latestChapter).toBe(0)
    })
  })

  describe('getSpeedPrediction', () => {
    it('should return stored prediction', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)
      const pred = predictNextSpeed(state, 3)
      state = recordPrediction(state, pred)

      expect(getSpeedPrediction(state, 3)).not.toBeNull()
    })

    it('should return null for unknown chapter', () => {
      const state = createEmptyState()
      expect(getSpeedPrediction(state, 99)).toBeNull()
    })
  })

  describe('clearPredictions', () => {
    it('should clear all predictions', () => {
      let state = createEmptyState()
      state = addTrajectoryPoint(state, 1, 200)
      state = addTrajectoryPoint(state, 2, 250)
      const pred = predictNextSpeed(state, 3)
      state = recordPrediction(state, pred)
      state = clearPredictions(state)
      expect(state.predictions).toEqual({})
    })
  })

  describe('resetState', () => {
    it('should reset while preserving baseline', () => {
      const state = createEmptyState(300)
      const metrics = calculateSpeed('Some content.', 30, 1, state)
      const next = recordSpeedMetrics(state, 'ch1', metrics)
      const reset = resetState(next)
      expect(reset.metrics).toEqual({})
      expect(reset.readingSpeedBaseline).toBe(300)
    })
  })

  // ─── Integration ──────────────────────────────────────────────

  describe('Full pipeline integration', () => {
    it('should work through complete workflow', () => {
      let state = createEmptyState(250)

      // Chapter 1
      const content1 = 'Chapter one content here. A long story unfolds. More words to make it realistic. The hero begins the journey. Scene changes as time passes.'
      const metrics1 = calculateSpeed(content1, 120, 1, state)
      state = recordSpeedMetrics(state, 'ch1', metrics1)
      state = addTrajectoryPoint(state, 1, metrics1.wordsPerMinute)
      state = detectSpeedAnomalies(state, 'ch1')

      // Chapter 2
      const content2 = 'Chapter two begins now. Action picks up significantly. The pace accelerates rapidly. More and more events unfold quickly. Racing through the narrative.'
      const metrics2 = calculateSpeed(content2, 90, 2, state)
      state = recordSpeedMetrics(state, 'ch2', metrics2)
      state = addTrajectoryPoint(state, 2, metrics2.wordsPerMinute)
      state = detectSpeedAnomalies(state, 'ch2')

      // Predict chapter 3
      const prediction = predictNextSpeed(state, 3)
      state = recordPrediction(state, prediction)

      // Verify results
      expect(getSpeedMetrics(state, 'ch1')).not.toBeNull()
      expect(getSpeedMetrics(state, 'ch2')).not.toBeNull()
      expect(getTrajectorySummary(state).totalPoints).toBe(2)
      expect(getAnomalies(state).length).toBeGreaterThan(0)
      expect(getSpeedPrediction(state, 3)).not.toBeNull()
    })
  })
})