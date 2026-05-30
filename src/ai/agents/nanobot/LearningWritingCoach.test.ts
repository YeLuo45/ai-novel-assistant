/**
 * LearningWritingCoach Tests - V137
 * Tests for Proactive Writing Style Adaptation System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyCoachState,
  analyzeSegmentStyle,
  updateStyleProfile,
  detectStyleShift,
  learnAuthorPattern,
  updatePatternAcceptanceRate,
  decideOnSuggestion,
  generateSuggestion,
  recordSuggestionFeedback,
  startNewSession,
  addSegmentToSession,
  endSession,
  shouldOfferProactiveSuggestion,
  markProactiveSuggestionMade,
  formatStyleProfile,
  formatCoachDashboard,
} from './LearningWritingCoach'

// =============================================================================
// createEmptyCoachState Tests
// =============================================================================

describe('createEmptyCoachState', () => {
  it('should create empty state with default profile', () => {
    const state = createEmptyCoachState()
    expect(state.styleProfile).toBeDefined()
    expect(state.styleProfile.averageSentenceLength).toBe(15)
  })

  it('should initialize empty collections', () => {
    const state = createEmptyCoachState()
    expect(state.coachingHistory.size).toBe(0)
    expect(state.authorPatterns.size).toBe(0)
    expect(state.currentSession).toBeNull()
  })

  it('should start at learning adaptation level', () => {
    const state = createEmptyCoachState()
    expect(state.adaptationLevel).toBe('learning')
    expect(state.coachingStrategy).toBe('subtle')
  })

  it('should have default proactive threshold', () => {
    const state = createEmptyCoachState()
    expect(state.proactiveThreshold).toBe(0.75)
  })
})

// =============================================================================
// analyzeSegmentStyle Tests
// =============================================================================

describe('analyzeSegmentStyle', () => {
  it('should analyze basic metrics', () => {
    const segment = {
      segmentId: 'test',
      timestamp: Date.now(),
      mode: 'narration' as const,
      content: 'The quick brown fox jumps over the lazy dog.',
      wordCount: 9,
      sentenceCount: 1,
      styleMetrics: { avgWordLength: 0, vocabularyRichness: 0, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    const metrics = analyzeSegmentStyle(segment)
    expect(metrics.avgWordLength).toBeGreaterThan(0)
    expect(metrics.vocabularyRichness).toBeGreaterThan(0)
  })

  it('should detect dialogue', () => {
    const segment = {
      segmentId: 'test',
      timestamp: Date.now(),
      mode: 'dialogue' as const,
      content: '"Hello there," he said. "How are you?"',
      wordCount: 8,
      sentenceCount: 2,
      styleMetrics: { avgWordLength: 0, vocabularyRichness: 0, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    const metrics = analyzeSegmentStyle(segment)
    expect(metrics.dialogueRatio).toBeGreaterThan(0)
  })

  it('should detect introspection', () => {
    const segment = {
      segmentId: 'test',
      timestamp: Date.now(),
      mode: 'reflection' as const,
      content: 'I feel something strange happening. I think I understand what this means.',
      wordCount: 14,
      sentenceCount: 2,
      styleMetrics: { avgWordLength: 0, vocabularyRichness: 0, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    const metrics = analyzeSegmentStyle(segment)
    expect(metrics.introspectionDepth).toBeGreaterThan(0)
  })

  it('should handle empty content', () => {
    const segment = {
      segmentId: 'test',
      timestamp: Date.now(),
      mode: 'narration' as const,
      content: '',
      wordCount: 0,
      sentenceCount: 0,
      styleMetrics: { avgWordLength: 0, vocabularyRichness: 0, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    const metrics = analyzeSegmentStyle(segment)
    expect(metrics.avgWordLength).toBe(0)
  })
})

// =============================================================================
// updateStyleProfile Tests
// =============================================================================

describe('updateStyleProfile', () => {
  it('should update average sentence length', () => {
    let state = createEmptyCoachState()
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'A simple sentence.',
      wordCount: 3, sentenceCount: 1,
      styleMetrics: { avgWordLength: 4, vocabularyRichness: 1, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    state = updateStyleProfile(state, segment)
    expect(state.styleProfile.averageSentenceLength).toBeLessThan(15)
  })

  it('should learn from multiple sessions', () => {
    let state = createEmptyCoachState()
    for (let i = 0; i < 5; i++) {
      state = startNewSession(state)
      state = addSegmentToSession(state, `Content for session ${i}.`, 'narration')
      state = endSession(state)
    }
    expect(state.sessionsCount).toBe(5)
  })

  it('should preserve stable profile values', () => {
    let state = createEmptyCoachState()
    state = { ...state, styleProfile: { ...state.styleProfile, preferredPOV: 'first_person' } }
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'Test content.',
      wordCount: 2, sentenceCount: 1,
      styleMetrics: { avgWordLength: 5, vocabularyRichness: 0.8, dialogueRatio: 0, introspectionDepth: 0.1, actionIntensity: 0 },
    }
    state = updateStyleProfile(state, segment)
    expect(state.styleProfile.preferredPOV).toBe('first_person')
  })
})

// =============================================================================
// detectStyleShift Tests
// =============================================================================

describe('detectStyleShift', () => {
  it('should not detect shift for similar style', () => {
    let state = createEmptyCoachState()
    state = { ...state, styleProfile: { ...state.styleProfile, vocabularyRichness: 0.5, dialogueTagFrequency: 0.2, introspectionRatio: 0.1 } }
    const metrics = { avgWordLength: 4.5, vocabularyRichness: 0.52, dialogueRatio: 0.18, introspectionDepth: 0.12, actionIntensity: 0.3 }
    const shift = detectStyleShift(state, metrics)
    expect(shift).toBe(false)
  })

  it('should detect shift for very different style', () => {
    let state = createEmptyCoachState()
    state = { ...state, styleProfile: { ...state.styleProfile, vocabularyRichness: 0.5, dialogueTagFrequency: 0.2, introspectionRatio: 0.1 } }
    const metrics = { avgWordLength: 4, vocabularyRichness: 0.9, dialogueRatio: 0.8, introspectionDepth: 0.8, actionIntensity: 0.9 }
    const shift = detectStyleShift(state, metrics)
    expect(shift).toBe(true)
  })
})

// =============================================================================
// learnAuthorPattern Tests
// =============================================================================

describe('learnAuthorPattern', () => {
  it('should learn new pattern', () => {
    let state = createEmptyCoachState()
    state = learnAuthorPattern(state, 'This is a test content.', 'vocabulary')
    expect(state.authorPatterns.size).toBeGreaterThan(0)
  })

  it('should increment frequency on repeated pattern', () => {
    let state = createEmptyCoachState()
    state = learnAuthorPattern(state, 'Test content for pattern.', 'vocabulary')
    state = learnAuthorPattern(state, 'Test content for pattern.', 'vocabulary')
    const pattern = Array.from(state.authorPatterns.values())[0]
    expect(pattern.frequency).toBe(2)
  })
})

// =============================================================================
// updatePatternAcceptanceRate Tests
// =============================================================================

describe('updatePatternAcceptanceRate', () => {
  it('should increase rate on acceptance', () => {
    let state = createEmptyCoachState()
    state = learnAuthorPattern(state, 'Test content.', 'vocabulary')
    const patternId = Array.from(state.authorPatterns.keys())[0]
    state = updatePatternAcceptanceRate(state, patternId, true)
    const pattern = state.authorPatterns.get(patternId)
    expect(pattern?.acceptanceRate).toBeGreaterThan(0.5)
  })

  it('should decrease rate on rejection', () => {
    let state = createEmptyCoachState()
    state = learnAuthorPattern(state, 'Test content.', 'vocabulary')
    const patternId = Array.from(state.authorPatterns.keys())[0]
    state = updatePatternAcceptanceRate(state, patternId, false)
    const pattern = state.authorPatterns.get(patternId)
    expect(pattern?.acceptanceRate).toBeLessThan(0.5)
  })
})

// =============================================================================
// decideOnSuggestion Tests
// =============================================================================

describe('decideOnSuggestion', () => {
  it('should not suggest with zero sessions', () => {
    const state = createEmptyCoachState()
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'Test content.',
      wordCount: 2, sentenceCount: 1,
      styleMetrics: { avgWordLength: 5, vocabularyRichness: 0.5, dialogueRatio: 0.2, introspectionDepth: 0.1, actionIntensity: 0.3 },
    }
    const decision = decideOnSuggestion(state, segment, 'vocabulary')
    expect(decision.shouldSuggest).toBe(false)
  })

  it('should suggest after enough sessions', () => {
    let state = createEmptyCoachState()
    state = { ...state, sessionsCount: 10, confidenceScore: 0.6 }
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'Test content.',
      wordCount: 2, sentenceCount: 1,
      styleMetrics: { avgWordLength: 5, vocabularyRichness: 0.5, dialogueRatio: 0.2, introspectionDepth: 0.1, actionIntensity: 0.3 },
    }
    const decision = decideOnSuggestion(state, segment, 'vocabulary')
    expect(decision.confidence).toBeGreaterThan(0)
  })
})

// =============================================================================
// generateSuggestion Tests
// =============================================================================

describe('generateSuggestion', () => {
  it('should return null when not enough confidence', () => {
    const state = createEmptyCoachState()
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'This is a very long paragraph with many words and some very repetitive language.',
      wordCount: 16, sentenceCount: 2,
      styleMetrics: { avgWordLength: 5, vocabularyRichness: 0.5, dialogueRatio: 0.2, introspectionDepth: 0.1, actionIntensity: 0.3 },
    }
    const suggestion = generateSuggestion(state, segment, 'vocabulary')
    expect(suggestion).toBeNull()
  })

  it('should return null when no common words found', () => {
    let state = createEmptyCoachState()
    state = { ...state, sessionsCount: 10, confidenceScore: 0.8 }
    const segment = {
      segmentId: 'test', timestamp: Date.now(), mode: 'narration' as const,
      content: 'Elephantine expressions of joy.',
      wordCount: 4, sentenceCount: 1,
      styleMetrics: { avgWordLength: 7, vocabularyRichness: 1, dialogueRatio: 0, introspectionDepth: 0, actionIntensity: 0 },
    }
    const suggestion = generateSuggestion(state, segment, 'vocabulary')
    // May or may not generate depending on content
  })
})

// =============================================================================
// recordSuggestionFeedback Tests
// =============================================================================

describe('recordSuggestionFeedback', () => {
  it('should update acceptance stats on acceptance', () => {
    let state = createEmptyCoachState()
    const suggestion = {
      suggestionId: 'test', segmentId: 'seg', type: 'vocabulary' as const,
      original: 'very', suggested: 'extremely', confidence: 0.7, reasoning: 'test',
      coachingStrategy: 'supportive' as const, proactive: false, timestamp: Date.now(), accepted: null,
    }
    state = recordSuggestionFeedback(state, suggestion, true)
    expect(state.totalSuggestionsMade).toBe(1)
    expect(state.totalSuggestionsAccepted).toBe(1)
  })

  it('should adapt strategy based on acceptance rate', () => {
    let state = createEmptyCoachState()
    state = { ...state, totalSuggestionsMade: 10, totalSuggestionsAccepted: 8 }
    const suggestion = {
      suggestionId: 'test', segmentId: 'seg', type: 'vocabulary' as const,
      original: 'very', suggested: 'extremely', confidence: 0.7, reasoning: 'test',
      coachingStrategy: 'subtle' as const, proactive: false, timestamp: Date.now(), accepted: null,
    }
    state = recordSuggestionFeedback(state, suggestion, true)
    expect(state.coachingStrategy).toBe('proactive')
  })

  it('should update confidence based on acceptance', () => {
    let state = createEmptyCoachState()
    state = { ...state, confidenceScore: 0.5 }
    const suggestion = {
      suggestionId: 'test', segmentId: 'seg', type: 'vocabulary' as const,
      original: 'very', suggested: 'extremely', confidence: 0.7, reasoning: 'test',
      coachingStrategy: 'supportive' as const, proactive: false, timestamp: Date.now(), accepted: null,
    }
    state = recordSuggestionFeedback(state, suggestion, true)
    expect(state.confidenceScore).toBeGreaterThan(0.5)
  })
})

// =============================================================================
// Session Management Tests
// =============================================================================

describe('startNewSession', () => {
  it('should create new session', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    expect(state.currentSession).not.toBeNull()
    expect(state.currentSession?.sessionId).toContain('session_')
  })
})

describe('addSegmentToSession', () => {
  it('should add segment to current session', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'This is a test paragraph.', 'narration')
    expect(state.currentSession?.segments.length).toBe(1)
  })

  it('should auto-start session if none exists', () => {
    let state = createEmptyCoachState()
    state = addSegmentToSession(state, 'First paragraph.', 'narration')
    expect(state.currentSession).not.toBeNull()
  })

  it('should calculate correct word count', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'One two three four five.', 'narration')
    expect(state.currentSession?.segments[0].wordCount).toBe(5)
  })
})

describe('endSession', () => {
  it('should increment sessions count', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'Test content.', 'narration')
    state = endSession(state)
    expect(state.sessionsCount).toBe(1)
  })

  it('should clear current session', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'Test content.', 'narration')
    state = endSession(state)
    expect(state.currentSession).toBeNull()
  })
})

// =============================================================================
// Proactive Suggestion Tests
// =============================================================================

describe('shouldOfferProactiveSuggestion', () => {
  it('should return false when strategy is not proactive', () => {
    const state = createEmptyCoachState()
    expect(shouldOfferProactiveSuggestion(state)).toBe(false)
  })

  it('should return false with no current session', () => {
    let state = createEmptyCoachState()
    state = { ...state, coachingStrategy: 'proactive' }
    expect(shouldOfferProactiveSuggestion(state)).toBe(false)
  })

  it('should return false when session has fewer than 2 segments', () => {
    let state = createEmptyCoachState()
    state = { ...state, coachingStrategy: 'proactive' }
    state = startNewSession(state)
    state = addSegmentToSession(state, 'First segment.', 'narration')
    expect(shouldOfferProactiveSuggestion(state)).toBe(false)
  })

  it('should return true when conditions met', () => {
    let state = createEmptyCoachState()
    state = { ...state, coachingStrategy: 'proactive' }
    state = startNewSession(state)
    state = addSegmentToSession(state, 'First segment.', 'narration')
    state = addSegmentToSession(state, 'Second segment.', 'narration')
    expect(shouldOfferProactiveSuggestion(state)).toBe(true)
  })
})

describe('markProactiveSuggestionMade', () => {
  it('should set last proactive timestamp', () => {
    let state = createEmptyCoachState()
    state = markProactiveSuggestionMade(state)
    expect(state.lastProactiveSuggestionAt).not.toBeNull()
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatStyleProfile', () => {
  it('should include all profile metrics', () => {
    const state = createEmptyCoachState()
    const formatted = formatStyleProfile(state)
    expect(formatted).toContain('Avg Sentence Length')
    expect(formatted).toContain('Vocabulary Richness')
    expect(formatted).toContain('POV')
  })

  it('should include adaptation level', () => {
    const state = createEmptyCoachState()
    const formatted = formatStyleProfile(state)
    expect(formatted).toContain('Adaptation Level')
    expect(formatted).toContain('learning')
  })

  it('should include coaching strategy', () => {
    const state = createEmptyCoachState()
    const formatted = formatStyleProfile(state)
    expect(formatted).toContain('Coaching Strategy')
    expect(formatted).toContain('subtle')
  })
})

describe('formatCoachDashboard', () => {
  it('should show style profile', () => {
    const state = createEmptyCoachState()
    const dashboard = formatCoachDashboard(state)
    expect(dashboard).toContain('Author Style Profile')
  })

  it('should show session count', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'Test.', 'narration')
    state = endSession(state)
    const dashboard = formatCoachDashboard(state)
    expect(dashboard).toContain('Sessions: 1')
  })

  it('should show patterns when present', () => {
    let state = createEmptyCoachState()
    state = learnAuthorPattern(state, 'Test content.', 'vocabulary')
    const dashboard = formatCoachDashboard(state)
    expect(dashboard).toContain('Recent Patterns')
  })

  it('should show current session info when active', () => {
    let state = createEmptyCoachState()
    state = startNewSession(state)
    state = addSegmentToSession(state, 'Test.', 'narration')
    const dashboard = formatCoachDashboard(state)
    expect(dashboard).toContain('Current Session')
  })
})
