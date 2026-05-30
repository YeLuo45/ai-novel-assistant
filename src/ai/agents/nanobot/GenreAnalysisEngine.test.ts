/**
 * GenreAnalysisEngine Tests - V183
 * Tests for Genre Classification & Trope Detection Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyGenreState,
  analyzeChapterGenre,
  detectTropesInText,
  getChapterAnalysis,
  getPrimaryGenre,
  formatGenreSummary,
  formatGenreDashboard,
} from './GenreAnalysisEngine'

describe('createEmptyGenreState', () => {
  it('should create empty state', () => {
    const state = createEmptyGenreState()
    expect(state.analyses.length).toBe(0)
    expect(state.currentGenre).toBe('unknown')
  })

  it('should have convention map', () => {
    const state = createEmptyGenreState()
    expect(state.conventionMap['fantasy']).toBeDefined()
    expect(state.conventionMap['fantasy'].length).toBeGreaterThan(0)
  })
})

describe('analyzeChapterGenre', () => {
  it('should detect fantasy genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast a magic spell. A dragon flew over the kingdom.', 1)
    expect(state.analyses[0].primaryGenre).toBe('fantasy')
  })

  it('should detect sci-fi genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The robot walked on the spaceship. Alien technology powered the AI.', 1)
    expect(state.analyses[0].primaryGenre).toBe('scifi')
  })

  it('should detect romance genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'Their love grew stronger each day. The romantic relationship blossomed.', 1)
    expect(state.analyses[0].primaryGenre).toBe('romance')
  })

  it('should detect mystery genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The detective found a clue. The murder investigation continued.', 1)
    expect(state.analyses[0].primaryGenre).toBe('mystery')
  })

  it('should detect thriller genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'She was in danger. A deadly chase across the city. High stakes.', 1)
    expect(state.analyses[0].primaryGenre).toBe('thriller')
  })

  it('should detect horror genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'Fear gripped the town. A monster lurked in the haunted house.', 1)
    expect(state.analyses[0].primaryGenre).toBe('horror')
  })

  it('should detect chosen_one trope', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The chosen one was destined to save the world from the prophecy.', 1)
    const tropes = state.analyses[0].tropes
    expect(tropes.some(t => t.trope === 'chosen_one')).toBeTruthy()
  })

  it('should detect enemies_to_lovers trope', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'They were enemies, rivals who hated each other. But love bloomed.', 1)
    const tropes = state.analyses[0].tropes
    expect(tropes.some(t => t.trope === 'enemies_to_lovers')).toBeTruthy()
  })

  it('should detect found_family trope', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'They became a family, bonded together through trials. A team of survivors.', 1)
    const tropes = state.analyses[0].tropes
    expect(tropes.some(t => t.trope === 'found_family')).toBeTruthy()
  })

  it('should track current chapter', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'Magic spell cast.', 5)
    expect(state.currentChapter).toBe(5)
  })

  it('should update current genre when detected', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    expect(state.currentGenre).toBe('fantasy')
  })

  it('should accumulate analyses', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    state = analyzeChapterGenre(state, 'The robot walked.', 2)
    expect(state.analyses.length).toBe(2)
  })
})

describe('detectTropesInText', () => {
  it('should detect redemption_arc trope', () => {
    const state = createEmptyGenreState()
    const tropes = detectTropesInText(state, 'He sought to redeem himself. To atone for past sins and reform.')
    expect(tropes.some(t => t.trope === 'redemption_arc')).toBeTruthy()
  })

  it('should detect world_building trope', () => {
    const state = createEmptyGenreState()
    const tropes = detectTropesInText(state, 'The world was vast. Many kingdoms across the continent.')
    expect(tropes.some(t => t.trope === 'world_building')).toBeTruthy()
  })

  it('should detect political_intrigue trope', () => {
    const state = createEmptyGenreState()
    const tropes = detectTropesInText(state, 'The court conspiracy threatened the throne. Betrayal loomed.')
    expect(tropes.some(t => t.trope === 'political_intrigue')).toBeTruthy()
  })

  it('should return empty array for no tropes', () => {
    const state = createEmptyGenreState()
    const tropes = detectTropesInText(state, 'A simple sentence with no special meaning.')
    expect(tropes.length).toBe(0)
  })

  it('should return multiple tropes', () => {
    const state = createEmptyGenreState()
    const tropes = detectTropesInText(state, 'The chosen one was destined to save the world. Foreshadowing of the battle.')
    expect(tropes.length).toBeGreaterThan(1)
  })
})

describe('getPrimaryGenre', () => {
  it('should return unknown for empty state', () => {
    const state = createEmptyGenreState()
    expect(getPrimaryGenre(state)).toBe('unknown')
  })

  it('should return primary genre from analyses', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    state = analyzeChapterGenre(state, 'The sorcerer used spells.', 2)
    expect(getPrimaryGenre(state)).toBe('fantasy')
  })

  it('should count genre frequency', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    state = analyzeChapterGenre(state, 'A robot on a spaceship.', 2)
    state = analyzeChapterGenre(state, 'Another magic spell.', 3)
    expect(getPrimaryGenre(state)).toBe('fantasy')
  })
})

describe('formatGenreSummary', () => {
  it('should show chapter count', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 7)
    const summary = formatGenreSummary(state)
    expect(summary).toContain('Chapters Analyzed: 7')
  })

  it('should show primary genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    const summary = formatGenreSummary(state)
    expect(summary).toContain('Primary Genre: fantasy')
  })

  it('should show analysis count', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    state = analyzeChapterGenre(state, 'Another scene.', 2)
    const summary = formatGenreSummary(state)
    expect(summary).toContain('Total Analyses: 2')
  })
})

describe('formatGenreDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 3)
    const dashboard = formatGenreDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show current genre', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    const dashboard = formatGenreDashboard(state)
    expect(dashboard).toContain('Current Genre: fantasy')
  })

  it('should show genre distribution', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The wizard cast magic.', 1)
    const dashboard = formatGenreDashboard(state)
    expect(dashboard).toContain('Genre Distribution')
  })

  it('should show tropes detected', () => {
    let state = createEmptyGenreState()
    state = analyzeChapterGenre(state, 'The chosen one was destined to save the world.', 1)
    const dashboard = formatGenreDashboard(state)
    expect(dashboard).toContain('Tropes Detected')
  })
})