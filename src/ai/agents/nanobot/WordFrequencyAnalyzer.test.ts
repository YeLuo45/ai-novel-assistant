import { describe, it, expect } from 'vitest'
import {
  createEmptyWordFrequencyState,
  analyzeWordFrequency,
  getTopWords,
  getOverusedWords,
  getUniqueWordCount,
  formatWordFrequencySummary,
  formatWordFrequencyDashboard,
} from './WordFrequencyAnalyzer'

describe('createEmptyWordFrequencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyWordFrequencyState()
    expect(state.entries.length).toBe(0)
    expect(state.totalWords).toBe(0)
    expect(state.uniqueWords).toBe(0)
    expect(state.diversityScore).toBe(100)
  })
})

describe('analyzeWordFrequency', () => {
  it('should count words from text', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    expect(state.totalWords).toBe(3)
    expect(state.uniqueWords).toBe(2)
  })

  it('should track word count per word', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    const hello = state.entries.find(e => e.word === 'hello')
    expect(hello?.count).toBe(2)
  })

  it('should accumulate across chapters', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world')
    state = analyzeWordFrequency(state, 2, 'hello there')
    const hello = state.entries.find(e => e.word === 'hello')
    expect(hello?.count).toBe(2)
    expect(hello?.chapters).toContain(1)
    expect(hello?.chapters).toContain(2)
  })

  it('should update total words', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'one two three')
    state = analyzeWordFrequency(state, 2, 'four five')
    expect(state.totalWords).toBe(5)
  })

  it('should track repeated phrases', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world', ['once upon a time'])
    expect(state.repeatedPhrases.length).toBe(1)
    expect(state.repeatedPhrases[0]).toBe('once upon a time')
  })
})

describe('getTopWords', () => {
  it('should return top N most frequent words', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello hello world one')
    const top = getTopWords(state, 2)
    expect(top[0].word).toBe('hello')
    expect(top.length).toBe(2)
  })

  it('should return all if count exceeds entries', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world')
    const top = getTopWords(state, 10)
    expect(top.length).toBe(2)
  })
})

describe('getOverusedWords', () => {
  it('should return words above threshold', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello hello hello hello hello')
    const overused = getOverusedWords(state, 4)
    expect(overused.length).toBe(1)
  })

  it('should return empty if no words exceed threshold', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world')
    const overused = getOverusedWords(state, 10)
    expect(overused.length).toBe(0)
  })
})

describe('getUniqueWordCount', () => {
  it('should return unique word count', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world')
    expect(getUniqueWordCount(state)).toBe(2)
  })
})

describe('formatWordFrequencySummary', () => {
  it('should show total words', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    const summary = formatWordFrequencySummary(state)
    expect(summary).toContain('Total Words: 3')
  })

  it('should show unique word count', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    const summary = formatWordFrequencySummary(state)
    expect(summary).toContain('Unique Words: 2')
  })

  it('should show vocabulary diversity', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    const summary = formatWordFrequencySummary(state)
    expect(summary).toContain('Vocabulary Diversity:')
  })
})

describe('formatWordFrequencyDashboard', () => {
  it('should show total and unique counts', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world')
    const dashboard = formatWordFrequencyDashboard(state)
    expect(dashboard).toContain('Total: 2')
    expect(dashboard).toContain('Unique: 2')
  })

  it('should show top words', () => {
    let state = createEmptyWordFrequencyState()
    state = analyzeWordFrequency(state, 1, 'hello world hello')
    const dashboard = formatWordFrequencyDashboard(state)
    expect(dashboard).toContain('hello')
  })
})
