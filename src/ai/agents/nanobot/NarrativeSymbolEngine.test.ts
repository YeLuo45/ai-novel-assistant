import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  trackSymbol,
  linkSymbolTheme,
  generateSymbolReport,
  getSymbolByName,
} from './NarrativeSymbolEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.symbols).toEqual([])
  })
})

describe('trackSymbol', () => {
  it('should track new symbol', () => {
    let s = createEmptyState()
    s = trackSymbol(s, 'crown', 5, 'iron crown', 30, 'surface')
    expect(s.symbols.length).toBe(1)
    expect(s.symbols[0].symbolName).toBe('crown')
    expect(s.symbols[0].frequencyScore).toBe(12)
  })

  it('should accumulate occurrences', () => {
    let s = createEmptyState()
    s = trackSymbol(s, 'crown', 5, 'iron crown', 30, 'surface')
    s = trackSymbol(s, 'crown', 15, 'golden crown', 50, 'thematic')
    expect(s.symbols[0].occurrences.length).toBe(2)
    expect(s.symbols[0].frequencyScore).toBe(24)
  })
})

describe('linkSymbolTheme', () => {
  it('should link symbol to theme', () => {
    let s = createEmptyState()
    s = trackSymbol(s, 'crown', 5, 'iron crown', 30, 'surface')
    s = linkSymbolTheme(s, 'crown', 'power')
    const crown = getSymbolByName(s, 'crown')
    expect(crown!.associatedThemes).toContain('power')
  })
})

describe('generateSymbolReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateSymbolReport(s)
    expect(report.totalSymbols).toBe(0)
    expect(report.avgFrequency).toBe(0)
  })

  it('should calculate avg frequency', () => {
    let s = createEmptyState()
    s = trackSymbol(s, 'crown', 5, 'iron', 30, 'surface')
    s = trackSymbol(s, 'crown', 10, 'gold', 40, 'thematic')
    s = trackSymbol(s, 'rose', 8, 'red', 20, 'surface')
    const report = generateSymbolReport(s)
    expect(report.totalSymbols).toBe(2)
    expect(report.avgFrequency).toBeGreaterThan(0)
  })
})

describe('getSymbolByName', () => {
  it('should return symbol', () => {
    let s = createEmptyState()
    s = trackSymbol(s, 'crown', 5, 'iron', 30, 'surface')
    const crown = getSymbolByName(s, 'crown')
    expect(crown).not.toBeNull()
    expect(crown!.symbolName).toBe('crown')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getSymbolByName(s, 'nonexistent')).toBeNull()
  })
})
