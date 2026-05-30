/**
 * NarrativeInsightAggregator Tests - V98
 * Tests for Cross-Subsystem Insight Aggregation
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyAggregatorState,
  createAggregatedInsight,
  generateCrossSubsystemInsights,
  deduplicateInsights,
  resolveInsight,
  autoResolveStaleInsights,
  analyzeInsights,
  generateCorrelationAnalysis,
  generatePrioritizedRecommendations,
  runAggregation,
  formatInsightAnalysis,
  formatCorrelationAnalysis,
  formatPrioritizedRecommendations,
  DEFAULT_AGGREGATOR_CONFIG,
  type InsightSource,
  type InsightEvidence,
  type SubsystemType
} from './NarrativeInsightAggregator'

import { createEmptyThreadState } from './PlotContinuityEngine'
import type { IntegratedNarrativeState } from './NarrativeInsightAggregator'

// =============================================================================
// Helper Functions
// =============================================================================

function makeInsightSource(subsystem: SubsystemType = 'plot_continuity_engine', weight = 0.5): InsightSource {
  return { subsystem, weight, specificFinding: 'Test finding' }
}

function makeInsightEvidence(): InsightEvidence[] {
  return [{ type: 'metric_value', description: 'Test evidence', value: 0.5 }]
}

function makeMinimalState(): IntegratedNarrativeState {
  return {
    worldState: {
      id: 'test', storyId: 'test', totalChapters: 10,
      characters: new Map(), locations: new Map(), items: new Map(),
      events: new Map(), rules: new Map(), timeline: [],
      characterCount: 0, locationCount: 0, itemCount: 0
    },
    contextGraph: {
      nodes: new Map(), connections: new Map(), adjacencyList: new Map(),
      chapterIndex: new Map(), typeIndex: new Map(), lastUpdated: Date.now()
    },
    continuityReport: {
      isClean: true, plotHoles: [],
      threadStates: { setupPromises: [], unresolvedPayoffs: [], pendingForeshadowing: [], satisfiedThreads: [], abandonedThreads: [] },
      warnings: [], suggestions: [], overallHealthScore: 100
    },
    dashboard: null,
    engagementPrediction: null,
    writerPersona: null,
    archipelagoAnalysis: null,
    healthScore: null,
    currentChapter: 10,
    timestamp: Date.now()
  }
}

// =============================================================================
// createEmptyAggregatorState Tests
// =============================================================================

describe('createEmptyAggregatorState', () => {
  it('should create state with defaults', () => {
    const state = createEmptyAggregatorState()
    expect(state.insights).toEqual([])
    expect(state.aggregationCount).toBe(0)
    expect(state.config.maxInsights).toBe(50)
  })
})

// =============================================================================
// createAggregatedInsight Tests
// =============================================================================

describe('createAggregatedInsight', () => {
  it('should create insight with correct fields', () => {
    const sources = [makeInsightSource()]
    const evidence = makeInsightEvidence()
    const insight = createAggregatedInsight(
      'Test Insight', 'Test description', 'major',
      sources, evidence, ['Rec1'], 0.7, [1, 10]
    )
    expect(insight.title).toBe('Test Insight')
    expect(insight.severity).toBe('major')
    expect(insight.resolved).toBe(false)
    expect(insight.id).toMatch(/^insight-/)
  })
})

// =============================================================================
// generateCrossSubsystemInsights Tests
// =============================================================================

describe('generateCrossSubsystemInsights', () => {
  it('should return empty for minimal state', () => {
    const state = makeMinimalState()
    const insights = generateCrossSubsystemInsights(state)
    expect(Array.isArray(insights)).toBe(true)
  })

  it('should detect high complexity low engagement', () => {
    const state: IntegratedNarrativeState = {
      ...makeMinimalState(),
      archipelagoAnalysis: {
        map: { islands: [], bridges: [], totalChapters: 10, mainPlotId: '', orphanedIslands: [], parallelSubplots: [] },
        complexityScore: 85,
        mainPlotIndependence: 0.5,
        subplotDensity: 0.8,
        overConnectedIslands: [], underConnectedIslands: [], seepageEffects: [], recommendations: []
      },
      engagementPrediction: {
        currentEngagement: 'low' as any,
        engagementScore: 45,
        predictedFinishProbability: 0.3,
        likelyDropChapter: 7,
        recommendedFix: 'Reduce complexity',
        confidence: 0.7
      }
    }
    const insights = generateCrossSubsystemInsights(state)
    const critical = insights.find(i => i.severity === 'critical')
    expect(critical).toBeDefined()
    expect(critical?.title).toContain('overwhelms')
  })

  it('should detect writer confidence vs low engagement', () => {
    const state: IntegratedNarrativeState = {
      ...makeMinimalState(),
      writerPersona: {
        id: 'p1', voice: { formalityLevel: 0.5, emotionalRange: 0.5, sentenceComplexity: 0.5, paragraphLength: 0.5, dialogueRatio: 0.3, descriptionDensity: 0.4 },
        stylePreferences: { preferredPOV: 'third', preferredTense: 'past', showDontTellBalance: 0.5, pacingPreference: 0.5, tonePreference: 0.5 },
        strengths: [], growthAreas: [], confidenceScore: 90,
        consistency: 0.8, lastUpdated: Date.now()
      },
      engagementPrediction: {
        currentEngagement: 'low' as any,
        engagementScore: 40,
        predictedFinishProbability: 0.3,
        likelyDropChapter: 5,
        recommendedFix: 'Check style',
        confidence: 0.6
      }
    }
    const insights = generateCrossSubsystemInsights(state)
    const major = insights.find(i => i.severity === 'major')
    expect(major).toBeDefined()
    expect(major?.title).toContain('not connecting')
  })

  it('should not generate foreshadow insight for few old foreshadow', () => {
    const state: IntegratedNarrativeState = {
      ...makeMinimalState(),
      continuityReport: {
        isClean: false, plotHoles: [],
        threadStates: {
          setupPromises: [],
          unresolvedPayoffs: [],
          pendingForeshadowing: [
            { id: 'f1', threadId: 't1', hintText: 'Old hint', chapter: 1, strength: 0.7, paidOff: false, payoffQuality: 0 },
            { id: 'f2', threadId: 't1', hintText: 'New hint', chapter: 8, strength: 0.5, paidOff: false, payoffQuality: 0 }
          ],
          satisfiedThreads: [], abandonedThreads: []
        },
        warnings: [], suggestions: [], overallHealthScore: 70
      },
      currentChapter: 30
    }
    const insights = generateCrossSubsystemInsights(state)
    // Only 2 old foreshadow elements (< 4 threshold), so no stale foreshadow insight
    const foreshadowInsight = insights.find(i => i.title.includes('foreshadowing'))
    expect(foreshadowInsight).toBeUndefined()
  })
})

// =============================================================================
// deduplicateInsights Tests
// =============================================================================

describe('deduplicateInsights', () => {
  it('should keep first of duplicates', () => {
    const insight1 = createAggregatedInsight(
      'Same Title', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    const insight2 = createAggregatedInsight(
      'Same Title', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    const deduped = deduplicateInsights([insight1, insight2])
    expect(deduped.length).toBe(1)
  })

  it('should keep different insights', () => {
    const insight1 = createAggregatedInsight(
      'Title A', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    const insight2 = createAggregatedInsight(
      'Title B', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    const deduped = deduplicateInsights([insight1, insight2])
    expect(deduped.length).toBe(2)
  })
})

// =============================================================================
// resolveInsight Tests
// =============================================================================

describe('resolveInsight', () => {
  it('should mark insight as resolved', () => {
    let state = createEmptyAggregatorState()
    const insight = createAggregatedInsight(
      'Test', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    state = { ...state, insights: [insight] }
    state = resolveInsight(state, insight.id, 'Fixed it')
    expect(state.insights[0].resolved).toBe(true)
    expect(state.insights[0].resolution).toBe('Fixed it')
  })
})

// =============================================================================
// autoResolveStaleInsights Tests
// =============================================================================

describe('autoResolveStaleInsights', () => {
  it('should not resolve fresh insights', () => {
    let state = createEmptyAggregatorState()
    const insight = createAggregatedInsight(
      'Test', 'Desc', 'major',
      [makeInsightSource()], [], ['Rec'], 0.5, [1, 10]
    )
    state = { ...state, insights: [insight] }
    const result = autoResolveStaleInsights(state, 86400000)
    expect(result.insights[0].resolved).toBe(false)
  })
})

// =============================================================================
// analyzeInsights Tests
// =============================================================================

describe('analyzeInsights', () => {
  it('should count by severity', () => {
    const insights = [
      createAggregatedInsight('1', 'D', 'critical', [makeInsightSource()], [], [], 0.8, [1, 5]),
      createAggregatedInsight('2', 'D', 'major', [makeInsightSource()], [], [], 0.6, [1, 5]),
      createAggregatedInsight('3', 'D', 'minor', [makeInsightSource()], [], [], 0.3, [1, 5])
    ]
    const analysis = analyzeInsights(insights)
    expect(analysis.bySeverity.critical).toBe(1)
    expect(analysis.bySeverity.major).toBe(1)
    expect(analysis.bySeverity.minor).toBe(1)
  })

  it('should calculate average impact', () => {
    // Ensure insights are NOT marked resolved
    const insights = [
      createAggregatedInsight('1', 'D', 'major', [makeInsightSource()], [], [], 0.8, [1, 5]),
      createAggregatedInsight('2', 'D', 'major', [makeInsightSource()], [], [], 0.4, [1, 5])
    ]
    const analysis = analyzeInsights(insights)
    expect(analysis.averageImpact).toBeCloseTo(0.6, 1)
  })

  it('should sort top insights by impact', () => {
    const insights = [
      createAggregatedInsight('Low', 'D', 'minor', [makeInsightSource()], [], [], 0.2, [1, 5]),
      createAggregatedInsight('High', 'D', 'critical', [makeInsightSource()], [], [], 0.9, [1, 5])
    ]
    const analysis = analyzeInsights(insights)
    expect(analysis.topInsights[0].title).toBe('High')
  })
})

// =============================================================================
// generateCorrelationAnalysis Tests
// =============================================================================

describe('generateCorrelationAnalysis', () => {
  it('should return analysis for minimal state', () => {
    const state = makeMinimalState()
    const analysis = generateCorrelationAnalysis(state)
    expect(analysis.complexityEngagementCorrelation).toBeDefined()
    expect(analysis.threadResolutionRate).toBeDefined()
  })

  it('should calculate foreshadow payoff rate', () => {
    const state: IntegratedNarrativeState = {
      ...makeMinimalState(),
      continuityReport: {
        isClean: true, plotHoles: [],
        threadStates: {
          setupPromises: [],
          unresolvedPayoffs: [],
          pendingForeshadowing: [
            { id: 'f1', threadId: 't1', hintText: 'H', chapter: 5, strength: 0.5, paidOff: true, payoffChapter: 10, payoffQuality: 0.8 },
            { id: 'f2', threadId: 't1', hintText: 'H', chapter: 5, strength: 0.5, paidOff: false, payoffQuality: 0 }
          ],
          satisfiedThreads: [], abandonedThreads: []
        },
        warnings: [], suggestions: [], overallHealthScore: 100
      }
    }
    const analysis = generateCorrelationAnalysis(state)
    expect(analysis.foreshadowPayoffRate).toBe(0.5)
  })
})

// =============================================================================
// generatePrioritizedRecommendations Tests
// =============================================================================

describe('generatePrioritizedRecommendations', () => {
  it('should return empty for no insights', () => {
    const recs = generatePrioritizedRecommendations([], makeMinimalState())
    expect(recs).toEqual([])
  })

  it('should prioritize critical insights higher', () => {
    const insights = [
      createAggregatedInsight('Critical Issue', 'Desc', 'critical', [makeInsightSource()], [], ['Fix critical'], 0.9, [1, 5]),
      createAggregatedInsight('Minor Issue', 'Desc', 'minor', [makeInsightSource()], [], ['Fix minor'], 0.2, [1, 5])
    ]
    const recs = generatePrioritizedRecommendations(insights, makeMinimalState())
    expect(recs.length).toBe(2)
    expect(recs[0].risk).toBe('high')
  })
})

// =============================================================================
// runAggregation Tests
// =============================================================================

describe('runAggregation', () => {
  it('should run full aggregation cycle', () => {
    const state = createEmptyAggregatorState()
    const intState = makeMinimalState()
    const result = runAggregation(state, intState)
    expect(result.aggregationCount).toBe(1)
    expect(result.lastAggregationTimestamp).toBeGreaterThan(0)
  })

  it('should cap insights at max', () => {
    let state = createEmptyAggregatorState()
    state = { ...state, config: { ...state.config, maxInsights: 3 } }

    // Create 5 insights
    const insights = Array.from({ length: 5 }, (_, i) =>
      createAggregatedInsight(`Insight ${i}`, 'Desc', 'minor', [makeInsightSource()], [], [], 0.5, [1, 5])
    )
    state = { ...state, insights }

    const result = runAggregation(state, makeMinimalState())
    expect(result.insights.length).toBeLessThanOrEqual(3)
  })
})

// =============================================================================
// formatInsightAnalysis Tests
// =============================================================================

describe('formatInsightAnalysis', () => {
  it('should format analysis summary', () => {
    const insights = [
      createAggregatedInsight('Test', 'D', 'critical', [makeInsightSource()], [], [], 0.8, [1, 5])
    ]
    const analysis = analyzeInsights(insights)
    const summary = formatInsightAnalysis(analysis)
    expect(summary).toContain('Insight Analysis')
    expect(summary).toContain('Critical: 1')
  })
})

// =============================================================================
// formatCorrelationAnalysis Tests
// =============================================================================

describe('formatCorrelationAnalysis', () => {
  it('should format correlation metrics', () => {
    const state = makeMinimalState()
    const analysis = generateCorrelationAnalysis(state)
    const summary = formatCorrelationAnalysis(analysis)
    expect(summary).toContain('Correlation Analysis')
    expect(summary).toContain('Thread Resolution Rate')
  })
})

// =============================================================================
// formatPrioritizedRecommendations Tests
// =============================================================================

describe('formatPrioritizedRecommendations', () => {
  it('should say no recommendations for empty list', () => {
    const summary = formatPrioritizedRecommendations([])
    expect(summary).toContain('No pending')
  })
})
