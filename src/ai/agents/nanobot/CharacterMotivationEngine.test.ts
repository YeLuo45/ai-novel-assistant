import { describe, it, expect } from 'vitest'
import {
  createEmptyMotivationState,
  addSurfaceMotivation,
  addHiddenMotivation,
  connectMotivationChain,
  getCharacterMotivation,
  getDominantMotivation,
  formatMotivationSummary,
  formatMotivationDashboard,
} from './CharacterMotivationEngine'

describe('createEmptyMotivationState', () => {
  it('should create empty state', () => {
    const state = createEmptyMotivationState()
    expect(Object.keys(state.characters).length).toBe(0)
  })
})

describe('addSurfaceMotivation', () => {
  it('should add surface motivation', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'alice', 'survive', 80)
    const char = state.characters['alice']
    expect(char).toBeDefined()
    expect(char.surfaceMotivation.length).toBe(1)
  })
})

describe('addHiddenMotivation', () => {
  it('should add hidden motivation', () => {
    let state = createEmptyMotivationState()
    state = addHiddenMotivation(state, 'alice', 'belong', 90)
    const char = state.characters['alice']
    expect(char.hiddenMotivation.length).toBe(1)
  })
})

describe('connectMotivationChain', () => {
  it('should create chain between motivations', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'alice', 'survive', 80)
    state = addHiddenMotivation(state, 'alice', 'belong', 90)
    state = connectMotivationChain(state, 'alice', 0, 0)
    const char = state.characters['alice']
    expect(char.chain.length).toBe(1)
  })
})

describe('getCharacterMotivation', () => {
  it('should return motivation data', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'alice', 'survive', 80)
    const result = getCharacterMotivation(state, 'alice')
    expect(result).toBeDefined()
    expect(result.surfaceMotivation.length).toBe(1)
  })

  it('should return null for unknown character', () => {
    const state = createEmptyMotivationState()
    const result = getCharacterMotivation(state, 'unknown')
    expect(result).toBeNull()
  })
})

describe('getDominantMotivation', () => {
  it('should return highest intensity motivation', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'alice', 'survive', 80)
    state = addHiddenMotivation(state, 'alice', 'belong', 95)
    const result = getDominantMotivation(state, 'alice')
    expect(result).toContain('belong')
  })
})

describe('formatMotivationSummary', () => {
  it('should show character count', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'alice', 'survive', 80)
    const summary = formatMotivationSummary(state)
    expect(summary).toContain('Characters: 1')
  })
})

describe('formatMotivationDashboard', () => {
  it('should show character list', () => {
    let state = createEmptyMotivationState()
    state = addSurfaceMotivation(state, 'bob', 'power', 85)
    const dash = formatMotivationDashboard(state)
    expect(dash).toContain('bob')
  })
})
