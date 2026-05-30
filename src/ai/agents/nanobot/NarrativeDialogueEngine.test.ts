import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addDialogueBeat,
  generateDialogueReport,
  getSpeakerDialogue,
  getChapterDialogue,
} from './NarrativeDialogueEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
  })
})

describe('addDialogueBeat', () => {
  it('should add dialogue beat', () => {
    let s = createEmptyState()
    s = addDialogueBeat(s, 5, 'hero', 120, 20, 30, 10)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].speakerId).toBe('hero')
    expect(s.beats[0].authenticity).toBeGreaterThan(50)
  })

  it('should calculate authenticity', () => {
    let s = createEmptyState()
    s = addDialogueBeat(s, 1, 'alice', 100, 10, 50, 0)
    // authenticity = 85 - 3 + 10 - 0 = 92
    expect(s.beats[0].authenticity).toBe(92)
  })
})

describe('generateDialogueReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateDialogueReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.avgAuthenticity).toBe(100)
  })

  it('should calculate avg authenticity', () => {
    let s = createEmptyState()
    s = addDialogueBeat(s, 1, 'alice', 100, 10, 30, 20)
    s = addDialogueBeat(s, 2, 'bob', 110, 15, 40, -10)
    const report = generateDialogueReport(s)
    expect(report.totalBeats).toBe(2)
    expect(report.avgAuthenticity).toBeGreaterThan(0)
  })
})

describe('getSpeakerDialogue', () => {
  it('should return speaker beats', () => {
    let s = createEmptyState()
    s = addDialogueBeat(s, 1, 'alice', 100, 10, 30, 10)
    s = addDialogueBeat(s, 2, 'bob', 110, 15, 40, 10)
    s = addDialogueBeat(s, 3, 'alice', 105, 20, 35, 10)
    const aliceDialogue = getSpeakerDialogue(s, 'alice')
    expect(aliceDialogue.length).toBe(2)
  })
})

describe('getChapterDialogue', () => {
  it('should return chapter beats', () => {
    let s = createEmptyState()
    s = addDialogueBeat(s, 5, 'alice', 100, 10, 30, 10)
    s = addDialogueBeat(s, 5, 'bob', 110, 15, 40, 10)
    const chapter5 = getChapterDialogue(s, 5)
    expect(chapter5.length).toBe(2)
  })
})
