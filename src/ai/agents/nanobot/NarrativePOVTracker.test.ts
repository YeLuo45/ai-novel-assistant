import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordPOVShift,
  markUnreliableNarrator,
  generatePOVReport,
  getChapterShifts,
  getPOVByCharacter,
} from './NarrativePOVTracker'

describe('createEmptyState', () => {
  it('should create empty POV state', () => {
    const s = createEmptyState()
    expect(s.shifts).toEqual([])
    expect(s.currentPOV).toBe('third_limited')
    expect(s.narratorReliability).toBe('reliable')
    expect(s.typeAlias).toEqual({})
  })
})

describe('recordPOVShift', () => {
  it('should record intentional shift', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch5', 50, 'third_limited', 'first_person', 'hero', true)
    expect(s.shifts.length).toBe(1)
    expect(s.shifts[0].isIntentional).toBe(true)
    expect(s.currentPOV).toBe('first_person')
  })

  it('should flag accidental shift', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch3', 20, 'third_limited', 'first_person', 'hero', false)
    s = recordPOVShift(s, 'ch3', 40, 'first_person', 'third_omniscient', 'narrator', false)
    // Second shift in same chapter without intentional=true should be flagged
    expect(s.shifts.length).toBe(2)
  })
})

describe('markUnreliableNarrator', () => {
  it('should mark narrator as unreliable', () => {
    let s = createEmptyState()
    s = markUnreliableNarrator(s, true)
    expect(s.narratorReliability).toBe('unreliable')
  })
})

describe('generatePOVReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generatePOVReport(s)
    expect(report.totalShifts).toBe(0)
    expect(report.intentionalShifts).toBe(0)
  })

  it('should count shift types', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch1', 10, 'third_limited', 'first_person', 'hero', true)
    s = recordPOVShift(s, 'ch2', 20, 'first_person', 'third_limited', 'hero', true)
    s = recordPOVShift(s, 'ch3', 30, 'third_limited', 'first_person', 'sidekick', false)
    const report = generatePOVReport(s)
    expect(report.totalShifts).toBe(3)
    expect(report.intentionalShifts).toBe(2)
    expect(report.accidentalShifts).toBe(1)
  })

  it('should track POV distribution', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch1', 10, 'third_limited', 'first_person', 'hero', true)
    s = recordPOVShift(s, 'ch2', 20, 'first_person', 'third_limited', 'hero', true)
    const report = generatePOVReport(s)
    expect(report.povDistribution['first_person']).toBe(1)
    expect(report.povDistribution['third_limited']).toBe(1)
  })
})

describe('getChapterShifts', () => {
  it('should return chapter shifts', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch5', 10, 'third_limited', 'first_person', 'hero', true)
    s = recordPOVShift(s, 'ch6', 20, 'first_person', 'third_limited', 'hero', true)
    const ch5Shifts = getChapterShifts(s, 'ch5')
    expect(ch5Shifts.length).toBe(1)
  })
})

describe('getPOVByCharacter', () => {
  it('should return character shifts', () => {
    let s = createEmptyState()
    s = recordPOVShift(s, 'ch1', 10, 'third_limited', 'first_person', 'hero', true)
    s = recordPOVShift(s, 'ch2', 20, 'first_person', 'third_limited', 'sidekick', true)
    const heroShifts = getPOVByCharacter(s, 'hero')
    expect(heroShifts.length).toBe(1)
  })
})
