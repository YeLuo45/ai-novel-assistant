import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addEndingBeat,
  setEndingType,
  setFinalChapter,
  calculateEndingScore,
  generateEndingReport,
  getEndingByType,
  getSignatureBeats,
} from './NarrativeEndingArchitect'

describe('createEmptyState', () => {
  it('should create empty ending state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
    expect(s.endingType).toBeNull()
    expect(s.typeAlias).toEqual({})
  })
})

describe('addEndingBeat', () => {
  it('should add ending beat', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'final_image', 'ch20', 'The door closes', 90, true)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].isSignature).toBe(true)
    expect(s.beats[0].emotionalImpact).toBe(90)
  })
})

describe('setEndingType', () => {
  it('should set ending type', () => {
    let s = createEmptyState()
    s = setEndingType(s, 'ambiguous')
    expect(s.endingType).toBe('ambiguous')
  })
})

describe('setFinalChapter', () => {
  it('should set final chapter', () => {
    let s = createEmptyState()
    s = setFinalChapter(s, 25)
    expect(s.finalChapter).toBe(25)
  })
})

describe('calculateEndingScore', () => {
  it('should return 50 for empty', () => {
    const s = createEmptyState()
    expect(calculateEndingScore(s)).toBe(50)
  })

  it('should increase with emotional impact', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'final_image', 'ch20', 'Hero walks into sunset', 90)
    s = setEndingType(s, 'resolute')
    const score = calculateEndingScore(s)
    expect(score).toBeGreaterThan(50)
  })
})

describe('generateEndingReport', () => {
  it('should return default for empty', () => {
    const s = createEmptyState()
    const report = generateEndingReport(s)
    expect(report.satisfactionScore).toBe(50)
    expect(report.predictedEndingType).toBeNull()
  })

  it('should predict cliffhanger', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'final_image', 'ch20', 'To be continued...', 70)
    const report = generateEndingReport(s)
    expect(report.predictedEndingType).toBe('cliffhanger')
  })

  it('should recommend opening signature', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'resolution', 'ch20', 'The end', 80)
    const report = generateEndingReport(s)
    expect(report.recommendations).toContain('No opening signature beat - consider echoing the beginning')
  })
})

describe('getEndingByType', () => {
  it('should return beats by type', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'final_image', 'ch20', 'Image 1', 85)
    s = addEndingBeat(s, 'final_line', 'ch20', 'Line 1', 75)
    const images = getEndingByType(s, 'final_image')
    expect(images.length).toBe(1)
  })
})

describe('getSignatureBeats', () => {
  it('should return signature beats', () => {
    let s = createEmptyState()
    s = addEndingBeat(s, 'final_image', 'ch20', 'Opening echo', 90, true)
    s = addEndingBeat(s, 'final_image', 'ch20', 'Regular image', 70, false)
    const signatures = getSignatureBeats(s)
    expect(signatures.length).toBe(1)
    expect(signatures[0].content).toBe('Opening echo')
  })
})
