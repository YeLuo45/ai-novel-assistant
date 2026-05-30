import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerMidpointBeat,
  findMidpointChapter,
  generateMidpointReport,
  getMidpointByChapter,
  compareMidpointImpact,
} from './NarrativeMidpointEngine'

describe('createEmptyState', () => {
  it('should create empty midpoint state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerMidpointBeat', () => {
  it('should register midpoint beat', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 12, 'reversal', 'Hero betrayed', 85, 90, -60)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].midpointType).toBe('reversal')
    expect(s.architecture?.pivotEffect).toBe(-60)
  })

  it('should replace existing beat same chapter', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 10, 'revelation', 'Truth revealed', 70, 75, 40)
    s = registerMidpointBeat(s, 10, 'commitment', 'Hero commits', 80, 85, 30)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].midpointType).toBe('commitment')
  })
})

describe('findMidpointChapter', () => {
  it('should return null for empty', () => {
    expect(findMidpointChapter([])).toBeNull()
  })

  it('should return single chapter', () => {
    const beats = [{ id: 'b1', chapterNumber: 5, midpointType: null as any, content: '', tensionLevel: 50, impactScore: 50, pivotEffect: 0 }]
    expect(findMidpointChapter(beats)).toBe(5)
  })

  it('should return middle chapter', () => {
    const beats = [
      { id: 'b1', chapterNumber: 5, midpointType: null as any, content: '', tensionLevel: 50, impactScore: 50, pivotEffect: 0 },
      { id: 'b2', chapterNumber: 10, midpointType: null as any, content: '', tensionLevel: 50, impactScore: 50, pivotEffect: 0 },
      { id: 'b3', chapterNumber: 15, midpointType: null as any, content: '', tensionLevel: 50, impactScore: 50, pivotEffect: 0 },
    ]
    expect(findMidpointChapter(beats)).toBe(10)
  })
})

describe('generateMidpointReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateMidpointReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.avgImpact).toBe(0)
  })

  it('should calculate avg impact', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 10, 'reversal', 'Beat 1', 70, 70, 30)
    s = registerMidpointBeat(s, 20, 'revelation', 'Beat 2', 80, 90, 50)
    const report = generateMidpointReport(s)
    expect(report.avgImpact).toBe(80)
  })

  it('should detect reversal', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 10, 'reversal', 'Big reversal', 85, 95, -70)
    const report = generateMidpointReport(s)
    expect(report.architecture?.reversalDetected).toBe(true)
  })
})

describe('getMidpointByChapter', () => {
  it('should return chapter beat', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 15, 'crisis', 'Crisis at 15', 80, 85, 40)
    const beat = getMidpointByChapter(s, 15)
    expect(beat).not.toBeNull()
    expect(beat!.midpointType).toBe('crisis')
  })

  it('should return null for missing chapter', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 10, 'revelation', 'Beat', 60, 65, 20)
    expect(getMidpointByChapter(s, 99)).toBeNull()
  })
})

describe('compareMidpointImpact', () => {
  it('should compare impact scores', () => {
    let s = createEmptyState()
    s = registerMidpointBeat(s, 10, 'reversal', 'Beat 10', 70, 60, 20)
    s = registerMidpointBeat(s, 20, 'revelation', 'Beat 20', 80, 90, 50)
    const result = compareMidpointImpact(s, 10, 20)
    expect(result.higherImpact).toBe(20)
    expect(result.impact2).toBe(90)
  })
})
