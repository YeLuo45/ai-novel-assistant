import { describe, it, expect } from 'vitest'
import {
  createEmptyDialogueAuthenticityState,
  analyzeDialogue,
  getDialoguesBySpeaker,
  getDialoguesWithSubtext,
  formatDialogueAuthenticitySummary,
  formatDialogueAuthenticityDashboard,
} from './DialogueAuthenticityEngine'

describe('createEmptyDialogueAuthenticityState', () => {
  it('should create empty state', () => {
    const state = createEmptyDialogueAuthenticityState()
    expect(state.entries.length).toBe(0)
    expect(state.averageAuthenticity).toBe(0)
    expect(state.authenticityScore).toBe(100)
  })
})

describe('analyzeDialogue', () => {
  it('should add dialogue entry', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello there', 'casual', false, 0)
    expect(state.entries.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should boost authenticity for dialogues with subtext', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'I am fine', 'casual', false, 0)
    const noSubtext = state.entries[0].authenticityScore
    state = analyzeDialogue(state, 2, 'Jane', 'I am fine', 'casual', true, 0)
    expect(state.entries[1].authenticityScore).toBeGreaterThan(noSubtext)
  })

  it('should penalize high filler word ratio', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'um like you know', 'casual', false, 3)
    expect(state.entries[0].authenticityScore).toBeLessThan(70)
  })

  it('should update average authenticity', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', false, 0)
    state = analyzeDialogue(state, 2, 'Jane', 'Hi there', 'casual', false, 0)
    expect(state.averageAuthenticity).toBeGreaterThan(0)
  })

  it('should track subtext dialogue count', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', true, 0)
    state = analyzeDialogue(state, 2, 'Jane', 'Hi', 'casual', false, 0)
    expect(state.dialoguesWithSubtext).toBe(1)
  })
})

describe('getDialoguesBySpeaker', () => {
  it('should return dialogues for specific speaker', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', false, 0)
    state = analyzeDialogue(state, 2, 'Jane', 'Hi', 'casual', false, 0)
    const johns = getDialoguesBySpeaker(state, 'John')
    expect(johns.length).toBe(1)
    expect(johns[0].speaker).toBe('John')
  })
})

describe('getDialoguesWithSubtext', () => {
  it('should return only dialogues with subtext', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', true, 0)
    state = analyzeDialogue(state, 2, 'Jane', 'Hi', 'casual', false, 0)
    const withSubtext = getDialoguesWithSubtext(state)
    expect(withSubtext.length).toBe(1)
  })
})

describe('formatDialogueAuthenticitySummary', () => {
  it('should show dialogue count', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', false, 0)
    const summary = formatDialogueAuthenticitySummary(state)
    expect(summary).toContain('Total Dialogues: 1')
  })

  it('should show average authenticity', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', false, 0)
    const summary = formatDialogueAuthenticitySummary(state)
    expect(summary).toContain('Average Authenticity:')
  })

  it('should show subtext count', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', true, 0)
    const summary = formatDialogueAuthenticitySummary(state)
    expect(summary).toContain('Dialogues with Subtext: 1')
  })
})

describe('formatDialogueAuthenticityDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 3, 'John', 'Hello', 'casual', false, 0)
    const dashboard = formatDialogueAuthenticityDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show SUBTEXT flag', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = analyzeDialogue(state, 1, 'John', 'Hello', 'casual', true, 0)
    const dashboard = formatDialogueAuthenticityDashboard(state)
    expect(dashboard).toContain('SUBTEXT')
  })
})
