/**
 * NarrativeIntelligenceCoordinator Tests - V100
 * Tests for Unified Narrative Intelligence Hub
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyIntelligenceState,
  calculateNarrativeHealthScore,
  detectCharacterPlotMismatches,
  detectReaderAuthorMismatches,
  detectWorldThreadInconsistencies,
  generateCrossSubsystemInsights,
  needsAlert,
  formatHealthSummary,
  formatInsightsSummary,
  formatIntelligenceSummary,
  type NarrativeIntelligenceState,
  type NarrativeHealthScore
} from './NarrativeIntelligenceCoordinator'

// =============================================================================
// Helper Functions
// =============================================================================

function makeFakeWorldState() {
  return {
    id: 'test', storyId: 'test', totalChapters: 10,
    characters: new Map([['c1', { id: 'c1', name: 'Alice', role: 'protagonist', firstAppearance: 1, importance: 0.8, traits: [], relationships: [], state: { health: 100, location: 'test' }, arcNotes: '', emotionalProfile: null, voiceMetrics: null, lastScene: 1 }]]),
    locations: new Map(), items: new Map(), events: new Map(), rules: new Map(), timeline: [],
    characterCount: 1, locationCount: 0, itemCount: 0
  }
}

function makeMinimalState(): NarrativeIntelligenceState {
  return {
    worldState: makeFakeWorldState(),
    continuityReport: {
      isClean: true, plotHoles: [],
      threadStates: { setupPromises: [], unresolvedPayoffs: [], pendingForeshadowing: [], satisfiedThreads: [], abandonedThreads: [] },
      warnings: [], suggestions: [], overallHealthScore: 100
    },
    archipelagoAnalysis: {
      map: { islands: [], bridges: [], totalChapters: 10, mainPlotId: '', orphanedIslands: [], parallelSubplots: [] },
      complexityScore: 50,
      mainPlotIndependence: 0.5,
      subplotDensity: 0.3,
      overConnectedIslands: [], underConnectedIslands: [], seepageEffects: [], recommendations: []
    },
    engagementPrediction: null,
    writerPersona: null,
    currentChapter: 1,
    lastUpdated: Date.now()
  }
}

// =============================================================================
// createEmptyIntelligenceState Tests
// =============================================================================

describe('createEmptyIntelligenceState', () => {
  it('should create state with defaults', () => {
    const state = createEmptyIntelligenceState()
    expect(state.currentChapter).toBe(0)
    expect(state.lastUpdated).toBeGreaterThan(0)
  })
})

// =============================================================================
// calculateNarrativeHealthScore Tests
// =============================================================================

describe('calculateNarrativeHealthScore', () => {
  it('should return health score for clean state', () => {
    const state = makeMinimalState()
    const score = calculateNarrativeHealthScore(state)
    expect(score.overall).toBeGreaterThan(0)
    expect(score.overall).toBeLessThanOrEqual(100)
  })

  it('should calculate continuity health from continuity report', () => {
    const state = makeMinimalState()
    const score = calculateNarrativeHealthScore(state)
    expect(score.continuityHealth).toBeGreaterThan(0)
    expect(score.worldHealth).toBeGreaterThan(0)
  })
})

// =============================================================================
// detectCharacterPlotMismatches Tests
// =============================================================================

describe('detectCharacterPlotMismatches', () => {
  it('should return empty for minimal state', () => {
    const state = makeMinimalState()
    const mismatches = detectCharacterPlotMismatches(state)
    expect(mismatches.length).toBe(0)
  })
})

// =============================================================================
// detectReaderAuthorMismatches Tests
// =============================================================================

describe('detectReaderAuthorMismatches', () => {
  it('should return empty for minimal state', () => {
    const state = makeMinimalState()
    const mismatches = detectReaderAuthorMismatches(state)
    expect(mismatches.length).toBe(0)
  })
})

// =============================================================================
// detectWorldThreadInconsistencies Tests
// =============================================================================

describe('detectWorldThreadInconsistencies', () => {
  it('should return empty for minimal state', () => {
    const state = makeMinimalState()
    const inconsistencies = detectWorldThreadInconsistencies(state)
    expect(inconsistencies.length).toBe(0)
  })
})

// =============================================================================
// generateCrossSubsystemInsights Tests
// =============================================================================

describe('generateCrossSubsystemInsights', () => {
  it('should return insights array', () => {
    const state = makeMinimalState()
    const insights = generateCrossSubsystemInsights(state)
    expect(Array.isArray(insights)).toBe(true)
  })
})

// =============================================================================
// needsAlert Tests
// =============================================================================

describe('needsAlert', () => {
  it('should return alert level for clean state', () => {
    const state = makeMinimalState()
    const health = calculateNarrativeHealthScore(state)
    const alert = needsAlert(health)
    expect(alert).toBeDefined()
  })

  it('should return warning for critical health', () => {
    const health: NarrativeHealthScore = {
      overall: 10,
      worldHealth: 10,
      continuityHealth: 10,
      engagementHealth: 10,
      styleHealth: 10,
      crossSubsystemScore: 10,
      strengths: [],
      criticalIssues: ['Test critical'],
      majorIssues: [],
      minorIssues: []
    }
    const alert = needsAlert(health)
    expect(alert.level).toBe('warning')
  })
})

// =============================================================================
// formatHealthSummary Tests
// =============================================================================

describe('formatHealthSummary', () => {
  it('should format health score', () => {
    const health: NarrativeHealthScore = {
      overall: 85,
      worldHealth: 90,
      continuityHealth: 80,
      engagementHealth: 85,
      styleHealth: 88,
      crossSubsystemScore: 70,
      strengths: ['Strong character work'],
      bottlenecks: [],
      criticalIssues: [],
      majorIssues: [],
      minorIssues: []
    }
    const summary = formatHealthSummary(health)
    expect(summary).toContain('Overall')
  })
})

// =============================================================================
// formatInsightsSummary Tests
// =============================================================================

describe('formatInsightsSummary', () => {
  it('should say no insights for empty array', () => {
    const summary = formatInsightsSummary([])
    expect(summary).toContain('No')
  })
})

// =============================================================================
// formatIntelligenceSummary Tests
// =============================================================================

describe('formatIntelligenceSummary', () => {
  it('should format full state summary', () => {
    const state = makeMinimalState()
    const health = calculateNarrativeHealthScore(state)
    const summary = formatIntelligenceSummary(state, health)
    expect(summary).toContain('Narrative')
    expect(summary).toContain('Health')
  })
})
