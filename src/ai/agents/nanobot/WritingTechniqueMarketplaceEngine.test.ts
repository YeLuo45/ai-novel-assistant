/**
 * WritingTechniqueMarketplaceEngine Tests — V500
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerTechnique,
  updateTechniqueStatus,
  getTechniquesByCategory,
  getTechniquesByLevel,
  createAuthorProfile,
  startLearningTechnique,
  masterTechnique,
  purchaseTechnique,
  getAuthorProfile,
  calculateTechniqueScore,
  createTechniqueTemplate,
  rateTemplate,
  searchTechniques,
  getTechniqueProgress,
  getTopTechniquesByScore,
  getCategoryLeaderboard
} from './WritingTechniqueMarketplaceEngine'

describe('WritingTechniqueMarketplaceEngine', () => {
  describe('createEmptyState', () => {
    it('should create state with default coins', () => {
      const state = createEmptyState()
      expect(state.userCoinBalance).toBe(100)
      expect(state.techniques).toEqual({})
    })
  })

  describe('registerTechnique', () => {
    it('should register a technique', () => {
      let state = createEmptyState()
      state = registerTechnique(state, "Show Don't Tell", "Use sensory details", 'style', ['craft'], ['Example'], 'beginner', 10)
      expect(Object.keys(state.techniques)).toHaveLength(1)
      expect(state.techniques[Object.keys(state.techniques)[0]].name).toBe('Show Don\'t Tell')
    })

    it('should register techniques with prerequisites', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'Basic', 'Basic', 'pacing', [], [], 'beginner', 5)
      const basicId = Object.keys(state.techniques)[0]
      state = registerTechnique(state, 'Advanced', 'Advanced', 'pacing', [], [], 'advanced', 15, -1, 'available', [basicId])
      expect(state.techniques[Object.keys(state.techniques)[1]].prerequisiteIds).toContain(basicId)
    })
  })

  describe('getTechniquesByCategory', () => {
    it('should filter by category', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'Pace 1', 'A', 'pacing', [], [], 'beginner', 5)
      state = registerTechnique(state, 'Dialogue 1', 'B', 'dialogue', [], [], 'beginner', 5)
      const pacing = getTechniquesByCategory(state, 'pacing')
      expect(pacing).toHaveLength(1)
      expect(pacing[0].name).toBe('Pace 1')
    })
  })

  describe('getTechniquesByLevel', () => {
    it('should filter by skill level', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'Beginner', 'A', 'pacing', [], [], 'beginner', 5)
      state = registerTechnique(state, 'Advanced', 'B', 'pacing', [], [], 'advanced', 15)
      const advanced = getTechniquesByLevel(state, 'advanced')
      expect(advanced).toHaveLength(1)
    })
  })

  describe('createAuthorProfile', () => {
    it('should create profile', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      const profile = getAuthorProfile(state, 'author1')
      expect(profile?.authorId).toBe('author1')
      expect(profile?.skillLevel).toBe('beginner')
    })
  })

  describe('startLearningTechnique', () => {
    it('should add technique to in-progress', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Basic', 'A', 'pacing', [], [], 'beginner', 10)
      const techId = Object.keys(state.techniques)[0]
      state = startLearningTechnique(state, 'author1', techId)
      const profile = getAuthorProfile(state, 'author1')
      expect(profile?.inProgressTechniqueIds).toContain(techId)
    })

    it('should reject if prerequisites not met', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Basic', 'A', 'pacing', [], [], 'beginner', 10)
      state = registerTechnique(state, 'Advanced', 'B', 'pacing', [], [], 'advanced', 20, -1, 'available', [Object.keys(state.techniques)[0]])
      const advancedId = Object.keys(state.techniques)[1]
      state = startLearningTechnique(state, 'author1', advancedId)
      const profile = getAuthorProfile(state, 'author1')
      expect(profile?.inProgressTechniqueIds).not.toContain(advancedId)
    })
  })

  describe('masterTechnique', () => {
    it('should move from in-progress to mastered and award coins', () => {
      let state = createEmptyState(100)
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Basic', 'A', 'pacing', [], [], 'beginner', 10)
      const techId = Object.keys(state.techniques)[0]
      state = startLearningTechnique(state, 'author1', techId)
      state = masterTechnique(state, 'author1', techId)
      const profile = getAuthorProfile(state, 'author1')
      expect(profile?.masteredTechniqueIds).toContain(techId)
      expect(profile?.totalScore).toBe(10)
      expect(state.userCoinBalance).toBe(105)  // 5 coin reward
    })
  })

  describe('purchaseTechnique', () => {
    it('should deduct coins and unlock technique', () => {
      let state = createEmptyState(100)
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Premium', 'A', 'pacing', [], [], 'advanced', 25, 50)
      const techId = Object.keys(state.techniques)[0]
      state = purchaseTechnique(state, 'author1', techId)
      expect(state.userCoinBalance).toBe(50)
      const profile = getAuthorProfile(state, 'author1')
      expect(profile?.masteredTechniqueIds).toContain(techId)
    })

    it('should reject if insufficient balance', () => {
      let state = createEmptyState(30)
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Premium', 'A', 'pacing', [], [], 'advanced', 25, 50)
      state = purchaseTechnique(state, 'author1', Object.keys(state.techniques)[0])
      expect(state.userCoinBalance).toBe(30)
    })
  })

  describe('calculateTechniqueScore', () => {
    it('should calculate score based on profile', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Basic', 'A', 'pacing', [], [], 'beginner', 10)
      const techId = Object.keys(state.techniques)[0]
      // Manually set category proficiency to ensure non-zero
      state = {
        ...state,
        authorProfiles: {
          ...state.authorProfiles,
          author1: {
            ...state.authorProfiles.author1,
            masteredTechniqueIds: [techId],
            categoryProficiency: { ...state.authorProfiles.author1.categoryProficiency, pacing: 60 }
          }
        }
      }
      const score = calculateTechniqueScore(state, 'author1', techId)
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('createTechniqueTemplate', () => {
    it('should create template', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'T1', 'A', 'pacing', [], [], 'beginner', 5)
      state = registerTechnique(state, 'T2', 'B', 'pacing', [], [], 'beginner', 5)
      const ids = Object.keys(state.techniques)
      state = createTechniqueTemplate(state, 'Pacing Pack', 'All pacing techs', 'author1', ids, 0)
      expect(Object.keys(state.techniqueTemplates)).toHaveLength(1)
    })
  })

  describe('rateTemplate', () => {
    it('should update rating', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'T1', 'A', 'pacing', [], [], 'beginner', 5)
      state = createTechniqueTemplate(state, 'Pack', 'Desc', 'author1', Object.keys(state.techniques), 10)
      const templateId = Object.keys(state.techniqueTemplates)[0]
      state = rateTemplate(state, templateId, 5)
      expect(state.techniqueTemplates[templateId].rating).toBe(5)
      expect(state.techniqueTemplates[templateId].downloadCount).toBe(1)
    })
  })

  describe('searchTechniques', () => {
    it('should find by name', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'Show Don\'t Tell', 'Use sensory details', 'style', [], [], 'beginner', 10)
      const results = searchTechniques(state, 'show')
      expect(results.some(t => t.name.includes('Show')))
    })
  })

  describe('getTechniqueProgress', () => {
    it('should report correct progress', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Basic', 'A', 'pacing', [], [], 'beginner', 10)
      const techId = Object.keys(state.techniques)[0]
      state = startLearningTechnique(state, 'author1', techId)
      const progress = getTechniqueProgress(state, 'author1', techId)
      expect(progress.started).toBe(true)
      expect(progress.completed).toBe(false)
      expect(progress.progress).toBe(50)

      state = masterTechnique(state, 'author1', techId)
      const final = getTechniqueProgress(state, 'author1', techId)
      expect(final.completed).toBe(true)
      expect(final.progress).toBe(100)
    })
  })

  describe('getTopTechniquesByScore', () => {
    it('should return sorted by score', () => {
      let state = createEmptyState()
      state = registerTechnique(state, 'Low', 'A', 'pacing', [], [], 'beginner', 5)
      state = registerTechnique(state, 'High', 'B', 'pacing', [], [], 'master', 50)
      const top = getTopTechniquesByScore(state, 1)
      expect(top[0].name).toBe('High')
    })
  })

  describe('getCategoryLeaderboard', () => {
    it('should rank authors by category proficiency', () => {
      let state = createEmptyState()
      state = createAuthorProfile(state, 'author1')
      state = registerTechnique(state, 'Pacing Tech', 'A', 'pacing', [], [], 'beginner', 10)
      const techId = Object.keys(state.techniques)[0]
      state = startLearningTechnique(state, 'author1', techId)
      state = masterTechnique(state, 'author1', techId)
      const leaderboard = getCategoryLeaderboard(state, 'pacing')
      expect(leaderboard).toHaveLength(1)
      expect(leaderboard[0].categoryProficiency.pacing).toBeGreaterThan(0)
    })
  })
})