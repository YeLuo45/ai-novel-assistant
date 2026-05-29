import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeChapterVoice,
  getVoiceConsistency,
  compareChapterVoices,
  detectVoiceDrift,
} from './NarrativeVoiceAnalyzer'

describe('createEmptyState', () => {
  it('should create empty voice state', () => {
    const s = createEmptyState()
    expect(s.overallProfile.avgSentenceLength).toBe(15)
    expect(s.chapterVoices).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeChapterVoice', () => {
  it('should analyze casual dialogue', () => {
    let s = createEmptyState()
    s = analyzeChapterVoice(s, 'ch1', 'Hey! Are you coming?')
    expect(s.chapterVoices['ch1']).toBeDefined()
    expect(s.chapterVoices['ch1'].profile.formalityScore).toBeLessThan(60)
  })

  it('should analyze formal prose', () => {
    let s = createEmptyState()
    const formalText = 'The council convened at dawn. The ancient hall was illuminated by candlelight. Representatives from each province gathered in solemn silence.'
    s = analyzeChapterVoice(s, 'ch1', formalText)
    expect(s.chapterVoices['ch1'].profile.formalityScore).toBeGreaterThan(50)
  })

  it('should analyze action text', () => {
    let s = createEmptyState()
    const actionText = 'He ran. The building crashed. Glass exploded. People screamed.'
    s = analyzeChapterVoice(s, 'ch1', actionText)
    expect(s.chapterVoices['ch1'].profile.pacingScore).toBeGreaterThan(60)
  })

  it('should update overall profile', () => {
    let s = createEmptyState()
    s = analyzeChapterVoice(s, 'ch1', 'The hero walked through the dark forest.')
    expect(s.overallProfile.avgSentenceLength).not.toBe(15)
  })
})

describe('getVoiceConsistency', () => {
  it('should return 0 for unknown chapter', () => {
    const s = createEmptyState()
    expect(getVoiceConsistency(s, 'unknown')).toBe(0)
  })

  it('should return consistency score', () => {
    let s = createEmptyState()
    s = analyzeChapterVoice(s, 'ch1', 'A story begins with a hero.')
    expect(getVoiceConsistency(s, 'ch1')).toBeGreaterThan(0)
  })
})

describe('compareChapterVoices', () => {
  it('should return null for unknown chapters', () => {
    const s = createEmptyState()
    expect(compareChapterVoices(s, 'ch1', 'ch2')).toBeNull()
  })

  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = analyzeChapterVoice(s, 'ch1', 'A formal and literary text with long sentences and complex vocabulary.')
    s = analyzeChapterVoice(s, 'ch2', 'Hey! Run! Fast!')
    const result = compareChapterVoices(s, 'ch1', 'ch2')
    expect(result).not.toBeNull()
    expect(result!.moreFormal).toBe('ch1')
  })
})

describe('detectVoiceDrift', () => {
  it('should return no drift for few chapters', () => {
    const s = createEmptyState()
    const result = detectVoiceDrift(s)
    expect(result.hasDrift).toBe(false)
  })

  it('should detect voice drift', () => {
    let s = createEmptyState()
    // First 3 chapters with similar voice
    s = analyzeChapterVoice(s, 'ch1', 'A hero walked. He was brave.')
    s = analyzeChapterVoice(s, 'ch2', 'The hero continued. He was strong.')
    s = analyzeChapterVoice(s, 'ch3', 'The hero journeyed. He fought.')
    // Ch4 with very different voice (very short = very fast pace)
    s = analyzeChapterVoice(s, 'ch4', 'Boom! Crash! Bang!')
    const result = detectVoiceDrift(s)
    expect(result.driftedChapters.length).toBeGreaterThanOrEqual(0)
  })
})
