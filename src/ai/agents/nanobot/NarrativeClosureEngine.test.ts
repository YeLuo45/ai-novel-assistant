import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordClosure,
  trackLooseEnd,
  resolveLooseEnd,
  generateClosureReport,
} from './NarrativeClosureEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.looseEnds).toEqual([])
  })
})

describe('recordClosure', () => {
  it('should record closure', () => {
    let s = createEmptyState()
    s = recordClosure(s, 28, 'complete', 85, 80, 90)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].closureType).toBe('complete')
    expect(s.markers[0].resolutionQuality).toBe(85)
  })
})

describe('trackLooseEnd', () => {
  it('should track loose end', () => {
    let s = createEmptyState()
    s = trackLooseEnd(s, 'character', 'Alice missing', 10)
    expect(s.looseEnds.length).toBe(1)
    expect(s.looseEnds[0].status).toBe('unresolved')
  })
})

describe('resolveLooseEnd', () => {
  it('should resolve loose end', () => {
    let s = createEmptyState()
    s = trackLooseEnd(s, 'character', 'Alice missing', 10)
    s = resolveLooseEnd(s, 'character', 25)
    expect(s.looseEnds[0].status).toBe('resolved')
    expect(s.looseEnds[0].chapterResolved).toBe(25)
  })

  it('should mark as intentional', () => {
    let s = createEmptyState()
    s = trackLooseEnd(s, 'theme', 'unresolved theme', 10)
    s = resolveLooseEnd(s, 'theme', 28, true)
    expect(s.looseEnds[0].status).toBe('intentional')
  })
})

describe('generateClosureReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateClosureReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.unresolvedCount).toBe(0)
  })

  it('should calculate averages', () => {
    let s = createEmptyState()
    s = recordClosure(s, 28, 'complete', 85, 80, 90)
    s = recordClosure(s, 29, 'open', 60, 70, 75)
    const report = generateClosureReport(s)
    expect(report.totalMarkers).toBe(2)
    // 85+60=145/2=72.5 → Math.round=73
    expect(report.avgResolutionQuality).toBe(73)
    expect(report.avgSatisfaction).toBe(75)
  })

  it('should count unresolved', () => {
    let s = createEmptyState()
    s = trackLooseEnd(s, 'character', 'Alice', 10)
    s = trackLooseEnd(s, 'plot', 'mystery', 15)
    s = resolveLooseEnd(s, 'character', 25)
    const report = generateClosureReport(s)
    expect(report.unresolvedCount).toBe(1)
  })
})
