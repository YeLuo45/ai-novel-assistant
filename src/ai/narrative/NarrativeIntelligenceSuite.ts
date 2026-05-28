/**
 * NarrativeIntelligenceSuite - V99
 * Export barrel and type re-exports for the complete Narrative Intelligence subsystem
 * 
 * This module re-exports all public types and functions from the narrative intelligence
 * subsystem components, providing a single import point for consumers.
 * 
 * Components:
 * - StoryArchipelagoAnalyzer: Story universe island graph analysis
 * - PlotContinuityEngine: Narrative thread tracking and causal integrity
 * - NarrativeContextGraph: Contextual relationship hypergraph
 * - NarrativeIntelligenceCoordinator: Unified coordination layer
 * - NarrativeInsightAggregator: Cross-subsystem insight aggregation
 * - ReaderExperienceSimulator: Reader engagement prediction
 * 
 * Inspired by: nanobot distributed mesh + thunderbolt pipeline + ruflo hierarchical + chatdev multi-agent
 */

import type {
  // StoryArchipelagoAnalyzer types
  StoryArchipelago,
  SubplotIsland,
  IslandConnection,
  AnchorType,
  BridgeType,
  SeepageEffect,
  ArchipelagoAnalysis,
  ArchipelagoMap,
  SeepageAnalysis,
  StoryComplexityMetrics,
  IslandRecommendation,

  // PlotContinuityEngine types
  PlotContinuityEngine,
  NarrativeThread,
  ThreadState,
  PlotHole,
  ContinuityReport,
  Foreshadow,
  TimelineEntry,
  TimelineConsistencyResult,
  ThreadResolution,
  PayoffValidation,
  createForeshadow,
  createPlotHole,
  createThreadState,
  trackPlotThread,
  recordPayoff,
  addForeshadow,
  payOffForeshadow,
  checkPlotHoles,
  checkTimelineConsistency,
  getContinuityReport,
  getUnresolvedPayoffs,
  getPendingForeshadowing,
  getSatisfiedThreads,
  getPlotHoleCount,
  isContinuityHealthy,
  getThreadResolutionRate,

  // NarrativeContextGraph types
  NarrativeContextGraph,
  ContextNode,
  ContextConnection,
  ConnectionPattern,
  NarrativeContextGraph as NarrativeContextGraphType,
  createContextNode,
  createContextConnection,
  createEmptyContextGraph,
  addNode,
  addConnection,
  findNode,
  findNeighbors,
  findConnectionsFrom,
  findConnectionBetween,
  queryGraph,
  traverseGraph,
  analyzeGraph,
  detectConnectionPatterns,
  detectSubgraphClusters,
  pruneGraph,
  removeNode,
  getNarrativeRecommendations,
  formatContextGraphSummary,

  // NarrativeIntelligenceCoordinator types
  NarrativeIntelligenceState,
  NarrativeHealthScore,
  NarrativeIntelligenceCoordinator as NarrativeIntelligenceCoordinatorType,
  createNarrativeIntelligenceCoordinator,
  updateNarrativeState,
  addInsight,
  getNarrativeHealthScore,
  getActiveInsights,
  getSuggestions,
  getCriticalIssues,
  runCoordination,
  formatNarrativeIntelligenceSummary,

  // NarrativeInsightAggregator types
  AggregatedInsight,
  InsightAggregatorState,
  InsightSource,
  InsightEvidence,
  SubsystemType,
  InsightAnalysis,
  CorrelationAnalysis,
  PrioritizedRecommendation,
  IntegratedNarrativeState,
  AggregatorConfig,
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
  formatAggregatorSummary,
  DEFAULT_AGGREGATOR_CONFIG,

  // ReaderExperienceSimulator types
  EmotionalState,
  ReaderProfile,
  EngagementPrediction,
  PacingAnalysis,
  HookAnalysis,
  ReadingFatigueIndicator,
  EngagementDriver,
  createBaselineEmotionalState,
  simulateEmotionalResponse,
  analyzePacingFromSegments,
  detectReadingFatigue,
  predictEngagement,
  analyzeHook,
  calculateOverallEngagement,
  formatEngagementReport
} from './index.js'

export type {
  // Re-export all types for consumers
  StoryArchipelago,
  SubplotIsland,
  IslandConnection,
  AnchorType,
  BridgeType,
  SeepageEffect,
  ArchipelagoAnalysis,
  ArchipelagoMap,
  SeepageAnalysis,
  StoryComplexityMetrics,
  IslandRecommendation,

  PlotContinuityEngine,
  NarrativeThread,
  ThreadState,
  PlotHole,
  ContinuityReport,
  Foreshadow,
  TimelineEntry,
  TimelineConsistencyResult,
  ThreadResolution,
  PayoffValidation,

  NarrativeContextGraph,
  ContextNode,
  ContextConnection,
  ConnectionPattern,

  NarrativeIntelligenceState,
  NarrativeHealthScore,

  AggregatedInsight,
  InsightAggregatorState,
  InsightSource,
  InsightEvidence,
  SubsystemType,
  InsightAnalysis,
  CorrelationAnalysis,
  PrioritizedRecommendation,
  IntegratedNarrativeState,
  AggregatorConfig,

  EmotionalState,
  ReaderProfile,
  EngagementPrediction,
  PacingAnalysis,
  HookAnalysis,
  ReadingFatigueIndicator,
  EngagementDriver
}

// =============================================================================
// Convenience re-exports of key functions
// =============================================================================

export {
  createForeshadow,
  createPlotHole,
  createThreadState,
  createContextNode,
  createContextConnection,
  createEmptyContextGraph,
  createNarrativeIntelligenceCoordinator,
  createEmptyAggregatorState,
  createAggregatedInsight,
  createBaselineEmotionalState,
  formatContextGraphSummary,
  formatNarrativeIntelligenceSummary,
  formatInsightAnalysis,
  formatCorrelationAnalysis,
  formatPrioritizedRecommendations,
  formatAggregatorSummary,
  formatEngagementReport,
  DEFAULT_AGGREGATOR_CONFIG
} from './index.js'

export {
  trackPlotThread,
  recordPayoff,
  addForeshadow,
  payOffForeshadow,
  checkPlotHoles,
  checkTimelineConsistency,
  getContinuityReport,
  getUnresolvedPayoffs,
  getPendingForeshadowing,
  getSatisfiedThreads,
  getPlotHoleCount,
  isContinuityHealthy,
  getThreadResolutionRate,
  addNode,
  addConnection,
  findNode,
  findNeighbors,
  findConnectionsFrom,
  findConnectionBetween,
  queryGraph,
  traverseGraph,
  analyzeGraph,
  detectConnectionPatterns,
  detectSubgraphClusters,
  pruneGraph,
  removeNode,
  getNarrativeRecommendations,
  updateNarrativeState,
  addInsight,
  getNarrativeHealthScore,
  getActiveInsights,
  getSuggestions,
  getCriticalIssues,
  runCoordination,
  generateCrossSubsystemInsights,
  deduplicateInsights,
  resolveInsight,
  autoResolveStaleInsights,
  analyzeInsights,
  generateCorrelationAnalysis,
  generatePrioritizedRecommendations,
  runAggregation,
  simulateEmotionalResponse,
  analyzePacingFromSegments,
  detectReadingFatigue,
  predictEngagement,
  analyzeHook,
  calculateOverallEngagement
} from './index.js'