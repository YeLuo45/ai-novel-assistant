/**
 * ContextualToneMappingEngine Tests — V518
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSceneContext,
  registerCharacterProfile,
  generateToneMapping,
  createVoiceTransition,
  interpolateTone,
  applyToneAdjustment,
  getToneMapping,
  getSceneContext,
  getCharacterVoice,
  getVoiceTransition,
  getToneSummary,
  compareToneMappings
} from './ContextualToneMappingEngine'

describe('ContextualToneMappingEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize with default voice', () => {
      const state = createEmptyState()
      expect(state.defaultVoice).toBe('limited')
      expect(state.sceneContexts).toEqual({})
      expect(state.currentMappings).toEqual({})
    })

    it('should allow custom default voice', () => {
      const state = createEmptyState('omniscient')
      expect(state.defaultVoice).toBe('omniscient')
    })
  })

  describe('registerSceneContext', () => {
    it('should register scene context', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'castle', 'night', 'mysterious', ['fear', 'curiosity'], {}, 'hero')
      expect(state.sceneContexts['scene1']).toBeDefined()
      expect(state.sceneContexts['scene1'].location).toBe('castle')
      expect(state.sceneContexts['scene1'].povCharacter).toBe('hero')
    })

    it('should register multiple scenes', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'forest', 'day', 'peaceful', ['calm'])
      state = registerSceneContext(state, 'scene2', 'battlefield', 'dusk', 'violent', ['anger', 'fear'])
      expect(Object.keys(state.sceneContexts)).toHaveLength(2)
    })
  })

  describe('registerCharacterProfile', () => {
    it('should register character voice profile', () => {
      let state = createEmptyState()
      state = registerCharacterProfile(state, 'hero', 'first_person', ['sarcastic'], ['I knew it'], [40, 70], 'external')
      expect(state.characterProfiles['hero']).toBeDefined()
      expect(state.characterProfiles['hero'].preferredVoice).toBe('first_person')
    })

    it('should update existing profile', () => {
      let state = createEmptyState()
      state = registerCharacterProfile(state, 'hero', 'limited', [])
      state = registerCharacterProfile(state, 'hero', 'first_person', ['lyrical'])
      expect(state.characterProfiles['hero'].preferredVoice).toBe('first_person')
      expect(state.characterProfiles['hero'].typicalModifiers).toContain('lyrical')
    })
  })

  describe('generateToneMapping', () => {
    it('should generate mapping from context', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'castle', 'night', 'mysterious', ['fear'])
      state = generateToneMapping(state, 'scene1')
      const mapping = state.currentMappings['scene1']
      expect(mapping).toBeDefined()
      expect(mapping.baseVoice).toBe('omniscient')
      expect(mapping.toneModifiers).toContain('staccato')
    })

    it('should increment scene shift counter', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'forest', 'day', 'peaceful', ['calm'])
      state = generateToneMapping(state, 'scene1')
      expect(state.totalSceneShifts).toBe(1)
    })

    it('should use limited voice for POV scenes', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'forest', 'day', 'peaceful', ['calm'], {}, 'hero')
      state = generateToneMapping(state, 'scene1')
      expect(state.currentMappings['scene1'].baseVoice).toBe('limited')
    })
  })

  describe('createVoiceTransition', () => {
    it('should create gradual transition', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 's1', 'forest', 'day', 'peaceful', ['calm'])
      state = registerSceneContext(state, 's2', 'castle', 'night', 'mysterious', ['fear'])
      state = generateToneMapping(state, 's1')
      state = generateToneMapping(state, 's2')
      state = createVoiceTransition(state, 's1', 's2', 'gradual')
      expect(Object.keys(state.transitions)).toHaveLength(1)
      expect(state.transitions[Object.keys(state.transitions)[0]].transitionType).toBe('gradual')
      expect(state.transitions[Object.keys(state.transitions)[0]].interpolationSteps).toBe(5)
    })

    it('should create abrupt transition', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 's1', 'forest', 'day', 'peaceful', ['calm'])
      state = registerSceneContext(state, 's2', 'castle', 'night', 'violent', ['fear'])
      state = createVoiceTransition(state, 's1', 's2', 'abrupt')
      expect(Object.keys(state.transitions)).toHaveLength(1)
      expect(state.transitions[Object.keys(state.transitions)[0]].interpolationSteps).toBe(1)
    })
  })

  describe('interpolateTone', () => {
    it('should interpolate between mappings', () => {
      const from = {
        id: 'm1', sceneId: 's1', baseVoice: 'limited' as const, toneModifiers: [] as any[],
        vocabularyComplexity: 40, sentenceLengthAverage: 15, dialogueToNarrationRatio: 0.3,
        emotionalDistance: 30, descriptiveDensity: 40, pacingTempo: 50, customAdjustments: {}
      }
      const to = {
        id: 'm2', sceneId: 's2', baseVoice: 'omniscient' as const, toneModifiers: [] as any[],
        vocabularyComplexity: 80, sentenceLengthAverage: 25, dialogueToNarrationRatio: 0.5,
        emotionalDistance: 70, descriptiveDensity: 80, pacingTempo: 80, customAdjustments: {}
      }
      const result = interpolateTone(from, to, 5, 10)
      expect(result.vocabularyComplexity).toBe(60)
      expect(result.emotionalDistance).toBe(50)
    })

    it('should return from mapping at step 0', () => {
      const from = { id: 'm1', sceneId: 's1', baseVoice: 'limited' as const, toneModifiers: [] as any[], vocabularyComplexity: 40, sentenceLengthAverage: 15, dialogueToNarrationRatio: 0.3, emotionalDistance: 30, descriptiveDensity: 40, pacingTempo: 50, customAdjustments: {} }
      const to = { id: 'm2', sceneId: 's2', baseVoice: 'omniscient' as const, toneModifiers: [] as any[], vocabularyComplexity: 80, sentenceLengthAverage: 25, dialogueToNarrationRatio: 0.5, emotionalDistance: 70, descriptiveDensity: 80, pacingTempo: 80, customAdjustments: {} }
      const result = interpolateTone(from, to, 0, 10)
      expect(result.vocabularyComplexity).toBe(40)
    })
  })

  describe('applyToneAdjustment', () => {
    it('should apply custom adjustment', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'castle', 'night', 'mysterious', ['fear'])
      state = generateToneMapping(state, 'scene1')
      state = applyToneAdjustment(state, 'scene1', 'vocabularyComplexity', 85)
      expect(state.currentMappings['scene1'].customAdjustments.vocabularyComplexity).toBe(85)
    })
  })

  describe('getToneMapping', () => {
    it('should return mapping for scene', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'forest', 'day', 'peaceful', ['calm'])
      state = generateToneMapping(state, 'scene1')
      const mapping = getToneMapping(state, 'scene1')
      expect(mapping).not.toBeNull()
    })

    it('should return null for unknown scene', () => {
      const state = createEmptyState()
      expect(getToneMapping(state, 'unknown')).toBeNull()
    })
  })

  describe('getSceneContext', () => {
    it('should return scene context', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 'scene1', 'castle', 'night', 'mysterious', ['fear'], {}, 'hero')
      const ctx = getSceneContext(state, 'scene1')
      expect(ctx).not.toBeNull()
      expect(ctx!.povCharacter).toBe('hero')
    })
  })

  describe('getCharacterVoice', () => {
    it('should return character voice profile', () => {
      let state = createEmptyState()
      state = registerCharacterProfile(state, 'hero', 'first_person', ['sarcastic'])
      const profile = getCharacterVoice(state, 'hero')
      expect(profile).not.toBeNull()
      expect(profile!.typicalModifiers).toContain('sarcastic')
    })
  })

  describe('getVoiceTransition', () => {
    it('should find transition between scenes', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 's1', 'forest', 'day', 'peaceful', ['calm'])
      state = registerSceneContext(state, 's2', 'castle', 'night', 'mysterious', ['fear'])
      state = createVoiceTransition(state, 's1', 's2', 'gradual')
      const trans = getVoiceTransition(state, 's1', 's2')
      expect(trans).not.toBeNull()
      expect(trans!.transitionType).toBe('gradual')
    })
  })

  describe('getToneSummary', () => {
    it('should compute tone summary', () => {
      let state = createEmptyState()
      state = registerSceneContext(state, 's1', 'forest', 'day', 'peaceful', ['calm'])
      state = registerSceneContext(state, 's2', 'castle', 'night', 'mysterious', ['fear'])
      state = generateToneMapping(state, 's1')
      state = generateToneMapping(state, 's2')
      state = createVoiceTransition(state, 's1', 's2', 'gradual')
      const summary = getToneSummary(state)
      expect(summary.totalScenes).toBe(2)
      expect(summary.transitionCount).toBe(1)
    })
  })

  describe('compareToneMappings', () => {
    it('should compare two mappings', () => {
      const map1 = { id: 'm1', sceneId: 's1', baseVoice: 'limited' as const, toneModifiers: ['clipped', 'urgent'] as any[], vocabularyComplexity: 50, sentenceLengthAverage: 18, dialogueToNarrationRatio: 0.35, emotionalDistance: 40, descriptiveDensity: 45, pacingTempo: 60, customAdjustments: {} }
      const map2 = { id: 'm2', sceneId: 's2', baseVoice: 'limited' as const, toneModifiers: ['clipped', 'flowing'] as any[], vocabularyComplexity: 60, sentenceLengthAverage: 20, dialogueToNarrationRatio: 0.4, emotionalDistance: 50, descriptiveDensity: 55, pacingTempo: 70, customAdjustments: {} }
      const result = compareToneMappings(map1, map2)
      expect(result.voiceMatch).toBe(true)
      expect(result.modifierOverlap).toBe(1)
      expect(result.complexityDiff).toBe(10)
    })
  })
})