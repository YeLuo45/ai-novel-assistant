import { describe, it, expect } from 'vitest'
import {
  createEmptyPOVConsistencyState,
  registerScene,
  getConsistencyScore,
  getPOVForCharacter,
  getIssues,
  formatPOVSummary,
  formatPOVDashboard,
} from './POVConsistencyEngine'

describe('createEmptyPOVConsistencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyPOVConsistencyState()
    expect(state.scenes.length).toBe(0)
    expect(state.issues.length).toBe(0)
    expect(state.consistencyScore).toBe(100)
  })
})

describe('registerScene', () => {
  it('should add first scene', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    expect(state.scenes.length).toBe(1)
  })

  it('should detect POV shift issue', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    expect(state.issues.length).toBe(1)
  })

  it('should detect same location POV shift as major issue', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    expect(state.issues[0].severity).toBe('major')
  })

  it('should detect no-issue POV shift (different location)', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice'], 'forest')
    state = registerScene(state, 2, 'bob', ['bob'], 'castle')
    expect(state.issues.length).toBe(0)
  })

  it('should track character POV count', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice'], 'forest')
    state = registerScene(state, 2, 'alice', ['alice'], 'castle')
    expect(getPOVForCharacter(state, 'alice')).toBe(2)
  })

  it('should update current chapter', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 5, 'alice', ['alice'], 'forest')
    expect(state.currentChapter).toBe(5)
  })

  it('should reduce consistency score on issue', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    expect(state.consistencyScore).toBeLessThan(100)
  })

  it('should allow multiple POV shifts', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    state = registerScene(state, 3, 'alice', ['alice', 'bob'], 'forest')
    expect(state.issues.length).toBe(2)
  })
})

describe('getConsistencyScore', () => {
  it('should return 100 for no issues', () => {
    const state = createEmptyPOVConsistencyState()
    expect(getConsistencyScore(state)).toBe(100)
  })

  it('should return reduced score after issues', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    state = registerScene(state, 3, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 4, 'bob', ['alice', 'bob'], 'forest')
    expect(getConsistencyScore(state)).toBe(85)
  })
})

describe('getPOVForCharacter', () => {
  it('should return 0 for unknown character', () => {
    const state = createEmptyPOVConsistencyState()
    expect(getPOVForCharacter(state, 'unknown')).toBe(0)
  })
})

describe('getIssues', () => {
  it('should return empty for no issues', () => {
    const state = createEmptyPOVConsistencyState()
    expect(getIssues(state).length).toBe(0)
  })

  it('should return all issues', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    expect(getIssues(state).length).toBe(1)
  })
})

describe('formatPOVSummary', () => {
  it('should show scene count', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice'], 'forest')
    const summary = formatPOVSummary(state)
    expect(summary).toContain('Scenes: 1')
  })

  it('should show consistency score', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    const summary = formatPOVSummary(state)
    expect(summary).toContain('Consistency Score: 95')
  })
})

describe('formatPOVDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 3, 'alice', ['alice'], 'forest')
    const dashboard = formatPOVDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show recent issues', () => {
    let state = createEmptyPOVConsistencyState()
    state = registerScene(state, 1, 'alice', ['alice', 'bob'], 'forest')
    state = registerScene(state, 2, 'bob', ['alice', 'bob'], 'forest')
    const dashboard = formatPOVDashboard(state)
    expect(dashboard).toContain('Recent Issues')
  })
})
