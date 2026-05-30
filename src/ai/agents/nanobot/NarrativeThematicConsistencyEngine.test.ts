import { describe, it, expect } from 'vitest'
import {
  createEmptyThematicState,
  registerThematicElement,
  getThematicElement,
  getConsistencyStatus,
  getThematicDensity,
  formatThematicSummary,
  formatThematicDashboard,
} from './NarrativeThematicConsistencyEngine'

describe('createEmptyThematicState', () => {
  it('should create empty state', () => {
    const state = createEmptyThematicState()
    expect(state.entries.length).toBe(0)
    expect(state.dominantThemes.length).toBe(0)
  })
})

describe('registerThematicElement', () => {
  it('should add new thematic element', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean scene')
    expect(state.entries.length).toBe(1)
    expect(state.entries[0].name).toBe('water')
  })

  it('should track occurrences for existing element', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean scene')
    state = registerThematicElement(state, 5, 'motif', 'water', 'death', 'drowning scene')
    expect(state.entries.length).toBe(1)
    expect(state.entries[0].occurrences).toBe(2)
    expect(state.entries[0].chapters).toEqual([1, 5])
  })

  it('should detect symbol element type', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'symbol' as any, 'rose', 'love', 'garden')
    expect(state.entries[0].elementType).toBe('symbol')
  })

  it('should track evolution track', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'fire', 'passion', 'hearth')
    state = registerThematicElement(state, 7, 'motif', 'fire', 'destruction', 'burning')
    expect(state.entries[0].evolutionTrack.length).toBe(2)
  })

  it('should update dominant themes', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    state = registerThematicElement(state, 2, 'motif', 'water', 'life', 'river')
    state = registerThematicElement(state, 1, 'motif', 'fire', 'passion', 'hearth')
    expect(state.dominantThemes).toContain('water')
  })
})

describe('getThematicElement', () => {
  it('should return element by name', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    const element = getThematicElement(state, 'water')
    expect(element).not.toBeNull()
    expect(element?.name).toBe('water')
  })

  it('should return null for missing element', () => {
    const state = createEmptyThematicState()
    const element = getThematicElement(state, 'missing')
    expect(element).toBeNull()
  })
})

describe('getConsistencyStatus', () => {
  it('should return consistent for high score', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    state = registerThematicElement(state, 2, 'motif', 'water', 'death', 'river')
    state = registerThematicElement(state, 3, 'motif', 'water', 'life', 'lake')
    const status = getConsistencyStatus(state, 'water')
    expect(status).toBe('consistent')
  })
})

describe('getThematicDensity', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyThematicState()
    const density = getThematicDensity(state, 1)
    expect(density).toBe(0)
  })

  it('should calculate density', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    state = registerThematicElement(state, 1, 'motif', 'fire', 'passion', 'hearth')
    const density = getThematicDensity(state, 1)
    expect(density).toBeGreaterThan(0)
  })
})

describe('formatThematicSummary', () => {
  it('should show thematic summary', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    const summary = formatThematicSummary(state)
    expect(summary).toContain('Elements: 1')
  })
})

describe('formatThematicDashboard', () => {
  it('should show thematic dashboard', () => {
    let state = createEmptyThematicState()
    state = registerThematicElement(state, 1, 'motif', 'water', 'life', 'ocean')
    const dash = formatThematicDashboard(state)
    expect(dash).toContain('Elements: 1')
  })
})