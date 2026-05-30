import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSubplot,
  advanceSubplotStatus,
  updateSubplotTension,
  deliverSubplotPayoff,
  generateInterweavingAnalysis,
  getSubplotProgress,
  compareSubplotInterweaving,
} from './SubplotInterweavingEngine'

describe('createEmptyState', () => {
  it('should create empty subplot state', () => {
    const s = createEmptyState()
    expect(s.subplots).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerSubplot', () => {
  it('should register a subplot', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Romance Arc', 3, ['hero', 'princess'], 70)
    expect(s.subplots.length).toBe(1)
    expect(s.subplots[0].name).toBe('Romance Arc')
    expect(s.subplots[0].status).toBe('setup')
  })

  it('should set importance level', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Minor Plot', 5, ['sidekick'], 30)
    expect(s.subplots[0].importanceLevel).toBe(30)
  })
})

describe('advanceSubplotStatus', () => {
  it('should advance status', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot', 1, ['hero'], 50)
    const subplotId = s.subplots[0].id
    s = advanceSubplotStatus(s, subplotId, 'rising')
    expect(s.subplots[0].status).toBe('rising')
  })
})

describe('updateSubplotTension', () => {
  it('should update tension score', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot', 1, ['hero'], 50)
    const subplotId = s.subplots[0].id
    s = updateSubplotTension(s, subplotId, 75)
    expect(s.subplots[0].tensionScore).toBe(75)
  })
})

describe('deliverSubplotPayoff', () => {
  it('should mark subplot as resolved', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot', 1, ['hero'], 50)
    const subplotId = s.subplots[0].id
    s = advanceSubplotStatus(s, subplotId, 'climax')
    s = deliverSubplotPayoff(s, subplotId, 10)
    expect(s.subplots[0].payoffDelivered).toBe(true)
    expect(s.subplots[0].status).toBe('resolution')
    expect(s.subplots[0].chapterEnd).toBe(10)
  })
})

describe('generateInterweavingAnalysis', () => {
  it('should return empty analysis', () => {
    const s = createEmptyState()
    const analysis = generateInterweavingAnalysis(s)
    expect(analysis.totalSubplots).toBe(0)
    expect(analysis.dominantSubplot).toBeNull()
  })

  it('should identify dominant subplot', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Minor', 1, ['a'], 20)
    s = registerSubplot(s, 'Major', 1, ['b'], 90)
    const analysis = generateInterweavingAnalysis(s)
    expect(analysis.dominantSubplot).toBe('Major')
  })

  it('should count active subplots', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot 1', 1, ['hero'], 50)
    s = registerSubplot(s, 'Plot 2', 2, ['hero'], 50)
    const analysis = generateInterweavingAnalysis(s)
    expect(analysis.activeSubplots).toBe(2)
  })
})

describe('getSubplotProgress', () => {
  it('should return 0 for unknown subplot', () => {
    const s = createEmptyState()
    expect(getSubplotProgress(s, 'unknown')).toBe(0)
  })

  it('should return progress based on status', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot', 1, ['hero'], 50)
    const subplotId = s.subplots[0].id
    s = advanceSubplotStatus(s, subplotId, 'climax')
    expect(getSubplotProgress(s, subplotId)).toBe(80)
  })
})

describe('compareSubplotInterweaving', () => {
  it('should compare chapters', () => {
    let s = createEmptyState()
    s = registerSubplot(s, 'Plot A', 1, ['ch1_hero', 'ch1_ally'], 70)
    s = registerSubplot(s, 'Plot B', 2, ['ch2_hero', 'ch2_ally'], 60)
    const result = compareSubplotInterweaving(s, 'ch1', 'ch2')
    expect(result.moreComplex).toBeTruthy()
  })
})
