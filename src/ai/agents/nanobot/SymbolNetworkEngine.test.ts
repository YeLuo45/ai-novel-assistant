/**
 * SymbolNetworkEngine Tests - V187
 * Tests for Symbol & Motif Connection Tracking Network Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySymbolNetworkState,
  recordSymbolOccurrence,
  connectSymbols,
  getSymbol,
  getDominantSymbols,
  getSymbolConnections,
  formatSymbolSummary,
  formatSymbolDashboard,
} from './SymbolNetworkEngine'

describe('createEmptySymbolNetworkState', () => {
  it('should create empty state', () => {
    const state = createEmptySymbolNetworkState()
    expect(state.symbols.size).toBe(0)
    expect(state.dominantSymbols.length).toBe(0)
  })
})

describe('recordSymbolOccurrence', () => {
  it('should detect water symbol', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river flowed peacefully. Water glistened under the sun.', 'water')
    expect(state.symbols.has('water')).toBeTruthy()
  })

  it('should detect fire symbol', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The flame burned bright. The fire consumed everything.', 'fire')
    expect(state.symbols.has('fire')).toBeTruthy()
  })

  it('should increment frequency on repeated occurrence', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river flowed.', 'water')
    state = recordSymbolOccurrence(state, 2, 'Another river scene.', 'water')
    expect(state.symbols.get('water')?.frequency).toBe(2)
  })

  it('should track multiple occurrences', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river.', 'water')
    state = recordSymbolOccurrence(state, 2, 'The river again.', 'water')
    state = recordSymbolOccurrence(state, 3, 'Yet another river.', 'water')
    expect(state.symbols.get('water')?.occurrences.length).toBe(3)
  })

  it('should update current chapter', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 5, 'The river.', 'water')
    expect(state.currentChapter).toBe(5)
  })

  it('should update dominant symbols', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river flows.', 'water')
    state = recordSymbolOccurrence(state, 1, 'The river again.', 'water')
    state = recordSymbolOccurrence(state, 1, 'River.', 'water')
    expect(state.dominantSymbols).toContain('water')
  })

  it('should return state unchanged for no symbols', () => {
    let state = createEmptySymbolNetworkState()
    const result = recordSymbolOccurrence(state, 1, 'A simple sentence.', 'none')
    expect(result.symbols.size).toBe(0)
  })
})

describe('connectSymbols', () => {
  it('should connect two existing symbols', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river flowed.', 'water')
    state = recordSymbolOccurrence(state, 1, 'Fire burned.', 'fire')
    state = connectSymbols(state, 'water', 'fire')
    const water = state.symbols.get('water')
    expect(water?.connections).toContain('fire')
  })
})

describe('getSymbol', () => {
  it('should return null for unknown symbol', () => {
    const state = createEmptySymbolNetworkState()
    expect(getSymbol(state, 'water')).toBeNull()
  })

  it('should return symbol by name', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river.', 'water')
    const sym = getSymbol(state, 'water')
    expect(sym).not.toBeNull()
    expect(sym?.name).toBe('water')
  })
})

describe('getDominantSymbols', () => {
  it('should return empty for no symbols', () => {
    const state = createEmptySymbolNetworkState()
    expect(getDominantSymbols(state).length).toBe(0)
  })

  it('should return top symbols by frequency', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river.', 'water')
    state = recordSymbolOccurrence(state, 1, 'The river.', 'water')
    state = recordSymbolOccurrence(state, 1, 'Fire.', 'fire')
    const dominant = getDominantSymbols(state)
    expect(dominant[0]?.name).toBe('water')
  })
})

describe('getSymbolConnections', () => {
  it('should return empty for unknown symbol', () => {
    const state = createEmptySymbolNetworkState()
    expect(getSymbolConnections(state, 'water').length).toBe(0)
  })
})

describe('formatSymbolSummary', () => {
  it('should show symbol count', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river.', 'water')
    state = recordSymbolOccurrence(state, 1, 'Fire.', 'fire')
    const summary = formatSymbolSummary(state)
    expect(summary).toContain('Total Symbols: 2')
  })

  it('should show dominant symbols', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river. River.', 'water')
    state = recordSymbolOccurrence(state, 1, 'Fire.', 'fire')
    const summary = formatSymbolSummary(state)
    expect(summary).toContain('Dominant Symbols: water')
  })
})

describe('formatSymbolDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 3, 'The river.', 'water')
    const dashboard = formatSymbolDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show dominant symbols', () => {
    let state = createEmptySymbolNetworkState()
    state = recordSymbolOccurrence(state, 1, 'The river. River.', 'water')
    state = recordSymbolOccurrence(state, 1, 'Fire.', 'fire')
    const dashboard = formatSymbolDashboard(state)
    expect(dashboard).toContain('Dominant Symbols')
  })
})
