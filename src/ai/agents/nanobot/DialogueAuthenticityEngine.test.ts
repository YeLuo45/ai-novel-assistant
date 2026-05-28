import { describe, it, expect } from 'vitest'
import {
  createEmptyDialogueAuthenticityState,
  recordDialogue,
  getDialogueAtChapter,
  getAverageAuthenticity,
  formatDialogueSummary,
  formatDialogueDashboard,
} from './DialogueAuthenticityEngine'

describe('createEmptyDialogueAuthenticityState', () => {
  it('should create empty state', () => {
    const state = createEmptyDialogueAuthenticityState()
    expect(state.segments.length).toBe(0)
    expect(state.characterVoices.size).toBe(0)
    expect(state.averageAuthenticity).toBe(0)
  })
})

describe('recordDialogue', () => {
  it('should add first dialogue segment', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I'm not sure about this")
    expect(state.segments.length).toBe(1)
  })

  it('should track speaker', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I'm not sure about this")
    expect(state.characterVoices.has('alice')).toBeTruthy()
  })

  it('should assess authenticity for natural speech', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I don't know, um, maybe it's fine")
    expect(state.segments[0].authenticityScore).toBeGreaterThan(50)
  })

  it('should assess authenticity for unnatural speech', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'The weather is pleasant today is it not')
    expect(state.segments[0].authenticityScore).toBeLessThan(70)
  })

  it('should detect subtext for dismissive speech', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'Fine, whatever you say')
    expect(state.segments[0].subtextDepth).toBeGreaterThan(50)
  })

  it('should detect subtext hint', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'Maybe we should consider that')
    expect(state.segments[0].subtextHint).not.toBe('')
  })

  it('should update current chapter', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 5, 'alice', 'Dialogue')
    expect(state.currentChapter).toBe(5)
  })

  it('should update average authenticity', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I'm not sure")
    expect(state.averageAuthenticity).toBeGreaterThan(0)
  })
})

describe('getDialogueAtChapter', () => {
  it('should return empty for unknown chapter', () => {
    const state = createEmptyDialogueAuthenticityState()
    expect(getDialogueAtChapter(state, 1).length).toBe(0)
  })

  it('should return segments at chapter', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 3, 'alice', 'Dialogue at ch 3')
    state = recordDialogue(state, 5, 'bob', 'Dialogue at ch 5')
    const at3 = getDialogueAtChapter(state, 3)
    expect(at3.length).toBe(1)
    expect(at3[0].speaker).toBe('alice')
  })
})

describe('getAverageAuthenticity', () => {
  it('should return 0 for no segments', () => {
    const state = createEmptyDialogueAuthenticityState()
    expect(getAverageAuthenticity(state)).toBe(0)
  })

  it('should return average across segments', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I'm not sure about this")
    state = recordDialogue(state, 2, 'bob', 'Another dialogue')
    expect(getAverageAuthenticity(state)).toBeGreaterThan(0)
  })
})

describe('formatDialogueSummary', () => {
  it('should show segment count', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'Dialogue')
    state = recordDialogue(state, 2, 'bob', 'Dialogue')
    const summary = formatDialogueSummary(state)
    expect(summary).toContain('Segments: 2')
  })

  it('should show avg authenticity', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', "I'm not sure about this")
    const summary = formatDialogueSummary(state)
    expect(summary).toContain('Avg Authenticity:')
  })

  it('should show character count', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'Dialogue')
    state = recordDialogue(state, 2, 'bob', 'Dialogue')
    const summary = formatDialogueSummary(state)
    expect(summary).toContain('Characters: 2')
  })
})

describe('formatDialogueDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 3, 'alice', 'Dialogue')
    const dashboard = formatDialogueDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show deep subtext segments', () => {
    let state = createEmptyDialogueAuthenticityState()
    state = recordDialogue(state, 1, 'alice', 'Fine, whatever you want')
    const dashboard = formatDialogueDashboard(state)
    expect(dashboard).toContain('Deep Subtext Segments')
  })
})
