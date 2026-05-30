/**
 * NarrativeVoiceConsistencyEngine Tests — V526
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerNarrativeVoice,
  activateVoice,
  detectVoiceDeviation,
  getVoiceScore,
  compareVoices,
  blendVoices,
  getActiveVoice,
  getVoiceById,
  getConsistencyViolations,
  getVoiceSummary,
  clearViolations,
  transferVoiceToChapter
} from './NarrativeVoiceConsistencyEngine'

describe('NarrativeVoiceConsistencyEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.voices).toEqual({})
      expect(state.activeVoice).toBeNull()
      expect(state.voiceTransitions).toEqual([])
      expect(state.consistencyViolations).toEqual([])
    })
  })

  describe('registerNarrativeVoice', () => {
    it('should register voice', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'formal', 'Formal Voice', 'third_omniscient', { formal: 80, serious: 70 }, 8, 7, 20, 50, ['long_sentences'])
      const voice = getVoiceById(state, 'formal')
      expect(voice).not.toBeNull()
      expect(voice?.perspective).toBe('third_omniscient')
      expect(voice?.quirks).toContain('long_sentences')
    })

    it('should not duplicate voice', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = registerNarrativeVoice(state, 'v1', 'V1 Changed', 'third_limited', {}, 3, 3, 0, 30, ['x'])
      const voice = getVoiceById(state, 'v1')
      expect(voice?.perspective).toBe('first_person')
    })
  })

  describe('activateVoice', () => {
    it('should activate voice', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'Voice 1', 'first_person', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      expect(state.activeVoice).toBe('v1')
      expect(state.currentPerspective).toBe('first_person')
    })

    it('should not record transition for first activation', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      expect(state.voiceTransitions).toHaveLength(0)
    })

    it('should record transition when switching', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = registerNarrativeVoice(state, 'v2', 'V2', 'third_limited', {}, 6, 6, 10, 60, [])
      state = activateVoice(state, 'v1')
      state = activateVoice(state, 'v2')
      expect(state.voiceTransitions).toHaveLength(1)
      expect(state.voiceTransitions[0].fromVoice).toBe('v1')
      expect(state.voiceTransitions[0].toVoice).toBe('v2')
    })
  })

  describe('detectVoiceDeviation', () => {
    it('should detect no deviation when matching', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'third_limited', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 3, 10, 'third_limited', 5, 5, 0)
      expect(state.consistencyViolations).toHaveLength(0)
    })

    it('should detect perspective deviation', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'third_limited', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 3, 10, 'first_person', 5, 5, 0)
      expect(state.consistencyViolations).toHaveLength(1)
      expect(state.consistencyViolations[0].severity).toBe('minor')
    })

    it('should detect multiple deviations as major', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'third_limited', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 3, 10, 'first_person', 9, 9, 80)
      expect(state.consistencyViolations).toHaveLength(1)
      expect(state.consistencyViolations[0].severity).toBe('major')
    })
  })

  describe('getVoiceScore', () => {
    it('should calculate score', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', { formal: 60, serious: 40 }, 7, 8, 30, 70, [])
      const score = getVoiceScore(state, 'v1')
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for unknown voice', () => {
      const state = createEmptyState()
      expect(getVoiceScore(state, 'unknown')).toBe(0)
    })
  })

  describe('compareVoices', () => {
    it('should compare two voices', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = registerNarrativeVoice(state, 'v2', 'V2', 'first_person', {}, 8, 8, 0, 50, [])
      const diff = compareVoices(state, 'v1', 'v2')
      expect(diff).toBeLessThan(0)  // v1 has lower score
    })
  })

  describe('blendVoices', () => {
    it('should blend two voices', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', { formal: 80 }, 5, 5, 0, 50, ['short'])
      state = registerNarrativeVoice(state, 'v2', 'V2', 'third_limited', { formal: 40 }, 8, 8, 50, 70, ['long'])
      const blended = blendVoices(state, 'v1', 'v2', 0.5)
      expect(blended).not.toBeNull()
      expect(blended?.vocabularyLevel).toBe(7)
      expect(blended?.quirks).toContain('short')
      expect(blended?.quirks).toContain('long')
    })

    it('should return null for unknown voice', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      expect(blendVoices(state, 'v1', 'unknown', 0.5)).toBeNull()
    })
  })

  describe('getActiveVoice', () => {
    it('should return active voice', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      expect(getActiveVoice(state)?.voiceId).toBe('v1')
    })

    it('should return null when no active voice', () => {
      const state = createEmptyState()
      expect(getActiveVoice(state)).toBeNull()
    })
  })

  describe('getConsistencyViolations', () => {
    it('should filter by severity', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 1, 10, 'third_limited', 9, 9, 90)  // major
      state = detectVoiceDeviation(state, 2, 10, 'third_limited', 5, 9, 0)     // minor
      const all = getConsistencyViolations(state)
      const major = getConsistencyViolations(state, 'major')
      expect(all).toHaveLength(2)
      expect(major).toHaveLength(1)
    })
  })

  describe('getVoiceSummary', () => {
    it('should compute summary', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = registerNarrativeVoice(state, 'v2', 'V2', 'third_limited', {}, 6, 6, 0, 60, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 1, 10, 'third_limited', 9, 9, 90)
      const summary = getVoiceSummary(state)
      expect(summary.totalVoices).toBe(2)
      expect(summary.activeVoice).toBe('v1')
      expect(summary.majorViolations).toBe(1)
    })
  })

  describe('clearViolations', () => {
    it('should clear all violations', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = activateVoice(state, 'v1')
      state = detectVoiceDeviation(state, 1, 10, 'third_limited', 9, 9, 90)
      state = clearViolations(state)
      expect(state.consistencyViolations).toHaveLength(0)
    })
  })

  describe('transferVoiceToChapter', () => {
    it('should transfer voice with reason', () => {
      let state = createEmptyState()
      state = registerNarrativeVoice(state, 'v1', 'V1', 'first_person', {}, 5, 5, 0, 50, [])
      state = registerNarrativeVoice(state, 'v2', 'V2', 'third_limited', {}, 6, 6, 0, 60, [])
      state = activateVoice(state, 'v1')
      state = transferVoiceToChapter(state, 'v2', 5, 'flashback')
      expect(state.activeVoice).toBe('v2')
      expect(state.voiceTransitions).toHaveLength(1)
      expect(state.voiceTransitions[0].chapter).toBe(5)
      expect(state.voiceTransitions[0].reason).toBe('flashback')
    })
  })
})