import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  trackEmotion,
  generateEmotionReport,
  getChapterEmotions,
} from './NarrativeEmotionEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
  })
})

describe('trackEmotion', () => {
  it('should track emotion', () => {
    let s = createEmptyState()
    s = trackEmotion(s, 5, 'positive', 70, 'joy', 'excitement')
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].primaryEmotion).toBe('joy')
    expect(s.markers[0].valence).toBe('positive')
  })

  it('should detect rising arc', () => {
    let s = createEmptyState()
    s = trackEmotion(s, 5, 'positive', 30, 'calm')
    s = trackEmotion(s, 10, 'positive', 60, 'joy')
    expect(s.markers[1].arcPosition).toBe('rising')
  })

  it('should detect peak', () => {
    let s = createEmptyState()
    s = trackEmotion(s, 5, 'positive', 85, 'excitement')
    s = trackEmotion(s, 10, 'positive', 95, 'ecstasy')
    expect(s.markers[1].arcPosition).toBe('peak')
  })
})

describe('generateEmotionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateEmotionReport(s)
    expect(report.totalMarkers).toBe(0)
    expect(report.dominantValence).toBeNull()
  })

  it('should identify dominant valence', () => {
    let s = createEmptyState()
    s = trackEmotion(s, 5, 'positive', 60, 'joy')
    s = trackEmotion(s, 10, 'positive', 70, 'excitement')
    s = trackEmotion(s, 15, 'negative', 40, 'sadness')
    const report = generateEmotionReport(s)
    expect(report.dominantValence).toBe('positive')
    expect(report.totalMarkers).toBe(3)
  })
})

describe('getChapterEmotions', () => {
  it('should return chapter emotions', () => {
    let s = createEmptyState()
    s = trackEmotion(s, 5, 'positive', 60, 'joy')
    s = trackEmotion(s, 5, 'ambivalent', 50, 'hope', 'fear')
    const ch5 = getChapterEmotions(s, 5)
    expect(ch5.length).toBe(2)
  })
})
