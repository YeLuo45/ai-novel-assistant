import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addToneMarker,
  buildToneArc,
  getToneArc,
  detectToneShift,
  compareToneArcs,
  getNarrativeMood,
} from './NarrativeToneMapper'

describe('createEmptyState', () => {
  it('should create empty tone state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.currentTone).toBe('anticipation')
    expect(s.typeAlias).toEqual({})
  })
})

describe('addToneMarker', () => {
  it('should add tone marker', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 50, 'joy', 80)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].category).toBe('joy')
    expect(s.markers[0].intensity).toBe(80)
  })

  it('should limit markers to 200', () => {
    let s = createEmptyState()
    for (let i = 0; i < 205; i++) {
      s = addToneMarker(s, 'ch1', i, 'joy', 50)
    }
    expect(s.markers.length).toBe(200)
  })
})

describe('buildToneArc', () => {
  it('should build tone arc', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 25, 'joy', 70)
    s = addToneMarker(s, 'ch1', 50, 'joy', 80)
    s = addToneMarker(s, 'ch1', 75, 'joy', 90)
    s = buildToneArc(s, 'ch1')
    const arc = getToneArc(s, 'ch1')
    expect(arc).not.toBeNull()
    expect(arc!.dominantTone).toBe('joy')
    expect(arc!.avgIntensity).toBeGreaterThan(70)
  })
})

describe('getToneArc', () => {
  it('should return null for unknown chapter', () => {
    const s = createEmptyState()
    expect(getToneArc(s, 'unknown')).toBeNull()
  })
})

describe('detectToneShift', () => {
  it('should detect no shift for consistent tone', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 25, 'joy', 70)
    s = addToneMarker(s, 'ch1', 50, 'joy', 80)
    s = addToneMarker(s, 'ch1', 75, 'joy', 75)
    s = buildToneArc(s, 'ch1')
    const result = detectToneShift(s, 'ch1')
    expect(result.hasShift).toBe(false)
  })

  it('should detect sudden shift', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 20, 'joy', 70)
    s = addToneMarker(s, 'ch1', 30, 'joy', 75)
    s = addToneMarker(s, 'ch1', 60, 'sorrow', 85)
    s = addToneMarker(s, 'ch1', 70, 'sorrow', 80)
    s = buildToneArc(s, 'ch1')
    const result = detectToneShift(s, 'ch1')
    expect(result.hasShift).toBe(true)
    expect(result.shiftType).toBe('sudden')
  })
})

describe('compareToneArcs', () => {
  it('should return null for unknown chapters', () => {
    const s = createEmptyState()
    expect(compareToneArcs(s, 'ch1', 'ch2')).toBeNull()
  })

  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 50, 'joy', 90)
    s = addToneMarker(s, 'ch2', 50, 'sorrow', 40)
    s = buildToneArc(s, 'ch1')
    s = buildToneArc(s, 'ch2')
    const result = compareToneArcs(s, 'ch1', 'ch2')
    expect(result).not.toBeNull()
    expect(result!.moreIntense).toBe('ch1')
  })
})

describe('getNarrativeMood', () => {
  it('should return neutral for empty state', () => {
    const s = createEmptyState()
    expect(getNarrativeMood(s)).toBe('neutral')
  })

  it('should return dominant recent mood', () => {
    let s = createEmptyState()
    s = addToneMarker(s, 'ch1', 20, 'joy', 70)
    s = addToneMarker(s, 'ch1', 40, 'joy', 80)
    s = addToneMarker(s, 'ch1', 60, 'sorrow', 60)
    expect(getNarrativeMood(s)).toBe('joy')
  })
})
