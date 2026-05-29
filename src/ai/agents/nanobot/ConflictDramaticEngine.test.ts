import { describe, it, expect } from 'vitest'
import {
  createEmptyConflictDramaticState,
  createConflict,
  escalateConflict,
  resolveConflict,
  recordTensionPoint,
  getActiveConflicts,
  getConflictById,
  formatConflictSummary,
  formatConflictDashboard,
} from './ConflictDramaticEngine'

describe('createEmptyConflictDramaticState', () => {
  it('should create empty state', () => {
    const state = createEmptyConflictDramaticState()
    expect(state.conflicts.length).toBe(0)
    expect(state.tensionCurve.length).toBe(0)
    expect(state.resolvedCount).toBe(0)
  })
})

describe('createConflict', () => {
  it('should create conflict', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'internal', 'Inner turmoil', ['Protagonist'])
    expect(state.conflicts.length).toBe(1)
    expect(state.conflicts[0].type).toBe('internal')
  })

  it('should set conflict status to building', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', ' lovers', ['Alice', 'Bob'])
    expect(state.conflicts[0].status).toBe('building')
  })

  it('should calculate average intensity', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', ' lovers', ['Alice', 'Bob'])
    expect(state.averageIntensity).toBe(30)
  })
})

describe('escalateConflict', () => {
  it('should increase intensity', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = escalateConflict(state, conflictId, 20)
    expect(state.conflicts[0].intensity).toBe(50)
  })

  it('should cap at 100', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = escalateConflict(state, conflictId, 80)
    expect(state.conflicts[0].intensity).toBe(100)
  })

  it('should set status to active', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = escalateConflict(state, conflictId, 10)
    expect(state.conflicts[0].status).toBe('active')
  })
})

describe('resolveConflict', () => {
  it('should change status to resolved', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = resolveConflict(state, conflictId)
    expect(state.conflicts[0].status).toBe('resolved')
  })

  it('should increment resolved count', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = resolveConflict(state, conflictId)
    expect(state.resolvedCount).toBe(1)
  })
})

describe('recordTensionPoint', () => {
  it('should add tension point', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 1, 80, 'Major confrontation')
    expect(state.tensionCurve.length).toBe(1)
    expect(state.tensionCurve[0].tension).toBe(80)
  })

  it('should sort by chapter', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 3, 60, 'Point 3')
    state = recordTensionPoint(state, 1, 30, 'Point 1')
    state = recordTensionPoint(state, 2, 45, 'Point 2')
    expect(state.tensionCurve[0].chapter).toBe(1)
    expect(state.tensionCurve[1].chapter).toBe(2)
    expect(state.tensionCurve[2].chapter).toBe(3)
  })

  it('should clamp tension value', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 1, 150, 'Too high')
    expect(state.tensionCurve[0].tension).toBe(100)
  })

  it('should update current chapter', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 5, 70, 'Point')
    expect(state.currentChapter).toBe(5)
  })
})

describe('getActiveConflicts', () => {
  it('should return active and building conflicts', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict 1', ['A', 'B'])
    state = createConflict(state, 'interpersonal', 'Conflict 2', ['C', 'D'])
    const conflictId = state.conflicts[0].conflictId
    state = resolveConflict(state, conflictId)
    expect(getActiveConflicts(state).length).toBe(1)
  })
})

describe('getConflictById', () => {
  it('should return null for unknown id', () => {
    const state = createEmptyConflictDramaticState()
    expect(getConflictById(state, 'unknown')).toBeNull()
  })

  it('should return conflict by id', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    const conflict = getConflictById(state, conflictId)
    expect(conflict).not.toBeNull()
    expect(conflict?.type).toBe('interpersonal')
  })
})

describe('formatConflictSummary', () => {
  it('should show conflict count', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    state = createConflict(state, 'internal', 'Inner conflict', ['Hero'])
    const summary = formatConflictSummary(state)
    expect(summary).toContain('Conflicts: 2')
  })

  it('should show resolved count', () => {
    let state = createEmptyConflictDramaticState()
    state = createConflict(state, 'interpersonal', 'Conflict', ['Alice', 'Bob'])
    const conflictId = state.conflicts[0].conflictId
    state = resolveConflict(state, conflictId)
    const summary = formatConflictSummary(state)
    expect(summary).toContain('Resolved: 1')
  })
})

describe('formatConflictDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 3, 60, 'Point')
    const dashboard = formatConflictDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show tension trend', () => {
    let state = createEmptyConflictDramaticState()
    state = recordTensionPoint(state, 1, 30, 'Low')
    state = recordTensionPoint(state, 2, 50, 'Medium')
    const dashboard = formatConflictDashboard(state)
    expect(dashboard).toContain('Tension Trend')
  })
})
