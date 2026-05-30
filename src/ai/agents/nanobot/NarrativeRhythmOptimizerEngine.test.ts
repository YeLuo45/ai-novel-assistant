/**
 * NarrativeRhythmOptimizerEngine Tests — V502
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addBeat,
  detectRhythmPattern,
  detectTensionPhase,
  analyzeRhythm,
  identifyClimaxNodes,
  smoothTensionCurve,
  findWeakSections,
  suggestTensionBoost,
  optimizeRhythm,
  getChapterTension,
  getTensionAtPosition,
  getRhythmSummary
} from './NarrativeRhythmOptimizerEngine'

describe('NarrativeRhythmOptimizerEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.tensionCurves).toEqual({})
      expect(state.climaxNodes).toEqual([])
      expect(state.rhythmAnalysis).toBeNull()
    })
  })

  describe('addBeat', () => {
    it('should add beat to library and curve', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 10, 'dialogue', 40, 30, 'Content', 1)
      expect(Object.keys(state.beatLibrary)).toHaveLength(1)
      expect(state.tensionCurves['ch1']).toBeDefined()
      expect(state.tensionCurves['ch1'].beats).toHaveLength(1)
    })

    it('should clamp tension and position values', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 150, 'action', 120, -10, 'Content', 1)
      const beat = Object.values(state.beatLibrary)[0]
      expect(beat.position).toBe(100)
      expect(beat.tension).toBe(100)
      expect(beat.emotionalIntensity).toBe(0)
    })
  })

  describe('detectRhythmPattern', () => {
    it('should detect increasing pattern', () => {
      const beats = [
        { id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 20, emotionalIntensity: 20, content: 'a' },
        { id: '2', chapterNumber: 1, position: 33, beatType: 'action' as const, tension: 50, emotionalIntensity: 50, content: 'b' },
        { id: '3', chapterNumber: 1, position: 66, beatType: 'action' as const, tension: 80, emotionalIntensity: 80, content: 'c' },
        { id: '4', chapterNumber: 1, position: 100, beatType: 'action' as const, tension: 95, emotionalIntensity: 95, content: 'd' }
      ]
      expect(detectRhythmPattern(beats)).toBe('increasing')
    })

    it('should detect wave pattern', () => {
      const beats = [
        { id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 20, emotionalIntensity: 20, content: 'a' },
        { id: '2', chapterNumber: 1, position: 25, beatType: 'action' as const, tension: 60, emotionalIntensity: 60, content: 'b' },
        { id: '3', chapterNumber: 1, position: 50, beatType: 'action' as const, tension: 30, emotionalIntensity: 30, content: 'c' },
        { id: '4', chapterNumber: 1, position: 75, beatType: 'action' as const, tension: 70, emotionalIntensity: 70, content: 'd' },
        { id: '5', chapterNumber: 1, position: 100, beatType: 'action' as const, tension: 40, emotionalIntensity: 40, content: 'e' }
      ]
      expect(detectRhythmPattern(beats)).toBe('wave')
    })

    it('should return plateau for too few beats', () => {
      const beats = [{ id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 50, emotionalIntensity: 50, content: 'a' }]
      expect(detectRhythmPattern(beats)).toBe('plateau')
    })
  })

  describe('detectTensionPhase', () => {
    it('should detect climax phase', () => {
      const beats = [
        { id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 20, emotionalIntensity: 20, content: 'a' },
        { id: '2', chapterNumber: 1, position: 50, beatType: 'action' as const, tension: 50, emotionalIntensity: 50, content: 'b' },
        { id: '3', chapterNumber: 1, position: 100, beatType: 'action' as const, tension: 85, emotionalIntensity: 85, content: 'c' }
      ]
      expect(detectTensionPhase(beats)).toBe('climax')
    })

    it('should detect falling phase', () => {
      const beats = [
        { id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 80, emotionalIntensity: 80, content: 'a' },
        { id: '2', chapterNumber: 1, position: 50, beatType: 'action' as const, tension: 60, emotionalIntensity: 60, content: 'b' },
        { id: '3', chapterNumber: 1, position: 100, beatType: 'action' as const, tension: 35, emotionalIntensity: 35, content: 'c' }
      ]
      expect(detectTensionPhase(beats)).toBe('falling')
    })
  })

  describe('analyzeRhythm', () => {
    it('should compute rhythm analysis', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'action', 30, 30, 'Content', 1)
      state = addBeat(state, 'ch1', 50, 'dialogue', 60, 50, 'Content', 1)
      state = addBeat(state, 'ch1', 100, 'action', 80, 80, 'Content', 1)
      state = analyzeRhythm(state)
      expect(state.rhythmAnalysis).not.toBeNull()
      expect(state.rhythmAnalysis!.avgTension).toBeGreaterThan(0)
    })

    it('should identify weak sections', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'description', 20, 20, 'Content', 1)
      state = addBeat(state, 'ch1', 50, 'description', 25, 25, 'Content', 1)
      state = addBeat(state, 'ch1', 100, 'description', 20, 20, 'Content', 1)
      state = analyzeRhythm(state)
      expect(state.rhythmAnalysis!.weakSections).toContain('ch1')
    })
  })

  describe('identifyClimaxNodes', () => {
    it('should identify climax nodes', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'action', 20, 20, 'Content', 1)
      state = addBeat(state, 'ch1', 30, 'action', 40, 40, 'Content', 1)
      state = addBeat(state, 'ch1', 60, 'action', 85, 85, 'Content', 1)  // climax
      state = addBeat(state, 'ch1', 100, 'action', 50, 50, 'Content', 1)
      state = identifyClimaxNodes(state, 'ch1')
      expect(state.climaxNodes.length).toBeGreaterThan(0)
    })
  })

  describe('smoothTensionCurve', () => {
    it('should smooth tension values', () => {
      const beats = [
        { id: '1', chapterNumber: 1, position: 0, beatType: 'action' as const, tension: 20, emotionalIntensity: 20, content: 'a' },
        { id: '2', chapterNumber: 1, position: 33, beatType: 'action' as const, tension: 80, emotionalIntensity: 80, content: 'b' },
        { id: '3', chapterNumber: 1, position: 66, beatType: 'action' as const, tension: 20, emotionalIntensity: 20, content: 'c' },
        { id: '4', chapterNumber: 1, position: 100, beatType: 'action' as const, tension: 50, emotionalIntensity: 50, content: 'd' }
      ]
      const smoothed = smoothTensionCurve(beats, 3)
      // The sharp peaks should be smoothed
      expect(smoothed[1].tension).toBeLessThan(80)
    })
  })

  describe('findWeakSections', () => {
    it('should find chapters with low avg tension', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'reflection', 10, 10, 'Content', 1)
      state = addBeat(state, 'ch1', 100, 'reflection', 15, 15, 'Content', 1)
      state = analyzeRhythm(state)
      const weak = findWeakSections(state)
      expect(weak).toContain('ch1')
    })
  })

  describe('suggestTensionBoost', () => {
    it('should recommend boost for low-tension chapters', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'description', 30, 30, 'Content', 1)
      state = addBeat(state, 'ch1', 100, 'description', 25, 25, 'Content', 1)
      state = analyzeRhythm(state)
      const suggestions = suggestTensionBoost(state, 'ch1')
      expect(suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('optimizeRhythm', () => {
    it('should optimize rhythm and return recommendations', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 0, 'action', 20, 20, 'Content', 1)
      state = addBeat(state, 'ch1', 50, 'dialogue', 80, 80, 'Content', 1)
      state = addBeat(state, 'ch1', 100, 'action', 30, 30, 'Content', 1)
      state = identifyClimaxNodes(state, 'ch1')
      const result = optimizeRhythm(state, 'ch1')
      expect(result.smoothedCurve).toBeDefined()
      expect(result.recommendedAdjustments).toBeDefined()
    })
  })

  describe('getChapterTension', () => {
    it('should return tension curve for chapter', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 10, 'dialogue', 50, 50, 'Content', 1)
      const curve = getChapterTension(state, 'ch1')
      expect(curve).not.toBeNull()
      expect(curve!.beats).toHaveLength(1)
    })

    it('should return null for non-existent chapter', () => {
      const state = createEmptyState()
      expect(getChapterTension(state, 'ch999')).toBeNull()
    })
  })

  describe('getTensionAtPosition', () => {
    it('should return tension at approximate position', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 20, 'action', 40, 40, 'Content', 1)
      state = addBeat(state, 'ch1', 60, 'action', 70, 70, 'Content', 1)
      const tension = getTensionAtPosition(state, 'ch1', 40)
      expect(tension).toBe(40)  // closest to position 20
    })

    it('should return default 50 for empty chapter', () => {
      const state = createEmptyState()
      expect(getTensionAtPosition(state, 'ch1', 50)).toBe(50)
    })
  })

  describe('getRhythmSummary', () => {
    it('should return rhythm summary stats', () => {
      let state = createEmptyState()
      state = addBeat(state, 'ch1', 10, 'dialogue', 50, 50, 'Content', 1)
      state = addBeat(state, 'ch1', 60, 'action', 80, 80, 'Content', 1)
      state = identifyClimaxNodes(state, 'ch1')
      state = analyzeRhythm(state)
      const summary = getRhythmSummary(state)
      expect(summary.totalBeats).toBe(2)
      expect(summary.totalClimaxes).toBeGreaterThanOrEqual(0)
      expect(summary.avgTension).toBeGreaterThan(0)
    })
  })
})