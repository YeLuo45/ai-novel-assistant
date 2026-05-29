import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeVocabularyPreferences,
  analyzePacingHabits,
  detectStructurePatterns,
  discoverPatterns,
  getTopVocabularyPreferences,
  getPersonalStyleSignature,
  compareWithPrevious,
  getSuggestedImprovements,
} from './WritingPatternLearner'

describe('createEmptyState', () => {
  it('should create empty state with default pacing habits', () => {
    const state = createEmptyState()
    expect(state.vocabularyProfile.size).toBe(0)
    expect(state.discoveredPatterns.size).toBe(0)
    expect(state.pacingHabits.sceneLength).toBe(0)
    expect(state.pacingHabits.dialogueRatio).toBe(0)
    expect(state.structurePatterns.structureType).toBe('linear')
    expect(state.typeAlias).toEqual({})
  })
})

describe('analyzeVocabularyPreferences', () => {
  it('should build vocabulary profile from text', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'The beautiful cat sat on the mat', 'text-1', 8)
    expect(state.vocabularyProfile.size).toBeGreaterThan(0)
    expect(state.historicalTexts.has('text-1')).toBe(true)
  })

  it('should accumulate frequency across texts', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'The beautiful cat', 'text-1', 4)
    state = analyzeVocabularyPreferences(state, 'The beautiful dog', 'text-2', 4)
    const catPref = state.vocabularyProfile.get('cat')
    expect(catPref).not.toBeUndefined()
    expect(catPref!.frequency).toBeGreaterThan(0)
  })

  it('should update historical texts map', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'Hello world test text', 't1', 4)
    expect(state.historicalTexts.get('t1')!.wordCount).toBe(4)
    expect(state.historicalTexts.get('t1')!.timestamp).toBeGreaterThan(0)
  })
})

describe('analyzePacingHabits', () => {
  it('should calculate average pacing metrics', () => {
    let state = createEmptyState()
    state = analyzePacingHabits(
      state,
      [500, 600, 400],  // sceneLengths
      [3000, 3500, 3200], // chapterLengths
      [0.3, 0.4, 0.35],  // dialogueRatios
      [5, 6, 4],         // actionDensities
      [1, 2, 1]          // pauseFrequencies
    )
    expect(state.pacingHabits.sceneLength).toBeCloseTo(500, -1)
    expect(state.pacingHabits.dialogueRatio).toBeCloseTo(0.35, -1)
  })

  it('should preserve existing values when arrays empty', () => {
    let state = createEmptyState()
    state = { ...state, pacingHabits: { ...state.pacingHabits, sceneLength: 800 } }
    state = analyzePacingHabits(state, [], [], [], [], [])
    expect(state.pacingHabits.sceneLength).toBe(800)
  })
})

describe('detectStructurePatterns', () => {
  it('should detect linear structure', () => {
    let state = createEmptyState()
    state = detectStructurePatterns(state, 'Once upon', 'The end', [1, 2, 3], 'smooth')
    expect(state.structurePatterns.structureType).toBe('linear')
  })

  it('should detect framed structure (decreasing)', () => {
    let state = createEmptyState()
    state = detectStructurePatterns(state, 'Opening', 'Closing', [5, 4, 3, 2, 1], 'chapter-break')
    expect(state.structurePatterns.structureType).toBe('framed')
  })

  it('should detect nonlinear structure', () => {
    let state = createEmptyState()
    state = detectStructurePatterns(state, 'Start', 'End', [3, 1, 5, 2, 4], 'cliffhanger')
    expect(state.structurePatterns.structureType).toBe('nonlinear')
  })

  it('should store opening and closing patterns', () => {
    let state = createEmptyState()
    const opening = 'Once upon a time in a faraway land'
    const closing = 'They lived happily ever after'
    state = detectStructurePatterns(state, opening, closing, [1, 2], 'smooth')
    expect(state.structurePatterns.openingPattern).toBe(opening.slice(0, 100))
    expect(state.structurePatterns.closingPattern).toBe(closing.slice(0, 100))
  })
})

describe('discoverPatterns', () => {
  it('should discover patterns from vocabulary', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'beautiful wonderful amazing beautiful', 't1', 4)
    state = { ...state, historicalTexts: new Map([['t1', { wordCount: 4, timestamp: Date.now() }]]) }
    state = discoverPatterns(state, 1)
    // Should have discovered vocabulary patterns
    expect(state.discoveredPatterns.size).toBeGreaterThan(0)
  })

  it('should set confidence based on occurrences', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'test test test test test', 't1', 5)
    state = { ...state, historicalTexts: new Map([['t1', { wordCount: 5, timestamp: Date.now() }]]) }
    state = discoverPatterns(state, 1)
    const pattern = Array.from(state.discoveredPatterns.values())[0]
    expect(pattern.confidence).toBeGreaterThan(0)
  })
})

describe('getTopVocabularyPreferences', () => {
  it('should return top K vocabulary', () => {
    let state = createEmptyState()
    state = analyzeVocabularyPreferences(state, 'beautiful cat dog running quickly slowly', 't1', 6)
    const top = getTopVocabularyPreferences(state, undefined, 3)
    expect(top.length).toBeLessThanOrEqual(3)
    expect(top[0]?.frequency).toBeGreaterThanOrEqual(top[1]?.frequency || 0)
  })
})

describe('getPersonalStyleSignature', () => {
  it('should return style signature', () => {
    const state = createEmptyState()
    const sig = getPersonalStyleSignature(state)
    expect(sig.uniqueWordCount).toBe(0)
    expect(sig.avgSceneLength).toBe(0)
    expect(sig.structureType).toBe('linear')
  })
})

describe('compareWithPrevious', () => {
  it('should detect vocabulary change', () => {
    const state = createEmptyState()
    const prev = getPersonalStyleSignature(state)
    const next = { ...prev, uniqueWordCount: 2000 }
    const state2 = { ...state, vocabularyProfile: new Map([['word', { word: 'word', category: 'noun', frequency: 10, favorability: 0.5 }]]) }
    const diff = compareWithPrevious(state2, prev)
    expect(diff.vocabularyChange).not.toBe(0)
  })

  it('should handle zero previous pace', () => {
    const state = createEmptyState()
    const prev = { uniqueWordCount: 0, avgSceneLength: 0, dialogueRatio: 0, structureType: 'linear', dominantPatternTypes: [] }
    const diff = compareWithPrevious(state, prev)
    expect(diff.pacingChange).toBe(0)
  })
})

describe('getSuggestedImprovements', () => {
  it('should suggest dialogue improvement when ratio low', () => {
    let state = createEmptyState()
    state = analyzePacingHabits(state, [500], [3000], [0.1], [5], [2])
    const suggestions = getSuggestedImprovements(state)
    expect(suggestions.some(s => s.toLowerCase().includes('dialogue'))).toBe(true)
  })

  it('should suggest structure variety when linear', () => {
    let state = createEmptyState()
    state = detectStructurePatterns(state, 'Open', 'Close', [1, 2, 3], 'smooth')
    const suggestions = getSuggestedImprovements(state)
    expect(suggestions.some(s => s.toLowerCase().includes('linear') || s.toLowerCase().includes('non-linear'))).toBe(true)
  })

  it('should return empty when patterns are rich', () => {
    let state = createEmptyState()
    state = { ...state, discoveredPatterns: new Map([['p1', { patternId: 'p1', patternType: 'pacing', occurrences: 5, confidence: 0.8, examples: [], frequency: 10, lastSeen: Date.now() }], ['p2', { patternId: 'p2', patternType: 'dialogue', occurrences: 5, confidence: 0.8, examples: [], frequency: 0.5, lastSeen: Date.now() }], ['p3', { patternId: 'p3', patternType: 'structure', occurrences: 5, confidence: 0.8, examples: [], frequency: 1, lastSeen: Date.now() }]]) }
    state = { ...state, pacingHabits: { ...state.pacingHabits, dialogueRatio: 0.35, pauseFrequency: 2 } }
    state = detectStructurePatterns(state, 'Open', 'Close', [3, 1, 5, 2, 4], 'cliffhanger')
    const suggestions = getSuggestedImprovements(state)
    expect(suggestions.length).toBe(0)
  })
})
