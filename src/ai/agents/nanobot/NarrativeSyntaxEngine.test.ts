import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeSyntax,
  generateSyntaxReport,
  getChapterSyntax,
} from './NarrativeSyntaxEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
  })
})

describe('analyzeSyntax', () => {
  it('should analyze syntax', () => {
    let s = createEmptyState()
    const dist = { simple: 5, compound: 2, complex: 1, 'compound-complex': 0 }
    s = analyzeSyntax(s, 5, 15, dist, 'mixed')
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].avgSentenceLength).toBe(15)
  })

  it('should calculate complexity', () => {
    let s = createEmptyState()
    const dist = { simple: 0, compound: 0, complex: 0, 'compound-complex': 5 }
    s = analyzeSyntax(s, 5, 20, dist, 'hypotactic')
    // complexity = min(100, 20*2.5 + 5*5) = 50 + 25 = 75
    expect(s.markers[0].complexityScore).toBe(75)
  })
})

describe('generateSyntaxReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateSyntaxReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.avgComplexity).toBe(0)
  })

  it('should calculate avg complexity', () => {
    let s = createEmptyState()
    const d1 = { simple: 5, compound: 2, complex: 1, 'compound-complex': 0 }
    const d2 = { simple: 3, compound: 3, complex: 2, 'compound-complex': 1 }
    s = analyzeSyntax(s, 5, 15, d1, 'mixed')
    s = analyzeSyntax(s, 10, 20, d2, 'hypotactic')
    const report = generateSyntaxReport(s)
    expect(report.totalMarkers).toBe(2)
    expect(report.avgComplexity).toBeGreaterThan(0)
  })
})

describe('getChapterSyntax', () => {
  it('should return chapter syntax', () => {
    let s = createEmptyState()
    const dist = { simple: 5, compound: 2, complex: 1, 'compound-complex': 0 }
    s = analyzeSyntax(s, 10, 15, dist, 'mixed')
    const ch10 = getChapterSyntax(s, 10)
    expect(ch10).not.toBeNull()
    expect(ch10!.chapter).toBe(10)
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getChapterSyntax(s, 99)).toBeNull()
  })
})
