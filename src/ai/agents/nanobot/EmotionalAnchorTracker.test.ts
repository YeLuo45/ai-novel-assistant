import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerAnchor,
  registerPayoff,
  generateInvestmentReport,
  getChapterInvestment,
  compareChapterInvestment,
} from './EmotionalAnchorTracker'

describe('createEmptyState', () => {
  it('should create empty anchor state', () => {
    const s = createEmptyState()
    expect(s.anchors).toEqual([])
    expect(s.arcs).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerAnchor', () => {
  it('should register emotional anchor', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 50, 'tender_moment', 80, 'The embrace lasted forever', 'love', 75)
    expect(s.anchors.length).toBe(1)
    expect(s.anchors[0].emotionTag).toBe('love')
    expect(s.anchors[0].intensity).toBe(80)
  })

  it('should create chapter arc', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 50, 'conflict', 70, 'The argument erupted', 'anger', 60)
    expect(s.arcs.length).toBe(1)
    expect(s.arcs[0].peakIntensity).toBe(70)
  })

  it('should track multiple anchors per chapter', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'tender_moment', 70, 'A quiet moment', 'love', 60)
    s = registerAnchor(s, 'ch1', 80, 'tension_peak', 90, 'Everything fell apart', 'fear', 80)
    const arc = s.arcs.find(a => a.chapterId === 'ch1')
    expect(arc!.anchors.length).toBe(2)
    expect(arc!.peakIntensity).toBe(90)
    expect(arc!.valleyIntensity).toBe(70)
  })
})

describe('registerPayoff', () => {
  it('should register payoff for anchor', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'mystery', 70, 'Who is the stranger?', 'curiosity', 85)
    const anchorId = s.anchors[0].id
    s = registerPayoff(s, anchorId)
    expect(s.anchors[0].payoffRegistered).toBe(true)
  })

  it('should not affect unrelated anchors', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'mystery', 70, 'Who is the stranger?', 'curiosity', 85)
    s = registerAnchor(s, 'ch1', 80, 'conflict', 60, 'A fight breaks out', 'anger', 50)
    const anchorId = s.anchors[0].id
    s = registerPayoff(s, anchorId)
    expect(s.anchors[1].payoffRegistered).toBe(false)
  })
})

describe('generateInvestmentReport', () => {
  it('should return zero investment for empty state', () => {
    const s = createEmptyState()
    const report = generateInvestmentReport(s)
    expect(report.totalAnchors).toBe(0)
    expect(report.investmentScore).toBe(0)
  })

  it('should calculate investment score', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'tender_moment', 80, 'A loving scene', 'love', 80)
    s = registerAnchor(s, 'ch2', 50, 'conflict', 70, 'A fight', 'anger', 70)
    const report = generateInvestmentReport(s)
    expect(report.totalAnchors).toBe(2)
    expect(report.activeAnchors).toBe(2)
    expect(report.investmentScore).toBeGreaterThan(0)
  })

  it('should count high value anchors', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'mystery', 80, 'Mystery 1', 'curiosity', 85)
    s = registerAnchor(s, 'ch2', 50, 'revelation', 75, 'Reveal', 'surprise', 72)
    s = registerAnchor(s, 'ch3', 50, 'conflict', 50, 'Conflict', 'anger', 30)
    const report = generateInvestmentReport(s)
    expect(report.highValueAnchors).toBe(2)
  })

  it('should suggest recommendations', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'conflict', 70, 'Fight', 'anger', 70)
    s = registerAnchor(s, 'ch2', 50, 'conflict', 65, 'Fight 2', 'anger', 65)
    s = registerAnchor(s, 'ch3', 50, 'conflict', 60, 'Fight 3', 'anger', 60)
    const report = generateInvestmentReport(s)
    expect(report.recommendations.length).toBeGreaterThan(0)
  })
})

describe('getChapterInvestment', () => {
  it('should return 0 for unknown chapter', () => {
    const s = createEmptyState()
    expect(getChapterInvestment(s, 'unknown')).toBe(0)
  })

  it('should return chapter investment score', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'tender_moment', 85, 'A scene', 'love', 80)
    const score = getChapterInvestment(s, 'ch1')
    expect(score).toBeGreaterThan(0)
  })
})

describe('compareChapterInvestment', () => {
  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = registerAnchor(s, 'ch1', 20, 'revelation', 90, 'Big reveal', 'surprise', 90)
    s = registerAnchor(s, 'ch2', 20, 'description', 40, 'A description', 'neutral', 30)
    const result = compareChapterInvestment(s, 'ch1', 'ch2')
    expect(result.moreInvested).toBe('ch1')
    expect(result.investmentDiff).toBeGreaterThan(0)
  })
})
