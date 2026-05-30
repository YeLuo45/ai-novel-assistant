import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeVoice,
  setTargetVoice,
  generateConsistencyReport,
  compareChapterVoice,
} from './NarrativeVoiceConsistencyEngine'

describe('createEmptyState', () => {
  it('should create empty voice state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.targetVoice).toBeNull()
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeVoice', () => {
  it('should analyze and store voice marker', () => {
    let s = createEmptyState()
    s = analyzeVoice(s, 'ch1', 18, 0.4, 10, 500)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].chapterId).toBe('ch1')
    expect(s.markers[0].pacingTone).toBe('moderate')
  })

  it('should detect fast pacing', () => {
    let s = createEmptyState()
    s = analyzeVoice(s, 'ch1', 8, 0.3, 5, 200)
    expect(s.markers[0].pacingTone).toBe('fast')
  })

  it('should detect slow pacing', () => {
    let s = createEmptyState()
    s = analyzeVoice(s, 'ch1', 25, 0.5, 15, 800)
    expect(s.markers[0].pacingTone).toBe('slow')
  })
})

describe('setTargetVoice', () => {
  it('should set target voice profile', () => {
    let s = createEmptyState()
    s = setTargetVoice(s, 60, 55, 50, 'moderate', 40)
    expect(s.targetVoice).not.toBeNull()
    expect(s.targetVoice!.formalityLevel).toBe(60)
  })
})

describe('generateConsistencyReport', () => {
  it('should return full consistency for empty state', () => {
    const s = createEmptyState()
    const report = generateConsistencyReport(s)
    expect(report.overallConsistency).toBe(100)
    expect(report.chaptersAnalyzed).toBe(0)
  })

  it('should detect inconsistent chapters', () => {
    let s = createEmptyState()
    s = setTargetVoice(s, 50, 50, 50, 'moderate', 50)
    s = analyzeVoice(s, 'ch1', 18, 0.4, 10, 500)  // close to target
    s = analyzeVoice(s, 'ch2', 3, 0.1, 2, 100)   // very different
    const report = generateConsistencyReport(s)
    expect(report.inconsistentChapters).toContain('ch2')
  })

  it('should calculate dominant formality', () => {
    let s = createEmptyState()
    s = analyzeVoice(s, 'ch1', 15, 0.3, 5, 300)
    s = analyzeVoice(s, 'ch2', 20, 0.4, 8, 400)
    const report = generateConsistencyReport(s)
    expect(report.dominantFormality).toBeGreaterThan(0)
  })
})

describe('compareChapterVoice', () => {
  it('should return first chapter for unknown', () => {
    const s = createEmptyState()
    const result = compareChapterVoice(s, 'unknown', 'also_unknown')
    expect(result.moreFormal).toBeTruthy()
  })

  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = analyzeVoice(s, 'ch1', 25, 0.6, 20, 600)  // more formal
    s = analyzeVoice(s, 'ch2', 8, 0.2, 3, 200)   // casual
    const result = compareChapterVoice(s, 'ch1', 'ch2')
    expect(result.moreFormal).toBe('ch1')
    expect(result.moreComplex).toBe('ch1')
  })
})
