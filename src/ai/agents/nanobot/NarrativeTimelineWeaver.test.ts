import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addTimelineEvent,
  linkCauseEffect,
  generateTimelineReport,
  getEventsByType,
  getEventChain,
} from './NarrativeTimelineWeaver'

describe('createEmptyState', () => {
  it('should create empty timeline state', () => {
    const s = createEmptyState()
    expect(s.events).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addTimelineEvent', () => {
  it('should add timeline event', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 1, 100, 'Hero wins', 80)
    expect(s.events.length).toBe(1)
    expect(s.events[0].eventType).toBe('present')
    expect(s.events[0].chronologicalOrder).toBe(100)
  })

  it('should sort by chronological order', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'flashback', 5, 50, 'Childhood memory', 70)
    s = addTimelineEvent(s, 'present', 10, 100, 'Current event', 80)
    s = addTimelineEvent(s, 'flashback', 3, 25, 'Early memory', 60)
    expect(s.events[0].chronologicalOrder).toBe(25)
    expect(s.events[2].chronologicalOrder).toBe(100)
  })
})

describe('linkCauseEffect', () => {
  it('should link cause and effect', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 1, 100, 'Hero trains', 60)
    s = addTimelineEvent(s, 'present', 20, 200, 'Hero wins', 80)
    const [id1, id2] = [s.events[0].id, s.events[1].id]
    s = linkCauseEffect(s, id1, id2)
    expect(s.events[0].effectChain).toContain(id2)
    expect(s.events[1].causeChain).toContain(id1)
  })
})

describe('generateTimelineReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateTimelineReport(s)
    expect(report.totalEvents).toBe(0)
    expect(report.timelineQuality).toBe(100)
    expect(report.paradoxCount).toBe(0)
  })

  it('should calculate quality for non-linear timeline', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 1, 100, 'Present 1', 70)
    s = addTimelineEvent(s, 'flashback', 5, 50, 'Memory', 60)
    s = addTimelineEvent(s, 'flashback', 10, 25, 'Early memory', 50)
    const report = generateTimelineReport(s)
    expect(report.totalEvents).toBe(3)
    expect(report.timelineQuality).toBeLessThan(100)
  })

  it('should detect paradoxes', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 10, 100, 'Event A', 70)
    s = addTimelineEvent(s, 'present', 20, 200, 'Event B', 80)
    const [id1, id2] = [s.events[0].id, s.events[1].id]
    // Link B as cause of A (but A is chronological before B)
    s = linkCauseEffect(s, id2, id1)
    const report = generateTimelineReport(s)
    expect(report.paradoxCount).toBe(1)
  })
})

describe('getEventsByType', () => {
  it('should filter by type', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 1, 100, 'Present', 70)
    s = addTimelineEvent(s, 'flashback', 5, 50, 'Flashback', 60)
    s = addTimelineEvent(s, 'flashforward', 10, 150, 'Flashforward', 75)
    const flashbacks = getEventsByType(s, 'flashback')
    expect(flashbacks.length).toBe(1)
    expect(flashbacks[0].content).toBe('Flashback')
  })
})

describe('getEventChain', () => {
  it('should return empty for missing event', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'present', 1, 100, 'Event', 70)
    expect(getEventChain(s, 'nonexistent')).toEqual([])
  })
})
