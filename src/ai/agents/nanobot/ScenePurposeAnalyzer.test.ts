import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeScene,
  generatePurposeReport,
  getChapterContribution,
  compareScenePurpose,
} from './ScenePurposeAnalyzer'

describe('createEmptyState', () => {
  it('should create empty purpose state', () => {
    const s = createEmptyState()
    expect(s.analyses).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeScene', () => {
  it('should analyze a plot-advancing scene', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch1', 'plot_advancement', 800, true, true)
    expect(s.analyses.length).toBe(1)
    expect(s.analyses[0].necessity).toBeGreaterThan(70)
  })

  it('should detect filler scenes', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch2', 'filler', 300, false, false)
    expect(s.analyses[0].necessity).toBeLessThan(30)
  })

  it('should flag long scene without dialogue', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch3', 'world_building', 1200, false, false)
    expect(s.analyses[0].issues.length).toBeGreaterThan(0)
  })
})

describe('generatePurposeReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generatePurposeReport(s)
    expect(report.totalScenes).toBe(0)
    expect(report.fillerScenes).toEqual([])
  })

  it('should count purposes', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch1', 'plot_advancement', 600, true, true)
    s = analyzeScene(s, 'ch2', 'character_development', 400, true, false)
    const report = generatePurposeReport(s)
    expect(report.totalScenes).toBe(2)
    expect(report.purposeCounts['plot_advancement']).toBe(1)
  })

  it('should identify filler scenes', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch1', 'filler', 300, false, false)
    const report = generatePurposeReport(s)
    expect(report.fillerScenes).toContain('ch1')
  })
})

describe('getChapterContribution', () => {
  it('should return 0 for unknown chapter', () => {
    const s = createEmptyState()
    expect(getChapterContribution(s, 'unknown')).toBe(0)
  })

  it('should calculate chapter contribution', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch1', 'plot_advancement', 800, true, true)
    const contribution = getChapterContribution(s, 'ch1')
    expect(contribution).toBeGreaterThan(0)
  })
})

describe('compareScenePurpose', () => {
  it('should compare purposes', () => {
    let s = createEmptyState()
    s = analyzeScene(s, 'ch1', 'plot_advancement', 600, true, true)
    s = analyzeScene(s, 'ch2', 'plot_advancement', 400, true, true)
    s = analyzeScene(s, 'ch3', 'filler', 200, false, false)
    const result = compareScenePurpose(s, 'plot_advancement', 'filler')
    expect(result.moreCommon).toBe('plot_advancement')
  })
})
