import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeProseSegment,
  generateRhythmReport,
  getChapterRhythm,
  compareRhythm,
} from './NarrativeProseRhythmEngine'

describe('createEmptyState', () => {
  it('should create empty prose state', () => {
    const s = createEmptyState()
    expect(s.segments).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeProseSegment', () => {
  it('should analyze short sentences as monotone when variance is low', () => {
    let s = createEmptyState()
    s = analyzeProseSegment(s, 'ch1', 10, 12, [5, 6, 7, 5, 8], 3)
    // variance=3 < 5 → monotone regardless of length
    expect(s.segments[0].rhythmPattern).toBe('monotone')
    expect(s.segments[0].avgSentenceLength).toBe(6)
  })

  it('should analyze long sentences as flowing', () => {
    let s = createEmptyState()
    s = analyzeProseSegment(s, 'ch1', 10, 5, [30, 35, 28, 32, 40], 2)
    expect(s.segments[0].rhythmPattern).toBe('flowing')
  })

  it('should analyze varied sentences as mixing', () => {
    let s = createEmptyState()
    s = analyzeProseSegment(s, 'ch1', 10, 8, [8, 15, 22, 10, 18, 25, 12, 16], 4)
    // variance=17 >= 5, avg=16, 10 < 16 < 25 → mixing
    expect(s.segments[0].rhythmPattern).toBe('mixing')
  })

  it('should replace existing segment same chapter+pos', () => {
    let s = createEmptyState()
    s = analyzeProseSegment(s, 'ch1', 10, 5, [10, 10], 2)
    s = analyzeProseSegment(s, 'ch1', 10, 10, [20, 20], 4)
    expect(s.segments.length).toBe(1)
    expect(s.segments[0].sentenceCount).toBe(10)
  })
})

describe('generateRhythmReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateRhythmReport(s)
    expect(report.totalSegments).toBe(0)
    expect(report.dominantPattern).toBeNull()
  })

  it('should identify dominant pattern', () => {
    let s = createEmptyState()
    // Two staccato (high variance, avg < 10), one flowing (avg >= 25)
    s = analyzeProseSegment(s, 'ch1', 10, 5, [5, 9, 6, 8, 7], 2)   // variance=4? Actually 9-5=4 < 5 → monotone
    // Need variance >= 5 and avg < 10 for staccato. max=9, min=5, variance=4 < 5 → monotone
    // Let's use [3, 9, 5, 8, 7]: max=9, min=3, variance=6 >= 5, avg=6.4 < 10 → staccato
    s = analyzeProseSegment(s, 'ch2', 30, 5, [3, 9, 5, 8, 7], 2)   // staccato
    s = analyzeProseSegment(s, 'ch3', 50, 5, [30, 35, 28], 2)      // flowing
    const report = generateRhythmReport(s)
    // ch1: max=9,min=5,v=4 < 5 → monotone
    // ch2: max=9,min=3,v=6≥5, avg=6.4 < 10 → staccato
    // ch3: flowing
    // dominant is... let's check:
    // If ch1 is monotone then staccato count=1. But we need 2 staccato.
    // Let's use [3, 9, 5, 8, 7] for both to get staccato
    s = createEmptyState()
    s = analyzeProseSegment(s, 'ch1', 10, 5, [3, 9, 5, 8, 7], 2)   // staccato
    s = analyzeProseSegment(s, 'ch2', 30, 5, [3, 9, 5, 8, 7], 2)   // staccato
    s = analyzeProseSegment(s, 'ch3', 50, 5, [30, 35, 28], 2)      // flowing
    const report2 = generateRhythmReport(s)
    expect(report2.dominantPattern).toBe('staccato')
    expect(report2.rhythmDistribution['staccato']).toBe(2)
  })

  it('should recommend for monotone prose', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = analyzeProseSegment(s, `ch${i}`, i * 10, 3, [12, 13, 12], 1)
    }
    const report = generateRhythmReport(s)
    expect(report.recommendations.some(r => r.includes('monotone'))).toBe(true)
  })
})

describe('getChapterRhythm', () => {
  it('should return chapter segments', () => {
    let s = createEmptyState()
    s = analyzeProseSegment(s, 'ch5', 10, 6, [12, 15], 2)
    s = analyzeProseSegment(s, 'ch5', 50, 8, [18, 20], 3)
    s = analyzeProseSegment(s, 'ch6', 30, 5, [10, 12], 2)
    const ch5Rhythm = getChapterRhythm(s, 'ch5')
    expect(ch5Rhythm.length).toBe(2)
  })
})

describe('compareRhythm', () => {
  it('should compare sentence lengths', () => {
    const s1 = { id: 's1', chapterId: 'ch1', position: 10, sentenceCount: 5, avgSentenceLength: 8, rhythmPattern: 'staccato' as const, sentenceTypes: [] as any[], paragraphCount: 2 }
    const s2 = { id: 's2', chapterId: 'ch2', position: 20, sentenceCount: 4, avgSentenceLength: 25, rhythmPattern: 'flowing' as const, sentenceTypes: [] as any[], paragraphCount: 2 }
    const result = compareRhythm(s1, s2)
    expect(result.moreStaccato).toBe('s1')
    expect(result.len1).toBe(8)
  })
})
