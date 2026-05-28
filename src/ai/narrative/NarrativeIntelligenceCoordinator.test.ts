/**
 * NarrativeIntelligenceCoordinator Tests - V94
 * Tests for Unified Narrative Intelligence Hub
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyIntelligenceState,
  detectCharacterPlotMismatches,
  detectReaderAuthorMismatches,
  detectWorldThreadInconsistencies,
  generateCrossSubsystemInsights,
  calculateNarrativeHealthScore,
  formatHealthSummary,
  formatInsightsSummary,
  formatIntelligenceSummary,
  DEFAULT_COORDINATION_CONFIG,
  type CrossSubsystemInsight
} from './NarrativeIntelligenceCoordinator'

import { createEmptyThreadState } from './PlotContinuityEngine'
import type { StoryWorldState } from '../world/StoryWorldModel'
import type { ArchipelagoAnalysis } from './StoryArchipelagoAnalyzer'
import type { EngagementPrediction } from './ReaderExperienceSimulator'
import type { WriterPersona } from '../persona/WriterPersonaEngine'

// =============================================================================
// Helper Functions
// =============================================================================

function makeState(overrides = {}) {
  return {
    worldState: {
      id: 'test', storyId: 'test', totalChapters: 10,
      characters: new Map([['char1', { id: 'char1', name: 'Alice', traits: [], relationships: [], stateChanges: [], appearance: '', personality: '', role: 'protagonist', firstAppearance: 1, currentLocation: 'castle', goals: [], fears: [] }]]),
      locations: new Map(), items: new Map(), events: new Map(), rules: new Map(), timeline: [],
      characterCount: 1, locationCount: 0, itemCount: 0
    },
    continuityReport: {
      isClean: true, plotHoles: [],
      threadStates: createEmptyThreadState(),
      warnings: [], suggestions: [], overallHealthScore: 100
    },
    archipelagoAnalysis: {
      map: { islands: [], bridges: [], totalChapters: 10, mainPlotId: '', orphanedIslands: [], parallelSubplots: [] },
      complexityScore: 30, mainPlotIndependence: 0.8, subplotDensity: 0.5,
      overConnectedIslands: [], underConnectedIslands: [], seepageEffects: [], recommendations: []
    },
    engagementPrediction: null,
    writerPersona: null,
    currentChapter: 5,
    lastUpdated: Date.now(),
    ...overrides
  }
}

function makeEngagementPrediction(score = 80) {
  return {
    currentEngagement: 'high' as any,
    engagementScore: score,
    predictedFinishProbability: 0.9,
    likelyDropChapter: null,
    recommendedFix: '',
    confidence: 0.8
  }
}

function makeWriterPersona(confidence = 70) {
  return {
    id: 'persona1', voice: { formalityLevel: 0.5, emotionalRange: 0.5, sentenceComplexity: 0.5, paragraphLength: 0.5, dialogueRatio: 0.3, descriptionDensity: 0.4 },
    stylePreferences: { preferredPOV: 'third', preferredTense: 'past', showDontTellBalance: 0.5, pacingPreference: 0.5, tonePreference: 0.5 },
    strengths: [], growthAreas: [], confidenceScore: confidence,
    consistency: 0.8, lastUpdated: Date.now()
  }
}

// =============================================================================
// createEmptyIntelligenceState Tests
// =============================================================================

describe('createEmptyIntelligenceState', () => {
  it('should create state with defaults', () => {
    const state = createEmptyIntelligenceState()
    expect(state.worldState.id).toBe('empty')
    expect(state.continuityReport.isClean).toBe(true)
    expect(state.currentChapter).toBe(0)
    expect(state.engagementPrediction).toBeNull()
  })
})

// =============================================================================
// Cross-Subsystem Insight Detection Tests
// =============================================================================

describe('detectCharacterPlotMismatches', () => {
  it('should return empty for clean continuity', () => {
    const state = makeState()
    const insights = detectCharacterPlotMismatches(state)
    expect(insights.length).toBe(0)
  })

  it('should detect issues when continuity not clean', () => {
    const state = makeState({
      continuityReport: {
        isClean: false,
        plotHoles: [{
          id: 'ph1', type: 'broken_continuity' as any, severity: 'critical' as any,
          description: 'Plot hole description', affectedThreads: [],
          chapter: 3, suggestion: 'Fix this'
        }],
        threadStates: createEmptyThreadState(),
        warnings: [], suggestions: [], overallHealthScore: 60
      }
    })
    const insights = detectCharacterPlotMismatches(state)
    expect(insights.length).toBeGreaterThan(0)
  })
})

describe('detectReaderAuthorMismatches', () => {
  it('should return empty when no engagement or persona', () => {
    const state = makeState()
    const insights = detectReaderAuthorMismatches(state)
    expect(insights.length).toBe(0)
  })

  it('should detect low engagement despite high confidence', () => {
    const state = makeState({
      engagementPrediction: makeEngagementPrediction(40),
      writerPersona: makeWriterPersona(80)
    })
    const insights = detectReaderAuthorMismatches(state)
    expect(insights.some(i => i.type === 'reader-author')).toBe(true)
  })

  it('should not flag when engagement and confidence both high', () => {
    const state = makeState({
      engagementPrediction: makeEngagementPrediction(80),
      writerPersona: makeWriterPersona(80)
    })
    const insights = detectReaderAuthorMismatches(state)
    const readerAuthorInsights = insights.filter(i => i.type === 'reader-author')
    expect(readerAuthorInsights).toEqual([])
  })
})

describe('detectWorldThreadInconsistencies', () => {
  it('should detect orphaned islands', () => {
    const state = makeState({
      archipelagoAnalysis: {
        ...makeState().archipelagoAnalysis,
        map: { ...makeState().archipelagoAnalysis.map, orphanedIslands: ['subplot1', 'subplot2'] }
      }
    })
    const insights = detectWorldThreadInconsistencies(state)
    expect(insights.some(i => i.type === 'world-thread')).toBe(true)
  })

  it('should flag many threads with few characters', () => {
    const state = makeState({
      continuityReport: {
        ...makeState().continuityReport,
        threadStates: { ...createEmptyThreadState(), unresolvedPayoffs: Array(15).fill('x') }
      }
    })
    const insights = detectWorldThreadInconsistencies(state)
    expect(insights.some(i => i.title.includes('active threads'))).toBe(true)
  })
})

// =============================================================================
// generateCrossSubsystemInsights Tests
// =============================================================================

describe('generateCrossSubsystemInsights', () => {
  it('should return sorted by severity', () => {
    const state = makeState()
    const insights = generateCrossSubsystemInsights(state)
    // Should be sorted: critical first, then major, then minor
    for (let i = 0; i < insights.length - 1; i++) {
      const order = { critical: 0, major: 1, minor: 2 }
      expect(order[insights[i].severity]).toBeLessThanOrEqual(order[insights[i + 1].severity])
    }
  })

  it('should return empty for healthy state', () => {
    const state = makeState()
    const insights = generateCrossSubsystemInsights(state)
    // No critical issues in healthy state
    const critical = insights.filter(i => i.severity === 'critical')
    expect(critical.length).toBe(0)
  })
})

// =============================================================================
// calculateNarrativeHealthScore Tests
// =============================================================================

describe('calculateNarrativeHealthScore', () => {
  it('should return 100 for fully healthy state', () => {
    const state = makeState({
      continuityReport: { ...makeState().continuityReport, overallHealthScore: 100 }
    })
    const health = calculateNarrativeHealthScore(state)
    expect(health.worldHealth).toBeGreaterThan(0)
    expect(health.continuityHealth).toBe(100)
  })

  it('should penalize low engagement', () => {
    const state = makeState({
      engagementPrediction: makeEngagementPrediction(30),
      writerPersona: makeWriterPersona(90)
    })
    const health = calculateNarrativeHealthScore(state)
    expect(health.engagementHealth).toBe(30)
    expect(health.overall).toBeLessThan(100)
  })

  it('should include cross-subsystem score', () => {
    const state = makeState({
      engagementPrediction: makeEngagementPrediction(40),
      writerPersona: makeWriterPersona(80)
    })
    const health = calculateNarrativeHealthScore(state)
    expect(health.crossSubsystemScore).toBeLessThan(100)
  })

  it('should include bottlenecks when low', () => {
    const state = makeState({
      continuityReport: { ...makeState().continuityReport, overallHealthScore: 40 }
    })
    const health = calculateNarrativeHealthScore(state)
    expect(health.bottlenecks.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// formatHealthSummary Tests
// =============================================================================

describe('formatHealthSummary', () => {
  it('should show all subsystem scores', () => {
    const state = makeState()
    const health = calculateNarrativeHealthScore(state)
    const summary = formatHealthSummary(health)
    expect(summary).toContain('World:')
    expect(summary).toContain('Continuity:')
    expect(summary).toContain('Overall:')
  })

  it('should list strengths', () => {
    const state = makeState()
    const health = calculateNarrativeHealthScore(state)
    const summary = formatHealthSummary(health)
    expect(summary).toContain('Strengths')
  })
})

// =============================================================================
// formatInsightsSummary Tests
// =============================================================================

describe('formatInsightsSummary', () => {
  it('should say no issues for empty list', () => {
    const summary = formatInsightsSummary([])
    expect(summary).toContain('No critical')
  })

  it('should format insights with icons', () => {
    const insights: CrossSubsystemInsight[] = [{
      type: 'reader-author', severity: 'critical', title: 'Test issue',
      description: 'Test description', evidence: [], affectedSubsystems: [], recommendations: []
    }]
    const summary = formatInsightsSummary(insights)
    expect(summary).toContain('🔴')
    expect(summary).toContain('Test issue')
  })
})

// =============================================================================
// formatIntelligenceSummary Tests
// =============================================================================

describe('formatIntelligenceSummary', () => {
  it('should format complete report', () => {
    const state = makeState()
    const health = calculateNarrativeHealthScore(state)
    const summary = formatIntelligenceSummary(state, health)
    expect(summary).toContain('Narrative Intelligence Report')
    expect(summary).toContain('Chapter:')
  })
})
