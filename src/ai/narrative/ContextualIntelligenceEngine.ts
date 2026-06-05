/**
 * V740 ContextualIntelligenceEngine — Direction A Iter 2/9 (Round 3)
 * Contextual intelligence engine: context-aware decision making
 * Sources: chatdev context + nanobot awareness + thunderbolt
 */

export type ContextLevel = 'immediate' | 'short_term' | 'long_term' | 'global';
export type ContextDimension = 'time' | 'space' | 'social' | 'emotional' | 'cultural' | 'linguistic';
export type IntelligenceDecision = 'action' | 'no_action' | 'gather_more' | 'defer' | 'escalate';

export interface ContextSnapshot {
  snapshotId: string;
  level: ContextLevel;
  dimensions: Map<ContextDimension, number>;
  timestamp: number;
  relevance: number;
  description: string;
}

export interface IntelligenceDecisionRecord {
  decisionId: string;
  contextId: string;
  decision: IntelligenceDecision;
  reasoning: string;
  confidence: number;
  outcome: string;
  timestamp: number;
}

export interface ContextualIntelligenceEngineState {
  snapshots: Map<string, ContextSnapshot>;
  decisions: Map<string, IntelligenceDecisionRecord>;
  totalSnapshots: number;
  totalDecisions: number;
  averageConfidence: number;
  contextCoverage: number;
  decisionAccuracy: number;
  dominantLevel: ContextLevel | null;
}

// Factory
export function createContextualIntelligenceEngineState(): ContextualIntelligenceEngineState {
  return {
    snapshots: new Map(),
    decisions: new Map(),
    totalSnapshots: 0,
    totalDecisions: 0,
    averageConfidence: 0.5,
    contextCoverage: 0,
    decisionAccuracy: 0.5,
    dominantLevel: null,
  };
}

// Capture context
export function captureContext(
  state: ContextualIntelligenceEngineState,
  snapshotId: string,
  level: ContextLevel,
  dimensions: Partial<Record<ContextDimension, number>>,
  description: string = ''
): ContextualIntelligenceEngineState {
  const fullDimensions = new Map<ContextDimension, number>();
  const allDimensions: ContextDimension[] = ['time', 'space', 'social', 'emotional', 'cultural', 'linguistic'];
  allDimensions.forEach(d => fullDimensions.set(d, dimensions[d] ?? 0.5));

  const totalWeight = Array.from(fullDimensions.values()).reduce((s, v) => s + v, 0);
  const relevance = Math.min(1, totalWeight / (allDimensions.length * 1.5));

  const snapshot: ContextSnapshot = { snapshotId, level, dimensions: fullDimensions, timestamp: Date.now(), relevance, description };
  const snapshots = new Map(state.snapshots).set(snapshotId, snapshot);
  return recomputeContextual({ ...state, snapshots, totalSnapshots: snapshots.size });
}

// Make decision
export function makeContextualDecision(
  state: ContextualIntelligenceEngineState,
  decisionId: string,
  contextId: string,
  decision: IntelligenceDecision,
  reasoning: string,
  confidence: number = 0.5,
  outcome: string = ''
): ContextualIntelligenceEngineState {
  const record: IntelligenceDecisionRecord = { decisionId, contextId, decision, reasoning, confidence, outcome, timestamp: Date.now() };
  const decisions = new Map(state.decisions).set(decisionId, record);
  return recomputeContextual({ ...state, decisions, totalDecisions: decisions.size });
}

// Get snapshots by level
export function getSnapshotsByLevel(state: ContextualIntelligenceEngineState, level: ContextLevel): ContextSnapshot[] {
  return Array.from(state.snapshots.values()).filter(s => s.level === level);
}

// Get decisions by type
export function getDecisionsByType(state: ContextualIntelligenceEngineState, decision: IntelligenceDecision): IntelligenceDecisionRecord[] {
  return Array.from(state.decisions.values()).filter(d => d.decision === decision);
}

// Get contextual report
export function getContextualIntelligenceReport(state: ContextualIntelligenceEngineState): {
  totalSnapshots: number;
  totalDecisions: number;
  averageConfidence: number;
  contextCoverage: number;
  decisionAccuracy: number;
  dominantLevel: ContextLevel | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSnapshots === 0) recommendations.push('No contexts — capture context');
  if (state.averageConfidence < 0.5) recommendations.push('Low confidence — improve context understanding');
  if (state.contextCoverage < 0.3) recommendations.push('Low context coverage — capture more');

  return {
    totalSnapshots: state.totalSnapshots,
    totalDecisions: state.totalDecisions,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    contextCoverage: Math.round(state.contextCoverage * 100) / 100,
    decisionAccuracy: Math.round(state.decisionAccuracy * 100) / 100,
    dominantLevel: state.dominantLevel,
    recommendations,
  };
}

// Recompute metrics
function recomputeContextual(state: ContextualIntelligenceEngineState): ContextualIntelligenceEngineState {
  const snapshots = Array.from(state.snapshots.values());
  const decisions = Array.from(state.decisions.values());

  const averageConfidence = decisions.length > 0
    ? decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length
    : 0.5;

  const contextCoverage = state.totalSnapshots === 0 ? 0 : Math.min(1, state.totalSnapshots / 10);

  const highConfidenceDecisions = decisions.filter(d => d.confidence > 0.7).length;
  const decisionAccuracy = decisions.length === 0 ? 0.5 : highConfidenceDecisions / decisions.length;

  let dominantLevel: ContextLevel | null = null;
  let maxCount = -1;
  const levelCounts = new Map<ContextLevel, number>();
  snapshots.forEach(s => levelCounts.set(s.level, (levelCounts.get(s.level) || 0) + 1));
  levelCounts.forEach((count, level) => {
    if (count > maxCount) {
      maxCount = count;
      dominantLevel = level;
    }
  });

  return { ...state, averageConfidence, contextCoverage, decisionAccuracy, dominantLevel };
}

// Reset contextual state
export function resetContextualIntelligenceEngineState(): ContextualIntelligenceEngineState {
  return createContextualIntelligenceEngineState();
}