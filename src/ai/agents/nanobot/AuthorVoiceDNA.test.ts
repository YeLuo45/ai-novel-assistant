import { describe, it, expect } from 'vitest'
import {
  createEmptyScenePurposeState,
  analyzeScene,
  getScenesByPurpose,
  getScenesByChapter,
  getRedundantScenes,
  getHighImpactScenes,
  formatScenePurposeSummary,
  formatScenePurposeDashboard,
} from './AuthorVoiceDNA'

describe('createEmptyScenePurposeState', () => {
  it('should create empty state', () => {
    const state = createEmptyScenePurposeState()
    expect(state.scenes.length).toBe(0)
    expect(state.currentChapter).toBe(0)
  })
})

describe('analyzeScene', () => {
  it('should analyze first scene', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'character_development', 5, 80)
    expect(state.scenes.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should calculate necessity', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'plot_advancement', 3, 70)
    expect(state.averageNecessity).toBeGreaterThan(0)
  })
})

describe('getScenesByPurpose', () => {
  it('should filter by purpose', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'emotional_resonance', 5, 80)
    state = analyzeScene(state, 2, 'character_development', 5, 80)
    const emotional = getScenesByPurpose(state, 'emotional_resonance')
    expect(emotional.length).toBe(1)
  })
})

describe('getScenesByChapter', () => {
  it('should filter by chapter', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 3, 'plot_advancement', 5, 80)
    const ch3 = getScenesByChapter(state, 3)
    expect(ch3.length).toBe(1)
  })
})

describe('getRedundantScenes', () => {
  it('should return low necessity scenes', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'transition', -2, 20)
    const redundant = getRedundantScenes(state)
    expect(redundant.length).toBe(1)
  })
})

describe('getHighImpactScenes', () => {
  it('should return high engagement scenes', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'conflict_creation', 5, 90)
    const high = getHighImpactScenes(state)
    expect(high.length).toBe(1)
  })
})

describe('formatScenePurposeSummary', () => {
  it('should show chapter', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 5, 'character_development', 5, 80)
    const summary = formatScenePurposeSummary(state)
    expect(summary).toContain('Chapter: 5')
  })

  it('should show scene count', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'character_development', 5, 80)
    const summary = formatScenePurposeSummary(state)
    expect(summary).toContain('Scenes: 1')
  })
})

describe('formatScenePurposeDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 4, 'plot_advancement', 5, 80)
    const dash = formatScenePurposeDashboard(state)
    expect(dash).toContain('Chapter: 4')
  })

  it('should show total scenes', () => {
    let state = createEmptyScenePurposeState()
    state = analyzeScene(state, 1, 'plot_advancement', 5, 80)
    const dash = formatScenePurposeDashboard(state)
    expect(dash).toContain('Total Scenes: 1')
  })
})
