import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addTransition,
  getTransitionQuality,
  suggestBestNextChapter,
  compareTransitionTypes,
} from './SceneTransitionMatrix'

describe('createEmptyState', () => {
  it('should create empty transition state', () => {
    const s = createEmptyState()
    expect(s.matrix.transitions).toEqual([])
    expect(s.matrix.averageQuality).toBe(70)
    expect(s.typeAlias).toEqual({})
  })
})

describe('addTransition', () => {
  it('should add a transition', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action: fight scene', 'action: another fight')
    expect(s.matrix.transitions.length).toBe(1)
    expect(s.matrix.transitions[0].transitionType).toBe('action_to_action')
  })

  it('should classify action_to_reflection', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action: battle', 'reflection: hero thinks about future')
    expect(s.matrix.transitions[0].transitionType).toBe('action_to_reflection')
  })

  it('should track chapter connections', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action scene', 'action scene 2')
    s = addTransition(s, 'ch1', 'ch3', 'action scene', 'different action')
    expect(s.matrix.chapterConnections['ch1']).toContain('ch2')
    expect(s.matrix.chapterConnections['ch1']).toContain('ch3')
  })
})

describe('getTransitionQuality', () => {
  it('should return 0 for unknown transition', () => {
    const s = createEmptyState()
    expect(getTransitionQuality(s, 'unknown', 'unknown')).toBe(0)
  })

  it('should return transition quality', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action scene', 'action scene 2')
    expect(getTransitionQuality(s, 'ch1', 'ch2')).toBeGreaterThan(0)
  })
})

describe('suggestBestNextChapter', () => {
  it('should return null for unknown chapter', () => {
    const s = createEmptyState()
    expect(suggestBestNextChapter(s, 'unknown', 'maintain')).toBeNull()
  })

  it('should suggest best quality chapter', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action scene', 'action scene 2')
    s = addTransition(s, 'ch1', 'ch3', 'action scene', 'action scene 3')
    expect(suggestBestNextChapter(s, 'ch1', 'maintain')).toBeTruthy()
  })
})

describe('compareTransitionTypes', () => {
  it('should compare transition types', () => {
    let s = createEmptyState()
    s = addTransition(s, 'ch1', 'ch2', 'action scene', 'reflection scene')
    s = addTransition(s, 'ch3', 'ch4', 'action scene', 'action scene 2')
    const result = compareTransitionTypes(s, 'action_to_action', 'action_to_reflection')
    expect(result.betterType).toBeTruthy()
  })
})
