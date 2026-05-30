import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordStyleMarker,
  generateStyleReport,
  getChapterStyle,
} from './NarrativeStyleEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
  })
})

describe('recordStyleMarker', () => {
  it('should record style marker', () => {
    let s = createEmptyState()
    s = recordStyleMarker(s, 5, 15, 65, 4)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].chapterNumber).toBe(5)
    expect(s.markers[0].vocabularyRichness).toBe(65)
  })

  it('should classify early period', () => {
    let s = createEmptyState()
    s = recordStyleMarker(s, 3, 12, 50, 3)
    expect(s.markers[0].stylePeriod).toBe('early')
  })

  it('should calculate voice consistency', () => {
    let s = createEmptyState()
    s = recordStyleMarker(s, 10, 18, 70, 5)
    // voiceConsistency = 75 + 14 - 0 = 89
    expect(s.markers[0].voiceConsistency).toBe(89)
  })
})

describe('generateStyleReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateStyleReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.dominantPeriod).toBeNull()
  })

  it('should identify dominant period', () => {
    let s = createEmptyState()
    s = recordStyleMarker(s, 3, 12, 50, 3)
    s = recordStyleMarker(s, 10, 15, 55, 4)
    s = recordStyleMarker(s, 17, 18, 60, 5)
    const report = generateStyleReport(s)
    expect(report.totalMarkers).toBe(3)
    expect(report.dominantPeriod).toBeTruthy()
  })
})

describe('getChapterStyle', () => {
  it('should return chapter style', () => {
    let s = createEmptyState()
    s = recordStyleMarker(s, 10, 18, 70, 5)
    const style = getChapterStyle(s, 10)
    expect(style).not.toBeNull()
    expect(style!.chapterNumber).toBe(10)
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getChapterStyle(s, 99)).toBeNull()
  })
})
