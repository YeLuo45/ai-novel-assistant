/**
 * ReaderPersonaEngine Tests — V496
 * Test coverage for ReaderPersonaEngine V495
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createProfile,
  setActiveProfile,
  recordInteraction,
  updateProfileFromHistory,
  predictEmotionalResonance,
  cacheResonance,
  getActiveProfile,
  getProfileById,
  listProfiles
} from './ReaderPersonaEngine'

describe('ReaderPersonaEngine', () => {
  describe('createEmptyState', () => {
    it('should create empty state', () => {
      const state = createEmptyState()
      expect(state.profiles).toEqual([])
      expect(state.activeProfileId).toBeNull()
      expect(state.resonanceCache).toEqual({})
      expect(state.adaptationHistory).toEqual([])
    })
  })

  describe('createProfile', () => {
    it('should create a new reader profile', () => {
      const state = createEmptyState()
      const next = createProfile(state, 'Alice', 'explorer')
      expect(next.profiles).toHaveLength(1)
      expect(next.profiles[0].name).toBe('Alice')
      expect(next.profiles[0].type).toBe('explorer')
      expect(next.profiles[0].engagementScore).toBe(50)
      expect(next.profiles[0].preferredPacing).toBe('medium')
    })

    it('should auto-set active profile', () => {
      const state = createEmptyState()
      const next = createProfile(state, 'Bob', 'critic')
      expect(next.activeProfileId).toBe(next.profiles[0].id)
    })

    it('should support multiple profiles', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      state = createProfile(state, 'Bob', 'connector')
      expect(state.profiles).toHaveLength(2)
    })

    it('should generate unique profile ids', () => {
      const state = createEmptyState()
      const next1 = createProfile(state, 'A', 'explorer')
      const next2 = createProfile(state, 'B', 'planner')
      expect(next1.profiles[0].id).not.toBe(next2.profiles[0].id)
    })
  })

  describe('setActiveProfile', () => {
    it('should set active profile', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      state = createProfile(state, 'Bob', 'connector')
      const next = setActiveProfile(state, profileId)
      expect(next.activeProfileId).toBe(profileId)
    })

    it('should ignore invalid profile id', () => {
      const state = createEmptyState()
      const next = setActiveProfile(state, 'invalid-id')
      expect(next.activeProfileId).toBeNull()
    })
  })

  describe('recordInteraction', () => {
    it('should record interaction to profile', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      const next = recordInteraction(state, profileId, 'ch1', 120, 85, 75, 20)
      expect(next.profiles[0].interactionHistory).toHaveLength(1)
      expect(next.profiles[0].interactionHistory[0].chapterId).toBe('ch1')
      expect(next.profiles[0].interactionHistory[0].dwellTime).toBe(120)
    })

    it('should cap history at 50 entries', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      for (let i = 0; i < 60; i++) {
        state = recordInteraction(state, profileId, `ch${i}`, 100, 70, 60, 15)
      }
      expect(state.profiles[0].interactionHistory).toHaveLength(50)
    })
  })

  describe('updateProfileFromHistory', () => {
    it('should update engagement from history', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      state = recordInteraction(state, profileId, 'ch1', 100, 80, 90, 15)
      state = recordInteraction(state, profileId, 'ch2', 100, 80, 90, 15)
      const next = updateProfileFromHistory(state, profileId)
      expect(next.profiles[0].engagementScore).toBeGreaterThan(50)
    })

    it('should detect slow pacing from low skip rate', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      state = recordInteraction(state, profileId, 'ch1', 200, 70, 60, 20)
      const next = updateProfileFromHistory(state, profileId)
      expect(next.profiles[0].preferredPacing).toBe('slow')
    })

    it('should detect fast pacing from high skip rate', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'planner')
      const profileId = state.profiles[0].id
      state = recordInteraction(state, profileId, 'ch1', 50, 70, 60, 70)
      const next = updateProfileFromHistory(state, profileId)
      expect(next.profiles[0].preferredPacing).toBe('fast')
    })
  })

  describe('predictEmotionalResonance', () => {
    it('should return neutral for unknown profile', () => {
      const state = createEmptyState()
      const result = predictEmotionalResonance(state, 'invalid', 'content1', 'action')
      expect(result.valence).toBe('neutral')
      expect(result.intensity).toBe(50)
    })

    it('should return cached prediction if available', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      const cached = { valence: 'positive' as const, intensity: 90, predictedEngagement: 85, recommendedAdjustments: ['cached'] }
      state = cacheResonance(state, profileId, 'content1', cached)
      const result = predictEmotionalResonance(state, profileId, 'content1', 'action')
      expect(result.valence).toBe('positive')
      expect(result.recommendedAdjustments).toContain('cached')
    })

    it('should recommend adjustments for disengaged reader', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'critic')
      const profileId = state.profiles[0].id
      // Set engagement below 40 to trigger disengagement warning
      state = { ...state, profiles: state.profiles.map(p => p.id === profileId ? { ...p, engagementScore: 35 } : p) }
      const result = predictEmotionalResonance(state, profileId, 'content1', 'mystery')
      expect(result.recommendedAdjustments.some(a => a.includes('disengaged'))).toBe(true)
    })

    it('should generate pacing adjustment for explorer reading romance', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      // Ensure preferred pacing is fast to trigger adjustment
      state = { ...state, profiles: state.profiles.map(p => p.id === profileId ? { ...p, preferredPacing: 'fast' as const, engagementScore: 50 } : p) }
      const result = predictEmotionalResonance(state, profileId, 'content1', 'romance')
      expect(result.recommendedAdjustments.some(a => a.includes('tightening pacing'))).toBe(true)
    })
  })

  describe('cacheResonance', () => {
    it('should cache prediction', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const profileId = state.profiles[0].id
      const pred = { valence: 'positive' as const, intensity: 80, predictedEngagement: 75, recommendedAdjustments: [] }
      const next = cacheResonance(state, profileId, 'content1', pred)
      const cacheKey = `${profileId}:content1`
      expect(next.resonanceCache[cacheKey]).toEqual(pred)
    })
  })

  describe('getActiveProfile', () => {
    it('should return null when no active profile', () => {
      const state = createEmptyState()
      expect(getActiveProfile(state)).toBeNull()
    })

    it('should return active profile', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      expect(getActiveProfile(state)?.name).toBe('Alice')
    })
  })

  describe('getProfileById', () => {
    it('should return null for unknown id', () => {
      const state = createEmptyState()
      expect(getProfileById(state, 'invalid')).toBeNull()
    })

    it('should return profile by id', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      const id = state.profiles[0].id
      expect(getProfileById(state, id)?.name).toBe('Alice')
    })
  })

  describe('listProfiles', () => {
    it('should list all profiles', () => {
      let state = createEmptyState()
      state = createProfile(state, 'Alice', 'explorer')
      state = createProfile(state, 'Bob', 'connector')
      expect(listProfiles(state)).toHaveLength(2)
    })
  })
})