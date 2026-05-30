/**
 * NarrativeProgressionIntelligenceEngine Tests — V536
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerMilestone,
  achieveMilestone,
  initCharacterArc,
  updateCharacterArc,
  updateChapterProgress,
  updateStoryHealth,
  calculateGlobalProgress,
  getNextRecommendedMilestone,
  getProgressionSummary
} from './NarrativeProgressionIntelligenceEngine'

describe('NarrativeProgressionIntelligenceEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const s = createEmptyState()
      expect(s.milestones).toEqual({})
      expect(s.characterArcs).toEqual({})
      expect(s.globalProgressScore).toBe(0)
      expect(s.storyHealth.overall).toBe(100)
    })
  })

  describe('registerMilestone', () => {
    it('should register milestone', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'Introduce protagonist', 30)
      expect(s.milestones['m1']).not.toBeNull()
      expect(s.milestones['m1'].type).toBe('setup')
    })
    it('should not duplicate', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'First', 30)
      s = registerMilestone(s, 'm1', 2, 'climax', 'Second', 90)
      expect(s.milestones['m1'].chapter).toBe(1)
    })
  })

  describe('achieveMilestone', () => {
    it('should mark achieved', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'Intro', 30)
      s = achieveMilestone(s, 'm1', 2)
      expect(s.milestones['m1'].achieved).toBe(true)
    })
    it('should enforce prerequisites', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'Setup', 30)
      s = registerMilestone(s, 'm2', 5, 'climax', 'Climax', 90, ['m1'])
      s = achieveMilestone(s, 'm2', 5)  // should fail - m1 not achieved
      expect(s.milestones['m2'].achieved).toBe(false)
    })
    it('should allow when prerequisites met', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'Setup', 30)
      s = registerMilestone(s, 'm2', 5, 'climax', 'Climax', 90, ['m1'])
      s = achieveMilestone(s, 'm1', 2)
      s = achieveMilestone(s, 'm2', 5)
      expect(s.milestones['m2'].achieved).toBe(true)
    })
  })

  describe('initCharacterArc', () => {
    it('should initialize arc', () => {
      let s = createEmptyState()
      s = initCharacterArc(s, 'alice', 'transformation', 'cynical', 'compassionate')
      expect(s.characterArcs['alice']).not.toBeNull()
      expect(s.characterArcs['alice'].arcType).toBe('transformation')
      expect(s.characterArcs['alice'].progressPercent).toBe(0)
    })
  })

  describe('updateCharacterArc', () => {
    it('should update state and progress', () => {
      let s = createEmptyState()
      s = initCharacterArc(s, 'alice', 'growth', 'weak', 'strong')
      s = updateCharacterArc(s, 'alice', 3, 'learning', 'discovers training')
      expect(s.characterArcs['alice'].currentState).toBe('learning')
      expect(s.characterArcs['alice'].progressPercent).toBeGreaterThan(0)
      expect(s.characterArcs['alice'].keyMoments).toHaveLength(1)
    })
    it('should set 100% when target reached', () => {
      let s = createEmptyState()
      s = initCharacterArc(s, 'alice', 'growth', 'weak', 'strong')
      s = updateCharacterArc(s, 'alice', 15, 'strong', 'becomes strong')
      expect(s.characterArcs['alice'].progressPercent).toBe(100)
    })
    it('should ignore unknown character', () => {
      let s = createEmptyState()
      const result = updateCharacterArc(s, 'unknown', 1, 'state', 'moment')
      expect(result).toBe(s)
    })
  })

  describe('updateChapterProgress', () => {
    it('should track progress', () => {
      let s = createEmptyState()
      s = updateChapterProgress(s, 1, 25)
      s = updateChapterProgress(s, 2, 55)
      expect(s.chapterProgress).toHaveLength(2)
      expect(s.chapterProgress[1].velocity).toBe(30)
    })
    it('should update existing chapter', () => {
      let s = createEmptyState()
      s = updateChapterProgress(s, 1, 25)
      s = updateChapterProgress(s, 1, 30)
      expect(s.chapterProgress).toHaveLength(1)
      expect(s.chapterProgress[0].progress).toBe(30)
    })
  })

  describe('updateStoryHealth', () => {
    it('should update and recalculate overall', () => {
      let s = createEmptyState()
      s = updateStoryHealth(s, 70, 80, 90, 60)
      expect(s.storyHealth.pacingHealth).toBe(70)
      expect(s.storyHealth.overall).toBe(77)  // 70*0.2+80*0.3+90*0.3+60*0.2 = 14+24+27+12
    })
  })

  describe('calculateGlobalProgress', () => {
    it('should calculate weighted progress', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'S', 30)
      s = achieveMilestone(s, 'm1', 2)
      s = initCharacterArc(s, 'alice', 'growth', 'weak', 'strong')
      s = updateCharacterArc(s, 'alice', 10, 'strong', 'final')
      s = updateStoryHealth(s, 80, 80, 80, 80)
      const progress = calculateGlobalProgress(s)
      expect(progress).toBeGreaterThan(0)
    })
  })

  describe('getNextRecommendedMilestone', () => {
    it('should return earliest unachieved with met prereqs', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'Setup', 30)
      s = registerMilestone(s, 'm2', 3, 'rising', 'Rising', 60, ['m1'])
      s = registerMilestone(s, 'm3', 5, 'climax', 'Climax', 90, ['m2'])
      s = achieveMilestone(s, 'm1', 2)
      const next = getNextRecommendedMilestone(s)
      expect(next?.id).toBe('m2')
    })
    it('should return null when none available', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'S', 30, ['m2'])
      const next = getNextRecommendedMilestone(s)
      expect(next).toBeNull()
    })
  })

  describe('getProgressionSummary', () => {
    it('should compute summary', () => {
      let s = createEmptyState()
      s = registerMilestone(s, 'm1', 1, 'setup', 'S', 30)
      s = achieveMilestone(s, 'm1', 2)
      s = initCharacterArc(s, 'alice', 'growth', 'weak', 'strong')
      s = updateCharacterArc(s, 'alice', 10, 'strong', 'done')
      s = updateStoryHealth(s, 80, 80, 80, 80)
      const summary = getProgressionSummary(s)
      expect(summary.totalMilestones).toBe(1)
      expect(summary.achievedMilestones).toBe(1)
      expect(summary.totalCharacterArcs).toBe(1)
    })
  })
})