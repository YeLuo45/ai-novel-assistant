import { describe, it, expect } from 'vitest'
import {
  createEmptySubtextLayerState,
  analyzeDialogue,
  getSubtextAtChapter,
  getDeepDialogues,
  formatSubtextSummary,
  formatSubtextDashboard,
} from './SubtextLayerEngine'

describe('createEmptySubtextLayerState', () => {
  it('should create empty state', () => {
    const state = createEmptySubtextLayerState()
    expect(state.dialogues.length).toBe(0)
    expect(state.averageDepth).toBe(0)
    expect(state.dominantCategory).toBeNull()
  })
})

describe('analyzeDialogue', () => {
  it('should analyze dialogue for subtext', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'I am fine.')
    expect(state.dialogues.length).toBe(1)
    expect(state.dialogues[0].speaker).toBe('Alice')
  })

  it('should detect emotional subtext', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Whatever you think is fine.')
    expect(state.dialogues[0].subtextDepth).toBeGreaterThan(20)
    expect(state.dialogues[0].categories).toContain('emotional')
  })

  it('should detect power dynamics', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Boss', 'You must do what I say.')
    expect(state.dialogues[0].categories).toContain('power')
  })

  it('should detect romantic tension', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'I miss the way things were.')
    expect(state.dialogues[0].categories).toContain('romantic')
  })

  it('should detect conflict markers', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'I hear you, but I disagree.')
    expect(state.dialogues[0].categories).toContain('conflict')
  })

  it('should calculate average depth', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Direct statement.')
    state = analyzeDialogue(state, 2, 'Bob', 'Fine whatever.')
    expect(state.averageDepth).toBeGreaterThan(0)
  })

  it('should update current chapter', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 3, 'Alice', 'Something')
    expect(state.currentChapter).toBe(3)
  })

  it('should detect dominant category', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Whatever you want.')
    state = analyzeDialogue(state, 2, 'Bob', 'Whatever you prefer.')
    state = analyzeDialogue(state, 3, 'Carol', 'Sure, fine.')
    expect(state.dominantCategory).toBe('emotional')
  })

  it('should add interpretation meaning', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Fine, do what you want.')
    expect(state.dialogues[0].meaning).not.toBe('')
  })

  it('should calculate tension level', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'I hate the way this is going.')
    expect(state.dialogues[0].tension).toBeGreaterThan(30)
  })
})

describe('getSubtextAtChapter', () => {
  it('should return dialogues at specific chapter', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Line one.')
    state = analyzeDialogue(state, 2, 'Bob', 'Line two.')
    state = analyzeDialogue(state, 2, 'Carol', 'Line three.')
    const ch2 = getSubtextAtChapter(state, 2)
    expect(ch2.length).toBe(2)
  })
})

describe('getDeepDialogues', () => {
  it('should return dialogues with depth >= threshold', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Simple.')  // low depth
    state = analyzeDialogue(state, 2, 'Bob', 'Whatever you think is fine, but I just do not care anymore.')  // high depth
    const deep = getDeepDialogues(state, 40)
    expect(deep.length).toBeGreaterThan(0)
  })
})

describe('formatSubtextSummary', () => {
  it('should show dialogue count', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Something')
    state = analyzeDialogue(state, 2, 'Bob', 'Something else')
    const summary = formatSubtextSummary(state)
    expect(summary).toContain('Dialogues: 2')
  })

  it('should show average depth', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Whatever.')
    const summary = formatSubtextSummary(state)
    expect(summary).toContain('Avg Depth:')
  })

  it('should show dominant category', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Whatever you want.')
    state = analyzeDialogue(state, 2, 'Bob', 'Fine.')
    const summary = formatSubtextSummary(state)
    expect(summary).toContain('emotional')
  })
})

describe('formatSubtextDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 5, 'Alice', 'Something')
    const dashboard = formatSubtextDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show recent subtext entries', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeDialogue(state, 1, 'Alice', 'Whatever.')
    state = analyzeDialogue(state, 2, 'Bob', 'Fine.')
    const dashboard = formatSubtextDashboard(state)
    expect(dashboard).toContain('Alice')
    expect(dashboard).toContain('Bob')
  })
})
