import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerWave,
  detectPattern,
  generateTensionReport,
  getChapterTension,
} from './NarrativeTensionWaveEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.waves).toEqual([])
  })
})

describe('registerWave', () => {
  it('should register a wave', () => {
    let s = createEmptyState()
    s = registerWave(s, 5, 10, 'rising', 90, 30)
    expect(s.waves.length).toBe(1)
    expect(s.waves[0].pattern).toBe('rising')
    expect(s.waves[0].intensity).toBe(60)
  })

  it('should calculate intensity', () => {
    let s = createEmptyState()
    s = registerWave(s, 1, 5, 'rising', 80, 20)
    expect(s.waves[0].intensity).toBe(60)
  })
})

describe('detectPattern', () => {
  it('should detect rising pattern', () => {
    let s = createEmptyState()
    s = registerWave(s, 1, 5, 'rising', 80, 30)
    s = registerWave(s, 6, 10, 'rising', 90, 40)
    const pattern = detectPattern(s.waves)
    expect(pattern).toBe('rising')
  })

  it('should return plateau for low intensity', () => {
    const waves: any[] = []
    expect(detectPattern(waves)).toBe('plateau')
  })
})

describe('generateTensionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateTensionReport(s)
    expect(report.totalWaves).toBe(0)
    expect(report.climacticChapter).toBeNull()
  })

  it('should identify climax chapter', () => {
    let s = createEmptyState()
    s = registerWave(s, 1, 5, 'rising', 60, 30)
    s = registerWave(s, 6, 12, 'climax', 95, 50)
    const report = generateTensionReport(s)
    expect(report.climacticChapter).toBe(12)
  })
})

describe('getChapterTension', () => {
  it('should return tension for chapter in wave', () => {
    let s = createEmptyState()
    s = registerWave(s, 5, 10, 'rising', 90, 30)
    const tension = getChapterTension(s, 7)
    expect(tension).toBeGreaterThan(30)
    expect(tension).toBeLessThan(90)
  })

  it('should return null for chapter outside waves', () => {
    let s = createEmptyState()
    s = registerWave(s, 5, 10, 'rising', 90, 30)
    expect(getChapterTension(s, 15)).toBeNull()
  })
})
