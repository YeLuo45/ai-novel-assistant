/**
 * ReaderDifficultyAnalysisEngine Tests — V516
 * Comprehensive tests for ReadabilityCalculator, DifficultyClassifier, AdaptationSuggestionEngine
 */

import { describe, it, expect } from 'vitest'
import {
  // Tokenizer & Syllable Counter
  countSyllables,
  isComplexWord,
  countWords,
  countSentences,
  countTotalSyllables,
  
  // Readability Calculator
  calculateFleschKincaidGrade,
  calculateFleschReadingEase,
  calculateVocabularyDifficulty,
  calculateSentenceComplexity,
  calculateOverallReadabilityScore,
  calculateReadabilityMetrics,
  
  // Difficulty Classifier
  classifyDifficulty,
  DEFAULT_DIFFICULTY_THRESHOLDS,
  
  // Adaptation Suggestion Engine
  generateReduceDifficultySuggestions,
  generateIncreaseChallengeSuggestions,
  generateAdaptationSuggestions,
  DEFAULT_ADAPTATION_THRESHOLDS,
  
  // State Management
  createEmptyDifficultyState,
  analyzeTextDifficulty,
  addAnalysisToHistory,
  getDifficultySummary,
  
  // Comprehensive Analysis
  analyzeReaderDifficulty,
  
  // Types
  ReadabilityMetrics,
  DifficultyClassification,
  AdaptationSuggestion
} from './ReaderDifficultyAnalysisEngine'

// ============================================================
// SYLLABLE COUNTER TESTS
// ============================================================

describe('SyllableCounter', () => {
  describe('countSyllables', () => {
    it('should count syllables in simple words', () => {
      expect(countSyllables('hello')).toBe(2)
      expect(countSyllables('world')).toBe(1)
      expect(countSyllables('beautiful')).toBe(4) // our heuristic may vary
    })
    
    it('should handle empty strings', () => {
      expect(countSyllables('')).toBe(0)
    })
    
    it('should handle words with silent e', () => {
      expect(countSyllables('made')).toBe(1)
      expect(countSyllables('love')).toBe(1)
    })
    
    it('should handle complex words', () => {
      expect(countSyllables('extraordinary')).toBe(5) // heuristic may count differently
      expect(countSyllables('responsibility')).toBe(6)
    })
    
    it('should be case insensitive', () => {
      expect(countSyllables('HELLO')).toBe(2)
      expect(countSyllables('World')).toBe(1)
    })
  })
  
  describe('isComplexWord', () => {
    it('should identify complex words (3+ syllables)', () => {
      expect(isComplexWord('beautiful')).toBe(true)
      expect(isComplexWord('extraordinary')).toBe(true)
    })
    
    it('should identify simple words (< 3 syllables)', () => {
      expect(isComplexWord('hello')).toBe(false)
      expect(isComplexWord('world')).toBe(false)
      expect(isComplexWord('the')).toBe(false)
    })
  })
})

// ============================================================
// TEXT STATISTICS TESTS
// ============================================================

describe('TextStatistics', () => {
  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('One two three four five')).toBe(5)
    })
    
    it('should handle empty strings', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })
    
    it('should ignore punctuation', () => {
      expect(countWords('Hello, world!')).toBe(2)
    })
  })
  
  describe('countSentences', () => {
    it('should count sentences correctly', () => {
      expect(countSentences('Hello. World.')).toBe(2)
      expect(countSentences('What is this?')).toBe(1)
    })
    
    it('should return 1 for text without sentence markers', () => {
      expect(countSentences('Hello world')).toBe(1)
    })
  })
  
  describe('countTotalSyllables', () => {
    it('should count total syllables in text', () => {
      const result = countTotalSyllables('Hello world')
      expect(result).toBeGreaterThan(0)
    })
    
    it('should return 0 for empty text', () => {
      expect(countTotalSyllables('')).toBe(0)
    })
  })
})

// ============================================================
// READABILITY CALCULATOR TESTS
// ============================================================

describe('ReadabilityCalculator', () => {
  describe('calculateFleschKincaidGrade', () => {
    it('should calculate grade level for simple text', () => {
      // Simple sentence: 5 words, 1 sentence, ~6 syllables
      const grade = calculateFleschKincaidGrade(5, 1, 6)
      expect(grade).toBeGreaterThan(0)
      expect(grade).toBeLessThan(10)
    })
    
    it('should return 0 for empty input', () => {
      expect(calculateFleschKincaidGrade(0, 0, 0)).toBe(0)
    })
    
    it('should calculate higher grade for complex text', () => {
      // Complex text: 50 words, 2 sentences, 80 syllables
      const complexGrade = calculateFleschKincaidGrade(50, 2, 80)
      // Simple text: 10 words, 2 sentences, 12 syllables
      const simpleGrade = calculateFleschKincaidGrade(10, 2, 12)
      expect(complexGrade).toBeGreaterThan(simpleGrade)
    })
  })
  
  describe('calculateFleschReadingEase', () => {
    it('should return score between 0-100', () => {
      const score = calculateFleschReadingEase(20, 2, 30)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
    
    it('should return higher scores for simpler text', () => {
      // Simple text scores higher
      const simpleScore = calculateFleschReadingEase(10, 2, 12)
      // Complex text scores lower
      const complexScore = calculateFleschReadingEase(50, 2, 80)
      expect(simpleScore).toBeGreaterThan(complexScore)
    })
  })
  
  describe('calculateVocabularyDifficulty', () => {
    it('should return ratio of complex words', () => {
      const difficulty = calculateVocabularyDifficulty(100, 20)
      expect(difficulty).toBe(0.2)
    })
    
    it('should return 0 for no complex words', () => {
      expect(calculateVocabularyDifficulty(50, 0)).toBe(0)
    })
  })
  
  describe('calculateSentenceComplexity', () => {
    it('should return lower score for optimal sentence length', () => {
      const optimalComplexity = calculateSentenceComplexity(17)
      const highComplexity = calculateSentenceComplexity(35)
      expect(optimalComplexity).toBeLessThan(highComplexity)
    })
    
    it('should handle short sentences with higher complexity score', () => {
      // Optimal is 17, so short sentences get higher complexity scores
      const complexity = calculateSentenceComplexity(5)
      expect(complexity).toBeGreaterThan(0)
      expect(complexity).toBeLessThanOrEqual(1)
    })
  })
  
  describe('calculateOverallReadabilityScore', () => {
    it('should return score between 0-100', () => {
      const score = calculateOverallReadabilityScore(70, 0.2, 0.3)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
  
  describe('calculateReadabilityMetrics', () => {
    it('should calculate all metrics for sample text', () => {
      const text = 'The quick brown fox jumps over the lazy dog. This is a simple sentence.'
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.wordCount).toBeGreaterThan(0)
      expect(metrics.sentenceCount).toBe(2)
      expect(metrics.fleschKincaidGrade).toBeGreaterThan(0)
      expect(metrics.fleschReadingEase).toBeGreaterThan(0)
    })
    
    it('should handle empty text', () => {
      const metrics = calculateReadabilityMetrics('')
      expect(metrics.wordCount).toBe(0)
      expect(metrics.sentenceCount).toBe(1) // default
      expect(metrics.fleschKincaidGrade).toBe(0)
    })
  })
})

// ============================================================
// DIFFICULTY CLASSIFIER TESTS
// ============================================================

describe('DifficultyClassifier', () => {
  describe('classifyDifficulty', () => {
    it('should classify simple text correctly', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 3,
        fleschReadingEase: 85,
        averageSentenceLength: 8,
        averageSyllablesPerWord: 1.2,
        wordCount: 50,
        sentenceCount: 8,
        syllableCount: 60,
        complexWordCount: 2,
        complexWordPercentage: 4,
        vocabularyDifficulty: 0.04,
        sentenceComplexityScore: 0.3,
        overallReadabilityScore: 90
      }
      
      const result = classifyDifficulty(metrics)
      expect(result.level).toBe('simple')
      expect(result.gradeRange.min).toBe(1)
    })
    
    it('should classify difficult text correctly', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 12,
        fleschReadingEase: 35,
        averageSentenceLength: 25,
        averageSyllablesPerWord: 1.8,
        wordCount: 100,
        sentenceCount: 4,
        syllableCount: 180,
        complexWordCount: 35,
        complexWordPercentage: 35,
        vocabularyDifficulty: 0.35,
        sentenceComplexityScore: 0.7,
        overallReadabilityScore: 30
      }
      
      const result = classifyDifficulty(metrics)
      expect(['difficult', 'expert']).toContain(result.level)
    })
    
    it('should classify normal text correctly', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 7,
        fleschReadingEase: 60,
        averageSentenceLength: 15,
        averageSyllablesPerWord: 1.5,
        wordCount: 100,
        sentenceCount: 7,
        syllableCount: 150,
        complexWordCount: 15,
        complexWordPercentage: 15,
        vocabularyDifficulty: 0.15,
        sentenceComplexityScore: 0.4,
        overallReadabilityScore: 65
      }
      
      const result = classifyDifficulty(metrics)
      expect(result.level).toBe('normal')
    })
    
    it('should include target audience in classification', () => {
      const simpleMetrics: ReadabilityMetrics = {
        fleschKincaidGrade: 4,
        fleschReadingEase: 80,
        averageSentenceLength: 10,
        averageSyllablesPerWord: 1.2,
        wordCount: 50,
        sentenceCount: 5,
        syllableCount: 60,
        complexWordCount: 3,
        complexWordPercentage: 6,
        vocabularyDifficulty: 0.06,
        sentenceComplexityScore: 0.25,
        overallReadabilityScore: 85
      }
      
      const result = classifyDifficulty(simpleMetrics)
      expect(result.targetAudience).toContain('General public')
    })
  })
})

// ============================================================
// ADAPTATION SUGGESTION ENGINE TESTS
// ============================================================

describe('AdaptationSuggestionEngine', () => {
  describe('generateReduceDifficultySuggestions', () => {
    it('should suggest reductions for complex text', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 12,
        fleschReadingEase: 30,
        averageSentenceLength: 28,
        averageSyllablesPerWord: 1.8,
        wordCount: 100,
        sentenceCount: 4,
        syllableCount: 180,
        complexWordCount: 35,
        complexWordPercentage: 35,
        vocabularyDifficulty: 0.35,
        sentenceComplexityScore: 0.7,
        overallReadabilityScore: 25
      }
      
      const suggestion = generateReduceDifficultySuggestions(metrics)
      expect(suggestion.type).toBe('reduce_difficulty')
      expect(suggestion.suggestions.length).toBeGreaterThan(0)
    })
    
    it('should prioritize high for very difficult text', () => {
      const difficultMetrics: ReadabilityMetrics = {
        fleschKincaidGrade: 15,
        fleschReadingEase: 20,
        averageSentenceLength: 35,
        averageSyllablesPerWord: 2.0,
        wordCount: 80,
        sentenceCount: 2,
        syllableCount: 160,
        complexWordCount: 40,
        complexWordPercentage: 50,
        vocabularyDifficulty: 0.5,
        sentenceComplexityScore: 0.85,
        overallReadabilityScore: 15
      }
      
      const suggestion = generateReduceDifficultySuggestions(difficultMetrics)
      expect(suggestion.priority).toBe('high')
    })
  })
  
  describe('generateIncreaseChallengeSuggestions', () => {
    it('should suggest increases for simple text', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 3,
        fleschReadingEase: 88,
        averageSentenceLength: 8,
        averageSyllablesPerWord: 1.1,
        wordCount: 50,
        sentenceCount: 6,
        syllableCount: 55,
        complexWordCount: 1,
        complexWordPercentage: 2,
        vocabularyDifficulty: 0.02,
        sentenceComplexityScore: 0.15,
        overallReadabilityScore: 92
      }
      
      const suggestion = generateIncreaseChallengeSuggestions(metrics)
      expect(suggestion.type).toBe('increase_challenge')
      expect(suggestion.suggestions.length).toBeGreaterThan(0)
    })
    
    it('should prioritize based on simplicity level', () => {
      const simpleMetrics: ReadabilityMetrics = {
        fleschKincaidGrade: 2,
        fleschReadingEase: 92,
        averageSentenceLength: 6,
        averageSyllablesPerWord: 1.0,
        wordCount: 30,
        sentenceCount: 5,
        syllableCount: 30,
        complexWordCount: 0,
        complexWordPercentage: 0,
        vocabularyDifficulty: 0,
        sentenceComplexityScore: 0.1,
        overallReadabilityScore: 95
      }
      
      const suggestion = generateIncreaseChallengeSuggestions(simpleMetrics)
      expect(suggestion.priority).toBe('high')
    })
  })
  
  describe('generateAdaptationSuggestions', () => {
    it('should return maintain for balanced text', () => {
      const balancedMetrics: ReadabilityMetrics = {
        fleschKincaidGrade: 7,
        fleschReadingEase: 60,
        averageSentenceLength: 15,
        averageSyllablesPerWord: 1.5,
        wordCount: 100,
        sentenceCount: 7,
        syllableCount: 150,
        complexWordCount: 15,
        complexWordPercentage: 15,
        vocabularyDifficulty: 0.15,
        sentenceComplexityScore: 0.4,
        overallReadabilityScore: 65
      }
      
      const suggestion = generateAdaptationSuggestions(balancedMetrics)
      expect(suggestion.type).toBe('maintain')
    })
    
    it('should respect target level parameter', () => {
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 3,
        fleschReadingEase: 85,
        averageSentenceLength: 8,
        averageSyllablesPerWord: 1.2,
        wordCount: 50,
        sentenceCount: 6,
        syllableCount: 60,
        complexWordCount: 2,
        complexWordPercentage: 4,
        vocabularyDifficulty: 0.04,
        sentenceComplexityScore: 0.25,
        overallReadabilityScore: 88
      }
      
      const suggestion = generateAdaptationSuggestions(metrics, DEFAULT_ADAPTATION_THRESHOLDS, 'difficult')
      expect(suggestion.type).toBe('increase_challenge')
    })
  })
})

// ============================================================
// STATE MANAGEMENT TESTS
// ============================================================

describe('StateManagement', () => {
  describe('createEmptyDifficultyState', () => {
    it('should create empty state with null values', () => {
      const state = createEmptyDifficultyState()
      expect(state.metrics).toBeNull()
      expect(state.classification).toBeNull()
      expect(state.suggestions).toEqual([])
      expect(state.analysisHistory).toEqual([])
    })
  })
  
  describe('analyzeTextDifficulty', () => {
    it('should analyze text and populate state', () => {
      const text = 'The quick brown fox jumps over the lazy dog. This is a simple test.'
      const state = analyzeTextDifficulty(text)
      
      expect(state.metrics).not.toBeNull()
      expect(state.metrics!.wordCount).toBeGreaterThan(0)
      expect(state.classification).not.toBeNull()
      expect(state.suggestions.length).toBeGreaterThan(0)
      expect(state.analysisHistory.length).toBe(1)
    })
  })
  
  describe('addAnalysisToHistory', () => {
    it('should add metrics to history', () => {
      const state = createEmptyDifficultyState()
      const metrics: ReadabilityMetrics = {
        fleschKincaidGrade: 5,
        fleschReadingEase: 70,
        averageSentenceLength: 12,
        averageSyllablesPerWord: 1.4,
        wordCount: 100,
        sentenceCount: 8,
        syllableCount: 140,
        complexWordCount: 10,
        complexWordPercentage: 10,
        vocabularyDifficulty: 0.1,
        sentenceComplexityScore: 0.35,
        overallReadabilityScore: 72
      }
      
      const updated = addAnalysisToHistory(state, metrics)
      expect(updated.analysisHistory.length).toBe(1)
      expect(updated.analysisHistory[0]).toEqual(metrics)
    })
  })
  
  describe('getDifficultySummary', () => {
    it('should return summary from state', () => {
      const text = 'The quick brown fox jumps over the lazy dog. This is a simple test.'
      const state = analyzeTextDifficulty(text)
      const summary = getDifficultySummary(state)
      
      expect(summary.currentLevel).not.toBeNull()
      expect(summary.readabilityScore).toBeGreaterThan(0)
      expect(summary.wordCount).toBeGreaterThan(0)
    })
    
    it('should handle empty state', () => {
      const state = createEmptyDifficultyState()
      const summary = getDifficultySummary(state)
      
      expect(summary.currentLevel).toBeNull()
      expect(summary.confidence).toBe(0)
    })
  })
})

// ============================================================
// COMPREHENSIVE ANALYSIS TESTS
// ============================================================

describe('ComprehensiveAnalysis', () => {
  describe('analyzeReaderDifficulty', () => {
    it('should perform full analysis on simple text', () => {
      const text = 'The cat sat on the mat. It was a sunny day. The children played outside.'
      const result = analyzeReaderDifficulty(text)
      
      expect(result.metrics).toBeDefined()
      expect(result.classification).toBeDefined()
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.summary.level).toBeDefined()
      expect(result.summary.readabilityScore).toBeGreaterThan(0)
    })
    
    it('should perform full analysis on complex text', () => {
      const text = 'The extraordinarily sophisticated pharmacological intervention demonstrated remarkable efficacy in ameliorating the deleterious manifestations associated with the inflammatory response, thereby facilitating substantial improvement in patient outcomes.'
      const result = analyzeReaderDifficulty(text)
      
      expect(result.metrics.complexWordPercentage).toBeGreaterThan(20)
      expect(['difficult', 'expert']).toContain(result.summary.level)
    })
    
    it('should include target audience in summary', () => {
      const text = 'Hello world. This is a test.'
      const result = analyzeReaderDifficulty(text)
      
      expect(result.summary.targetAudience).toBeDefined()
    })
    
    it('should respect target level parameter', () => {
      const text = 'The cat sat on the mat. It was happy.'
      const result = analyzeReaderDifficulty(text, 'difficult')
      
      expect(result.suggestions[0].type).toBe('increase_challenge')
    })
    
    it('should identify primary focus area', () => {
      const text = 'The extraordinarily sophisticated pharmacological intervention was administered.'
      const result = analyzeReaderDifficulty(text)
      
      expect(['vocabulary', 'sentence_structure', 'both', 'balanced']).toContain(result.summary.primaryFocus)
    })
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('EdgeCases', () => {
  it('should handle very short texts', () => {
    const metrics = calculateReadabilityMetrics('Hi.')
    expect(metrics.wordCount).toBe(1)
    expect(metrics.fleschKincaidGrade).toBeGreaterThanOrEqual(0)
  })
  
  it('should handle texts with only complex words', () => {
    const text = 'Extraordinarily sophisticated pharmacological intervention'
    const metrics = calculateReadabilityMetrics(text)
    expect(metrics.complexWordPercentage).toBe(100)
  })
  
  it('should handle texts with only simple words', () => {
    const text = 'The cat sat on the mat'
    const metrics = calculateReadabilityMetrics(text)
    expect(metrics.complexWordPercentage).toBe(0)
  })
  
  it('should handle single very long sentence', () => {
    const text = 'This is a very long sentence that goes on and on with many words and clauses and conjunctions and descriptions and details and more and more content to create a long complex sentence that should have a high sentence complexity score.'
    const metrics = calculateReadabilityMetrics(text)
    expect(metrics.averageSentenceLength).toBeGreaterThan(30)
    expect(metrics.sentenceComplexityScore).toBeGreaterThan(0.5)
  })
  
  it('should handle all default thresholds are defined', () => {
    expect(DEFAULT_DIFFICULTY_THRESHOLDS.simple.maxGrade).toBeDefined()
    expect(DEFAULT_DIFFICULTY_THRESHOLDS.normal.maxGrade).toBeDefined()
    expect(DEFAULT_DIFFICULTY_THRESHOLDS.difficult.maxGrade).toBeDefined()
    expect(DEFAULT_ADAPTATION_THRESHOLDS.reduceThreshold).toBeDefined()
    expect(DEFAULT_ADAPTATION_THRESHOLDS.increaseThreshold).toBeDefined()
  })
})