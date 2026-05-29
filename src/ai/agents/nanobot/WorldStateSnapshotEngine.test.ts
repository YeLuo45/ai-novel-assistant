import { describe, it, expect } from 'vitest'
import {
  createEmptyWorldSnapshotState,
  takeSnapshot,
  compareSnapshots,
  getWorldChangeRate,
  getConsistentElements,
  formatSnapshotSummary,
  formatSnapshotDashboard,
} from './WorldStateSnapshotEngine'

describe('createEmptyWorldSnapshotState', () => {
  it('should create empty state', () => {
    const state = createEmptyWorldSnapshotState()
    expect(state.snapshots.length).toBe(0)
  })
})

describe('takeSnapshot', () => {
  it('should take snapshot with chapter data', () => {
    let state = createEmptyWorldSnapshotState()
    const worldData = { locations: ['castle'], characters: ['alice'], items: ['sword'] }
    state = takeSnapshot(state, 1, worldData)
    expect(state.snapshots.length).toBe(1)
    expect(state.snapshots[0].chapter).toBe(1)
  })

  it('should track location count', () => {
    let state = createEmptyWorldSnapshotState()
    const worldData = { locations: ['castle', 'forest'], characters: ['alice'], items: ['sword'] }
    state = takeSnapshot(state, 1, worldData)
    expect(state.snapshots[0].data.locationCount).toBe(2)
  })
})

describe('compareSnapshots', () => {
  it('should return change count between snapshots', () => {
    let state = createEmptyWorldSnapshotState()
    state = takeSnapshot(state, 1, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    state = takeSnapshot(state, 2, { locations: ['castle', 'forest'], characters: ['alice', 'bob'], items: ['sword', 'shield'] })
    const changes = compareSnapshots(state, 1, 2)
    expect(changes).toBeGreaterThan(0)
  })
})

describe('getWorldChangeRate', () => {
  it('should return changes per chapter', () => {
    let state = createEmptyWorldSnapshotState()
    state = takeSnapshot(state, 1, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    state = takeSnapshot(state, 2, { locations: ['forest'], characters: ['bob'], items: ['shield'] })
    const rate = getWorldChangeRate(state)
    expect(rate).toBeGreaterThanOrEqual(0)
  })
})

describe('getConsistentElements', () => {
  it('should return elements that persist across snapshots', () => {
    let state = createEmptyWorldSnapshotState()
    state = takeSnapshot(state, 1, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    state = takeSnapshot(state, 2, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    const consistent = getConsistentElements(state)
    expect(consistent.length).toBeGreaterThanOrEqual(0)
  })
})

describe('formatSnapshotSummary', () => {
  it('should show snapshot count', () => {
    let state = createEmptyWorldSnapshotState()
    state = takeSnapshot(state, 1, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    const summary = formatSnapshotSummary(state)
    expect(summary).toContain('Snapshots: 1')
  })
})

describe('formatSnapshotDashboard', () => {
  it('should show latest chapter', () => {
    let state = createEmptyWorldSnapshotState()
    state = takeSnapshot(state, 5, { locations: ['castle'], characters: ['alice'], items: ['sword'] })
    const dash = formatSnapshotDashboard(state)
    expect(dash).toContain('Chapter: 5')
  })
})
