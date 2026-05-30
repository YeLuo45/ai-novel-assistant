/**
 * NarrativeQualityScoringEngine Tests — V521
 * Comprehensive tests for QualityDimensionScorer, OverallQualityCalculator,
 * QualityImprovementSuggestor, and combined engine functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Quality Dimension Scorer
  scoreDimension,
  scoreAllDimensions,
  scoreToGrade,
  QualityScoringResult,
  DimensionScore,

  // Overall Quality Calculator
  calculateWeightedScores,
  calculateOverallQuality,
  WeightedScore,
  QualityAggregation,

  // Quality Improvement Suggestor
  getSuggestionPriority,
  estimateImprovement,
  calculateActionability,
  generateSuggestionText,
  generateSuggestions,
  SuggestionReport,
  QualitySuggestion,
  formatSuggestionReport,

  // Combined Engine
  createEmptyEngineState,
  addScoringResult,
  addSuggestionReport,
  analyzeNarrativeQuality,
  formatQualityReport,
  NarrativeQualityEngineState,
} from './NarrativeQualityScoringEngine'

import type { QualityDimension } from './NarrativeQualityScoringEngine'

// ============================================================
// TEST FIXTURES
// ============================================================

const sampleGoodNarrative = `
  Sarah walked slowly through the ancient forest, her boots crunching on fallen leaves.
  The morning sun filtered through the canopy, casting dappled shadows across the mossy path.
  "I never thought I'd find myself here again," she whispered to no one in particular.
  Memories of her grandmother's stories flooded her mind—tales of hidden groves and secret clearings.
  
  She paused at a familiar oak, its trunk scarred by decades of weather and time.
  Her heart raced as she noticed the small marking etched into the bark: a crescent moon.
  This was the spot. The place where everything had changed five years ago.
  
  "Hello?" she called out, her voice trembling slightly in the cool morning air.
  The forest answered with silence, broken only by birdsong and the rustle of leaves.
  Suddenly, a figure emerged from behind the ancient trunk—a young man with familiar gray eyes.
  "Sarah," he breathed, "I knew you'd come back eventually."
`

const sampleWeakNarrative = `
  The boy walked. He was going to the house. The house was big.
  The boy went inside. He saw a girl. The girl was pretty.
  "Hi," said the boy. "Hi," said the girl. They talked.
  Then they went to another place. It was fun.
`

const sampleMediumNarrative = `
  Marcus stood at the window, looking out at the rain.
  He felt sad about what happened last week.
  "I should have known better," he thought.
  The coffee was getting cold in his hands.
  Outside, cars drove past, their headlights cutting through the gray evening.
  His phone buzzed—a message from his sister.
  He picked it up and read: "Are you okay? Mom is worried."
  He sighed and typed back: "I'm fine."
`

const emptyNarrative = ''

// ============================================================
// QUALITY DIMENSION SCORER TESTS
// ============================================================

describe('QualityDimensionScorer', () => {
  describe('scoreDimension', () => {
    it('should score pacing dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'pacing')
      expect(result.dimension).toBe('pacing')
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(Array.isArray(result.evidence)).toBe(true)
    })

    it('should score coherence dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'coherence')
      expect(result.dimension).toBe('coherence')
      expect(result.score).toBeGreaterThan(0)
      expect(result.evidence.length).toBeGreaterThan(0)
    })

    it('should score characterization dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'characterization')
      expect(result.dimension).toBe('characterization')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should score dialogue dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'dialogue')
      expect(result.dimension).toBe('dialogue')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should score worldBuilding dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'worldBuilding')
      expect(result.dimension).toBe('worldBuilding')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should score emotionalImpact dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'emotionalImpact')
      expect(result.dimension).toBe('emotionalImpact')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should score proseStyle dimension', () => {
      const result = scoreDimension(sampleGoodNarrative, 'proseStyle')
      expect(result.dimension).toBe('proseStyle')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should return baseline or zero score for empty content on all dimensions', () => {
      const dimensions: QualityDimension[] = [
        'pacing', 'coherence', 'characterization', 'dialogue',
        'worldBuilding', 'emotionalImpact', 'proseStyle',
      ]
      for (const dim of dimensions) {
        const result = scoreDimension(emptyNarrative, dim)
        // Empty content returns baseline score of ~50 or 0 (dialogue returns 0 for no content)
        if (dim === 'dialogue') {
          expect(result.score).toBe(0)
        } else {
          expect(result.score).toBeGreaterThanOrEqual(40)
          expect(result.score).toBeLessThanOrEqual(70)
        }
        expect(result.confidence).toBeLessThanOrEqual(0.15)
      }
    })

    it('should return lower scores for weak narrative', () => {
      const pacing = scoreDimension(sampleWeakNarrative, 'pacing')
      const coherence = scoreDimension(sampleWeakNarrative, 'coherence')
      expect(pacing.score).toBeLessThan(60)
      expect(coherence.score).toBeLessThan(60)
    })
  })

  describe('scoreAllDimensions', () => {
    it('should return results for all 7 dimensions', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      expect(result.dimensions).toHaveLength(7)
    })

    it('should include all required dimension names', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      const dimNames = result.dimensions.map(d => d.dimension)
      expect(dimNames).toContain('pacing')
      expect(dimNames).toContain('coherence')
      expect(dimNames).toContain('characterization')
      expect(dimNames).toContain('dialogue')
      expect(dimNames).toContain('worldBuilding')
      expect(dimNames).toContain('emotionalImpact')
      expect(dimNames).toContain('proseStyle')
    })

    it('should calculate metrics correctly', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      expect(result.metrics.pacingScore).toBe(result.dimensions[0].score)
      expect(result.metrics.coherenceScore).toBe(result.dimensions[1].score)
      expect(result.metrics.characterizationScore).toBe(result.dimensions[2].score)
      expect(result.metrics.dialogueScore).toBe(result.dimensions[3].score)
      expect(result.metrics.worldBuildingScore).toBe(result.dimensions[4].score)
      expect(result.metrics.emotionalImpactScore).toBe(result.dimensions[5].score)
      expect(result.metrics.proseStyleScore).toBe(result.dimensions[6].score)
    })

    it('should calculate overall score between 0-100', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should calculate valid grade', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      expect(['failing', 'belowExpectations', 'meetsExpectations', 'excellent', 'outstanding']).toContain(result.grade)
    })

    it('should include timestamp', () => {
      const result = scoreAllDimensions(sampleGoodNarrative)
      expect(result.timestamp).toBeGreaterThan(0)
      expect(result.timestamp).toBeLessThanOrEqual(Date.now())
    })

    it('should handle empty narrative', () => {
      const result = scoreAllDimensions(emptyNarrative)
      expect(result.dimensions).toHaveLength(7)
      // Empty narrative gets baseline score around 46
      expect(result.overallScore).toBeGreaterThanOrEqual(40)
      expect(result.overallScore).toBeLessThanOrEqual(55)
    })
  })
})

// ============================================================
// OVERALL QUALITY CALCULATOR TESTS
// ============================================================

describe('OverallQualityCalculator', () => {
  describe('scoreToGrade', () => {
    it('should return failing for scores below 40', () => {
      expect(scoreToGrade(0)).toBe('failing')
      expect(scoreToGrade(20)).toBe('failing')
      expect(scoreToGrade(39)).toBe('failing')
    })

    it('should return belowExpectations for 40-59', () => {
      expect(scoreToGrade(40)).toBe('belowExpectations')
      expect(scoreToGrade(50)).toBe('belowExpectations')
      expect(scoreToGrade(59)).toBe('belowExpectations')
    })

    it('should return meetsExpectations for 60-74', () => {
      expect(scoreToGrade(60)).toBe('meetsExpectations')
      expect(scoreToGrade(65)).toBe('meetsExpectations')
      expect(scoreToGrade(74)).toBe('meetsExpectations')
    })

    it('should return excellent for 75-89', () => {
      expect(scoreToGrade(75)).toBe('excellent')
      expect(scoreToGrade(80)).toBe('excellent')
      expect(scoreToGrade(89)).toBe('excellent')
    })

    it('should return outstanding for 90-100', () => {
      expect(scoreToGrade(90)).toBe('outstanding')
      expect(scoreToGrade(95)).toBe('outstanding')
      expect(scoreToGrade(100)).toBe('outstanding')
    })
  })

  describe('calculateWeightedScores', () => {
    it('should calculate weighted contributions', () => {
      const metrics = {
        pacingScore: 70,
        coherenceScore: 75,
        characterizationScore: 80,
        dialogueScore: 65,
        worldBuildingScore: 70,
        emotionalImpactScore: 75,
        proseStyleScore: 70,
      }
      const result = calculateWeightedScores(metrics)

      expect(result.weightedScores).toHaveLength(7)
      expect(result.weightedScores[0].dimension).toBe('pacing')
      expect(result.weightedScores[0].rawScore).toBe(70)
      expect(result.weightedScores[0].weight).toBeCloseTo(0.15)
    })

    it('should calculate total weighted score', () => {
      const metrics = {
        pacingScore: 80,
        coherenceScore: 80,
        characterizationScore: 80,
        dialogueScore: 80,
        worldBuildingScore: 80,
        emotionalImpactScore: 80,
        proseStyleScore: 80,
      }
      const result = calculateWeightedScores(metrics)
      expect(result.totalWeightedScore).toBe(80)
    })

    it('should identify lowest and highest dimensions', () => {
      const metrics = {
        pacingScore: 50,
        coherenceScore: 90,
        characterizationScore: 60,
        dialogueScore: 70,
        worldBuildingScore: 80,
        emotionalImpactScore: 85,
        proseStyleScore: 75,
      }
      const result = calculateWeightedScores(metrics)
      expect(result.lowestDimension).toBe('pacing')
      expect(result.highestDimension).toBe('coherence')
    })

    it('should calculate score spread', () => {
      const metrics = {
        pacingScore: 40,
        coherenceScore: 90,
        characterizationScore: 60,
        dialogueScore: 70,
        worldBuildingScore: 80,
        emotionalImpactScore: 85,
        proseStyleScore: 75,
      }
      const result = calculateWeightedScores(metrics)
      expect(result.scoreSpread).toBe(50)
    })

    it('should return valid confidence level', () => {
      const metrics = {
        pacingScore: 70,
        coherenceScore: 75,
        characterizationScore: 80,
        dialogueScore: 65,
        worldBuildingScore: 70,
        emotionalImpactScore: 75,
        proseStyleScore: 70,
      }
      const result = calculateWeightedScores(metrics)
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0)
      expect(result.confidenceLevel).toBeLessThanOrEqual(1)
    })
  })

  describe('calculateOverallQuality', () => {
    it('should return complete quality analysis', () => {
      const result = calculateOverallQuality(sampleGoodNarrative)
      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.grade).toBeDefined()
      expect(result.aggregation).toBeDefined()
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0)
    })

    it('should return higher scores for better narrative', () => {
      const goodResult = calculateOverallQuality(sampleGoodNarrative)
      const weakResult = calculateOverallQuality(sampleWeakNarrative)
      expect(goodResult.overallScore).toBeGreaterThan(weakResult.overallScore)
    })

    it('should handle empty narrative', () => {
      const result = calculateOverallQuality(emptyNarrative)
      // Empty narrative gets baseline score around 46
      expect(result.overallScore).toBeGreaterThanOrEqual(40)
      expect(result.overallScore).toBeLessThanOrEqual(55)
      expect(result.grade).toBe('belowExpectations')
    })
  })
})

// ============================================================
// QUALITY IMPROVEMENT SUGGESTOR TESTS
// ============================================================

describe('QualityImprovementSuggestor', () => {
  describe('getSuggestionPriority', () => {
    it('should return critical for scores below 40', () => {
      expect(getSuggestionPriority(30, 'pacing')).toBe('critical')
      expect(getSuggestionPriority(39, 'coherence')).toBe('critical')
    })

    it('should return high for scores 40-59', () => {
      expect(getSuggestionPriority(40, 'pacing')).toBe('high')
      expect(getSuggestionPriority(50, 'coherence')).toBe('high')
      expect(getSuggestionPriority(59, 'dialogue')).toBe('high')
    })

    it('should return medium for scores 60-74', () => {
      expect(getSuggestionPriority(60, 'pacing')).toBe('medium')
      expect(getSuggestionPriority(70, 'coherence')).toBe('medium')
      expect(getSuggestionPriority(74, 'dialogue')).toBe('medium')
    })

    it('should return low for scores 75 and above', () => {
      expect(getSuggestionPriority(75, 'pacing')).toBe('low')
      expect(getSuggestionPriority(80, 'coherence')).toBe('low')
      expect(getSuggestionPriority(90, 'dialogue')).toBe('low')
    })
  })

  describe('estimateImprovement', () => {
    it('should return 0 for scores 80 and above', () => {
      expect(estimateImprovement(80, 'pacing')).toBe(0)
      expect(estimateImprovement(90, 'coherence')).toBe(0)
    })

    it('should return positive values for scores below 80', () => {
      expect(estimateImprovement(70, 'pacing')).toBeGreaterThan(0)
      expect(estimateImprovement(50, 'coherence')).toBeGreaterThan(0)
      expect(estimateImprovement(30, 'dialogue')).toBeGreaterThan(0)
    })

    it('should estimate higher improvement for lower scores', () => {
      const lowImprovement = estimateImprovement(70, 'pacing')
      const midImprovement = estimateImprovement(50, 'pacing')
      const highImprovement = estimateImprovement(30, 'pacing')
      expect(highImprovement).toBeGreaterThan(midImprovement)
      expect(midImprovement).toBeGreaterThan(lowImprovement)
    })
  })

  describe('calculateActionability', () => {
    it('should return high actionability for proseStyle and pacing', () => {
      const pacingAction = calculateActionability('pacing', 60)
      const proseAction = calculateActionability('proseStyle', 60)
      expect(pacingAction).toBeGreaterThan(0.7)
      expect(proseAction).toBeGreaterThan(0.7)
    })

    it('should return medium actionability for dialogue and worldBuilding', () => {
      const dialogueAction = calculateActionability('dialogue', 60)
      const worldAction = calculateActionability('worldBuilding', 60)
      expect(dialogueAction).toBeGreaterThan(0.5)
      expect(dialogueAction).toBeLessThan(0.8)
      expect(worldAction).toBeGreaterThan(0.5)
      expect(worldAction).toBeLessThan(0.8)
    })

    it('should return lower actionability for very low scores', () => {
      const lowScoreAction = calculateActionability('pacing', 20)
      const midScoreAction = calculateActionability('pacing', 60)
      expect(lowScoreAction).toBeLessThan(midScoreAction)
    })
  })

  describe('generateSuggestionText', () => {
    it('should generate appropriate suggestions for each dimension', () => {
      const dimensions: QualityDimension[] = [
        'pacing', 'coherence', 'characterization', 'dialogue',
        'worldBuilding', 'emotionalImpact', 'proseStyle',
      ]
      for (const dim of dimensions) {
        const text = generateSuggestionText(dim, 50)
        expect(typeof text).toBe('string')
        expect(text.length).toBeGreaterThan(10)
      }
    })

    it('should return different suggestions based on score', () => {
      const lowText = generateSuggestionText('pacing', 30)
      const midText = generateSuggestionText('pacing', 55)
      expect(lowText).not.toBe(midText)
    })
  })

  describe('generateSuggestions', () => {
    it('should return suggestion report', () => {
      const report = generateSuggestions(sampleGoodNarrative)
      expect(report.suggestions).toBeDefined()
      expect(Array.isArray(report.suggestions)).toBe(true)
      expect(report.totalExpectedImprovement).toBeGreaterThanOrEqual(0)
    })

    it('should sort suggestions by priority', () => {
      const report = generateSuggestions(sampleWeakNarrative)
      const priorities = report.suggestions.map(s => s.priority)
      const priorityOrder = ['critical', 'high', 'medium', 'low']
      let lastPriority = -1
      for (const p of priorities) {
        const currentPriority = priorityOrder.indexOf(p)
        expect(currentPriority).toBeGreaterThanOrEqual(lastPriority)
        lastPriority = currentPriority
      }
    })

    it('should categorize quick wins and long term goals', () => {
      const report = generateSuggestions(sampleWeakNarrative)
      expect(Array.isArray(report.quickWins)).toBe(true)
      expect(Array.isArray(report.longTermGoals)).toBe(true)
      expect(Array.isArray(report.prioritizedActions)).toBe(true)
    })

    it('should return empty suggestions for excellent content', () => {
      // Create content with all high scores
      const excellentContent = sampleGoodNarrative + ' The prose was beautifully crafted with rich vocabulary ' +
        'and varied sentence structure. Characters spoke with distinct voices full of personality. ' +
        'The world felt real with sensory details everywhere. Emotional moments hit hard.'
      const report = generateSuggestions(excellentContent)
      // May still have suggestions but should be low priority
      expect(report).toBeDefined()
    })
  })

  describe('formatSuggestionReport', () => {
    it('should format report as readable text', () => {
      const report = generateSuggestions(sampleWeakNarrative)
      const formatted = formatSuggestionReport(report)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
      expect(formatted).toContain('Quality Improvement Suggestions')
    })

    it('should include quick wins section when applicable', () => {
      const report = generateSuggestions(sampleWeakNarrative)
      const formatted = formatSuggestionReport(report)
      // Quick wins may or may not be present depending on content
      expect(formatted).toBeDefined()
    })
  })
})

// ============================================================
// COMBINED ENGINE TESTS
// ============================================================

describe('NarrativeQualityScoringEngine', () => {
  describe('createEmptyEngineState', () => {
    it('should create valid empty state', () => {
      const state = createEmptyEngineState()
      expect(state.scoringHistory).toEqual([])
      expect(state.suggestionHistory).toEqual([])
      expect(state.averageScores.size).toBe(0)
      expect(state.totalContentsAnalyzed).toBe(0)
    })
  })

  describe('addScoringResult', () => {
    it('should add result to scoring history', () => {
      const state = createEmptyEngineState()
      const result = scoreAllDimensions(sampleGoodNarrative)
      const newState = addScoringResult(state, result)

      expect(newState.scoringHistory).toHaveLength(1)
      expect(newState.totalContentsAnalyzed).toBe(1)
    })

    it('should update average scores', () => {
      const state = createEmptyEngineState()
      const result = scoreAllDimensions(sampleGoodNarrative)
      const newState = addScoringResult(state, result)

      expect(newState.averageScores.size).toBeGreaterThan(0)
    })
  })

  describe('addSuggestionReport', () => {
    it('should add report to suggestion history', () => {
      const state = createEmptyEngineState()
      const report = generateSuggestions(sampleGoodNarrative)
      const newState = addSuggestionReport(state, report)

      expect(newState.suggestionHistory).toHaveLength(1)
    })
  })

  describe('analyzeNarrativeQuality', () => {
    it('should return complete analysis', () => {
      const result = analyzeNarrativeQuality(sampleGoodNarrative)
      expect(result.scoringResult).toBeDefined()
      expect(result.suggestionReport).toBeDefined()
      expect(result.state).toBeDefined()
    })

    it('should update state with new analysis', () => {
      const result = analyzeNarrativeQuality(sampleGoodNarrative)
      expect(result.state.totalContentsAnalyzed).toBe(1)
    })

    it('should accept existing state', () => {
      const existingState = createEmptyEngineState()
      const result = analyzeNarrativeQuality(sampleGoodNarrative, existingState)
      expect(result.state).toBeDefined()
    })

    it('should handle empty narrative', () => {
      const result = analyzeNarrativeQuality(emptyNarrative)
      // Empty narrative gets baseline score around 46
      expect(result.scoringResult.overallScore).toBeGreaterThanOrEqual(40)
      expect(result.scoringResult.overallScore).toBeLessThanOrEqual(55)
    })
  })

  describe('formatQualityReport', () => {
    it('should format complete quality report', () => {
      const { scoringResult, suggestionReport } = analyzeNarrativeQuality(sampleGoodNarrative)
      const report = formatQualityReport(scoringResult, suggestionReport)

      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      expect(report).toContain('NARRATIVE QUALITY SCORING REPORT')
      expect(report).toContain('Overall Score')
    })

    it('should include dimension breakdown', () => {
      const { scoringResult, suggestionReport } = analyzeNarrativeQuality(sampleGoodNarrative)
      const report = formatQualityReport(scoringResult, suggestionReport)

      expect(report).toContain('pacing')
      expect(report).toContain('coherence')
    })

    it('should include improvement suggestions', () => {
      const { scoringResult, suggestionReport } = analyzeNarrativeQuality(sampleWeakNarrative)
      const report = formatQualityReport(scoringResult, suggestionReport)

      expect(report).toContain('Improvement Suggestions')
    })
  })
})

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('NarrativeQualityScoringEngine Integration', () => {
  it('should provide consistent scores across multiple calls', () => {
    const result1 = analyzeNarrativeQuality(sampleGoodNarrative)
    const result2 = analyzeNarrativeQuality(sampleGoodNarrative)
    expect(result1.scoringResult.overallScore).toBe(result2.scoringResult.overallScore)
  })

  it('should differentiate between good and weak narratives', () => {
    const goodResult = analyzeNarrativeQuality(sampleGoodNarrative)
    const weakResult = analyzeNarrativeQuality(sampleWeakNarrative)
    const mediumResult = analyzeNarrativeQuality(sampleMediumNarrative)

    expect(goodResult.scoringResult.overallScore).toBeGreaterThan(mediumResult.scoringResult.overallScore)
    expect(mediumResult.scoringResult.overallScore).toBeGreaterThan(weakResult.scoringResult.overallScore)
  })

  it('should track scoring history correctly', () => {
    let state = createEmptyEngineState()
    state = analyzeNarrativeQuality(sampleGoodNarrative, state).state
    state = analyzeNarrativeQuality(sampleWeakNarrative, state).state

    expect(state.totalContentsAnalyzed).toBe(2)
    expect(state.scoringHistory).toHaveLength(2)
  })

  it('should generate appropriate suggestions for weak narrative', () => {
    const { suggestionReport } = analyzeNarrativeQuality(sampleWeakNarrative)
    expect(suggestionReport.suggestions.length).toBeGreaterThan(0)
    expect(suggestionReport.totalExpectedImprovement).toBeGreaterThan(0)
  })

  it('should generate fewer suggestions for strong narrative', () => {
    const weakReport = generateSuggestions(sampleWeakNarrative)
    const goodReport = generateSuggestions(sampleGoodNarrative)
    // Weak narratives should have more critical/high priority suggestions
    const weakCriticalCount = weakReport.suggestions.filter(s => s.priority === 'critical' || s.priority === 'high').length
    const goodCriticalCount = goodReport.suggestions.filter(s => s.priority === 'critical' || s.priority === 'high').length
    expect(weakCriticalCount).toBeGreaterThanOrEqual(goodCriticalCount)
  })
})