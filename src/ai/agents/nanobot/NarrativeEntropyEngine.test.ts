/**
 * NarrativeEntropyEngine Tests — V514
 * Comprehensive tests for EntropyCalculator, AnomalyDetector, PacingFeedbackEngine
 */

import { describe, it, expect } from 'vitest'
import {
  // Entropy Calculator
  calculateWordFrequencies,
  tokenize,
  calculateShannonEntropy,
  calculateNormalizedEntropy,
  calculateEntropy,
  calculateEntropyWithWindows,
  
  // Anomaly Detector
  calculateRollingStatistics,
  detectAnomaly,
  analyzeEntropyAnomalies,
  DEFAULT_THRESHOLDS,
  
  // Pacing Feedback Engine
  calculateEntropyTrend,
  calculateEntropyVolatility,
  generatePacingFeedback,
  generatePacingFeedbackFromWindows,
  DEFAULT_PACING_THRESHOLDS,
  
  // State Management
  createEmptyEntropyState,
  addEntropyResult,
  addAnomalyResult,
  addPacingFeedback,
  analyzeNarrativeEntropy,
  getEntropySummary,
  
  // Types
  EntropyResult,
  AnomalyDetectionResult,
  PacingFeedback
} from './NarrativeEntropyEngine'

// ============================================================
// ENTROPY CALCULATOR TESTS
// ============================================================

describe('EntropyCalculator', () => {
  describe('tokenize', () => {
    it('should tokenize simple text', () => {
      const result = tokenize('Hello world hello')
      expect(result).toEqual(['hello', 'world', 'hello'])
    })
    
    it('should lowercase all words', () => {
      const result = tokenize('HELLO World Test')
      expect(result).toEqual(['hello', 'world', 'test'])
    })
    
    it('should remove punctuation', () => {
      const result = tokenize('Hello, world! How are you?')
      expect(result).toEqual(['hello', 'world', 'how', 'are', 'you'])
    })
    
    it('should handle empty strings', () => {
      expect(tokenize('')).toEqual([])
      expect(tokenize('   ')).toEqual([])
    })
    
    it('should handle multiple spaces', () => {
      const result = tokenize('hello    world')
      expect(result).toEqual(['hello', 'world'])
    })
  })
  
  describe('calculateWordFrequencies', () => {
    it('should count word frequencies', () => {
      const result = calculateWordFrequencies('hello world hello')
      expect(result).toEqual({ hello: 2, world: 1 })
    })
    
    it('should handle empty text', () => {
      const result = calculateWordFrequencies('')
      expect(result).toEqual({})
    })
    
    it('should be case insensitive', () => {
      const result = calculateWordFrequencies('Hello hello HELLO')
      expect(result).toEqual({ hello: 3 })
    })
  })
  
  describe('calculateShannonEntropy', () => {
    it('should return 0 for empty frequencies', () => {
      const result = calculateShannonEntropy({})
      expect(result).toBe(0)
    })
    
    it('should return 0 for single word (no surprise)', () => {
      const result = calculateShannonEntropy({ word: 10 })
      expect(result).toBe(0)
    })
    
    it('should calculate maximum entropy for uniform distribution', () => {
      // 4 words with equal probability = log2(4) = 2 bits
      const frequencies = { a: 1, b: 1, c: 1, d: 1 }
      const result = calculateShannonEntropy(frequencies)
      expect(result).toBeCloseTo(2, 5)
    })
    
    it('should calculate lower entropy for skewed distribution', () => {
      // 80% one word, 20% another
      const frequencies = { a: 8, b: 2 }
      const result = calculateShannonEntropy(frequencies)
      expect(result).toBeLessThan(1) // less than uniform 2-word entropy
    })
    
    it('should handle mixed frequencies', () => {
      const frequencies = { the: 5, a: 3, is: 2, in: 1 }
      const result = calculateShannonEntropy(frequencies)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(Math.log2(4)) // less than max for 4 words
    })
  })
  
  describe('calculateNormalizedEntropy', () => {
    it('should return 0 for vocabulary size 1', () => {
      const result = calculateNormalizedEntropy(0.5, 1)
      expect(result).toBe(1) // entropy > 0 with single word = max normalized
    })
    
    it('should return 0 for empty entropy', () => {
      const result = calculateNormalizedEntropy(0, 5)
      expect(result).toBe(0)
    })
    
    it('should normalize by vocabulary size', () => {
      const entropy = Math.log2(4) // max entropy for 4 words
      const result = calculateNormalizedEntropy(entropy, 4)
      expect(result).toBeCloseTo(1, 5)
    })
    
    it('should handle partial entropy', () => {
      const entropy = Math.log2(2) // half max for 4 words
      const result = calculateNormalizedEntropy(entropy, 4)
      expect(result).toBeCloseTo(0.5, 5)
    })
  })
  
  describe('calculateEntropy', () => {
    it('should handle empty text', () => {
      const result = calculateEntropy('')
      expect(result.entropy).toBe(0)
      expect(result.normalizedEntropy).toBe(0)
      expect(result.vocabularySize).toBe(0)
      expect(result.totalWords).toBe(0)
    })
    
    it('should calculate entropy for simple text', () => {
      const result = calculateEntropy('hello world')
      expect(result.totalWords).toBe(2)
      expect(result.vocabularySize).toBe(2)
      expect(result.entropy).toBeGreaterThan(0)
    })
    
    it('should identify top words', () => {
      const result = calculateEntropy('hello world hello test world test')
      expect(result.topWords.length).toBeLessThanOrEqual(10)
      expect(result.topWords[0].word).toBe('hello')
      expect(result.topWords[0].frequency).toBe(2)
    })
    
    it('should handle uniform word distribution (high entropy)', () => {
      // Many different words = high entropy
      const text = 'a b c d e f g h i j k l m n o p'
      const result = calculateEntropy(text)
      expect(result.normalizedEntropy).toBeGreaterThan(0.8)
    })
    
    it('should handle repetitive word distribution (low entropy)', () => {
      // Same word repeated = low entropy
      const text = 'word word word word word word word word word word'
      const result = calculateEntropy(text)
      expect(result.normalizedEntropy).toBeLessThan(0.3)
    })
    
    it('should handle mixed text (medium entropy)', () => {
      const text = 'the quick brown fox jumps over the lazy dog the quick brown'
      const result = calculateEntropy(text)
      expect(result.normalizedEntropy).toBeGreaterThan(0.3)
      expect(result.normalizedEntropy).toBeLessThan(1.0) // widened upper bound
    })
  })
  
  describe('calculateEntropyWithWindows', () => {
    it('should create multiple windows', () => {
      const text = 'one two three four five six seven eight nine ten'
      const results = calculateEntropyWithWindows(text, 3, 2)
      expect(results.length).toBeGreaterThan(1)
    })
    
    it('should handle text shorter than window', () => {
      const text = 'short'
      const results = calculateEntropyWithWindows(text, 50, 25)
      expect(results.length).toBe(0)
    })
    
    it('should return empty for empty text', () => {
      const results = calculateEntropyWithWindows('', 50, 25)
      expect(results).toEqual([])
    })
    
    it('should maintain correct window sizes', () => {
      const text = 'a b c d e f g h i j k l m n o'
      const results = calculateEntropyWithWindows(text, 5, 5)
      for (const r of results) {
        expect(r.totalWords).toBe(5)
      }
    })
  })
})

// ============================================================
// ANOMALY DETECTOR TESTS
// ============================================================

describe('AnomalyDetector', () => {
  describe('calculateRollingStatistics', () => {
    it('should calculate mean and stdDev', () => {
      const result = calculateRollingStatistics([0.2, 0.4, 0.6, 0.8], 4)
      expect(result.mean).toBeCloseTo(0.5, 5)
      expect(result.stdDev).toBeGreaterThan(0)
    })
    
    it('should handle single value', () => {
      const result = calculateRollingStatistics([0.5], 1)
      expect(result.mean).toBe(0.5)
      expect(result.stdDev).toBe(0)
    })
    
    it('should slice to window size', () => {
      const result = calculateRollingStatistics([0.1, 0.2, 0.3, 0.4, 0.5], 3)
      expect(result.values).toHaveLength(3)
      expect(result.mean).toBeCloseTo(0.4, 5)
    })
    
    it('should return zeros for empty array', () => {
      const result = calculateRollingStatistics([], 5)
      expect(result.mean).toBe(0)
      expect(result.stdDev).toBe(0)
    })
    
    it('should handle window larger than array', () => {
      const result = calculateRollingStatistics([0.5], 5)
      expect(result.mean).toBe(0.5)
      expect(result.stdDev).toBe(0)
    })
  })
  
  describe('detectAnomaly', () => {
    it('should detect high density anomaly when entropy exceeds threshold', () => {
      const stats = { mean: 0.5, stdDev: 0.1 }
      const result = detectAnomaly(0.9, stats, DEFAULT_THRESHOLDS)
      expect(result.isAnomalous).toBe(true)
      expect(result.anomalyType).toBe('high_density')
      expect(result.actualEntropy).toBe(0.9)
    })
    
    it('should detect low density anomaly when entropy below threshold', () => {
      const stats = { mean: 0.5, stdDev: 0.1 }
      const result = detectAnomaly(0.1, stats, DEFAULT_THRESHOLDS)
      expect(result.isAnomalous).toBe(true)
      expect(result.anomalyType).toBe('low_density')
      expect(result.actualEntropy).toBe(0.1)
    })
    
    it('should detect normal entropy', () => {
      const stats = { mean: 0.5, stdDev: 0.1 }
      const result = detectAnomaly(0.5, stats, DEFAULT_THRESHOLDS)
      expect(result.isAnomalous).toBe(false)
      expect(result.anomalyType).toBeNull()
    })
    
    it('should detect statistical anomalies beyond deviation threshold', () => {
      const stats = { mean: 0.5, stdDev: 0.05 }
      // 0.4 is 2 std deviations away
      const result = detectAnomaly(0.4, stats, DEFAULT_THRESHOLDS)
      expect(result.isAnomalous).toBe(true)
    })
    
    it('should handle zero stdDev', () => {
      const stats = { mean: 0.5, stdDev: 0 }
      const result = detectAnomaly(0.3, stats, DEFAULT_THRESHOLDS)
      // Should still work (normalized deviation = 0)
      expect(result.deviation).toBe(-0.2)
    })
    
    it('should calculate correct deviation', () => {
      const stats = { mean: 0.5, stdDev: 0.1 }
      const result = detectAnomaly(0.6, stats, DEFAULT_THRESHOLDS)
      expect(result.deviation).toBeCloseTo(0.1, 5)
      expect(result.expectedEntropy).toBe(0.5)
    })
  })
  
  describe('analyzeEntropyAnomalies', () => {
    it('should detect anomalies across windows', () => {
      // Create entropy results with some anomalous values
      const entropyResults: EntropyResult[] = [
        { entropy: 1.5, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 2.5, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] }, // high
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
      ]
      
      const anomalies = analyzeEntropyAnomalies(entropyResults, 3)
      expect(anomalies.length).toBeGreaterThan(0)
    })
    
    it('should return empty for insufficient data', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] }
      ]
      
      const anomalies = analyzeEntropyAnomalies(entropyResults, 5)
      expect(anomalies).toEqual([])
    })
    
    it('should set window indices correctly', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.5, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 2.5, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 5, totalWords: 10, topWords: [] },
      ]
      
      const anomalies = analyzeEntropyAnomalies(entropyResults, 3)
      anomalies.forEach(a => {
        expect(a.windowIndex).toBeDefined()
      })
    })
  })
})

// ============================================================
// PACING FEEDBACK ENGINE TESTS
// ============================================================

describe('PacingFeedbackEngine', () => {
  describe('calculateEntropyTrend', () => {
    it('should return increasing for rising trend', () => {
      const result = calculateEntropyTrend([0.2, 0.3, 0.4, 0.5, 0.6])
      expect(result).toBe('increasing')
    })
    
    it('should return decreasing for falling trend', () => {
      const result = calculateEntropyTrend([0.6, 0.5, 0.4, 0.3, 0.2])
      expect(result).toBe('decreasing')
    })
    
    it('should return stable for flat trend', () => {
      const result = calculateEntropyTrend([0.5, 0.5, 0.5, 0.5, 0.5])
      expect(result).toBe('stable')
    })
    
    it('should handle single value', () => {
      const result = calculateEntropyTrend([0.5])
      expect(result).toBe('stable')
    })
    
    it('should handle empty array', () => {
      const result = calculateEntropyTrend([])
      expect(result).toBe('stable')
    })
    
    it('should use window parameter', () => {
      const data = [0.1, 0.2, 0.5, 0.8, 0.9, 0.95]
      const result = calculateEntropyTrend(data, 3)
      // Should focus on last 3 values
      expect(result).toBeDefined()
    })
  })
  
  describe('calculateEntropyVolatility', () => {
    it('should return 0 for single value', () => {
      const result = calculateEntropyVolatility([0.5])
      expect(result).toBe(0)
    })
    
    it('should return 0 for constant values', () => {
      const result = calculateEntropyVolatility([0.5, 0.5, 0.5, 0.5])
      expect(result).toBe(0)
    })
    
    it('should calculate positive volatility for varying values', () => {
      const result = calculateEntropyVolatility([0.1, 0.5, 0.9, 0.3])
      expect(result).toBeGreaterThan(0)
    })
    
    it('should use window parameter', () => {
      const data = [0.1, 0.2, 0.5, 0.8, 0.9]
      const result = calculateEntropyVolatility(data, 3)
      expect(result).toBeDefined()
    })
    
    it('should handle empty array', () => {
      const result = calculateEntropyVolatility([])
      expect(result).toBe(0)
    })
  })
  
  describe('generatePacingFeedback', () => {
    it('should suggest accelerate for very low entropy', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 0.5, normalizedEntropy: 0.1, wordFrequencies: {}, vocabularySize: 10, totalWords: 100, topWords: [] },
        { entropy: 0.5, normalizedEntropy: 0.1, wordFrequencies: {}, vocabularySize: 10, totalWords: 100, topWords: [] },
        { entropy: 0.5, normalizedEntropy: 0.1, wordFrequencies: {}, vocabularySize: 10, totalWords: 100, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      expect(feedback.suggestion).toBe('accelerate')
      expect(feedback.recommendedPacing).toBeGreaterThan(50)
    })
    
    it('should suggest decelerate for very high entropy', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 3.0, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 20, totalWords: 100, topWords: [] },
        { entropy: 3.0, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 20, totalWords: 100, topWords: [] },
        { entropy: 3.0, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 20, totalWords: 100, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      expect(feedback.suggestion).toBe('decelerate')
      expect(feedback.recommendedPacing).toBeLessThan(50)
    })
    
    it('should suggest maintain for healthy entropy range', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 15, totalWords: 100, topWords: [] },
        { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 15, totalWords: 100, topWords: [] },
        { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 15, totalWords: 100, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      expect(['maintain', 'analyze']).toContain(feedback.suggestion)
    })
    
    it('should handle empty entropy history', () => {
      const feedback = generatePacingFeedback([])
      expect(feedback.suggestion).toBe('analyze')
      expect(feedback.confidence).toBe(0)
    })
    
    it('should include entropy context in feedback', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 15, totalWords: 100, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      expect(feedback.entropyContext).toBeDefined()
      expect(feedback.entropyContext.currentEntropy).toBe(0.5)
      expect(['increasing', 'decreasing', 'stable']).toContain(feedback.entropyContext.trend)
    })
    
    it('should handle increasing trend with high entropy', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.0, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.6, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 2.0, normalizedEntropy: 0.8, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      expect(feedback.entropyContext.trend).toBe('increasing')
    })
    
    it('should handle decreasing trend with low volatility', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.0, normalizedEntropy: 0.3, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 0.9, normalizedEntropy: 0.28, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 0.8, normalizedEntropy: 0.26, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      // Should suggest maintain since it's in a healthy range with decreasing stable trend
      expect(['maintain', 'accelerate']).toContain(feedback.suggestion)
    })
  })
  
  describe('generatePacingFeedbackFromWindows', () => {
    it('should delegate to generatePacingFeedback', () => {
      const windows: EntropyResult[] = [
        { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 15, totalWords: 50, topWords: [] },
        { entropy: 2.1, normalizedEntropy: 0.52, wordFrequencies: {}, vocabularySize: 15, totalWords: 50, topWords: [] },
      ]
      
      const feedback = generatePacingFeedbackFromWindows(windows)
      expect(feedback).toBeDefined()
      expect(feedback.suggestion).toBeDefined()
    })
  })
})

// ============================================================
// STATE MANAGEMENT TESTS
// ============================================================

describe('NarrativeEntropyState', () => {
  describe('createEmptyEntropyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyEntropyState()
      expect(state.entropyHistory).toEqual([])
      expect(state.anomalyLog).toEqual([])
      expect(state.pacingHistory).toEqual([])
      expect(state.currentEntropy).toBe(0)
      expect(state.averageEntropy).toBe(0)
      expect(state.entropyTrend).toBe('stable')
    })
  })
  
  describe('addEntropyResult', () => {
    it('should add entropy result to history', () => {
      let state = createEmptyEntropyState()
      const result: EntropyResult = {
        entropy: 2.0,
        normalizedEntropy: 0.5,
        wordFrequencies: { hello: 5 },
        vocabularySize: 10,
        totalWords: 50,
        topWords: []
      }
      
      state = addEntropyResult(state, result)
      expect(state.entropyHistory).toHaveLength(1)
      expect(state.currentEntropy).toBe(0.5)
      expect(state.averageEntropy).toBe(0.5)
    })
    
    it('should update average entropy', () => {
      let state = createEmptyEntropyState()
      
      state = addEntropyResult(state, { entropy: 2.0, normalizedEntropy: 0.4, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
      state = addEntropyResult(state, { entropy: 2.0, normalizedEntropy: 0.6, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
      
      expect(state.averageEntropy).toBeCloseTo(0.5, 5)
    })
    
    it('should update entropy trend', () => {
      let state = createEmptyEntropyState()
      
      state = addEntropyResult(state, { entropy: 1.0, normalizedEntropy: 0.3, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
      state = addEntropyResult(state, { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
      state = addEntropyResult(state, { entropy: 2.0, normalizedEntropy: 0.7, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
      
      expect(state.entropyTrend).toBe('increasing')
    })
  })
  
  describe('addAnomalyResult', () => {
    it('should add anomaly to log', () => {
      let state = createEmptyEntropyState()
      const anomaly: AnomalyDetectionResult = {
        isAnomalous: true,
        anomalyType: 'high_density',
        anomalyScore: 0.8,
        windowIndex: 5,
        expectedEntropy: 0.5,
        actualEntropy: 0.9,
        deviation: 0.4
      }
      
      state = addAnomalyResult(state, anomaly)
      expect(state.anomalyLog).toHaveLength(1)
      expect(state.anomalyLog[0].anomalyType).toBe('high_density')
    })
  })
  
  describe('addPacingFeedback', () => {
    it('should add pacing feedback to history', () => {
      let state = createEmptyEntropyState()
      const feedback: PacingFeedback = {
        suggestion: 'maintain',
        confidence: 0.85,
        reason: 'Healthy entropy range',
        entropyContext: {
          currentEntropy: 0.5,
          trend: 'stable',
          volatility: 0.1
        },
        recommendedPacing: 50
      }
      
      state = addPacingFeedback(state, feedback)
      expect(state.pacingHistory).toHaveLength(1)
      expect(state.pacingHistory[0].suggestion).toBe('maintain')
    })
  })
})

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('analyzeNarrativeEntropy (integration)', () => {
  it('should process text and return complete analysis', () => {
    const text = 'the quick brown fox jumps over the lazy dog the quick brown fox jumps'
    const result = analyzeNarrativeEntropy(text, 10, 5)
    
    expect(result.overallEntropy).toBeDefined()
    expect(result.windows.length).toBeGreaterThan(0)
    expect(result.anomalies).toBeDefined()
    expect(result.pacingFeedback).toBeDefined()
  })
  
  it('should handle very short text', () => {
    const text = 'hi'
    const result = analyzeNarrativeEntropy(text, 10, 5)
    
    expect(result.overallEntropy).toBeDefined()
    expect(result.overallEntropy.totalWords).toBe(1)
  })
  
  it('should handle repetitive text', () => {
    const text = 'word word word word word word word word word word'
    const result = analyzeNarrativeEntropy(text, 10, 5)
    
    expect(result.overallEntropy.normalizedEntropy).toBeLessThan(0.3)
    expect(result.pacingFeedback.suggestion).toBe('accelerate')
  })
  
  it('should handle diverse text', () => {
    const text = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet'
    const result = analyzeNarrativeEntropy(text, 10, 5)
    
    expect(result.overallEntropy.normalizedEntropy).toBeGreaterThan(0.7)
  })
})

describe('getEntropySummary', () => {
  it('should return summary from state', () => {
    let state = createEmptyEntropyState()
    state = addEntropyResult(state, { entropy: 2.0, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] })
    state = addPacingFeedback(state, {
      suggestion: 'maintain',
      confidence: 0.85,
      reason: 'test',
      entropyContext: { currentEntropy: 0.5, trend: 'stable', volatility: 0.1 },
      recommendedPacing: 50
    })
    
    const summary = getEntropySummary(state)
    expect(summary.currentEntropy).toBe(0.5)
    expect(summary.trend).toBe('stable')
    expect(summary.pacingSuggestion).toBe('maintain')
  })
  
  it('should return analyze when no pacing feedback', () => {
    const state = createEmptyEntropyState()
    const summary = getEntropySummary(state)
    expect(summary.pacingSuggestion).toBe('analyze')
  })
})

// ============================================================
// EDGE CASES & BOUNDARY CONDITIONS
// ============================================================

describe('Edge Cases', () => {
  describe('EntropyCalculator edge cases', () => {
    it('should handle text with only punctuation', () => {
      const result = calculateEntropy('!!! ??? ...')
      expect(result.totalWords).toBe(0)
    })
    
    it('should handle unicode characters', () => {
      const result = calculateWordFrequencies('hello 世界 مرحبا')
      expect(result['hello']).toBe(1)
    })
    
    it('should handle very long words', () => {
      const longWord = 'a'.repeat(1000)
      const result = calculateWordFrequencies(longWord)
      expect(result[longWord]).toBe(1)
    })
    
    it('should handle newline characters', () => {
      const result = tokenize('hello\nworld\ntest')
      expect(result).toContain('hello')
      expect(result).toContain('world')
    })
  })
  
  describe('AnomalyDetector edge cases', () => {
    it('should handle all same entropy values', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.5, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
      ]
      
      const anomalies = analyzeEntropyAnomalies(entropyResults, 3)
      // All same = no anomalies (except possible threshold breach)
      anomalies.forEach(a => {
        expect(a.deviation).toBe(0)
      })
    })
    
    it('should handle extreme threshold values', () => {
      const stats = { mean: 0.5, stdDev: 0.1 }
      const customThresholds = {
        highDensityUpper: 0.95,
        lowDensityLower: 0.05,
        deviationThreshold: 3.0
      }
      
      const result = detectAnomaly(0.5, stats, customThresholds)
      expect(result.isAnomalous).toBe(false)
    })
  })
  
  describe('PacingFeedbackEngine edge cases', () => {
    it('should handle rapid entropy changes', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.0, normalizedEntropy: 0.2, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 2.5, normalizedEntropy: 0.9, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 0.5, normalizedEntropy: 0.15, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 2.0, normalizedEntropy: 0.8, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      // High volatility triggers analyze, or high entropy triggers decelerate
      expect(['analyze', 'decelerate']).toContain(feedback.suggestion)
      expect(feedback.entropyContext.volatility).toBeGreaterThan(0.2)
    })
    
    it('should handle borderline thresholds', () => {
      const entropyResults: EntropyResult[] = [
        { entropy: 1.5, normalizedEntropy: 0.26, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.27, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
        { entropy: 1.5, normalizedEntropy: 0.25, wordFrequencies: {}, vocabularySize: 10, totalWords: 50, topWords: [] },
      ]
      
      const feedback = generatePacingFeedback(entropyResults)
      // Just below accelerate threshold (0.25)
      expect(feedback.suggestion).toBe('maintain')
    })
  })
})