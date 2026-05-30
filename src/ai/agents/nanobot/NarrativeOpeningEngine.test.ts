import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addOpeningBeat,
  detectHookType,
  generateOpeningReport,
  getBeatsByType,
  getChapterOpening,
} from './NarrativeOpeningEngine'

describe('createEmptyState', () => {
  it('should create empty opening state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addOpeningBeat', () => {
  it('should add opening beat', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'Why did the tower fall?', 85, 1, 5)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].beatType).toBe('hook')
    expect(s.beats[0].effectiveness).toBe(85)
  })
})

describe('detectHookType', () => {
  it('should detect question hook', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'Who is at the door?', 70, 1, 0)
    expect(detectHookType(s)).toBe('question')
  })

  it('should detect dialogue hook', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', '"You will regret this," she said.', 80, 1, 0)
    expect(detectHookType(s)).toBe('dialogue')
  })

  it('should return null when no hook', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'setup', 'The world was different.', 60, 1, 20)
    expect(detectHookType(s)).toBeNull()
  })
})

describe('generateOpeningReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateOpeningReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.predictedEngagement).toBe(50)
  })

  it('should calculate engagement', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'The storm came.', 80, 1, 5)
    s = addOpeningBeat(s, 'inciting_incident', 'Village attacked', 75, 1, 25)
    const report = generateOpeningReport(s)
    expect(report.predictedEngagement).toBeGreaterThan(50)
  })

  it('should recommend late inciting incident', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'Beginning', 70, 1, 5)
    s = addOpeningBeat(s, 'inciting_incident', 'Incident', 65, 1, 60)
    const report = generateOpeningReport(s)
    expect(report.recommendations.some(r => r.includes('too late'))).toBe(true)
  })
})

describe('getBeatsByType', () => {
  it('should return beats by type', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'Hook content', 80, 1, 5)
    s = addOpeningBeat(s, 'world_intro', 'World content', 60, 1, 20)
    const hooks = getBeatsByType(s, 'hook')
    expect(hooks.length).toBe(1)
    expect(hooks[0].content).toBe('Hook content')
  })
})

describe('getChapterOpening', () => {
  it('should return chapter beats', () => {
    let s = createEmptyState()
    s = addOpeningBeat(s, 'hook', 'Ch1 hook', 80, 1, 5)
    s = addOpeningBeat(s, 'setup', 'Ch2 setup', 65, 2, 10)
    const ch1 = getChapterOpening(s, 1)
    expect(ch1.length).toBe(1)
    expect(ch1[0].chapterNumber).toBe(1)
  })
})
