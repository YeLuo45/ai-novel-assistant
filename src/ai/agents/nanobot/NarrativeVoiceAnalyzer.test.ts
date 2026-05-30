import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addVoiceMarker,
  detectDominantVoice,
  findVoiceDeviations,
  generateVoiceReport,
  getChapterVoice,
  compareChapterVoice,
} from './NarrativeVoiceAnalyzer'

describe('createEmptyState', () => {
  it('should create empty voice state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addVoiceMarker', () => {
  it('should add voice marker', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].voiceType).toBe('first_person')
    expect(s.markers[0].voiceConsistency).toBeGreaterThan(50)
  })

  it('should reduce consistency for high passive', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 50, 70, 30, 5)
    // passive 50 > 30, reduces by 10
    expect(s.markers[0].voiceConsistency).toBeLessThan(80)
  })
})

describe('detectDominantVoice', () => {
  it('should return null for empty', () => {
    expect(detectDominantVoice(createEmptyState())).toBeNull()
  })

  it('should return most common voice', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'third_limited', 20, 5.5, 15, 70, 30, 5)
    s = addVoiceMarker(s, 2, 'third_limited', 20, 5.5, 15, 70, 30, 5)
    s = addVoiceMarker(s, 3, 'first_person', 20, 5.5, 15, 70, 30, 5)
    expect(detectDominantVoice(s)).toBe('third_limited')
  })
})

describe('findVoiceDeviations', () => {
  it('should return empty for insufficient data', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    expect(findVoiceDeviations(s)).toEqual([])
  })

  it('should detect voice deviations', () => {
    let s = createEmptyState()
    // ch1: first_person, intrusion 5 → consistency 80
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    // ch2: first_person, intrusion 5 → consistency 80
    s = addVoiceMarker(s, 2, 'first_person', 20, 5.5, 15, 70, 30, 5)
    // ch3: third_omniscient, intrusion 90, dialogue 80 → consistency 52 (80-(90-40)*0.4-(80-60)*0.2=80-20-4=56)
    s = addVoiceMarker(s, 3, 'third_omniscient', 20, 5.5, 15, 70, 80, 90)
    // dominant is first_person (2 vs 1)
    // ch3: |52-80|=28 > 20 → deviation
    const deviations = findVoiceDeviations(s)
    expect(deviations).toContain(3)
  })
})

describe('generateVoiceReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateVoiceReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.avgConsistency).toBe(100)
  })

  it('should calculate avg consistency', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    s = addVoiceMarker(s, 2, 'first_person', 20, 5.5, 15, 70, 30, 5)
    const report = generateVoiceReport(s)
    expect(report.totalMarkers).toBe(2)
    expect(report.avgConsistency).toBeGreaterThan(50)
  })
})

describe('getChapterVoice', () => {
  it('should return chapter voice', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 5, 'third_limited', 20, 5.5, 15, 70, 30, 5)
    const marker = getChapterVoice(s, 5)
    expect(marker).not.toBeNull()
    expect(marker!.voiceType).toBe('third_limited')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    expect(getChapterVoice(s, 99)).toBeNull()
  })
})

describe('compareChapterVoice', () => {
  it('should compare consistency scores', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 50, 70, 30, 5)  // lower
    s = addVoiceMarker(s, 2, 'first_person', 20, 5.5, 10, 70, 30, 5)  // higher
    const result = compareChapterVoice(s, 1, 2)
    expect(result.moreConsistent).toBe(2)
  })
})
