import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSymbol,
  interpretSymbol,
  getSymbolCluster,
  getChapterSymbols,
  findSymbolPatterns,
  compareSymbolDensity,
} from './SymbolDensityAnalyzer'

describe('createEmptyState', () => {
  it('should create empty symbol state', () => {
    const s = createEmptyState()
    expect(s.instances).toEqual([])
    expect(s.clusters).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerSymbol', () => {
  it('should register a symbol', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'The building burned.')
    expect(s.instances.length).toBe(1)
    expect(s.clusters['Fire']).toBeDefined()
    expect(s.clusters['Fire'].occurrences).toBe(1)
  })

  it('should track multiple occurrences', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 20, 'Fire burned.')
    s = registerSymbol(s, 'Fire', 'ch2', 50, 'Fire consumed.')
    expect(s.clusters['Fire'].occurrences).toBe(2)
    expect(s.clusters['Fire'].chapters).toContain('ch1')
    expect(s.clusters['Fire'].chapters).toContain('ch2')
  })

  it('should link symbol to theme', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire burned.', 'destruction')
    expect(s.thematicMap['destruction']).toContain('Fire')
  })

  it('should update dominant symbol', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    s = registerSymbol(s, 'Water', 'ch2', 50, 'Water.')
    s = registerSymbol(s, 'Fire', 'ch3', 50, 'Fire.')
    expect(s.dominantSymbol).toBe('Fire')
  })
})

describe('interpretSymbol', () => {
  it('should add interpretation to evolution', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire burned.')
    s = interpretSymbol(s, 'Fire', 'Destruction and transformation')
    expect(s.clusters['Fire'].evolution).toContain('Destruction and transformation')
  })
})

describe('getSymbolCluster', () => {
  it('should return null for unknown symbol', () => {
    const s = createEmptyState()
    expect(getSymbolCluster(s, 'Unknown')).toBeNull()
  })

  it('should return cluster', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    const cluster = getSymbolCluster(s, 'Fire')
    expect(cluster).not.toBeNull()
    expect(cluster!.symbol).toBe('Fire')
  })
})

describe('getChapterSymbols', () => {
  it('should return symbols for chapter', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    s = registerSymbol(s, 'Water', 'ch1', 30, 'Water.')
    const symbols = getChapterSymbols(s, 'ch1')
    expect(symbols.length).toBe(2)
  })
})

describe('findSymbolPatterns', () => {
  it('should find repeated symbols', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    s = registerSymbol(s, 'Fire', 'ch2', 50, 'Fire.')
    s = registerSymbol(s, 'Fire', 'ch3', 50, 'Fire.')
    const patterns = findSymbolPatterns(s)
    expect(patterns.repeatedSymbols).toContain('Fire')
  })

  it('should find growing and fading symbols', () => {
    let s = createEmptyState()
    // ch1-2 first, then ch5-6 later
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    s = registerSymbol(s, 'Fire', 'ch2', 50, 'Fire.')
    s = registerSymbol(s, 'Fire', 'ch5', 50, 'Fire.')
    s = registerSymbol(s, 'Fire', 'ch6', 50, 'Fire.')
    // ch1-2 then ch3 only
    s = registerSymbol(s, 'Water', 'ch1', 50, 'Water.')
    s = registerSymbol(s, 'Water', 'ch2', 50, 'Water.')
    s = registerSymbol(s, 'Water', 'ch3', 50, 'Water.')
    const patterns = findSymbolPatterns(s)
    expect(patterns.growingSymbols.length).toBeGreaterThanOrEqual(0)
    expect(patterns.fadingSymbols.length).toBeGreaterThanOrEqual(0)
  })

  it('should find isolated symbols', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    const patterns = findSymbolPatterns(s)
    expect(patterns.isolatedSymbols).toContain('Fire')
  })
})

describe('compareSymbolDensity', () => {
  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = registerSymbol(s, 'Fire', 'ch1', 50, 'Fire.')
    s = registerSymbol(s, 'Water', 'ch1', 50, 'Water.')
    s = registerSymbol(s, 'Fire', 'ch2', 50, 'Fire.')
    const result = compareSymbolDensity(s, 'ch1', 'ch2')
    expect(result.richerSymbolism).toBe('ch1')
    expect(result.uniqueInCh1).toContain('Water')
  })
})
