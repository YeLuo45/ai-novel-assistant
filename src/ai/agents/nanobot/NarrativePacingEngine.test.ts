import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  markPacing,
  generatePacingReport,
  getChapterPacing,
} from './NarrativePacingEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
  })
})

describe('markPacing', () => {
  it('should mark slow pacing', () => {
    let s = createEmptyState()
    s = markPacing(s, 5, 1, 'slow', 1500, 3)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].tempo).toBe('slow')
    // 40 + min(10, 1500/200) = 40 + 7.5 = 47.5
    expect(s.markers[0].pacingScore).toBe(47.5)
  })

  it('should cap at 100 for high pacing', () => {
    let s = createEmptyState()
    s = markPacing(s, 10, 1, 'intense', 2500, 5)
    // 95 + min(10, 12.5) = 95+10=105 → capped at 100
    expect(s.markers[0].pacingScore).toBe(100)
  })
})

describe('generatePacingReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generatePacingReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.avgPacing).toBe(0)
  })

  it('should calculate avg pacing', () => {
    let s = createEmptyState()
    s = markPacing(s, 5, 1, 'slow', 1500, 3)
    s = markPacing(s, 10, 1, 'fast', 2500, 4)
    const report = generatePacingReport(s)
    expect(report.totalMarkers).toBe(2)
    expect(report.avgPacing).toBeGreaterThan(0)
  })

  it('should count tempo breakdown', () => {
    let s = createEmptyState()
    s = markPacing(s, 5, 1, 'slow', 1500, 3)
    s = markPacing(s, 10, 1, 'fast', 2500, 4)
    s = markPacing(s, 15, 1, 'fast', 2000, 4)
    const report = generatePacingReport(s)
    expect(report.tempoBreakdown.slow).toBe(1)
    expect(report.tempoBreakdown.fast).toBe(2)
  })
})

describe('getChapterPacing', () => {
  it('should return chapter markers', () => {
    let s = createEmptyState()
    s = markPacing(s, 5, 1, 'slow', 1500, 3)
    s = markPacing(s, 5, 2, 'moderate', 2000, 3)
    const ch5 = getChapterPacing(s, 5)
    expect(ch5.length).toBe(2)
  })
})
