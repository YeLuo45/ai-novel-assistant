import { describe, it, expect } from 'vitest'
import {
  createEmptyClimaxPlacementState,
  registerClimaxCandidate,
  selectOptimalClimax,
  getClimaxPosition,
  isClimaxWellPlaced,
  formatClimaxSummary,
  formatClimaxDashboard,
} from './ClimaxPlacementEngine'

describe('createEmptyClimaxPlacementState', () => {
  it('should create empty state', () => {
    const state = createEmptyClimaxPlacementState()
    expect(state.candidates.length).toBe(0)
    expect(state.selectedClimax).toBeNull()
  })
})

describe('registerClimaxCandidate', () => {
  it('should add candidate', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'The final confrontation', 'Major battle')
    expect(state.candidates.length).toBe(1)
  })

  it('should detect action climax type', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'Epic battle ensues', 'Battle')
    expect(state.candidates[0].type).toBe('action')
  })

  it('should detect revelation climax type', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'The truth is revealed', 'Truth')
    expect(state.candidates[0].type).toBe('revelation')
  })

  it('should calculate intensity from buildUp and payoff', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'The climax of the story. A confrontation.', 'Major')
    expect(state.candidates[0].intensity).toBeGreaterThan(0)
  })

  it('should update chapter', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 7, 'Climax', 'Event')
    expect(state.currentChapter).toBe(7)
  })
})

describe('selectOptimalClimax', () => {
  it('should return state unchanged if no candidates', () => {
    const state = createEmptyClimaxPlacementState()
    const result = selectOptimalClimax(state)
    expect(result.selectedClimax).toBeNull()
  })

  it('should select candidate with highest score', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 3, 'Small event', 'Minor')
    state = registerClimaxCandidate(state, 7, 'The major climax with building tension and confrontation', 'Major')
    state = selectOptimalClimax(state)
    expect(state.selectedClimax).not.toBeNull()
    expect(state.selectedClimax?.chapter).toBe(7)
  })
})

describe('getClimaxPosition', () => {
  it('should return null when no climax selected', () => {
    const state = createEmptyClimaxPlacementState()
    expect(getClimaxPosition(state)).toBeNull()
  })

  it('should return chapter and percentage', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 7, 'Climax', 'Major')
    state = selectOptimalClimax(state)
    const pos = getClimaxPosition(state)
    expect(pos).not.toBeNull()
    expect(pos?.chapter).toBe(7)
    expect(pos?.percentage).toBeGreaterThan(0)
  })
})

describe('isClimaxWellPlaced', () => {
  it('should return false when no climax selected', () => {
    const state = createEmptyClimaxPlacementState()
    expect(isClimaxWellPlaced(state)).toBeFalsy()
  })

  it('should return true for climax at 70%', () => {
    let state = createEmptyClimaxPlacementState()
    state = { ...state, storyLength: 10 }
    state = registerClimaxCandidate(state, 7, 'Climax', 'Major')
    state = selectOptimalClimax(state)
    expect(isClimaxWellPlaced(state)).toBeTruthy()
  })

  it('should return false for climax at 30%', () => {
    let state = createEmptyClimaxPlacementState()
    state = { ...state, storyLength: 10 }
    state = registerClimaxCandidate(state, 3, 'Too early climax', 'Major')
    state = selectOptimalClimax(state)
    expect(isClimaxWellPlaced(state)).toBeFalsy()
  })
})

describe('formatClimaxSummary', () => {
  it('should show candidate count', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'Event', 'Reason')
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('Candidates: 1')
  })

  it('should show optimal position percentage', () => {
    const state = createEmptyClimaxPlacementState()
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('70%')
  })
})

describe('formatClimaxDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'Climax', 'Major')
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show story length', () => {
    const state = createEmptyClimaxPlacementState()
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Story Length: 10')
  })

  it('should show selected climax', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'Climax', 'Major')
    state = selectOptimalClimax(state)
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Selected Climax')
  })

  it('should show all candidates', () => {
    let state = createEmptyClimaxPlacementState()
    state = registerClimaxCandidate(state, 5, 'Event1', 'Reason1')
    state = registerClimaxCandidate(state, 7, 'Event2', 'Reason2')
    state = selectOptimalClimax(state)
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('All Candidates')
  })
})
