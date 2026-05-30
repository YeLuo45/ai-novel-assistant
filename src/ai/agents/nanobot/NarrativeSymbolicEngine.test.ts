import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSymbol,
  generateSymbolicReport,
  getSymbolByName,
  getSymbolByCategory,
  compareSymbolFrequency,
} from './NarrativeSymbolicEngine'

describe('createEmptyState', () => {
  it('should create empty symbolic state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerSymbol', () => {
  it('should register a new symbol', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 70)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].symbol).toBe('water')
    expect(s.markers[0].frequency).toBe(1)
  })

  it('should extend existing symbol', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 60)
    s = registerSymbol(s, 'water', 'elemental', 5, 80)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].frequency).toBe(2)
    expect(s.markers[0].chaptersAppeared).toEqual([1, 5])
  })

  it('should track meaning evolution', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'fire', 'elemental', 1, 40)
    s = registerSymbol(s, 'fire', 'elemental', 15, 90)
    expect(s.markers[0].meaningEvolution.length).toBe(1)
  })
})

describe('generateSymbolicReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateSymbolicReport(s)
    expect(report.totalSymbols).toBe(0)
    expect(report.dominantCategory).toBeNull()
  })

  it('should identify dominant category', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 70)
    s = registerSymbol(s, 'fire', 'elemental', 2, 60)
    s = registerSymbol(s, 'raven', 'animal', 3, 50)
    const report = generateSymbolicReport(s)
    expect(report.dominantCategory).toBe('elemental')
  })

  it('should identify high-frequency symbols', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 70)
    s = registerSymbol(s, 'water', 'elemental', 5, 80)
    s = registerSymbol(s, 'water', 'elemental', 10, 75)
    s = registerSymbol(s, 'fire', 'elemental', 2, 60)
    const report = generateSymbolicReport(s)
    expect(report.highFrequencySymbols).toContain('water')
  })
})

describe('getSymbolByName', () => {
  it('should return symbol by name', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'shadow', 'elemental', 1, 65)
    const symbol = getSymbolByName(s, 'shadow')
    expect(symbol).not.toBeNull()
    expect(symbol!.symbol).toBe('shadow')
  })

  it('should be case insensitive', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Moon', 'celestial', 1, 70)
    expect(getSymbolByName(s, 'moon')).not.toBeNull()
  })
})

describe('getSymbolByCategory', () => {
  it('should return symbols by category', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 70)
    s = registerSymbol(s, 'fire', 'elemental', 2, 60)
    s = registerSymbol(s, 'raven', 'animal', 3, 50)
    const elemental = getSymbolByCategory(s, 'elemental')
    expect(elemental.length).toBe(2)
  })
})

describe('compareSymbolFrequency', () => {
  it('should compare frequencies', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'water', 'elemental', 1, 70)
    s = registerSymbol(s, 'water', 'elemental', 5, 80)
    s = registerSymbol(s, 'fire', 'elemental', 2, 60)
    const result = compareSymbolFrequency(s, 'water', 'fire')
    expect(result.moreFrequent).toBe('water')
    expect(result.freq1).toBe(2)
    expect(result.freq2).toBe(1)
  })
})
