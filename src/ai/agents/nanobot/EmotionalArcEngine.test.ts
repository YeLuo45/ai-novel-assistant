import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionalArcState,
  recordEmotionalState,
  getCharacterArc,
  getArcSummary,
  formatEmotionalSummary,
  formatEmotionalDashboard,
} from './EmotionalArcEngine'

describe('createEmptyEmotionalArcState', () => {
  it('should create empty state', () => {
    const state = createEmptyEmotionalArcState()
    expect(state.arcs.size).toBe(0)
    expect(state.currentChapter).toBe(0)
  })
})

describe('recordEmotionalState', () => {
  it('should add first state for new character', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'hopeful', 70)
    expect(state.arcs.size).toBe(1)
    expect(state.arcs.get('alice')?.states.length).toBe(1)
  })

  it('should add second state for existing character', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'hopeful', 70)
    state = recordEmotionalState(state, 'alice', 3, 'despair', 30)
    expect(state.arcs.get('alice')?.states.length).toBe(2)
  })

  it('should detect growth arc type', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 3, 'neutral', 50)
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    expect(state.arcs.get('alice')?.arcType).toBe('growth')
  })

  it('should detect decline arc type', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'happy', 80)
    state = recordEmotionalState(state, 'alice', 3, 'neutral', 50)
    state = recordEmotionalState(state, 'alice', 5, 'sad', 20)
    expect(state.arcs.get('alice')?.arcType).toBe('decline')
  })

  it('should detect stable arc type for few states', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'neutral', 50)
    state = recordEmotionalState(state, 'alice', 2, 'neutral', 50)
    expect(state.arcs.get('alice')?.arcType).toBe('stable')
  })

  it('should detect cycle arc type', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 3, 'happy', 80)
    state = recordEmotionalState(state, 'alice', 5, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 7, 'happy', 80)
    expect(state.arcs.get('alice')?.arcType).toBe('cycle')  // fixed: cycle detection order
  })

  it('should calculate transformation score', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    expect(state.arcs.get('alice')?.transformationScore).toBeGreaterThan(0)
  })

  it('should update current chapter', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    expect(state.currentChapter).toBe(5)
  })

  it('should normalize emotion to lowercase', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'HOPEFUL', 70)
    expect(state.arcs.get('alice')?.states[0].state).toBe('hopeful')
  })

  it('should track multiple characters independently', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'bob', 1, 'happy', 80)
    expect(state.arcs.size).toBe(2)
    expect(state.arcs.get('alice')?.states[0].state).toBe('sad')
    expect(state.arcs.get('bob')?.states[0].state).toBe('happy')
  })
})

describe('getCharacterArc', () => {
  it('should return null for unknown character', () => {
    const state = createEmptyEmotionalArcState()
    expect(getCharacterArc(state, 'unknown')).toBeNull()
  })

  it('should return arc for known character', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'hopeful', 70)
    const arc = getCharacterArc(state, 'alice')
    expect(arc).not.toBeNull()
    expect(arc?.states.length).toBe(1)
  })
})

describe('getArcSummary', () => {
  it('should return empty for no arcs', () => {
    const state = createEmptyEmotionalArcState()
    expect(getArcSummary(state).length).toBe(0)
  })

  it('should return summaries for all characters', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    state = recordEmotionalState(state, 'bob', 1, 'neutral', 50)
    const summaries = getArcSummary(state)
    expect(summaries.length).toBe(2)
  })
})

describe('formatEmotionalSummary', () => {
  it('should show character count', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'hopeful', 70)
    state = recordEmotionalState(state, 'bob', 2, 'sad', 30)
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Characters: 2')
  })

  it('should show chapter', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Chapter: 5')
  })
})

describe('formatEmotionalDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 3, 'hopeful', 70)
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show character arcs', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Character Arcs')
    expect(dashboard).toContain('alice')
  })

  it('should show arc type and transformation', () => {
    let state = createEmptyEmotionalArcState()
    state = recordEmotionalState(state, 'alice', 1, 'sad', 20)
    state = recordEmotionalState(state, 'alice', 5, 'happy', 80)
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toMatch(/growth|cycle|decline|stable/)
  })
})
