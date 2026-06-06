/**
 * V926 AdaptiveRevisionEngine — Direction D Iter 11/15 (Round 4)
 * Adaptive revision engine: revision that adapts
 * Sources: thunderbolt revision + nanobot + generic-agent
 */

export type RevisionDepth = 'surface' | 'moderate' | 'deep' | 'structural' | 'visionary';
export type RevisionFocus = 'prose' | 'plot' | 'character' | 'theme' | 'pacing' | 'world' | 'dialogue';
export type RevisionOutcome = 'minor_change' | 'major_change' | 'transformation' | 'rejection' | 'integration';

export interface Revision {
  revisionId: string;
  depth: RevisionDepth;
  focus: RevisionFocus;
  description: string;
  outcome: RevisionOutcome;
  improvement: number;
  chapter: number;
}

export interface RevisionStrategy {
  strategyId: string;
  name: string;
  revisionIds: string[];
  successRate: number;
  averageImprovement: number;
  usage: number;
}

export interface AdaptiveRevisionEngineState {
  revisions: Map<string, Revision>;
  strategies: Map<string, RevisionStrategy>;
  totalRevisions: number;
  totalStrategies: number;
  totalImprovement: number;
  averageImprovement: number;
  revisionSuccess: number;
  adaptiveMastery: number;
}

// Factory
export function createAdaptiveRevisionEngineState(): AdaptiveRevisionEngineState {
  return {
    revisions: new Map(),
    strategies: new Map(),
    totalRevisions: 0,
    totalStrategies: 0,
    totalImprovement: 0,
    averageImprovement: 0,
    revisionSuccess: 0.5,
    adaptiveMastery: 0.5,
  };
}

// Add revision
export function addRevision(
  state: AdaptiveRevisionEngineState,
  revisionId: string,
  depth: RevisionDepth,
  focus: RevisionFocus,
  description: string,
  outcome: RevisionOutcome,
  improvement: number,
  chapter: number
): AdaptiveRevisionEngineState {
  const revision: Revision = { revisionId, depth, focus, description, outcome, improvement, chapter };
  const revisions = new Map(state.revisions).set(revisionId, revision);
  const totalImprovement = state.totalImprovement + improvement;
  return recomputeAdaptRev({ ...state, revisions, totalImprovement, totalRevisions: revisions.size });
}

// Add strategy
export function addRevisionStrategy(
  state: AdaptiveRevisionEngineState,
  strategyId: string,
  name: string,
  revisionIds: string[]
): AdaptiveRevisionEngineState {
  const revisions = revisionIds.map(id => state.revisions.get(id)).filter((r): r is Revision => r !== undefined);
  const successful = revisions.filter(r => r.outcome !== 'rejection').length;
  const successRate = revisions.length === 0 ? 0.5 : successful / revisions.length;
  const averageImprovement = revisions.length === 0 ? 0
    : revisions.reduce((s, r) => s + r.improvement, 0) / revisions.length;
  const strategy: RevisionStrategy = { strategyId, name, revisionIds, successRate, averageImprovement, usage: 0 };
  const strategies = new Map(state.strategies).set(strategyId, strategy);
  return recomputeAdaptRev({ ...state, strategies, totalStrategies: strategies.size });
}

// Use strategy
export function useRevisionStrategy(state: AdaptiveRevisionEngineState, strategyId: string): AdaptiveRevisionEngineState {
  const strategy = state.strategies.get(strategyId);
  if (!strategy) return state;

  const updated: RevisionStrategy = { ...strategy, usage: strategy.usage + 1 };
  const strategies = new Map(state.strategies).set(strategyId, updated);
  return recomputeAdaptRev({ ...state, strategies });
}

// Get revisions by focus
export function getRevisionsByFocus(state: AdaptiveRevisionEngineState, focus: RevisionFocus): Revision[] {
  return Array.from(state.revisions.values()).filter(r => r.focus === focus);
}

// Get revision report
export function getRevisionReport(state: AdaptiveRevisionEngineState): {
  totalRevisions: number;
  totalStrategies: number;
  totalImprovement: number;
  averageImprovement: number;
  revisionSuccess: number;
  adaptiveMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRevisions === 0) recommendations.push('No revisions — add revisions');
  if (state.averageImprovement < 0.1) recommendations.push('Low improvement — improve');
  if (state.revisionSuccess < 0.5) recommendations.push('Low success — improve');

  return {
    totalRevisions: state.totalRevisions,
    totalStrategies: state.totalStrategies,
    totalImprovement: Math.round(state.totalImprovement * 100) / 100,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    revisionSuccess: Math.round(state.revisionSuccess * 100) / 100,
    adaptiveMastery: Math.round(state.adaptiveMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptRev(state: AdaptiveRevisionEngineState): AdaptiveRevisionEngineState {
  const revisions = Array.from(state.revisions.values());
  const averageImprovement = revisions.length === 0 ? 0
    : revisions.reduce((s, r) => s + r.improvement, 0) / revisions.length;

  const successCount = revisions.filter(r => r.outcome !== 'rejection').length;
  const revisionSuccess = revisions.length === 0 ? 0.5 : successCount / revisions.length;

  const strategies = Array.from(state.strategies.values());
  const avgStrategySuccess = strategies.length === 0 ? 0.5
    : strategies.reduce((s, st) => s + st.successRate, 0) / strategies.length;

  const adaptiveMastery = (averageImprovement * 0.4 + revisionSuccess * 0.3 + avgStrategySuccess * 0.3);

  return { ...state, averageImprovement, revisionSuccess, adaptiveMastery };
}

// Reset revision state
export function resetAdaptiveRevisionEngineState(): AdaptiveRevisionEngineState {
  return createAdaptiveRevisionEngineState();
}