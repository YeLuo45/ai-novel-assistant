import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addResolutionBeat,
  setEndingType,
  generateResolutionReport,
  getFinalImpression,
} from './NarrativeResolutionArchitect'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
  })
})

describe('addResolutionBeat', () => {
  it('should add resolution beat', () => {
    let s = createEmptyState()
    s = addResolutionBeat(s, 28, 'denouement', 70, 80)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].beatType).toBe('denouement')
    expect(s.beats[0].readerSatisfaction).toBe(76)  // 70*0.4 + 80*0.6 = 28+48=76
  })

  it('should calculate satisfaction', () => {
    let s = createEmptyState()
    s = addResolutionBeat(s, 29, 'final_image', 90, 90)
    expect(s.beats[0].readerSatisfaction).toBe(90)
  })
})

describe('setEndingType', () => {
  it('should set ending type', () => {
    let s = createEmptyState()
    s = setEndingType(s, 'bittersweet')
    expect((s.typeAlias as any).endingType).toBe('bittersweet')
  })
})

describe('generateResolutionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateResolutionReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.endingType).toBeNull()
  })

  it('should calculate avg satisfaction', () => {
    let s = createEmptyState()
    s = addResolutionBeat(s, 28, 'denouement', 70, 80)
    s = addResolutionBeat(s, 29, 'final_image', 80, 85)
    const report = generateResolutionReport(s)
    expect(report.totalBeats).toBe(2)
    expect(report.avgSatisfaction).toBeGreaterThan(0)
  })

  it('should recommend without ending type', () => {
    let s = createEmptyState()
    s = addResolutionBeat(s, 28, 'denouement', 50, 50)
    const report = generateResolutionReport(s)
    expect(report.recommendations.some(r => r.includes('ending type'))).toBe(true)
  })
})

describe('getFinalImpression', () => {
  it('should return average of last 3 beats', () => {
    let s = createEmptyState()
    s = addResolutionBeat(s, 26, 'denouement', 60, 60)
    s = addResolutionBeat(s, 27, 'closure', 70, 70)
    s = addResolutionBeat(s, 28, 'final_image', 80, 80)
    s = addResolutionBeat(s, 29, 'hook', 90, 90)
    const impression = getFinalImpression(s)
    // Last 3: 27, 28, 29 = (70+80+90)/3 = 80
    expect(impression).toBe(80)
  })

  it('should return 0 for empty', () => {
    let s = createEmptyState()
    expect(getFinalImpression(s)).toBe(0)
  })
})
