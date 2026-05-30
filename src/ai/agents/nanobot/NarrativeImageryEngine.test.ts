import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerImagery,
  generateImageryReport,
  getSymbolDensity,
  compareSensoryBalance,
} from './NarrativeImageryEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.clusters).toEqual([])
  })
})

describe('registerImagery', () => {
  it('should register new imagery', () => {
    let s = createEmptyState()
    s = registerImagery(s, 'crimson', 5, 'visual', 20)
    expect(s.clusters.length).toBe(1)
    expect(s.clusters[0].symbol).toBe('crimson')
    expect(s.clusters[0].dominantChannel).toBe('visual')
  })

  it('should add occurrence to existing symbol', () => {
    let s = createEmptyState()
    s = registerImagery(s, 'crimson', 5, 'visual', 20)
    s = registerImagery(s, 'crimson', 10, 'tactile', 15)
    expect(s.clusters.length).toBe(1)
    expect(s.clusters[0].occurrences).toContain(5)
    expect(s.clusters[0].occurrences).toContain(10)
  })
})

describe('generateImageryReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateImageryReport(s)
    expect(report.totalClusters).toBe(0)
    expect(report.avgDensity).toBe(0)
  })

  it('should calculate avg density', () => {
    let s = createEmptyState()
    s = registerImagery(s, 'crimson', 5, 'visual', 20)
    s = registerImagery(s, 'crimson', 10, 'visual', 20)
    s = registerImagery(s, 'ocean', 3, 'auditory', 10)
    const report = generateImageryReport(s)
    expect(report.totalClusters).toBe(2)
    expect(report.avgDensity).toBeGreaterThan(0)
  })
})

describe('getSymbolDensity', () => {
  it('should return density for symbol', () => {
    let s = createEmptyState()
    s = registerImagery(s, 'crimson', 5, 'visual', 20)
    s = registerImagery(s, 'crimson', 10, 'visual', 20)
    s = registerImagery(s, 'crimson', 15, 'visual', 20)
    const density = getSymbolDensity(s, 'crimson')
    expect(density).toBe(30)
  })

  it('should return 0 for missing symbol', () => {
    let s = createEmptyState()
    expect(getSymbolDensity(s, 'nonexistent')).toBe(0)
  })
})

describe('compareSensoryBalance', () => {
  it('should return balance counts', () => {
    let s = createEmptyState()
    s = registerImagery(s, 'crimson', 5, 'visual', 20)
    s = registerImagery(s, 'wave', 10, 'auditory', 10)
    s = registerImagery(s, 'storm', 15, 'kinesthetic', 10)
    const balance = compareSensoryBalance(s)
    expect(balance.visual).toBe(1)
    expect(balance.auditory).toBe(1)
    expect(balance.kinesthetic).toBe(1)
  })
})
