import { describe, it, expect } from 'vitest'
import {
  createEmptyCharacterArcState,
  createEmptyMultiCharacterArcState,
  addArcPoint,
  setIntendedArc,
  generateActualArcDescription,
  getArcProgress,
  getMilestoneProgress,
  formatCharacterArcSummary,
  formatCharacterArcDashboard,
} from './CharacterArcTrajectoryEngine'

describe('createEmptyCharacterArcState', () => {
  it('should create empty state for character', () => {
    const state = createEmptyCharacterArcState('alice')
    expect(state.characterId).toBe('alice')
    expect(state.arcPoints.length).toBe(0)
    expect(state.direction).toBe('stable')
  })
})

describe('createEmptyMultiCharacterArcState', () => {
  it('should create empty multi-character state', () => {
    const state = createEmptyMultiCharacterArcState()
    expect(Object.keys(state.characters).length).toBe(0)
    expect(state.sharedMilestones.length).toBe(0)
  })
})

describe('addArcPoint', () => {
  it('should add arc point', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'confident', 70, 60, 50, null)
    expect(state.arcPoints.length).toBe(1)
    expect(state.arcPoints[0].chapter).toBe(1)
  })

  it('should clamp scores to 0-100', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'test', 150, -20, 50, null)
    expect(state.arcPoints[0].agencyScore).toBe(100)
    expect(state.arcPoints[0].growthScore).toBe(0)
  })

  it('should track milestone', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 5, 'crisis', 40, 30, 60, 'crisis')
    expect(state.arcPoints[0].milestone).toBe('crisis')
  })
})

describe('addArcPoint direction detection', () => {
  it('should detect ascending direction', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 40, 40, null)
    state = addArcPoint(state, 3, 'middle', 70, 55, 50, null)
    state = addArcPoint(state, 5, 'end', 80, 75, 60, null)
    expect(state.direction).toBe('ascending')
  })

  it('should detect descending direction', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 80, 60, null)
    state = addArcPoint(state, 3, 'middle', 50, 60, 50, null)
    state = addArcPoint(state, 5, 'end', 40, 40, 40, null)
    expect(state.direction).toBe('descending')
  })

  it('should detect stable direction', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 50, 50, null)
    state = addArcPoint(state, 3, 'middle', 58, 52, 50, null)
    state = addArcPoint(state, 5, 'end', 62, 51, 50, null)
    expect(state.direction).toBe('stable')
  })
})

describe('setIntendedArc', () => {
  it('should set intended arc description', () => {
    let state = createEmptyCharacterArcState('alice')
    state = setIntendedArc(state, 'Growth from 40 to 80')
    expect(state.intendedArc).toBe('Growth from 40 to 80')
  })
})

describe('generateActualArcDescription', () => {
  it('should return no arc data for empty state', () => {
    const state = createEmptyCharacterArcState('alice')
    const desc = generateActualArcDescription(state)
    expect(desc).toContain('No arc data')
  })

  it('should describe growth arc', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 40, 40, null)
    state = addArcPoint(state, 5, 'end', 80, 75, 60, null)
    const desc = generateActualArcDescription(state)
    expect(desc).toContain('Growth arc')
  })

  it('should describe decline arc', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 80, 60, null)
    state = addArcPoint(state, 5, 'end', 40, 40, 40, null)
    const desc = generateActualArcDescription(state)
    expect(desc).toContain('Decline arc')
  })
})

describe('getArcProgress', () => {
  it('should return 0 for insufficient points', () => {
    const state = createEmptyCharacterArcState('alice')
    expect(getArcProgress(state)).toBe(0)
  })

  it('should calculate progress', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 40, 50, null)
    state = addArcPoint(state, 5, 'end', 80, 70, 60, null)
    expect(getArcProgress(state)).toBe(30)
  })
})

describe('getMilestoneProgress', () => {
  it('should return empty array for no milestones', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 40, 50, null)
    state = addArcPoint(state, 5, 'end', 80, 70, 60, null)
    const milestones = getMilestoneProgress(state)
    expect(milestones.length).toBe(0)
  })

  it('should return milestones', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'origin', 50, 30, 40, 'origin')
    state = addArcPoint(state, 5, 'crisis', 40, 50, 60, 'crisis')
    const milestones = getMilestoneProgress(state)
    expect(milestones.length).toBe(2)
  })
})

describe('formatCharacterArcSummary', () => {
  it('should show arc summary', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 50, 50, null)
    const summary = formatCharacterArcSummary(state)
    expect(summary).toContain('alice')
  })
})

describe('formatCharacterArcDashboard', () => {
  it('should show arc dashboard', () => {
    let state = createEmptyCharacterArcState('alice')
    state = addArcPoint(state, 1, 'start', 60, 50, 50, null)
    const dash = formatCharacterArcDashboard(state)
    expect(dash).toContain('alice')
  })
})