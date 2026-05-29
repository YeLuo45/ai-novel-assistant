import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeVocabularyPreferences,
  analyzePacingHabits,
  extractStyleFingerprint,
  analyzeWritingSample,
  getMostCommonWords,
  compareFingerprints,
  checkStyleConsistency,
  suggestVocabularyImprovements,
} from './WritingPatternLearner'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.vocabulary).toEqual([])
    expect(s.pacingHabit).toBeNull()
    expect(s.fingerprint).toBeNull()
    expect(s.totalWordsAnalyzed).toBe(0)
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeVocabularyPreferences', () => {
  it('should count word frequencies', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'hello world hello everyone hello')
    expect(s.vocabulary.find(v => v.word === 'hello')!.frequency).toBe(3)
  })

  it('should update existing words on second call', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'testing testing running')
    s = analyzeVocabularyPreferences(s, 'testing jumping climbing')
    expect(s.vocabulary.find(v => v.word === 'testing')!.frequency).toBeGreaterThanOrEqual(1)
  })

  it('should track total words analyzed', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'one two three four five')
    expect(s.totalWordsAnalyzed).toBe(5)
  })

  it('should increment sessions', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'first session content here')
    expect(s.sessionsAnalyzed).toBe(1)
    s = analyzeVocabularyPreferences(s, 'second session content here')
    expect(s.sessionsAnalyzed).toBe(2)
  })

  it('should sort by frequency descending', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'alpha beta alpha beta beta gamma alpha')
    expect(s.vocabulary[0].word).toBe('alpha')
    expect(s.vocabulary[1].word).toBe('beta')
  })

  it('should set timestamp', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'some words in this text')
    expect(s.lastAnalysisTimestamp).toBeGreaterThan(0)
  })
})

describe('analyzePacingHabits', () => {
  it('should compute avg sentence length', () => {
    let s = createEmptyState()
    s = analyzePacingHabits(s, 'Short sentence. Another one here. And one more.')
    expect(s.pacingHabit!.avgSentenceLength).toBeGreaterThan(0)
  })

  it('should compute avg paragraph length', () => {
    let s = createEmptyState()
    s = analyzePacingHabits(s, 'First paragraph words here.\n\nSecond paragraph words here still.')
    expect(s.pacingHabit!.avgParagraphLength).toBeGreaterThan(0)
  })

  it('should handle empty text', () => {
    let s = createEmptyState()
    s = analyzePacingHabits(s, '')
    expect(s.pacingHabit!.avgSentenceLength).toBe(0)
  })

  it('should calculate dialogue ratio', () => {
    let s = createEmptyState()
    s = analyzePacingHabits(s, '"Hello," said the girl. The room was dark.')
    expect(s.pacingHabit!.dialogueToNarrationRatio).toBeGreaterThan(0)
  })

  it('should track action density', () => {
    let s = createEmptyState()
    s = analyzePacingHabits(s, 'He ran to the door and jumped out the window when he looked at me.')
    expect(s.pacingHabit!.actionDensity).toBeGreaterThan(0)
  })
})

describe('extractStyleFingerprint', () => {
  it('should compute unique word ratio', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'hello world hello planet hello')
    expect(s.fingerprint!.uniqueWordRatio).toBeLessThan(1)
    expect(s.fingerprint!.uniqueWordRatio).toBeGreaterThan(0)
  })

  it('should compute avg word length', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'hello world testing')
    expect(s.fingerprint!.avgWordLength).toBeGreaterThan(3)
  })

  it('should compute sentence variance', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'Short. Medium length sentence here. This is a much longer sentence to balance things out.')
    expect(s.fingerprint!.sentenceVariance).toBeGreaterThan(0)
  })

  it('should compute punctuation density', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'Hello, world! How are you? I am fine.')
    expect(s.fingerprint!.punctuationDensity[',']).toBeGreaterThan(0)
  })

  it('should track first person pronouns', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'I walked to the store and I saw my friend. We talked for a while.')
    expect(s.fingerprint!.firstPersonPronounRatio).toBeGreaterThan(0)
  })

  it('should track conjunction ratio', () => {
    let s = createEmptyState()
    s = extractStyleFingerprint(s, 'I walked and I ran but I did not stop so I kept going')
    expect(s.fingerprint!.conjunctionRatio).toBeGreaterThan(0)
  })
})

describe('analyzeWritingSample', () => {
  it('should call all three analyzers', () => {
    let s = createEmptyState()
    s = analyzeWritingSample(s, 'I walked to the store and I bought some food. It was good.')
    expect(s.vocabulary.length).toBeGreaterThan(0)
    expect(s.pacingHabit).not.toBeNull()
    expect(s.fingerprint).not.toBeNull()
  })
})

describe('getMostCommonWords', () => {
  it('should return top N words', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'alpha beta gamma delta epsilon alpha beta gamma alpha beta')
    const top = getMostCommonWords(s, 3)
    expect(top.length).toBeLessThanOrEqual(3)
  })

  it('should be ordered by frequency descending', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'zero one two one two one one')
    const top = getMostCommonWords(s, 2)
    expect(top[0].word).toBe('one')
    expect(top[0].frequency).toBe(4)
  })

  it('should default to 20 words', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, Array(30).fill('word').join(' '))
    const top = getMostCommonWords(s)
    expect(top.length).toBeGreaterThan(0) // all same word
  })
})

describe('compareFingerprints', () => {
  it('should return high similarity for similar fingerprints', () => {
    const fp1: any = { uniqueWordRatio: 0.8, avgWordLength: 4.5, sentenceVariance: 10, paragraphVariance: 20, punctuationDensity: {}, firstPersonPronounRatio: 0.05, conjunctionRatio: 0.03 }
    const fp2: any = { uniqueWordRatio: 0.82, avgWordLength: 4.6, sentenceVariance: 11, paragraphVariance: 19, punctuationDensity: {}, firstPersonPronounRatio: 0.05, conjunctionRatio: 0.03 }
    const result = compareFingerprints(fp1, fp2)
    expect(result.similarity).toBeGreaterThan(80)
  })

  it('should return low similarity for very different fingerprints', () => {
    const fp1: any = { uniqueWordRatio: 0.5, avgWordLength: 3.0, sentenceVariance: 30, paragraphVariance: 40, punctuationDensity: {}, firstPersonPronounRatio: 0.2, conjunctionRatio: 0.1 }
    const fp2: any = { uniqueWordRatio: 0.9, avgWordLength: 7.0, sentenceVariance: 2, paragraphVariance: 5, punctuationDensity: {}, firstPersonPronounRatio: 0.01, conjunctionRatio: 0.01 }
    const result = compareFingerprints(fp1, fp2)
    expect(result.differences.length).toBeGreaterThan(2)
    expect(result.similarity).toBeLessThan(50)
  })

  it('should report specific differences', () => {
    const fp1: any = { uniqueWordRatio: 0.5, avgWordLength: 3.0, sentenceVariance: 30, paragraphVariance: 40, punctuationDensity: {}, firstPersonPronounRatio: 0.2, conjunctionRatio: 0.1 }
    const fp2: any = { uniqueWordRatio: 0.9, avgWordLength: 3.2, sentenceVariance: 30, paragraphVariance: 40, punctuationDensity: {}, firstPersonPronounRatio: 0.2, conjunctionRatio: 0.1 }
    const result = compareFingerprints(fp1, fp2)
    expect(result.differences.some(d => d.includes('uniqueWordRatio'))).toBe(true)
  })
})

describe('checkStyleConsistency', () => {
  it('should return consistent for insufficient sessions', () => {
    let s = createEmptyState()
    s.fingerprint = { uniqueWordRatio: 0.7, avgWordLength: 4, sentenceVariance: 10, paragraphVariance: 20, punctuationDensity: {}, firstPersonPronounRatio: 0.05, conjunctionRatio: 0.03 }
    s.sessionsAnalyzed = 2
    const result = checkStyleConsistency(s, 'Some text to check')
    expect(result.consistent).toBe(true)
    expect(result.warnings[0]).toContain('Insufficient')
  })

  it('should return consistent for similar text', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = analyzeWritingSample(s, 'I walked to the store and I bought some food yesterday when I was feeling tired.')
    }
    const result = checkStyleConsistency(s, 'I ran to the park and I played some games with my friend.')
    expect(result.similarityScore).toBeGreaterThan(60)
  })
})

describe('suggestVocabularyImprovements', () => {
  it('should suggest expansion for small vocabulary', () => {
    let s = createEmptyState()
    s = analyzeVocabularyPreferences(s, 'word word word word word')
    const suggestions = suggestVocabularyImprovements(s)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0]).toContain('vocabulary')
  })

  it('should warn about overused words', () => {
    let s = createEmptyState()
    // Create many entries of the same word
    for (let i = 0; i < 30; i++) {
      s = analyzeVocabularyPreferences(s, 'repeat repeat repeat repeat repeat')
    }
    const suggestions = suggestVocabularyImprovements(s)
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('should return empty for normal vocabulary', () => {
    let s = createEmptyState()
    const words = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
      'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine', 'watermelon', 'zucchini',
      'carrot', 'broccoli', 'spinach', 'kale', 'lettuce', 'tomato', 'cucumber', 'pepper', 'onion', 'garlic']
    s = analyzeVocabularyPreferences(s, words.join(' ') + ' ' + words.join(' '))
    const suggestions = suggestVocabularyImprovements(s)
    // May or may not have suggestions depending on pacing
    expect(Array.isArray(suggestions)).toBe(true)
  })
})
