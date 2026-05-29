import { describe, it, expect } from 'vitest'
import {
  createEmptyCoherenceState,
  addNarrativeElement,
  scorePlotCoherence,
  scoreCharacterCoherence,
  getOverallCoherenceScore,
  formatCoherenceSummary,
  formatCoherenceDashboard,
} from './NarrativeCoherenceScorer'

describe('createEmptyCoherenceState', () => {
  it('should create empty state', () => {
    const state = createEmptyCoherenceState()
    expect(state.plotElements.length).toBe(0)
    expect(state.characterStates.length).toBe(0)
  })
})

describe('addNarrativeElement', () => {
  it('should add plot element', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'plot', 'ch1', 'character_introduced', 'alice', 80)
    expect(state.plotElements.length).toBe(1)
  })

  it('should add character state', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'character', 'ch2', 'motivation_change', 'bob', 75)
    expect(state.characterStates.length).toBe(1)
  })
})

describe('scorePlotCoherence', () => {
  it('should return coherence score', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'plot', 'ch1', 'intro', 'alice', 80)
    state = addNarrativeElement(state, 'plot', 'ch2', 'conflict', 'alice', 70)
    const score = scorePlotCoherence(state)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('scoreCharacterCoherence', () => {
  it('should return character score', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'character', 'ch1', 'intro', 'alice', 80)
    const score = scoreCharacterCoherence(state)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('getOverallCoherenceScore', () => {
  it('should return combined score', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'plot', 'ch1', 'event', 'alice', 80)
    state = addNarrativeElement(state, 'character', 'ch2', 'state', 'alice', 75)
    const score = getOverallCoherenceScore(state)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('formatCoherenceSummary', () => {
  it('should show plot element count', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'plot', 'ch1', 'event', 'alice', 80)
    const summary = formatCoherenceSummary(state)
    expect(summary).toContain('Plot: 1')
  })
})

describe('formatCoherenceDashboard', () => {
  it('should show overall score', () => {
    let state = createEmptyCoherenceState()
    state = addNarrativeElement(state, 'plot', 'ch1', 'event', 'alice', 80)
    const dash = formatCoherenceDashboard(state)
    expect(dash).toContain('Overall:')
  })
})
