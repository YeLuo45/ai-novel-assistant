import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addTimelineEvent,
  markTimeJump,
  setAnchor,
  generateConsistencyReport,
  getTimelineSlice,
  compareChapterTiming,
} from './NarrativeTimeTracker'

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
    s = addTimelineEvent(s, 'ch1', 1, 100, 500, 'Hero leaves home')
    expect(s.events.length).toBe(1)
    expect(s.events[0].narrativeOrder).toBe(1)
  })

  it('should track anchor events', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 100, 500, 'Start', true)
    expect(s.events[0].isAnchor).toBe(true)
  })
})

describe('markTimeJump', () => {
  it('should mark time jump type', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch2', 5, 200, 300, 'Dream')
    const eventId = s.events[0].id
    s = markTimeJump(s, eventId, 'dream_sequence')
    expect(s.events[0].timeJumpType).toBe('dream_sequence')
  })
})

describe('setAnchor', () => {
  it('should set single anchor', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 100, 500, 'Start')
    s = addTimelineEvent(s, 'ch2', 2, 200, 300, 'Middle')
    s = setAnchor(s, s.events[0].id)
    expect(s.events[0].isAnchor).toBe(true)
    expect(s.events[1].isAnchor).toBe(false)
  })
})

describe('generateConsistencyReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateConsistencyReport(s)
    expect(report.totalEvents).toBe(0)
    expect(report.paradoxes).toEqual([])
  })

  it('should detect chronological paradox', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 200, 500, 'Later in story but first in narrative')
    s = addTimelineEvent(s, 'ch2', 2, 100, 300, 'Earlier in story but second')
    const report = generateConsistencyReport(s)
    expect(report.paradoxes.length).toBeGreaterThan(0)
  })

  it('should find narrative gaps', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 100, 500, 'Start')
    s = addTimelineEvent(s, 'ch2', 3, 200, 300, 'Skipped ch2')
    const report = generateConsistencyReport(s)
    expect(report.gaps).toContain(2)
  })
})

describe('getTimelineSlice', () => {
  it('should return events in range', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 100, 500, 'Start')
    s = addTimelineEvent(s, 'ch2', 2, 200, 300, 'Middle')
    s = addTimelineEvent(s, 'ch3', 3, 300, 200, 'End')
    const slice = getTimelineSlice(s, 1, 2)
    expect(slice.length).toBe(2)
  })
})

describe('compareChapterTiming', () => {
  it('should compare chapter timing', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 'ch1', 1, 100, 1000, 'Long chapter')
    s = addTimelineEvent(s, 'ch2', 2, 200, 200, 'Short chapter')
    const result = compareChapterTiming(s, 'ch1', 'ch2')
    expect(result.longerChapter).toBe('ch1')
  })
})
