import { describe, it, expect } from 'vitest'
import {
  createEmptySymbolMotifState,
  trackSymbol,
  createMotifGroup,
  getSymbolInfo,
  getFrequentSymbols,
  formatSymbolSummary,
  formatSymbolDashboard,
} from './SymbolMotifEngine'

describe('createEmptySymbolMotifState', () => {
  it('should create empty state', () => {
    const state = createEmptySymbolMotifState()
    expect(state.symbols.size).toBe(0)
    expect(state.motifGroups.length).toBe(0)
    expect(state.averageConsistency).toBe(100)
  })
})

describe('trackSymbol', () => {
  it('should track new symbol', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'A dark raven flew overhead', 60)
    expect(state.symbols.size).toBe(1)
    expect(state.symbols.get('Raven')?.frequency).toBe(1)
  })

  it('should add occurrence to existing symbol', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First raven', 60)
    state = trackSymbol(state, 'Raven', 5, 'Second raven', 70)
    expect(state.symbols.get('Raven')?.frequency).toBe(2)
    expect(state.symbols.get('Raven')?.occurrences.length).toBe(2)
  })

  it('should update current chapter', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 3, 'Third raven', 60)
    expect(state.currentChapter).toBe(3)
  })

  it('should calculate consistency', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 50)
    state = trackSymbol(state, 'Raven', 2, 'Second', 50)
    state = trackSymbol(state, 'Raven', 3, 'Third', 50)
    expect(state.symbols.get('Raven')?.consistencyScore).toBe(100)
  })
})

describe('createMotifGroup', () => {
  it('should create motif group', () => {
    let state = createEmptySymbolMotifState()
    state = createMotifGroup(state, ['Raven', 'Black', 'Night'])
    expect(state.motifGroups.length).toBe(1)
    expect(state.motifGroups[0]).toContain('Raven')
  })
})

describe('getSymbolInfo', () => {
  it('should return null for unknown symbol', () => {
    const state = createEmptySymbolMotifState()
    expect(getSymbolInfo(state, 'Unknown')).toBeNull()
  })

  it('should return symbol info', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 60)
    const info = getSymbolInfo(state, 'Raven')
    expect(info).not.toBeNull()
    expect(info?.symbol).toBe('Raven')
  })
})

describe('getFrequentSymbols', () => {
  it('should return empty for no matches', () => {
    const state = createEmptySymbolMotifState()
    expect(getFrequentSymbols(state, 3).length).toBe(0)
  })

  it('should return symbols with frequency >= threshold', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 60)
    state = trackSymbol(state, 'Raven', 2, 'Second', 60)
    state = trackSymbol(state, 'Raven', 3, 'Third', 60)
    state = trackSymbol(state, 'Moon', 1, 'Moon', 50)
    const frequent = getFrequentSymbols(state, 3)
    expect(frequent.length).toBe(1)
    expect(frequent[0].symbol).toBe('Raven')
  })
})

describe('formatSymbolSummary', () => {
  it('should show symbol count', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 60)
    state = trackSymbol(state, 'Moon', 2, 'Second', 50)
    const summary = formatSymbolSummary(state)
    expect(summary).toContain('Symbols: 2')
  })

  it('should show motif group count', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 60)
    state = createMotifGroup(state, ['Raven', 'Moon'])
    const summary = formatSymbolSummary(state)
    expect(summary).toContain('Motif Groups: 1')
  })
})

describe('formatSymbolDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 4, 'First', 60)
    const dashboard = formatSymbolDashboard(state)
    expect(dashboard).toContain('Chapter: 4')
  })

  it('should show top symbols', () => {
    let state = createEmptySymbolMotifState()
    state = trackSymbol(state, 'Raven', 1, 'First', 60)
    state = trackSymbol(state, 'Raven', 2, 'Second', 60)
    state = trackSymbol(state, 'Raven', 3, 'Third', 60)
    state = trackSymbol(state, 'Moon', 1, 'Moon', 50)
    const dashboard = formatSymbolDashboard(state)
    expect(dashboard).toContain('Raven')
  })
})
