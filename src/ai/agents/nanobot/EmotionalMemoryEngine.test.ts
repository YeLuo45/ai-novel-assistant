/**
 * EmotionalMemoryEngine Tests - V173
 * Tests for Character Emotional State Memory Tracking & Consolidation Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionalMemoryState,
  recordEmotionalBeat,
  consolidateMemory,
  getCharacterEmotionalState,
  getEmotionalHistory,
  getActiveTrends,
  formatEmotionalSummary,
  formatEmotionalDashboard,
} from './EmotionalMemoryEngine'

describe('createEmptyEmotionalMemoryState', () => {
  it('should create empty state', () => {
    const state = createEmptyEmotionalMemoryState()
    expect(state.snapshots.length).toBe(0)
    expect(state.trends.length).toBe(0)
    expect(state.characterEmotions.size).toBe(0)
  })
})

describe('recordEmotionalBeat', () => {
  it('should record joy emotion', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'She was happy and smiled at the good news.', 'good news', 1)
    expect(state.snapshots.length).toBe(1)
    expect(state.snapshots[0].primaryEmotion).toBe('joy')
  })

  it('should record anger emotion', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'bob', 'Bob was furious and shouted with rage at the betrayal.', 'betrayal', 2)
    expect(state.snapshots[0].primaryEmotion).toBe('anger')
  })

  it('should record sadness emotion', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'carol', 'Carol felt sad and cried after hearing the terrible news.', 'terrible news', 3)
    expect(state.snapshots[0].primaryEmotion).toBe('sadness')
  })

  it('should record fear emotion', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'dave', 'Dave was terrified and afraid of the dark shadow approaching.', 'danger', 4)
    expect(state.snapshots[0].primaryEmotion).toBe('fear')
  })

  it('should update character emotions map', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt joyful and happy today.', 'positive event', 1)
    expect(state.characterEmotions.get('alice')).toBe('joy')
  })

  it('should accumulate snapshots', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy.', 'positive', 1)
    state = recordEmotionalBeat(state, 'bob', 'Bob felt angry.', 'negative', 2)
    expect(state.snapshots.length).toBe(2)
  })

  it('should add to unresolved', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy and joyful today.', 'positive event', 1)
    expect(state.unresolved.length).toBe(1)
  })

  it('should detect emotion trend', () => {
    let state = createEmptyEmotionalMemoryState()
    for (let i = 1; i <= 8; i++) {
      state = recordEmotionalBeat(state, 'alice', 'Alice felt happy. She was joyful and delighted.', 'positive event', i)
    }
    expect(state.trends.length).toBeGreaterThan(0)
  })
})

describe('consolidateMemory', () => {
  it('should remove character from unresolved', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy today.', 'positive', 1)
    expect(state.unresolved.length).toBe(1)
    state = consolidateMemory(state, 'alice')
    expect(state.unresolved.length).toBe(0)
  })

  it('should not affect other characters', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy.', 'positive', 1)
    state = recordEmotionalBeat(state, 'bob', 'Bob felt angry.', 'negative', 2)
    state = consolidateMemory(state, 'alice')
    expect(state.unresolved.length).toBe(1)
  })
})

describe('getCharacterEmotionalState', () => {
  it('should return neutral for unknown character', () => {
    const state = createEmptyEmotionalMemoryState()
    expect(getCharacterEmotionalState(state, 'unknown')).toBe('neutral')
  })

  it('should return current emotion', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt very happy and joyful today.', 'positive event', 1)
    expect(getCharacterEmotionalState(state, 'alice')).toBe('joy')
  })
})

describe('getEmotionalHistory', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptyEmotionalMemoryState()
    expect(getEmotionalHistory(state, 'unknown').length).toBe(0)
  })

  it('should return character history', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy.', 'positive', 1)
    state = recordEmotionalBeat(state, 'alice', 'Alice felt angry.', 'negative', 2)
    state = recordEmotionalBeat(state, 'bob', 'Bob felt sad.', 'sad', 2)
    const history = getEmotionalHistory(state, 'alice')
    expect(history.length).toBe(2)
  })
})

describe('getActiveTrends', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptyEmotionalMemoryState()
    expect(getActiveTrends(state, 'unknown').length).toBe(0)
  })
})

describe('formatEmotionalSummary', () => {
  it('should show snapshot count', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy today.', 'positive', 1)
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Total Snapshots: 1')
  })

  it('should show character states', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy and joyful today.', 'positive', 1)
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('alice')
    expect(summary).toContain('joy')
  })
})

describe('formatEmotionalDashboard', () => {
  it('should show recent emotions', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy today.', 'positive', 1)
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Recent Emotions')
  })

  it('should show unresolved beats', () => {
    let state = createEmptyEmotionalMemoryState()
    state = recordEmotionalBeat(state, 'alice', 'Alice felt happy and excited today.', 'positive event', 1)
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Unresolved Emotional Beats')
  })
})
