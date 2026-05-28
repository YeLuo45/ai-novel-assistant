import { describe, it, expect } from 'vitest'
import {
  createEmptySceneTransitionState,
  addScene,
  getScene,
  getTransitionAnalysis,
  getAverageSmoothness,
  formatTransitionSummary,
  formatTransitionDashboard,
} from './SceneTransitionOptimizer'

describe('createEmptySceneTransitionState', () => {
  it('should create empty state', () => {
    const state = createEmptySceneTransitionState()
    expect(state.scenes.length).toBe(0)
    expect(state.analyses.length).toBe(0)
  })
})

describe('addScene', () => {
  it('should add first scene without analysis', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    expect(state.scenes.length).toBe(1)
    expect(state.analyses.length).toBe(0)
  })

  it('should analyze transition on second scene', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'castle', 'afternoon', ['bob'], 'dramatic')
    expect(state.analyses.length).toBe(1)
  })

  it('should score location change', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'castle', 'morning', ['alice'], 'tense')
    expect(state.analyses[0].smoothnessScore).toBeGreaterThan(60)
  })

  it('should penalize no character overlap', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'forest', 'morning', ['bob'], 'tense')
    expect(state.analyses[0].smoothnessScore).toBeLessThan(80)
  })

  it('should update current chapter', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 5, 'forest', 'morning', ['alice'], 'tense')
    expect(state.currentChapter).toBe(5)
  })

  it('should detect location change issue', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'castle', 'morning', ['alice'], 'tense')
    expect(state.analyses[0].issues.some(i => i.includes('Location'))).toBeTruthy()
  })

  it('should suggest bridge for location change', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'castle', 'morning', ['alice'], 'tense')
    expect(state.analyses[0].bridgeSuggestions.length).toBeGreaterThan(0)
  })

  it('should update average smoothness', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'castle', 'morning', ['alice'], 'tense')
    expect(state.averageSmoothness).toBeGreaterThan(0)
  })
})

describe('getScene', () => {
  it('should return null for unknown scene', () => {
    const state = createEmptySceneTransitionState()
    expect(getScene(state, 'unknown')).toBeNull()
  })

  it('should return scene by id', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    const sceneId = state.scenes[0].sceneId
    const scene = getScene(state, sceneId)
    expect(scene).not.toBeNull()
    expect(scene?.location).toBe('forest')
  })
})

describe('getTransitionAnalysis', () => {
  it('should return null for unknown pair', () => {
    const state = createEmptySceneTransitionState()
    expect(getTransitionAnalysis(state, 'unknown', 'also')).toBeNull()
  })

  it('should return analysis for valid pair', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'forest', 'morning', ['bob'], 'tense')
    const fromId = state.scenes[0].sceneId
    const toId = state.scenes[1].sceneId
    const analysis = getTransitionAnalysis(state, fromId, toId)
    expect(analysis).not.toBeNull()
  })
})

describe('getAverageSmoothness', () => {
  it('should return 0 for no analyses', () => {
    const state = createEmptySceneTransitionState()
    expect(getAverageSmoothness(state)).toBe(0)
  })

  it('should return average smoothness', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'forest', 'morning', ['alice'], 'tense')
    expect(getAverageSmoothness(state)).toBeGreaterThan(0)
  })
})

describe('formatTransitionSummary', () => {
  it('should show scene count', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'forest', 'morning', ['alice'], 'tense')
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Total Scenes: 2')
  })

  it('should show transition count', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 1, 'forest', 'morning', ['alice'], 'tense')
    state = addScene(state, 2, 'forest', 'morning', ['alice'], 'tense')
    const summary = formatTransitionSummary(state)
    expect(summary).toContain('Transitions Analyzed: 1')
  })
})

describe('formatTransitionDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySceneTransitionState()
    state = addScene(state, 3, 'forest', 'morning', ['alice'], 'tense')
    const dashboard = formatTransitionDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })
})
