/**
 * PacingMomentumEngine Tests — V530
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerScene,
  calculateMomentum,
  detectEngagementDip,
  detectPacingViolation,
  suggestPacingAdjustment,
  calculateChapterPacing,
  smoothMomentumCurve,
  getSceneById,
  getScenesByChapter,
  getPacingSummary
} from './PacingMomentumEngine'

describe('PacingMomentumEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.scenes).toEqual([])
      expect(state.momentumCurve).toEqual([])
      expect(state.currentPacingMode).toBe('balanced')
      expect(state.pacingViolations).toEqual([])
    })
  })

  describe('registerScene', () => {
    it('should register scene', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 1, 10, 20, 60, 70, 'beat', 50)
      expect(state.scenes).toHaveLength(1)
      expect(state.scenes[0].pacingScore).toBe(60)
    })

    it('should not duplicate scene', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 1, 10, 20, 60, 70, 'beat', 50)
      state = registerScene(state, 's1', 2, 30, 40, 80, 90, 'cut', 70)
      expect(state.scenes).toHaveLength(1)
    })

    it('should register multiple scenes in same chapter', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 3, 5, 15, 50, 60, 'beat', 40)
      state = registerScene(state, 's2', 3, 16, 25, 70, 75, 'cut', 60)
      const scenes = getScenesByChapter(state, 3)
      expect(scenes).toHaveLength(2)
    })
  })

  describe('calculateMomentum', () => {
    it('should calculate avg metrics', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 5, 10, 20, 60, 70, 'beat', 50)
      state = registerScene(state, 's2', 5, 21, 30, 80, 90, 'cut', 70)
      state = calculateMomentum(state, 5)
      expect(state.momentumCurve[5]).toBe(70)  // (60+80)/2*0.4 + (70+90)/2*0.3 + (50+70)/2*0.3 rounded
    })

    it('should switch to breathtaking mode', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 10, 5, 15, 95, 90, 'cut', 95)
      state = calculateMomentum(state, 10)
      expect(state.currentPacingMode).toBe('breathtaking')
    })

    it('should switch to meditative mode', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 10, 5, 15, 20, 25, 'fade', 15)
      state = calculateMomentum(state, 10)
      expect(state.currentPacingMode).toBe('meditative')
    })
  })

  describe('detectEngagementDip', () => {
    it('should record dip when below threshold', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 7, 5, 15, 20, 25, 'fade', 15)  // low engagement
      state = calculateMomentum(state, 7)  // momentum < 30
      state = detectEngagementDip(state, 7, 30)
      expect(state.engagementDips).toHaveLength(1)
      expect(state.engagementDips[0].chapter).toBe(7)
    })

    it('should not record when above threshold', () => {
      let state = createEmptyState()
      state = detectEngagementDip(state, 5, 30)
      expect(state.engagementDips).toHaveLength(0)
    })
  })

  describe('detectPacingViolation', () => {
    it('should record violation', () => {
      let state = createEmptyState()
      state = detectPacingViolation(state, 6, 's1', 'Too many consecutive beat transitions')
      expect(state.pacingViolations).toHaveLength(1)
      expect(state.pacingViolations[0].chapter).toBe(6)
    })
  })

  describe('suggestPacingAdjustment', () => {
    it('should suggest increase when too slow', () => {
      let state = createEmptyState()
      state = calculateMomentum(state, 8)
      state = detectPacingViolation(state, 8, 's1', 'sagging')
      const suggested = suggestPacingAdjustment(state, 8)
      expect(suggested).toBeGreaterThan(50)
    })

    it('should suggest decrease when too fast', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 9, 5, 15, 95, 95, 'cut', 95)
      state = calculateMomentum(state, 9)
      const suggested = suggestPacingAdjustment(state, 9)
      expect(suggested).toBeLessThan(95)
    })
  })

  describe('calculateChapterPacing', () => {
    it('should average pacing scores', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 4, 10, 20, 50, 60, 'beat', 40)
      state = registerScene(state, 's2', 4, 21, 30, 70, 65, 'cut', 55)
      const pacing = calculateChapterPacing(state, 4)
      expect(pacing).toBe(60)
    })

    it('should return 50 for unknown chapter', () => {
      const state = createEmptyState()
      expect(calculateChapterPacing(state, 99)).toBe(50)
    })
  })

  describe('smoothMomentumCurve', () => {
    it('should smooth curve', () => {
      let state = createEmptyState()
      state = { ...state, momentumCurve: [0, 30, 60, 90, 0, 0, 0] }
      state = smoothMomentumCurve(state, 3)
      expect(state.momentumCurve[2]).toBe(30)  // (0+30+60)/3 rounded
    })

    it('should return unchanged for short curve', () => {
      let state = createEmptyState()
      state = { ...state, momentumCurve: [50, 60] }
      const result = smoothMomentumCurve(state, 3)
      expect(result.momentumCurve).toEqual([50, 60])
    })
  })

  describe('getSceneById', () => {
    it('should find scene', () => {
      let state = createEmptyState()
      state = registerScene(state, 's_find', 2, 5, 15, 55, 65, 'beat', 45)
      const scene = getSceneById(state, 's_find')
      expect(scene?.sceneId).toBe('s_find')
    })

    it('should return null for unknown', () => {
      const state = createEmptyState()
      expect(getSceneById(state, 'unknown')).toBeNull()
    })
  })

  describe('getScenesByChapter', () => {
    it('should filter by chapter', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 7, 5, 15, 50, 60, 'beat', 40)
      state = registerScene(state, 's2', 7, 16, 25, 70, 65, 'cut', 55)
      state = registerScene(state, 's3', 8, 5, 15, 60, 70, 'beat', 50)
      const scenes = getScenesByChapter(state, 7)
      expect(scenes).toHaveLength(2)
    })
  })

  describe('getPacingSummary', () => {
    it('should compute summary', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 1, 5, 15, 50, 60, 'beat', 40)
      state = registerScene(state, 's2', 2, 5, 15, 70, 75, 'cut', 60)
      state = calculateMomentum(state, 1)
      state = calculateMomentum(state, 2)
      state = detectPacingViolation(state, 2, 's2', 'abrupt cut')
      const summary = getPacingSummary(state)
      expect(summary.totalScenes).toBe(2)
      expect(summary.totalViolations).toBe(1)
    })

    it('should handle empty state', () => {
      const state = createEmptyState()
      const summary = getPacingSummary(state)
      expect(summary.totalScenes).toBe(0)
      expect(summary.avgMomentum).toBe(50)
      expect(summary.currentMode).toBe('balanced')
    })
  })

  describe('pacing mode transitions', () => {
    it('should transition from suspenseful to breathtaking', () => {
      let state = createEmptyState()
      state = registerScene(state, 's1', 11, 5, 15, 75, 80, 'cut', 85)
      state = registerScene(state, 's2', 12, 5, 15, 92, 95, 'dissolve', 98)
      state = calculateMomentum(state, 11)
      state = calculateMomentum(state, 12)
      expect(state.currentPacingMode).toBe('breathtaking')
    })
  })
})