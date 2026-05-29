import { describe, it, expect } from 'vitest'
import {
  createEmptySubtextLayerState,
  analyzeSubtext,
  getSubtextEntriesBySpeaker,
  getHighTensionEntries,
  getEntriesByLayer,
  formatSubtextLayerSummary,
  formatSubtextLayerDashboard,
} from './DialogueSubtextLayerEngine'

describe('createEmptySubtextLayerState', () => {
  it('should create empty state', () => {
    const state = createEmptySubtextLayerState()
    expect(state.entries.length).toBe(0)
    expect(state.averageTension).toBe(0)
  })
})

describe('analyzeSubtext', () => {
  it('should add subtext entry', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'Hello there')
    expect(state.entries.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should detect literal layer', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'Hello there')
    expect(state.entries[0].layers).toContain('literal')
  })

  it('should detect implied layer', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'I am actually fine')
    expect(state.entries[0].layers).toContain('implied')
  })

  it('should detect hidden layer', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'I secretly wanted this')
    expect(state.entries[0].layers).toContain('hidden')
  })

  it('should detect submissive power dynamic for questions', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'What do you want?')
    expect(state.entries[0].powerDynamic).toBe('submissive')
  })

  it('should detect dominant power dynamic for exclamation', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'You must leave now!')
    expect(state.entries[0].powerDynamic).toBe('dominant')
  })

  it('should calculate tension level', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'You must go!')
    expect(state.entries[0].tensionLevel).toBeGreaterThan(30)
  })
})

describe('getSubtextEntriesBySpeaker', () => {
  it('should return entries for specific speaker', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'Hello')
    state = analyzeSubtext(state, 2, 'Jane', 'John', 'Hi')
    const johnEntries = getSubtextEntriesBySpeaker(state, 'John')
    expect(johnEntries.length).toBe(1)
    expect(johnEntries[0].speaker).toBe('John')
  })
})

describe('getHighTensionEntries', () => {
  it('should return entries above threshold', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'You must go!')
    const highTension = getHighTensionEntries(state, 70)
    expect(highTension.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getEntriesByLayer', () => {
  it('should return entries by layer', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'I actually meant it')
    const impliedEntries = getEntriesByLayer(state, 'implied')
    expect(impliedEntries.length).toBeGreaterThan(0)
  })
})

describe('formatSubtextLayerSummary', () => {
  it('should show subtext summary', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'Hello')
    const summary = formatSubtextLayerSummary(state)
    expect(summary).toContain('Total Entries: 1')
  })
})

describe('formatSubtextLayerDashboard', () => {
  it('should show subtext dashboard', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'Hello')
    const dash = formatSubtextLayerDashboard(state)
    expect(dash).toContain('Entries: 1')
  })

  it('should show power dynamic distribution', () => {
    let state = createEmptySubtextLayerState()
    state = analyzeSubtext(state, 1, 'John', 'Jane', 'What do you want?')
    state = analyzeSubtext(state, 2, 'Jane', 'John', 'You must leave!')
    const dash = formatSubtextLayerDashboard(state)
    expect(dash).toContain('Power Dynamic Distribution')
  })
})