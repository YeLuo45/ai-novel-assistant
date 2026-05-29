import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeDialogue,
  recordDialogue,
  getSpeechPattern,
  learnSpeechPattern,
  compareDialogueQuality,
} from './DialogueQualityEngine'

describe('createEmptyState', () => {
  it('should create empty dialogue state', () => {
    const s = createEmptyState()
    expect(s.speechPatterns).toEqual({})
    expect(s.dialogueHistory).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeDialogue', () => {
  it('should analyze natural dialogue', () => {
    const s = createEmptyState()
    const result = analyzeDialogue(s, 'alice', 'Hello! How are you doing today?')
    expect(result.authenticityScore).toBeGreaterThan(50)
    expect(result.naturalnessScore).toBeGreaterThan(50)
  })

  it('should detect long sentence issues', () => {
    const s = createEmptyState()
    const longText = 'The quick brown fox jumps over the lazy dog and then runs through the forest and climbs over the fence and goes to the other side of the river where the water is deep and cold and the fish are swimming happily in the clear blue water of the riverbed.'
    const result = analyzeDialogue(s, 'alice', longText)
    expect(result.issues.some(i => i.includes('long'))).toBe(true)
  })

  it('should detect low vocabulary variety', () => {
    const s = createEmptyState()
    const repetitive = 'the the the the the the the the the the the the the the the the the the'
    const result = analyzeDialogue(s, 'alice', repetitive)
    expect(result.issues.some(i => i.includes('variety'))).toBe(true)
  })
})

describe('recordDialogue', () => {
  it('should record dialogue in history', () => {
    let s = createEmptyState()
    s = recordDialogue(s, 'alice', 'Hello Bob!')
    expect(s.dialogueHistory.length).toBe(1)
    expect(s.dialogueHistory[0].characterId).toBe('alice')
  })

  it('should update overall quality', () => {
    let s = createEmptyState()
    s = recordDialogue(s, 'alice', 'Hello! How are you?')
    expect(s.overallQuality.authenticityScore).toBeGreaterThan(0)
  })
})

describe('getSpeechPattern', () => {
  it('should return null for unknown character', () => {
    const s = createEmptyState()
    expect(getSpeechPattern(s, 'unknown')).toBeNull()
  })

  it('should return learned pattern', () => {
    let s = createEmptyState()
    s = learnSpeechPattern(s, 'alice', ['Hello! How are you?', 'I am doing well today.'])
    const pattern = getSpeechPattern(s, 'alice')
    expect(pattern).not.toBeNull()
    expect(pattern!.characterId).toBe('alice')
  })
})

describe('learnSpeechPattern', () => {
  it('should learn pattern from samples', () => {
    let s = createEmptyState()
    s = learnSpeechPattern(s, 'bob', ['What are you doing?', 'Where are you going?', 'How old are you?'])
    const pattern = getSpeechPattern(s, 'bob')
    expect(pattern!.questionFrequency).toBeGreaterThan(0)
    expect(pattern!.commonWords.length).toBeGreaterThan(0)
  })

  it('should calculate average sentence length', () => {
    let s = createEmptyState()
    s = learnSpeechPattern(s, 'charlie', ['Short line.', 'A slightly longer sentence here.'])
    const pattern = getSpeechPattern(s, 'charlie')
    expect(pattern!.avgSentenceLength).toBeGreaterThan(0)
  })
})

describe('compareDialogueQuality', () => {
  it('should return null for no dialogue', () => {
    const s = createEmptyState()
    expect(compareDialogueQuality(s, 'alice', 'bob')).toBeNull()
  })

  it('should compare two characters', () => {
    let s = createEmptyState()
    s = recordDialogue(s, 'alice', 'Hello! How are you doing today?')
    s = recordDialogue(s, 'bob', 'The quick brown fox jumps over the lazy dog.')
    const result = compareDialogueQuality(s, 'alice', 'bob')
    expect(result).not.toBeNull()
    expect(result!.moreNatural).toBeTruthy()
  })
})
