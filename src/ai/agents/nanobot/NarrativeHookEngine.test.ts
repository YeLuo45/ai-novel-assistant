import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerHook,
  analyzeHook,
  getHookPerformance,
  compareHooks,
  getTopHooks,
} from './NarrativeHookEngine'

describe('createEmptyState', () => {
  it('should create empty hook state', () => {
    const s = createEmptyState()
    expect(s.hooks).toEqual([])
    expect(s.analyses).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerHook', () => {
  it('should register a hook', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'The hero fell from the sky.', 80, 75, 70)
    expect(s.hooks.length).toBe(1)
    expect(s.hooks[0].hookType).toBe('action')
    expect(s.hooks[0].initialEngagement).toBe(80)
  })

  it('should classify dialogue', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, '"Where are you going?" she asked.', 70)
    expect(s.hooks[0].hookType).toBe('dialogue')
  })

  it('should classify question', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'What if the hero never came back?', 75)
    expect(s.hooks[0].hookType).toBe('question')
  })

  it('should replace existing hook at same position', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'First hook', 60)
    s = registerHook(s, 'ch1', 0, 'Second hook', 80)
    expect(s.hooks.length).toBe(1)
    expect(s.hooks[0].text).toBe('Second hook')
  })
})

describe('analyzeHook', () => {
  it('should analyze question hook', () => {
    const analysis = analyzeHook('Who killed the mayor?')
    expect(analysis.hookType).toBe('question')
    expect(analysis.effectivenessScore).toBeGreaterThan(50)
    expect(analysis.strengths).toContain('Creates curiosity')
  })

  it('should analyze action hook', () => {
    const analysis = analyzeHook('The building exploded in a ball of fire.')
    expect(analysis.hookType).toBe('action')
    expect(analysis.effectivenessScore).toBeGreaterThan(40)
  })

  it('should analyze dialogue hook', () => {
    const analysis = analyzeHook('"You will never escape," the villain whispered.')
    expect(analysis.hookType).toBe('dialogue')
    expect(analysis.strengths).toContain('Immediate voice')
  })

  it('should penalize overly long hooks', () => {
    const longText = 'This is a very long hook that goes on and on and on without saying anything meaningful and just keeps rambling and rambling until the reader loses interest completely in this story.'
    const analysis = analyzeHook(longText)
    expect(analysis.weaknesses).toContain('Too wordy for hook')
  })

  it('should suggest improvements', () => {
    const analysis = analyzeHook('The hero woke up.')
    expect(analysis.improvementSuggestions.length).toBeGreaterThan(0)
  })
})

describe('getHookPerformance', () => {
  it('should return zeros for unknown chapter', () => {
    const s = createEmptyState()
    const perf = getHookPerformance(s, 'unknown')
    expect(perf.avgEngagement).toBe(0)
  })

  it('should calculate average performance', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'Hook 1', 60, 70, 80)
    s = registerHook(s, 'ch1', 50, 'Hook 2', 80, 60, 70)
    const perf = getHookPerformance(s, 'ch1')
    expect(perf.avgEngagement).toBe(70)
    expect(perf.avgRetention).toBe(65)
    expect(perf.clickThroughRate).toBe(75)
  })
})

describe('compareHooks', () => {
  it('should return null for chapters with no hooks', () => {
    const s = createEmptyState()
    const result = compareHooks(s, 'ch1', 'ch2')
    expect(result.moreEngaging).toBe('ch2')
  })

  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'Hook ch1', 90)
    s = registerHook(s, 'ch2', 0, 'Hook ch2', 60)
    const result = compareHooks(s, 'ch1', 'ch2')
    expect(result.moreEngaging).toBe('ch1')
  })
})

describe('getTopHooks', () => {
  it('should return empty for no hooks', () => {
    const s = createEmptyState()
    expect(getTopHooks(s)).toEqual([])
  })

  it('should return top N hooks sorted by engagement', () => {
    let s = createEmptyState()
    s = registerHook(s, 'ch1', 0, 'Hook A', 30)
    s = registerHook(s, 'ch2', 0, 'Hook B', 80)
    s = registerHook(s, 'ch3', 0, 'Hook C', 60)
    const top = getTopHooks(s, 2)
    expect(top.length).toBe(2)
    expect(top[0].text).toBe('Hook B')
    expect(top[1].text).toBe('Hook C')
  })
})
