import { describe, it, expect } from 'vitest'
import {
  createEmptyWorldbuildingState,
  addLoreEntry,
  getLoreByCategory,
  getLoreEntry,
  formatWorldbuildingSummary,
  formatWorldbuildingDashboard,
} from './WorldbuildingDepthEngine'

describe('createEmptyWorldbuildingState', () => {
  it('should create empty state', () => {
    const state = createEmptyWorldbuildingState()
    expect(state.lore.size).toBe(0)
    expect(state.depthScore).toBe(0)
    expect(state.consistencyScore).toBe(100)
  })
})

describe('addLoreEntry', () => {
  it('should add first lore entry', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'history', 'Great War', 'A war that shaped the kingdom')
    expect(state.lore.size).toBe(1)
  })

  it('should set entry category and name', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire Magic', 'Magic based on fire elements')
    const entry = state.lore.get('magic:Fire Magic')
    expect(entry).not.toBeNull()
    expect(entry?.category).toBe('magic')
  })

  it('should calculate depth score', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'history', 'War', 'A long description of the great war that shaped the kingdom')
    state = addLoreEntry(state, 'magic', 'Fire', 'Description of fire magic')
    state = addLoreEntry(state, 'geography', 'Mountains', 'Description of the mountains')
    expect(state.depthScore).toBeGreaterThan(0)
  })

  it('should track multiple entries', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'history', 'War1', 'Desc1')
    state = addLoreEntry(state, 'magic', 'Magic1', 'Desc2')
    expect(state.lore.size).toBe(2)
  })
})

describe('getLoreByCategory', () => {
  it('should return empty for unknown category', () => {
    const state = createEmptyWorldbuildingState()
    expect(getLoreByCategory(state, 'history').length).toBe(0)
  })

  it('should return entries in category', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'history', 'War', 'Desc')
    state = addLoreEntry(state, 'magic', 'Fire', 'Desc')
    const historyEntries = getLoreByCategory(state, 'history')
    expect(historyEntries.length).toBe(1)
    expect(historyEntries[0].name).toBe('War')
  })

  it('should return multiple entries in same category', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Fire magic description')
    state = addLoreEntry(state, 'magic', 'Water', 'Water magic description')
    const magicEntries = getLoreByCategory(state, 'magic')
    expect(magicEntries.length).toBe(2)
  })
})

describe('getLoreEntry', () => {
  it('should return null for unknown entry', () => {
    const state = createEmptyWorldbuildingState()
    expect(getLoreEntry(state, 'history', 'Unknown')).toBeNull()
  })

  it('should return lore entry by category and name', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire Magic', 'Description of fire magic')
    const entry = getLoreEntry(state, 'magic', 'Fire Magic')
    expect(entry).not.toBeNull()
    expect(entry?.description).toContain('fire')
  })
})

describe('formatWorldbuildingSummary', () => {
  it('should show lore entry count', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    state = addLoreEntry(state, 'history', 'War', 'Description')
    const summary = formatWorldbuildingSummary(state)
    expect(summary).toContain('Lore Entries: 2')
  })

  it('should show depth score', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    state = addLoreEntry(state, 'history', 'War', 'Description')
    const summary = formatWorldbuildingSummary(state)
    expect(summary).toContain('Depth Score:')
  })

  it('should show consistency score', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    const summary = formatWorldbuildingSummary(state)
    expect(summary).toContain('Consistency:')
  })
})

describe('formatWorldbuildingDashboard', () => {
  it('should show depth score', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    const dashboard = formatWorldbuildingDashboard(state)
    expect(dashboard).toContain('Depth Score:')
  })

  it('should show total lore count', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    state = addLoreEntry(state, 'history', 'War', 'Description')
    const dashboard = formatWorldbuildingDashboard(state)
    expect(dashboard).toContain('2 entries')
  })

  it('should show categories', () => {
    let state = createEmptyWorldbuildingState()
    state = addLoreEntry(state, 'magic', 'Fire', 'Description')
    state = addLoreEntry(state, 'history', 'War', 'Description')
    const dashboard = formatWorldbuildingDashboard(state)
    expect(dashboard).toContain('magic')
    expect(dashboard).toContain('history')
  })
})
