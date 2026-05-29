import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerChapter,
  setActBreakdown,
  generateProgressionReport,
  analyzeArcPosition,
  compareActProgression,
} from './NarrativeProgressionAnalyzer'

describe('createEmptyState', () => {
  it('should create empty progression state', () => {
    const s = createEmptyState()
    expect(s.chapters).toEqual({})
    expect(s.arcType).toBe('three-act')
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerChapter', () => {
  it('should register chapter', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1)
    expect(s.chapters['ch1']).toBeDefined()
    expect(s.chapters['ch1'].chapterNumber).toBe(1)
  })

  it('should track connections', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1, ['ch2'])
    expect(s.chapters['ch1'].connectionsTo).toContain('ch2')
  })

  it('should set arc position without breakdown', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1)
    expect(s.chapters['ch1'].arcPosition).toBe('act1')
  })
})

describe('setActBreakdown', () => {
  it('should set act breakdown', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1)
    s = registerChapter(s, 'ch2', 2)
    s = registerChapter(s, 'ch3', 3)
    s = registerChapter(s, 'ch4', 4)
    s = setActBreakdown(s, 1, 3)  // act1 ends ch1, act2 ends ch3
    expect(s.actBreakdown).toEqual({ act1End: 1, act2End: 3, act3Start: 4 })
  })

  it('should update arc positions', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1)
    s = registerChapter(s, 'ch2', 2)
    s = registerChapter(s, 'ch3', 3)
    s = registerChapter(s, 'ch4', 4)
    s = setActBreakdown(s, 1, 3)
    expect(s.chapters['ch1'].arcPosition).toBe('act1')
    expect(s.chapters['ch2'].arcPosition).toBe('act2')
    expect(s.chapters['ch4'].arcPosition).toBe('act3')
  })
})

describe('generateProgressionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateProgressionReport(s)
    expect(report.totalChapters).toBe(0)
    expect(report.stagnationPoints).toEqual([])
  })

  it('should identify stagnation', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1, [], 70, 70)
    s = registerChapter(s, 'ch2', 2, [], 70, 30)  // low progression
    const report = generateProgressionReport(s)
    expect(report.stagnationPoints).toContain('ch2')
  })

  it('should identify pacing issues', () => {
    let s = createEmptyState()
    s = registerChapter(s, 'ch1', 1, [], 30, 70)  // low pacing
    const report = generateProgressionReport(s)
    expect(report.pacingIssues).toContain('ch1')
  })
})

describe('analyzeArcPosition', () => {
  it('should return unknown for unknown chapter', () => {
    const s = createEmptyState()
    const result = analyzeArcPosition(s, 'unknown')
    expect(result.arcPosition).toBe('unknown')
  })

  it('should identify act3 climax', () => {
    let s = createEmptyState()
    s = setActBreakdown(s, 2, 5)
    s = registerChapter(s, 'ch7', 7, [], 80, 80)
    const result = analyzeArcPosition(s, 'ch7')
    expect(result.shouldHaveClimax).toBe(true)
  })
})

describe('compareActProgression', () => {
  it('should compare acts', () => {
    let s = createEmptyState()
    s = setActBreakdown(s, 2, 4)
    s = registerChapter(s, 'ch1', 1, [], 80, 80)
    s = registerChapter(s, 'ch2', 2, [], 70, 70)
    s = registerChapter(s, 'ch5', 5, [], 60, 60)
    const result = compareActProgression(s, 'act1', 'act2')
    expect(result.betterPacing).toBeDefined()
  })
})
