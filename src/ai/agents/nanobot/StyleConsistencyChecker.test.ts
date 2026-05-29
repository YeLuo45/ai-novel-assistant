import { describe, it, expect } from 'vitest'
import {
  createEmptyStyleConsistencyState,
  establishStyle,
  getViolationsByChapter,
  getViolationsByType,
  getCriticalViolations,
  formatStyleConsistencySummary,
  formatStyleConsistencyDashboard,
} from './StyleConsistencyChecker'

describe('createEmptyStyleConsistencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyStyleConsistencyState()
    expect(state.establishedVoice).toBeNull()
    expect(state.establishedTense).toBe('past')
    expect(state.overallStyleScore).toBe(100)
    expect(state.violations.length).toBe(0)
  })
})

describe('establishStyle', () => {
  it('should establish first style without violation', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    expect(state.establishedVoice).toBe('first_person')
    expect(state.currentChapter).toBe(1)
    expect(state.violations.length).toBe(0)
  })

  it('should detect voice violation', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    expect(state.voiceConsistencyScore).toBe(75)
    expect(state.violations.length).toBe(1)
    expect(state.violations[0].type).toBe('voice')
  })

  it('should detect tense violation', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'first_person', 'present', 'protagonist')
    expect(state.tenseConsistencyScore).toBe(70)
    expect(state.violations.length).toBe(1)
    expect(state.violations[0].type).toBe('tense')
  })

  it('should detect POV violation', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'first_person', 'past', 'antagonist')
    expect(state.povConsistencyScore).toBe(75)
    expect(state.violations.length).toBe(1)
    expect(state.violations[0].type).toBe('pov')
  })

  it('should accumulate violations', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    state = establishStyle(state, 3, 'third_limited', 'present', 'protagonist')
    expect(state.violations.length).toBe(3)
  })

  it('should update current chapter', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 5, 'first_person', 'past', 'protagonist')
    expect(state.currentChapter).toBe(5)
  })
})

describe('getViolationsByChapter', () => {
  it('should return violations for specific chapter', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    const ch2violations = getViolationsByChapter(state, 2)
    expect(ch2violations.length).toBe(1)
  })

  it('should return empty for chapter with no violations', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    expect(getViolationsByChapter(state, 1).length).toBe(0)
  })
})

describe('getViolationsByType', () => {
  it('should return only voice violations', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    const voiceViolations = getViolationsByType(state, 'voice')
    expect(voiceViolations.length).toBe(1)
    expect(voiceViolations[0].type).toBe('voice')
  })
})

describe('getCriticalViolations', () => {
  it('should return empty for no violations', () => {
    const state = createEmptyStyleConsistencyState()
    expect(getCriticalViolations(state).length).toBe(0)
  })
})

describe('formatStyleConsistencySummary', () => {
  it('should show style score', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    const summary = formatStyleConsistencySummary(state)
    expect(summary).toContain('Overall Style Score:')
  })

  it('should show violation count', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    const summary = formatStyleConsistencySummary(state)
    expect(summary).toContain('Total Violations: 1')
  })

  it('should show chapter', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 3, 'first_person', 'past', 'protagonist')
    const summary = formatStyleConsistencySummary(state)
    expect(summary).toContain('Chapter: 3')
  })
})

describe('formatStyleConsistencyDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 2, 'first_person', 'past', 'protagonist')
    const dashboard = formatStyleConsistencyDashboard(state)
    expect(dashboard).toContain('Chapter: 2')
  })

  it('should show style score', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    const dashboard = formatStyleConsistencyDashboard(state)
    expect(dashboard).toContain('Style Score:')
  })

  it('should show recent violations', () => {
    let state = createEmptyStyleConsistencyState()
    state = establishStyle(state, 1, 'first_person', 'past', 'protagonist')
    state = establishStyle(state, 2, 'third_limited', 'past', 'protagonist')
    const dashboard = formatStyleConsistencyDashboard(state)
    expect(dashboard).toContain('Recent Violations')
  })
})
