import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordTone,
  generateToneReport,
  getChapterTone,
} from './NarrativeToneEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
  })
})

describe('recordTone', () => {
  it('should record tone marker', () => {
    let s = createEmptyState()
    s = recordTone(s, 5, 'warm', 60)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].primaryTone).toBe('warm')
    expect(s.markers[0].temperature).toBe(60)
  })

  it('should calculate stability', () => {
    let s = createEmptyState()
    s = recordTone(s, 5, 'warm', 60)
    s = recordTone(s, 10, 'warm', 55)
    // stability = 100 - |55-60| = 95
    expect(s.markers[1].stabilityScore).toBe(95)
  })

  it('should calculate low stability for shift', () => {
    let s = createEmptyState()
    s = recordTone(s, 5, 'warm', 60)
    s = recordTone(s, 10, 'cold', -60)
    // stability = 100 - |-60-60| = 100-120 = -20 → max(20, -20) = 20
    expect(s.markers[1].stabilityScore).toBe(20)
  })
})

describe('generateToneReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateToneReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.dominantTone).toBeNull()
  })

  it('should identify dominant tone', () => {
    let s = createEmptyState()
    s = recordTone(s, 5, 'warm', 60)
    s = recordTone(s, 10, 'warm', 55)
    s = recordTone(s, 15, 'nostalgic', 30)
    const report = generateToneReport(s)
    expect(report.dominantTone).toBe('warm')
    expect(report.totalMarkers).toBe(3)
  })
})

describe('getChapterTone', () => {
  it('should return chapter tone', () => {
    let s = createEmptyState()
    s = recordTone(s, 10, 'suspenseful', 10)
    const ch10 = getChapterTone(s, 10)
    expect(ch10).not.toBeNull()
    expect(ch10!.chapter).toBe(10)
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getChapterTone(s, 99)).toBeNull()
  })
})
