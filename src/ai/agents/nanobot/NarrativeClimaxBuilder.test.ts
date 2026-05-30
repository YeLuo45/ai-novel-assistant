import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerClimaxBeat,
  generateClimaxReport,
  getClimaxByChapter,
  getPeakedBeats,
  compareClimaxIntensity,
} from './NarrativeClimaxBuilder'

describe('createEmptyState', () => {
  it('should create empty climax state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerClimaxBeat', () => {
  it('should register climax beat', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 25, 'action', 'Epic battle', 95, 90, 8)
    expect(s.beats.length).toBe(1)
    expect(s.architecture?.peakTension).toBe(95)
    expect(s.beats[0].isPeaked).toBe(true)
  })

  it('should track highest tension beat', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 20, 'emotional', 'Emotional moment', 70, 75, 4)
    s = registerClimaxBeat(s, 25, 'action', 'Final battle', 95, 90, 8)
    expect(s.architecture?.climaxChapter).toBe(25)
    expect(s.architecture?.peakTension).toBe(95)
  })
})

describe('generateClimaxReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateClimaxReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.avgTension).toBe(0)
  })

  it('should count peaked beats', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 10, 'revelation', 'Reveal', 95, 90, 5)
    s = registerClimaxBeat(s, 20, 'confrontation', 'Confront', 60, 55, 3)
    const report = generateClimaxReport(s)
    expect(report.climaxCount).toBe(1)
    expect(report.avgTension).toBe(78)  // (95+60)/2 = 77.5 → round to 78
  })

  it('should recommend for low tension', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 10, 'decision', 'Decision', 55, 50, 2)
    s = registerClimaxBeat(s, 20, 'revelation', 'Reveal', 50, 45, 2)
    const report = generateClimaxReport(s)
    expect(report.recommendations.some(r => r.includes('tension too low'))).toBe(true)
  })
})

describe('getClimaxByChapter', () => {
  it('should return chapter climax', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 30, 'sacrifice', 'Sacrifice', 90, 95, 6)
    const beat = getClimaxByChapter(s, 30)
    expect(beat).not.toBeNull()
    expect(beat!.climaxType).toBe('sacrifice')
  })

  it('should return null for missing chapter', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 15, 'confrontation', 'Confront', 70, 65, 3)
    expect(getClimaxByChapter(s, 99)).toBeNull()
  })
})

describe('getPeakedBeats', () => {
  it('should return peaked beats', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 10, 'action', 'Peak', 95, 90, 5)
    s = registerClimaxBeat(s, 20, 'emotional', 'Not peak', 60, 55, 3)
    const peaked = getPeakedBeats(s)
    expect(peaked.length).toBe(1)
    expect(peaked[0].chapterNumber).toBe(10)
  })
})

describe('compareClimaxIntensity', () => {
  it('should compare emotional intensity', () => {
    let s = createEmptyState()
    s = registerClimaxBeat(s, 10, 'action', 'Action climax', 85, 70, 4)
    s = registerClimaxBeat(s, 20, 'emotional', 'Emotional climax', 75, 95, 5)
    const result = compareClimaxIntensity(s, 10, 20)
    expect(result.moreIntense).toBe(20)
    expect(result.intensity2).toBe(95)
  })
})
