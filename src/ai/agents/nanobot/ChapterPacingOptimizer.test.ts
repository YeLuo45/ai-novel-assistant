import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerChapterScenes,
  setTargetPacingScore,
  generateOptimizationReport,
  compareChapterPacing,
} from './ChapterPacingOptimizer'

describe('createEmptyState', () => {
  it('should create empty pacing state', () => {
    const s = createEmptyState()
    expect(s.scenes).toEqual([])
    expect(s.targetPacingScore).toBe(70)
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerChapterScenes', () => {
  it('should register chapter scenes', () => {
    let s = createEmptyState()
    s = registerChapterScenes(s, 'ch1', [500, 400, 600], [50, 60, 55])
    expect(s.scenes.length).toBe(1)
    expect(s.scenes[0].chapterId).toBe('ch1')
    expect(s.scenes[0].totalScenes).toBe(3)
  })

  it('should calculate scene density as dense', () => {
    let s = createEmptyState()
    s = registerChapterScenes(s, 'ch1', [400, 350, 450], [50, 60, 55])
    expect(s.scenes[0].sceneDensity).toBe('dense')
  })

  it('should detect accelerating rhythm', () => {
    let s = createEmptyState()
    s = registerChapterScenes(s, 'ch1', [300, 400, 500], [30, 50, 80])
    expect(s.scenes[0].pacingRhythm).toBe('accelerating')
  })
})

describe('setTargetPacingScore', () => {
  it('should set target pacing score', () => {
    let s = createEmptyState()
    s = setTargetPacingScore(s, 75)
    expect(s.targetPacingScore).toBe(75)
  })

  it('should clamp score between 0 and 100', () => {
    let s = createEmptyState()
    s = setTargetPacingScore(s, 150)
    expect(s.targetPacingScore).toBe(100)
    s = setTargetPacingScore(s, -20)
    expect(s.targetPacingScore).toBe(0)
  })
})

describe('generateOptimizationReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateOptimizationReport(s)
    expect(report.totalChapters).toBe(0)
    expect(report.overPacedChapters).toEqual([])
  })

  it('should identify over-paced chapters', () => {
    let s = createEmptyState()
    s = setTargetPacingScore(s, 70)
    s = registerChapterScenes(s, 'ch1', [200, 150, 180], [80, 85, 90])  // dense + accelerating = over paced
    const report = generateOptimizationReport(s)
    expect(report.totalChapters).toBe(1)
  })
})

describe('compareChapterPacing', () => {
  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = registerChapterScenes(s, 'ch1', [600, 500], [60, 70])
    s = registerChapterScenes(s, 'ch2', [300, 250], [60, 70])
    const result = compareChapterPacing(s, 'ch1', 'ch2')
    expect(result.fasterChapter).toBe('ch2')
    expect(result.pacingDiff).toBeGreaterThan(0)
  })
})
