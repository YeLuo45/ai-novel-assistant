import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addTransitionLink,
  generateTransitionReport,
  getTransitionBetween,
  getChapterTransitions,
  compareTransitionQuality,
} from './NarrativeTransitionMaster'

describe('createEmptyState', () => {
  it('should create empty transition state', () => {
    const s = createEmptyState()
    expect(s.links).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addTransitionLink', () => {
  it('should add transition link', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 5, 6, 'scene_cut', 3, null)
    // scene_cut: 65 + 9 = 74 → smooth (65-85)
    expect(s.links.length).toBe(1)
    expect(s.links[0].fromChapter).toBe(5)
    expect(s.links[0].quality).toBe('smooth')
  })

  it('should assess parallel as exemplary', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 10, 11, 'parallel', 4, null)
    // parallel: 85 + 12 = 97 >= 85 → exemplary
    expect(s.links[0].quality).toBe('exemplary')
    expect(s.links[0].smoothnessScore).toBeGreaterThan(85)
  })

  it('should improve with callback', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 8, 9, 'mirror', 2, 'echo of ch1')
    expect(s.links[0].callback).toBe('echo of ch1')
    expect(s.links[0].smoothnessScore).toBeGreaterThan(85)
  })
})

describe('generateTransitionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateTransitionReport(s)
    expect(report.totalLinks).toBe(0)
    expect(report.avgSmoothness).toBe(0)
  })

  it('should calculate avg smoothness', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 5, 6, 'parallel', 5, null)
    s = addTransitionLink(s, 6, 7, 'time_jump', 2, null)
    const report = generateTransitionReport(s)
    expect(report.totalLinks).toBe(2)
    expect(report.avgSmoothness).toBeGreaterThan(0)
  })

  it('should count problem transitions', () => {
    let s = createEmptyState()
    // scene_cut with 0 paragraphs: 65+0=65 → functional (not abrupt)
    // time_jump with 0 paragraphs: 50+0=50 → functional (not abrupt)
    // Use scene_cut for functional, but let's verify counts
    s = addTransitionLink(s, 1, 2, 'time_jump', 0, null)
    s = addTransitionLink(s, 2, 3, 'time_jump', 0, null)
    // Both are functional (50→functional), not abrupt
    const report = generateTransitionReport(s)
    // With current thresholds, both transitions should be functional
    expect(report.problemTransitions).toBe(0)
  })
})

describe('getTransitionBetween', () => {
  it('should return link between chapters', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 10, 11, 'sensory', 4, null)
    const link = getTransitionBetween(s, 10, 11)
    expect(link).not.toBeNull()
    expect(link!.transitionType).toBe('sensory')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 5, 6, 'scene_cut', 2, null)
    expect(getTransitionBetween(s, 99, 100)).toBeNull()
  })
})

describe('getChapterTransitions', () => {
  it('should return chapter transitions', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 10, 11, 'parallel', 3, null)
    s = addTransitionLink(s, 11, 12, 'mirror', 4, null)
    const trans = getChapterTransitions(s, 11)
    expect(trans.length).toBe(2)
  })
})

describe('compareTransitionQuality', () => {
  it('should compare smoothness scores', () => {
    let s = createEmptyState()
    s = addTransitionLink(s, 5, 6, 'parallel', 5, null)   // smooth
    s = addTransitionLink(s, 10, 11, 'time_jump', 2, null) // rough
    const result = compareTransitionQuality(s, 5, 6, 10, 11)
    expect(result.score1).toBeGreaterThan(result.score2)
  })
})
