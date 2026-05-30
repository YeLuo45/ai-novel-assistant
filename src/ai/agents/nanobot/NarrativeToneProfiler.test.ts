import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addToneSegment,
  mergeToneSegments,
  generateToneProfile,
  getChapterTone,
  getToneByCategory,
  compareToneIntensity,
} from './NarrativeToneProfiler'

describe('createEmptyState', () => {
  it('should create empty tone state', () => {
    const s = createEmptyState()
    expect(s.segments).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addToneSegment', () => {
  it('should add tone segment', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'tense', 80, 'fear')
    expect(s.segments.length).toBe(1)
    expect(s.segments[0].tone).toBe('tense')
    expect(s.segments[0].intensity).toBe(80)
  })

  it('should clamp intensity', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 20, 'dark', 150, 'doom')
    expect(s.segments[0].intensity).toBe(100)
  })
})

describe('mergeToneSegments', () => {
  it('should merge adjacent segments', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'tense', 80, 'fear')
    s = addToneSegment(s, 'ch1', 31, 60, 'tense', 70, 'anxiety')
    const [id1, id2] = [s.segments[0].id, s.segments[1].id]
    s = mergeToneSegments(s, id1, id2)
    expect(s.segments.length).toBe(1)
    expect(s.segments[0].endPosition).toBe(60)
  })
})

describe('generateToneProfile', () => {
  it('should return empty profile', () => {
    const s = createEmptyState()
    const profile = generateToneProfile(s)
    expect(profile.totalSegments).toBe(0)
    expect(profile.dominantTone).toBeNull()
  })

  it('should calculate dominant tone', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'dark', 80, 'doom')
    s = addToneSegment(s, 'ch2', 0, 30, 'dark', 70, 'gloom')
    s = addToneSegment(s, 'ch3', 0, 30, 'romantic', 60, 'love')
    const profile = generateToneProfile(s)
    expect(profile.dominantTone).toBe('dark')
    expect(profile.toneDistribution['dark']).toBe(2)
  })

  it('should calculate average intensity', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'tense', 80, 'fear')
    s = addToneSegment(s, 'ch2', 0, 30, 'lighthearted', 40, 'joy')
    const profile = generateToneProfile(s)
    expect(profile.averageIntensity).toBe(60)
  })
})

describe('getChapterTone', () => {
  it('should return chapter segments', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'dark', 80, 'doom')
    s = addToneSegment(s, 'ch2', 0, 30, 'romantic', 60, 'love')
    const ch1Tone = getChapterTone(s, 'ch1')
    expect(ch1Tone.length).toBe(1)
    expect(ch1Tone[0].tone).toBe('dark')
  })
})

describe('getToneByCategory', () => {
  it('should return segments by tone', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'melancholic', 70, 'sadness')
    s = addToneSegment(s, 'ch2', 0, 30, 'melancholic', 60, 'grief')
    s = addToneSegment(s, 'ch3', 0, 30, 'triumphant', 80, 'victory')
    const melancholic = getToneByCategory(s, 'melancholic')
    expect(melancholic.length).toBe(2)
  })
})

describe('compareToneIntensity', () => {
  it('should compare segment intensities', () => {
    let s = createEmptyState()
    s = addToneSegment(s, 'ch1', 0, 30, 'tense', 85, 'fear')
    s = addToneSegment(s, 'ch2', 0, 30, 'whimsical', 45, 'fun')
    const [id1, id2] = [s.segments[0].id, s.segments[1].id]
    const result = compareToneIntensity(s, id1, id2)
    expect(result.moreIntense).toBe(id1)
    expect(result.intensity1).toBe(85)
  })
})
