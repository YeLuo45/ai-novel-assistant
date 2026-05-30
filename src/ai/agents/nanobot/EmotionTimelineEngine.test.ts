/**
 * EmotionTimelineEngine Tests — V504
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addEmotionEntry,
  detectMoodShift,
  calculateImpactScore,
  predictEmotionalImpact,
  getCharacterEmotionAtScene,
  getOverallStoryMood,
  getEmotionTimeline,
  getMoodShiftSummary,
  compareEmotionArcs
} from './EmotionTimelineEngine'

describe('EmotionTimelineEngine', () => {
  describe('createEmptyState', () => {
    it('should create empty state', () => {
      const state = createEmptyState()
      expect(state.arcs).toEqual({})
      expect(state.moodShifts).toEqual([])
      expect(state.impactScores).toEqual({})
    })
  })

  describe('addEmotionEntry', () => {
    it('should add emotion entry to arc', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'Victory')
      expect(Object.keys(state.arcs)).toHaveLength(1)
      expect(state.arcs.char1.entries).toHaveLength(1)
      expect(state.arcs.char1.entries[0].emotion).toBe('joy')
    })

    it('should clamp intensity to 0-100', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'anger', 150, 'Test')
      expect(state.arcs.char1.entries[state.arcs.char1.entries.length - 1].intensity).toBe(100)
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'anger', -20, 'Test')
      expect(state.arcs.char1.entries[state.arcs.char1.entries.length - 1].intensity).toBe(0)
    })

    it('should recompute arc stats', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'Good')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'joy', 60, 'Okay')
      expect(state.arcs.char1.avgIntensity).toBeGreaterThan(0)
    })
  })

  describe('detectMoodShift', () => {
    it('should detect mood shift when emotion changes', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'Victory')
      // Small delay ensures different timestamps
      const state2 = { ...state, arcs: { ...state.arcs } }
      state2.arcs['char1'] = { ...state2.arcs['char1'], entries: [...state2.arcs['char1'].entries] }
      state2.arcs['char1'].entries.push({
        id: 'emo_test2',
        chapterNumber: 1, sceneId: 'scene2', emotion: 'sadness' as const,
        intensity: 70, trigger: 'Loss', duration: 1, timestamp: Date.now() + 1
      })
      state = state2
      state = detectMoodShift(state, 'char1', 'scene2')
      expect(state.moodShifts.length).toBeGreaterThan(0)
      // Check that a shift was detected with different emotions
      const shift = state.moodShifts.find(s => s.toEmotion === 'sadness')
      expect(shift).toBeDefined()
    })

    it('should not detect shift for same emotion', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'joy', 60, 'B')
      state = detectMoodShift(state, 'char1', 'scene2')
      expect(state.moodShifts).toHaveLength(0)
    })
  })

  describe('calculateImpactScore', () => {
    it('should calculate impact for scene', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'trust', 70, 'B')
      state = calculateImpactScore(state, 'scene1')
      const score = state.impactScores['scene1']
      expect(score).toBeDefined()
      expect(score.emotionalWeight).toBe(150)
      expect(score.positivityRatio).toBe(1.0)
    })

    it('should handle empty scene', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = calculateImpactScore(state, 'scene_nonexistent')
      expect(state.impactScores['scene_nonexistent']).toBeUndefined()
    })
  })

  describe('predictEmotionalImpact', () => {
    it('should predict impact for upcoming events', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 60, 'A')
      const predictions = predictEmotionalImpact(state, 'char1', ['win', 'danger', 'meet'])
      expect(predictions['win']).toBeGreaterThan(60)
      expect(predictions['danger']).toBeGreaterThan(60)
    })

    it('should return empty for unknown character', () => {
      const state = createEmptyState()
      const predictions = predictEmotionalImpact(state, 'unknown', ['win'])
      expect(Object.keys(predictions)).toHaveLength(0)
    })
  })

  describe('getCharacterEmotionAtScene', () => {
    it('should return emotion at scene', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      const emotion = getCharacterEmotionAtScene(state, 'char1', 'scene1')
      expect(emotion).toBe('joy')
    })

    it('should return null for unknown character', () => {
      const state = createEmptyState()
      expect(getCharacterEmotionAtScene(state, 'char1', 'scene1')).toBeNull()
    })

    it('should return null for unknown scene', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      expect(getCharacterEmotionAtScene(state, 'char1', 'scene2')).toBeNull()
    })
  })

  describe('getOverallStoryMood', () => {
    it('should compute overall story mood from total intensity', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'joy', 60, 'B')
      state = addEmotionEntry(state, 'char2', 1, 'scene1', 'sadness', 30, 'C')
      const mood = getOverallStoryMood(state)
      expect(mood).toBe('joy')  // joy has 140 total vs sadness 30
    })

    it('should return null for empty state', () => {
      const state = createEmptyState()
      expect(getOverallStoryMood(state)).toBeNull()
    })
  })

  describe('getEmotionTimeline', () => {
    it('should return sorted timeline', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'sadness', 60, 'B')
      const timeline = getEmotionTimeline(state, 'char1')
      expect(timeline).toHaveLength(2)
      expect(timeline[0].sceneId).toBe('scene1')
    })

    it('should return empty for unknown character', () => {
      const state = createEmptyState()
      expect(getEmotionTimeline(state, 'unknown')).toEqual([])
    })
  })

  describe('getMoodShiftSummary', () => {
    it('should count shift types', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'sadness', 90, 'B')
      state = detectMoodShift(state, 'char1', 'scene2')
      const summary = getMoodShiftSummary(state)
      expect(summary.total).toBe(1)
    })
  })

  describe('compareEmotionArcs', () => {
    it('should identify differences between arcs', () => {
      let state = createEmptyState()
      state = addEmotionEntry(state, 'char1', 1, 'scene1', 'joy', 80, 'A')
      state = addEmotionEntry(state, 'char1', 1, 'scene2', 'sadness', 60, 'B')
      state = addEmotionEntry(state, 'char2', 1, 'scene1', 'trust', 70, 'C')
      state = addEmotionEntry(state, 'char2', 1, 'scene2', 'anger', 50, 'D')
      const comparison = compareEmotionArcs(state, 'char1', 'char2')
      // Different characters with different emotions should produce differences
      expect(comparison.differences.length).toBeGreaterThanOrEqual(0)
      // They have different dominant emotions (sadness vs trust)
      expect(comparison.differences.some(d => d.includes('Dominant emotion'))).toBe(true)
    })

    it('should return 0 similarity for unknown characters', () => {
      const state = createEmptyState()
      const comparison = compareEmotionArcs(state, 'unknown1', 'unknown2')
      expect(comparison.similarity).toBe(0)
    })
  })
})