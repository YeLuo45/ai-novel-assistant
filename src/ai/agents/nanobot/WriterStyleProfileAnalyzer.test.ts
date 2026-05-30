/**
 * WriterStyleProfileAnalyzer Tests - V151
 * Tests for Multi-Dimensional Writing Style Analysis Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyAnalyzerState,
  analyzeVocabulary,
  analyzeSyntax,
  analyzeDialogue,
  analyzeNarrativeVoice,
  buildStyleProfile,
  saveProfile,
  compareProfiles,
  setBenchmark,
  analyzeStyleGap,
  formatStyleProfile,
  formatStyleDashboard,
} from './WriterStyleProfileAnalyzer'

// =============================================================================
// State Management Tests
// =============================================================================

describe('createEmptyAnalyzerState', () => {
  it('should create empty state', () => {
    const state = createEmptyAnalyzerState()
    expect(state.profiles.size).toBe(0)
    expect(state.currentProfileId).toBeNull()
    expect(state.benchmarkProfile).toBeNull()
  })

  it('should have zero session count', () => {
    const state = createEmptyAnalyzerState()
    expect(state.sessionCount).toBe(0)
  })
})

// =============================================================================
// Vocabulary Analysis Tests
// =============================================================================

describe('analyzeVocabulary', () => {
  it('should analyze empty text', () => {
    const result = analyzeVocabulary('')
    expect(result.totalWordCount).toBe(0)
    expect(result.typeTokenRatio).toBe(0)
  })

  it('should calculate type-token ratio', () => {
    const result = analyzeVocabulary('the cat sat on the mat')
    expect(result.totalWordCount).toBe(6)
    expect(result.uniqueWordCount).toBe(5)
    expect(result.typeTokenRatio).toBeCloseTo(5/6, 1)
  })

  it('should identify rare words', () => {
    const result = analyzeVocabulary('a b c a b c')
    expect(result.rareWordRatio).toBe(0)  // all words appear twice
  })

  it('should calculate average word length', () => {
    const result = analyzeVocabulary('ab cd ef')
    expect(result.avgWordLength).toBe(2)
  })

  it('should count advanced words', () => {
    const result = analyzeVocabulary('beautiful international')
    expect(result.advancedWordCount).toBe(2)  // both > 8 chars
  })

  it('should score colloquial language', () => {
    const result = analyzeVocabulary('yeah gonna wanna stuff things cool')
    expect(result.colloquialScore).toBeGreaterThan(0)
  })
})

// =============================================================================
// Syntax Analysis Tests
// =============================================================================

describe('analyzeSyntax', () => {
  it('should analyze empty text', () => {
    const result = analyzeSyntax('')
    expect(result.avgSentenceLength).toBe(0)
  })

  it('should calculate average sentence length', () => {
    const result = analyzeSyntax('The cat sat. The dog ran. The bird flew.')
    expect(result.avgSentenceLength).toBe(3)  // 3 words per sentence
  })

  it('should count complex sentences', () => {
    const text = 'This is short. This is a much longer sentence with many more words to count properly for the analysis.'
    const result = analyzeSyntax(text)
    expect(result.complexSentenceRatio).toBeLessThan(1)
  })

  it('should identify question ratio', () => {
    const result = analyzeSyntax('What is this? Is it real? Yes.')
    expect(result.questionRatio).toBeCloseTo(2/3, 1)
  })

  it('should count paragraph averages', () => {
    const text = 'First paragraph. Second sentence.\n\nNew paragraph. Another.'
    const result = analyzeSyntax(text)
    expect(result.paragraphAvgLength).toBe(2)  // 2 sentences per paragraph
  })
})

// =============================================================================
// Dialogue Analysis Tests
// =============================================================================

describe('analyzeDialogue', () => {
  it('should analyze text with no dialogue', () => {
    const result = analyzeDialogue('There was a garden.')
    expect(result.dialogueRatio).toBe(0)
  })

  it('should calculate dialogue ratio', () => {
    const result = analyzeDialogue('Hello said she. "I am here."')
    expect(result.dialogueRatio).toBeGreaterThan(0)
  })

  it('should count unique speakers', () => {
    const text = 'John said. "Hello." Mary said. "Hi."'
    const result = analyzeDialogue(text)
    expect(result.uniqueSpeakerCount).toBe(2)
  })

  it('should calculate inner thought ratio', () => {
    const result = analyzeDialogue('She walked. -- What if I fail? --')
    expect(result.innerThoughtRatio).toBeGreaterThan(0)
  })
})

// =============================================================================
// Narrative Voice Tests
// =============================================================================

describe('analyzeNarrativeVoice', () => {
  it('should score first person', () => {
    const result = analyzeNarrativeVoice('I walked through the forest. I felt afraid.')
    expect(result.distanceScore).toBeLessThan(50)
  })

  it('should score third person', () => {
    const result = analyzeNarrativeVoice('She walked through the forest. He saw her fear.')
    expect(result.distanceScore).toBeGreaterThan(50)
  })

  it('should measure emotional leak', () => {
    const result = analyzeNarrativeVoice('I felt a deep sadness in my heart.')
    expect(result.emotionalLeakScore).toBeGreaterThan(0)
  })

  it('should identify subjective words', () => {
    const result = analyzeNarrativeVoice('Perhaps it seemed like maybe he thought.')
    expect(result.subjectiveWordDensity).toBeGreaterThan(0)
  })

  it('should track tense distribution', () => {
    const result = analyzeNarrativeVoice('She was there. He is here. They will come.')
    expect(result.tenseDistribution.get('past')).toBeGreaterThan(0)
    expect(result.tenseDistribution.get('present')).toBeGreaterThan(0)
  })
})

// =============================================================================
// Style Profile Building Tests
// =============================================================================

describe('buildStyleProfile', () => {
  it('should build complete profile', () => {
    const profile = buildStyleProfile('The quick brown fox jumps.')
    expect(profile.vocabulary.totalWordCount).toBeGreaterThan(0)
    expect(profile.overallScore).toBeGreaterThan(0)
  })

  it('should detect genre affinity', () => {
    const profile = buildStyleProfile('I am the hero. I feel brave. I will fight.')
    expect(profile.genreAffinity.length).toBeGreaterThan(0)
    expect(profile.genreAffinity).toContain('first_person')
  })

  it('should assign general_fiction when no specific match', () => {
    const profile = buildStyleProfile('a bird flew over the garden a bird flew')
    expect(profile.genreAffinity).toContain('general_fiction')
  })
})

describe('saveProfile', () => {
  it('should save and track profile', () => {
    let state = createEmptyAnalyzerState()
    state = saveProfile(state, 5, 'The hero walked through darkness.')
    
    expect(state.profiles.size).toBe(1)
    expect(state.currentProfileId).toBe('profile_ch5')
    expect(state.sessionCount).toBe(1)
  })

  it('should cap history at 20', () => {
    let state = createEmptyAnalyzerState()
    for (let i = 1; i <= 25; i++) {
      state = saveProfile(state, i, `Chapter ${i} text`)
    }
    
    expect(state.analysisHistory.length).toBe(20)
  })
})

// =============================================================================
// Style Comparison Tests
// =============================================================================

describe('compareProfiles', () => {
  it('should compare two profiles', () => {
    const p1 = buildStyleProfile('The cat sat on the mat')
    const p2 = buildStyleProfile('A brave hero walked through dark forests')
    
    const result = compareProfiles(p1, p2)
    expect(result.similarity).toBeGreaterThan(0)
    expect(Array.isArray(result.differences)).toBe(true)
  })

  it('should return high similarity for similar styles', () => {
    const p1 = buildStyleProfile('A small cat walked through the garden. It was happy.')
    const p2 = buildStyleProfile('A large dog ran through the forest. It was joyful.')
    
    const result = compareProfiles(p1, p2)
    expect(result.similarity).toBeGreaterThan(60)
  })
})

describe('setBenchmark', () => {
  it('should set benchmark profile', () => {
    let state = createEmptyAnalyzerState()
    state = setBenchmark(state, 'Target style text with specific characteristics')
    
    expect(state.benchmarkProfile).not.toBeNull()
    expect(state.benchmarkProfile?.overallScore).toBeGreaterThan(0)
  })
})

describe('analyzeStyleGap', () => {
  it('should analyze gap between current and benchmark', () => {
    let state = createEmptyAnalyzerState()
    state = setBenchmark(state, 'A long text with many complex sentences and rich vocabulary')
    state = saveProfile(state, 1, 'Short text')
    
    const gap = analyzeStyleGap(state)
    expect(gap.gapScore).toBeGreaterThan(0)
  })

  it('should return empty when no benchmark', () => {
    const state = createEmptyAnalyzerState()
    const gap = analyzeStyleGap(state)
    expect(gap.gapScore).toBe(0)
    expect(gap.areas.length).toBe(0)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatStyleProfile', () => {
  it('should format complete profile', () => {
    const profile = buildStyleProfile('A story with some words and dialogue. "Hello," she said.')
    const formatted = formatStyleProfile(profile)
    
    expect(formatted).toContain('Overall Score')
    expect(formatted).toContain('Vocabulary Metrics')
    expect(formatted).toContain('Genre Affinity')
  })

  it('should show type-token ratio', () => {
    const profile = buildStyleProfile('the the the')
    const formatted = formatStyleProfile(profile)
    expect(formatted).toContain('Type-Token Ratio')
  })
})

describe('formatStyleDashboard', () => {
  it('should show session count', () => {
    const state = createEmptyAnalyzerState()
    const dashboard = formatStyleDashboard(state)
    expect(dashboard).toContain('Profiles analyzed: 0')
  })

  it('should show recent history', () => {
    let state = createEmptyAnalyzerState()
    state = saveProfile(state, 1, 'Chapter one content')
    state = saveProfile(state, 2, 'Chapter two content')
    
    const dashboard = formatStyleDashboard(state)
    expect(dashboard).toContain('Recent Analysis')
  })

  it('should show benchmark gap', () => {
    let state = createEmptyAnalyzerState()
    state = setBenchmark(state, 'Benchmark with very rich vocabulary and complex sentence structures')
    state = saveProfile(state, 1, 'Simple text')
    
    const dashboard = formatStyleDashboard(state)
    expect(dashboard).toContain('Benchmark Active')
    expect(dashboard).toContain('Style gap')
  })

  it('should include suggestions when available', () => {
    let state = createEmptyAnalyzerState()
    state = setBenchmark(state, 'In the profound depths of existential contemplation, the protagonist traversed the labyrinthine corridors of consciousness while contemplating the multiplicity of philosophical paradigms and their implications for human existence. Furthermore, the narrative employed a heterogeneous syntactic architecture comprising elaborate subordinate clauses and polysyllabic nomenclature.')
    state = saveProfile(state, 1, 'Simple short text')
    
    const dashboard = formatStyleDashboard(state)
    expect(dashboard).toContain('Suggestions')
  })
})
