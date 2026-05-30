/**
 * SceneBlockingOptimizationEngine Tests — V532
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSceneBlocking,
  addBlockingElement,
  updateSceneClarity,
  checkContinuity,
  setFocusPoints,
  analyzeBlockingDensity,
  getBlockingSummary,
  getSceneById,
  getCharacterPositions
} from './SceneBlockingOptimizationEngine'

describe('SceneBlockingOptimizationEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty', () => {
      const s = createEmptyState()
      expect(s.scenes).toEqual({})
      expect(s.characterPositions).toEqual({})
      expect(s.continuityViolations).toHaveLength(0)
    })
  })

  describe('registerSceneBlocking', () => {
    it('should register scene', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      expect(getSceneById(s, 'sc1')?.location).toBe('garden')
    })
    it('should update heatmap', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'library')
      s = registerSceneBlocking(s, 'sc2', 2, 'library')
      expect(Object.keys(s.spatialHeatmap)).toHaveLength(1)
    })
  })

  describe('addBlockingElement', () => {
    it('should add element', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 0, 0, 0, 'standing', 'calm')
      expect(getSceneById(s, 'sc1')?.blockingElements).toHaveLength(1)
    })
    it('should track character positions', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 5, 3, 0, 'walking', 'happy')
      expect(getCharacterPositions(s, 'alice')).toHaveLength(1)
    })
  })

  describe('updateSceneClarity', () => {
    it('should update clarity', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = updateSceneClarity(s, 'sc1', 75)
      expect(getSceneById(s, 'sc1')?.visualClarity).toBe(75)
    })
    it('should clamp to 0-100', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = updateSceneClarity(s, 'sc1', 150)
      expect(getSceneById(s, 'sc1')?.visualClarity).toBe(100)
    })
  })

  describe('checkContinuity', () => {
    it('should detect jump violation', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 0, 0, 0, 'standing', 'calm')
      s = addBlockingElement(s, 'sc1', 'el2', 'alice', 20, 0, 0, 'walking', 'happy')
      s = checkContinuity(s, 'sc1')
      expect(s.continuityViolations).toHaveLength(1)
    })
    it('should not flag small movement', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'bob', 3, 3, 0, 'sitting', 'neutral')
      s = addBlockingElement(s, 'sc1', 'el2', 'bob', 5, 5, 0, 'standing', 'neutral')
      s = checkContinuity(s, 'sc1')
      expect(s.continuityViolations).toHaveLength(0)
    })
  })

  describe('setFocusPoints', () => {
    it('should set focus', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = setFocusPoints(s, 'sc1', ['alice', 'bob'])
      expect(getSceneById(s, 'sc1')?.focusPoints).toEqual(['alice', 'bob'])
    })
  })

  describe('analyzeBlockingDensity', () => {
    it('should calculate density', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 0, 0, 0, 'standing', 'calm')
      s = addBlockingElement(s, 'sc1', 'el2', 'bob', 10, 0, 0, 'standing', 'calm')
      const d = analyzeBlockingDensity(s, 'sc1')
      expect(d).toBe(10)
    })
    it('should return 0 for no elements', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      expect(analyzeBlockingDensity(s, 'sc1')).toBe(0)
    })
  })

  describe('getBlockingSummary', () => {
    it('should compute summary', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'garden')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 0, 0, 0, 'standing', 'calm')
      s = updateSceneClarity(s, 'sc1', 80)
      const summary = getBlockingSummary(s)
      expect(summary.totalScenes).toBe(1)
      expect(summary.totalBlockingElements).toBe(1)
      expect(summary.avgClarity).toBe(80)
    })
    it('should return null most used location when empty', () => {
      const s = createEmptyState()
      expect(getBlockingSummary(s).mostUsedLocation).toBeNull()
    })
  })

  describe('getSceneById', () => {
    it('should return null for unknown', () => {
      const s = createEmptyState()
      expect(getSceneById(s, 'unknown')).toBeNull()
    })
  })

  describe('getCharacterPositions', () => {
    it('should return empty for unknown character', () => {
      const s = createEmptyState()
      expect(getCharacterPositions(s, 'unknown')).toEqual([])
    })
  })

  describe('multi-scene blocking', () => {
    it('should track 3 characters in scene', () => {
      let s = createEmptyState()
      s = registerSceneBlocking(s, 'sc1', 1, 'ballroom')
      s = addBlockingElement(s, 'sc1', 'el1', 'alice', 0, 0, 0, 'dancing', 'joyful')
      s = addBlockingElement(s, 'sc1', 'el2', 'bob', 5, 5, 0, 'watching', 'curious')
      s = addBlockingElement(s, 'sc1', 'el3', 'carol', 10, 10, 0, 'entering', 'nervous')
      expect(getSceneById(s, 'sc1')?.blockingElements).toHaveLength(3)
    })
  })
})