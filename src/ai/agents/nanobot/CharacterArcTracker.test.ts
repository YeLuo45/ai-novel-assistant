import { describe, it, expect } from 'vitest'
import {
  createEmptyArcState,
  startArc,
  evolveArc,
  completeArc,
  getArcsByCharacter,
  getActiveArcs,
  formatArcSummary,
  formatArcDashboard,
} from './CharacterArcTracker'

describe('createEmptyArcState', () => {
  it('should create empty state', () => {
    const state = createEmptyArcState()
    expect(state.arcs.length).toBe(0)
    expect(state.characterCount).toBe(0)
  })
})

describe('startArc', () => {
  it('should start first arc', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'Introduction')
    expect(state.arcs.length).toBe(1)
    expect(state.arcs[0].characterId).toBe('hero')
  })

  it('should update chapter', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 5, 'Journey begins')
    expect(state.currentChapter).toBe(5)
  })
})

describe('evolveArc', () => {
  it('should evolve arc phase', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    const arcId = state.arcs[0].arcId
    state = evolveArc(state, arcId, 'rising', 60)
    expect(state.arcs[0].phase).toBe('rising')
    expect(state.arcs[0].intensity).toBe(60)
  })
})

describe('completeArc', () => {
  it('should complete arc with transformation', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    const arcId = state.arcs[0].arcId
    state = evolveArc(state, arcId, 'climax', 90)
    state = completeArc(state, arcId, 85)
    expect(state.arcs[0].transformation).toBe(85)
  })
})

describe('getArcsByCharacter', () => {
  it('should filter arcs', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    state = startArc(state, 'villain', 1, 'intro')
    const heroArcs = getArcsByCharacter(state, 'hero')
    expect(heroArcs.length).toBe(1)
  })
})

describe('getActiveArcs', () => {
  it('should return incomplete arcs', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    const arcId = state.arcs[0].arcId
    state = completeArc(state, arcId, 80)
    expect(getActiveArcs(state).length).toBe(0)
  })
})

describe('formatArcSummary', () => {
  it('should show chapter', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 3, 'intro')
    const summary = formatArcSummary(state)
    expect(summary).toContain('Chapter: 3')
  })

  it('should show character count', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    const summary = formatArcSummary(state)
    expect(summary).toContain('Characters:')
  })
})

describe('formatArcDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 4, 'intro')
    const dash = formatArcDashboard(state)
    expect(dash).toContain('Chapter: 4')
  })

  it('should show total arcs', () => {
    let state = createEmptyArcState()
    state = startArc(state, 'hero', 1, 'intro')
    const dash = formatArcDashboard(state)
    expect(dash).toContain('Total Arcs:')
  })
})
