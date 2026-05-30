/**
 * NarrativeMetaCognitionEngine Tests — V506
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerPattern,
  incrementPatternUsage,
  generateInsight,
  performSelfReflection,
  getTopPatterns,
  getPatternsByType,
  getCognitionLevelDistribution,
  getInsightsAtLevel,
  getRecentReflections,
  getImprovementRecommendations,
  calculateQualityImprovement,
  getPatternEffectiveness,
  linkInsightToPattern,
  getMetaCognitionSummary
} from './NarrativeMetaCognitionEngine'

describe('NarrativeMetaCognitionEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.patterns).toEqual({})
      expect(state.insights).toEqual([])
      expect(state.currentCycle).toBe(0)
      expect(state.overallQualityScore).toBe(50)
    })
  })

  describe('registerPattern', () => {
    it('should register a new pattern', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Hero Journey')
      expect(Object.keys(state.patterns)).toHaveLength(1)
      const pattern = state.patterns[Object.keys(state.patterns)[0]]
      expect(pattern.name).toBe('Hero Journey')
      expect(pattern.type).toBe('narrative')
    })

    it('should register patterns of different types', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'character', 'Dynamic Arc')
      state = registerPattern(state, 'dialogue', 'Subtext')
      expect(Object.keys(state.patterns)).toHaveLength(2)
    })
  })

  describe('incrementPatternUsage', () => {
    it('should increment frequency and update quality', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Test Pattern')
      const patternId = Object.keys(state.patterns)[0]
      state = incrementPatternUsage(state, patternId, 80)
      expect(state.patterns[patternId].frequency).toBe(1)
      expect(state.patterns[patternId].avgQualityScore).toBe(80)

      state = incrementPatternUsage(state, patternId, 60)
      expect(state.patterns[patternId].frequency).toBe(2)
      expect(state.patterns[patternId].avgQualityScore).toBe(70) // avg of 80 and 60
    })

    it('should detect improving trend', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'character', 'Complex Character')
      const patternId = Object.keys(state.patterns)[0]
      state = incrementPatternUsage(state, patternId, 50)
      state = incrementPatternUsage(state, patternId, 80)
      state = incrementPatternUsage(state, patternId, 95)
      expect(state.patterns[patternId].effectivenessTrend).toBe('improving')
    })

    it('should detect declining trend', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'dialogue', 'Weak Dialogue')
      const patternId = Object.keys(state.patterns)[0]
      state = incrementPatternUsage(state, patternId, 80)
      state = incrementPatternUsage(state, patternId, 60)
      state = incrementPatternUsage(state, patternId, 35)
      expect(state.patterns[patternId].effectivenessTrend).toBe('declining')
    })
  })

  describe('generateInsight', () => {
    it('should create an insight', () => {
      let state = createEmptyState()
      state = generateInsight(state, 'surface', 'Detected a repeating phrase', 70, ['adjust_pacing'])
      expect(state.insights).toHaveLength(1)
      expect(state.insights[0].level).toBe('surface')
      expect(state.insights[0].confidence).toBe(70)
    })

    it('should update cognition history', () => {
      let state = createEmptyState()
      state = generateInsight(state, 'pattern', 'Pattern observed', 60, [])
      state = generateInsight(state, 'pattern', 'Another pattern', 75, [])
      const dist = getCognitionLevelDistribution(state)
      expect(dist.pattern).toBe(2)
    })
  })

  describe('performSelfReflection', () => {
    it('should create a reflection with metrics', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Test')
      state = performSelfReflection(state, {
        avgEngagementScore: 75,
        pacingQuality: 70,
        characterConsistency: 80,
        plotCoherence: 65,
        emotionalResonance: 85
      }, ['adjust_pacing'])

      expect(state.reflections).toHaveLength(1)
      expect(state.currentCycle).toBe(1)
      expect(state.overallQualityScore).toBe(75)
      expect(state.reflections[0].adjustmentsMade).toContain('adjust_pacing')
    })

    it('should accumulate quality scores', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Test')
      state = performSelfReflection(state, {
        avgEngagementScore: 60,
        pacingQuality: 60,
        characterConsistency: 60,
        plotCoherence: 60,
        emotionalResonance: 60
      }, [])

      state = performSelfReflection(state, {
        avgEngagementScore: 80,
        pacingQuality: 80,
        characterConsistency: 80,
        plotCoherence: 80,
        emotionalResonance: 80
      }, ['increase_tension'])

      expect(state.currentCycle).toBe(2)
      expect(state.overallQualityScore).toBeGreaterThan(60)
    })
  })

  describe('getTopPatterns', () => {
    it('should return patterns sorted by frequency and quality', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Low Freq')
      state = registerPattern(state, 'dialogue', 'High Freq')
      const lowId = Object.keys(state.patterns)[0]
      const highId = Object.keys(state.patterns)[1]
      state = incrementPatternUsage(state, lowId, 80)
      state = incrementPatternUsage(state, highId, 60)
      state = incrementPatternUsage(state, highId, 60)

      const top = getTopPatterns(state)
      expect(top[0].name).toBe('High Freq')
    })
  })

  describe('getPatternsByType', () => {
    it('should filter by pattern type', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Narrative 1')
      state = registerPattern(state, 'character', 'Character 1')
      state = registerPattern(state, 'narrative', 'Narrative 2')

      const narrative = getPatternsByType(state, 'narrative')
      expect(narrative).toHaveLength(2)
    })
  })

  describe('getCognitionLevelDistribution', () => {
    it('should count insights per level', () => {
      let state = createEmptyState()
      state = generateInsight(state, 'surface', 'Surface', 50, [])
      state = generateInsight(state, 'pattern', 'Pattern 1', 60, [])
      state = generateInsight(state, 'pattern', 'Pattern 2', 70, [])
      state = generateInsight(state, 'causal', 'Causal', 80, [])

      const dist = getCognitionLevelDistribution(state)
      expect(dist.surface).toBe(1)
      expect(dist.pattern).toBe(2)
      expect(dist.causal).toBe(1)
    })
  })

  describe('getInsightsAtLevel', () => {
    it('should filter insights by cognition level', () => {
      let state = createEmptyState()
      state = generateInsight(state, 'surface', 'S1', 50, [])
      state = generateInsight(state, 'meta', 'Meta 1', 90, [])

      const metaInsights = getInsightsAtLevel(state, 'meta')
      expect(metaInsights).toHaveLength(1)
      expect(metaInsights[0].level).toBe('meta')
    })
  })

  describe('getRecentReflections', () => {
    it('should return most recent reflections', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'T1')
      state = performSelfReflection(state, {
        avgEngagementScore: 60, pacingQuality: 60, characterConsistency: 60,
        plotCoherence: 60, emotionalResonance: 60
      }, [])

      state = performSelfReflection(state, {
        avgEngagementScore: 80, pacingQuality: 80, characterConsistency: 80,
        plotCoherence: 80, emotionalResonance: 80
      }, [])

      const recent = getRecentReflections(state, 2)
      expect(recent.length).toBeGreaterThanOrEqual(1)
      expect(recent[0].cycleNumber).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getImprovementRecommendations', () => {
    it('should recommend based on low metrics', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'T1')
      state = performSelfReflection(state, {
        avgEngagementScore: 40,  // low
        pacingQuality: 55,  // low
        characterConsistency: 70,
        plotCoherence: 80,
        emotionalResonance: 85
      }, [])

      const recs = getImprovementRecommendations(state)
      expect(recs).toContain('adjust_pacing')
      expect(recs).toContain('increase_tension')
    })
  })

  describe('calculateQualityImprovement', () => {
    it('should calculate improvement percentage', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'T1')
      state = performSelfReflection(state, {
        avgEngagementScore: 50, pacingQuality: 50, characterConsistency: 50,
        plotCoherence: 50, emotionalResonance: 50
      }, [])

      state = performSelfReflection(state, {
        avgEngagementScore: 75, pacingQuality: 75, characterConsistency: 75,
        plotCoherence: 75, emotionalResonance: 75
      }, [])

      const improvement = calculateQualityImprovement(state)
      expect(improvement).toBeGreaterThan(0)
    })

    it('should return 0 for insufficient data', () => {
      let state = createEmptyState()
      const improvement = calculateQualityImprovement(state)
      expect(improvement).toBe(0)
    })
  })

  describe('getPatternEffectiveness', () => {
    it('should calculate effectiveness score', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Effective Pattern')
      const patternId = Object.keys(state.patterns)[0]
      state = incrementPatternUsage(state, patternId, 80)
      state = incrementPatternUsage(state, patternId, 80)

      const effectiveness = getPatternEffectiveness(state, patternId)
      expect(effectiveness).toBeGreaterThan(0)
    })
  })

  describe('linkInsightToPattern', () => {
    it('should link insight to pattern', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'Test')
      state = generateInsight(state, 'pattern', 'Detected pattern', 70, [])
      const patternId = Object.keys(state.patterns)[0]
      const insightId = state.insights[0].id

      state = linkInsightToPattern(state, insightId, patternId)
      expect(state.insights[0].relatedPatterns).toContain(patternId)
    })
  })

  describe('getMetaCognitionSummary', () => {
    it('should return comprehensive summary', () => {
      let state = createEmptyState()
      state = registerPattern(state, 'narrative', 'T1')
      state = registerPattern(state, 'character', 'T2')
      state = generateInsight(state, 'surface', 'S1', 50, [])
      state = registerPattern(state, 'narrative', 'T1')  // duplicate
      state = performSelfReflection(state, {
        avgEngagementScore: 70, pacingQuality: 70, characterConsistency: 70,
        plotCoherence: 70, emotionalResonance: 70
      }, [])

      const summary = getMetaCognitionSummary(state)
      expect(summary.totalPatterns).toBe(3)
      expect(summary.totalInsights).toBe(1)
      expect(summary.totalReflections).toBe(1)
      expect(summary.currentQualityScore).toBe(70)
    })
  })
})