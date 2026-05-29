import { describe, it, expect } from 'vitest'
import {
  createEmptySymbolDensityState,
  registerSymbol,
  getSymbolInstances,
  getSymbolsByCategory,
  getSymbolFrequency,
  getMostFrequentSymbols,
  formatSymbolDensitySummary,
  formatSymbolDensityDashboard,
} from './NarrativeSymbolDensityEngine'

describe('createEmptySymbolDensityState', () => {
  it('should create empty state', () => {
    const state = createEmptySymbolDensityState()
    expect(state.instances.length).toBe(0)
    expect(state.densityScore).toBe(50)
  })
})

describe('registerSymbol', () => {
  it('should add symbol instance', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'golden ring on finger', 'wealth', 70)
    expect(state.instances.length).toBe(1)
    expect(state.instances[0].name).toBe('ring')
  })

  it('should detect object category', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'key', 'key on table', 'access', 60)
    expect(state.instances[0].category).toBe('object')
  })

  it('should detect color category', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'red', 'red sky', 'danger', 50)
    expect(state.instances[0].category).toBe('color')
  })

  it('should detect animal category', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'raven', 'raven perched', 'death', 65)
    expect(state.instances[0].category).toBe('animal')
  })

  it('should detect weather category', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'rain', 'rain falling', 'sorrow', 55)
    expect(state.instances[0].category).toBe('weather')
  })

  it('should track symbol counts', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'ring1', 'wealth', 60)
    state = registerSymbol(state, 5, 'ring', 'ring2', 'loss', 70)
    expect(state.symbolCounts['ring']).toBe(2)
  })

  it('should update category distribution', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'key', 'key context', 'access', 60)
    expect(state.categoryDistribution.object).toBe(1)
  })

  it('should calculate density score', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'ring1', 'wealth', 60)
    state = registerSymbol(state, 2, 'key', 'key1', 'access', 60)
    state = registerSymbol(state, 3, 'door', 'door1', 'opportunity', 60)
    expect(state.densityScore).toBeGreaterThanOrEqual(15)
  })
})

describe('getSymbolInstances', () => {
  it('should return instances by name', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'ring1', 'wealth', 60)
    state = registerSymbol(state, 5, 'ring', 'ring2', 'loss', 70)
    const instances = getSymbolInstances(state, 'ring')
    expect(instances.length).toBe(2)
  })
})

describe('getSymbolsByCategory', () => {
  it('should return symbols by category', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'ring context', 'wealth', 60)
    state = registerSymbol(state, 2, 'raven', 'raven context', 'death', 50)
    const objects = getSymbolsByCategory(state, 'object')
    expect(objects.length).toBe(1)
  })
})

describe('getSymbolFrequency', () => {
  it('should return 0 for missing symbol', () => {
    const state = createEmptySymbolDensityState()
    expect(getSymbolFrequency(state, 'missing')).toBe(0)
  })

  it('should return frequency', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'context1', 'wealth', 60)
    state = registerSymbol(state, 2, 'ring', 'context2', 'wealth', 60)
    expect(getSymbolFrequency(state, 'ring')).toBe(2)
  })
})

describe('getMostFrequentSymbols', () => {
  it('should return sorted symbols', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'context', 'wealth', 60)
    state = registerSymbol(state, 2, 'ring', 'context', 'wealth', 60)
    state = registerSymbol(state, 3, 'key', 'context', 'access', 60)
    const top = getMostFrequentSymbols(state, 5)
    expect(top[0].name).toBe('ring')
    expect(top[0].count).toBe(2)
  })
})

describe('formatSymbolDensitySummary', () => {
  it('should show symbol summary', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'context', 'wealth', 60)
    const summary = formatSymbolDensitySummary(state)
    expect(summary).toContain('Instances: 1')
  })
})

describe('formatSymbolDensityDashboard', () => {
  it('should show symbol dashboard', () => {
    let state = createEmptySymbolDensityState()
    state = registerSymbol(state, 1, 'ring', 'context', 'wealth', 60)
    const dash = formatSymbolDensityDashboard(state)
    expect(dash).toContain('Instances: 1')
  })
})