/**
 * V1102 NarrativeRecoveryEngine — Direction D Iter 19/20 (Round 6)
 * Narrative recovery engine: recovery from narrative disruption
 * Sources: generic-agent recovery + thunderbolt + nanobot
 */

export type RecoveryType = 'plot' | 'character' | 'theme' | 'voice' | 'pacing' | 'momentum';
export type RecoverySpeed = 'slow' | 'gradual' | 'normal' | 'rapid' | 'instant';
export type RecoveryCompleteness = 'incomplete' | 'partial' | 'mostly' | 'fully' | 'enhanced';

export interface Recovery {
  recoveryId: string;
  type: RecoveryType;
  speed: RecoverySpeed;
  completeness: RecoveryCompleteness;
  description: string;
  before: number;
  after: number;
  improvement: number;
}

export interface RecoveryArc {
  arcId: string,
  recoveryIds: string[],
  cumulativeImprovement: number,
  resilience: number,
}

export interface NarrativeRecoveryEngineState {
  recoveries: Map<string, Recovery>;
  arcs: Map<string, RecoveryArc>;
  totalRecoveries: number;
  totalArcs: number;
  averageImprovement: number;
  averageCompleteness: number;
  arcResilience: number;
  recoveryMastery: number;
}

// Factory
export function createNarrativeRecoveryEngineState(): NarrativeRecoveryEngineState {
  return {
    recoveries: new Map(),
    arcs: new Map(),
    totalRecoveries: 0,
    totalArcs: 0,
    averageImprovement: 0.5,
    averageCompleteness: 0.5,
    arcResilience: 0.5,
    recoveryMastery: 0.5,
  };
}

// Add recovery
export function addRecovery(
  state: NarrativeRecoveryEngineState,
  recoveryId: string,
  type: RecoveryType,
  speed: RecoverySpeed,
  completeness: RecoveryCompleteness,
  description: string,
  before: number,
  after: number
): NarrativeRecoveryEngineState {
  const improvement = Math.max(0, after - before);
  const recovery: Recovery = { recoveryId, type, speed, completeness, description, before, after, improvement };
  const recoveries = new Map(state.recoveries).set(recoveryId, recovery);
  return recomputeRecovery({ ...state, recoveries, totalRecoveries: recoveries.size });
}

// Add arc
export function addRecoveryArc(
  state: NarrativeRecoveryEngineState,
  arcId: string,
  recoveryIds: string[]
): NarrativeRecoveryEngineState {
  const recoveries = recoveryIds.map(id => state.recoveries.get(id)).filter((r): r is Recovery => r !== undefined);
  const cumulativeImprovement = recoveries.length === 0 ? 0
    : recoveries.reduce((s, r) => s + r.improvement, 0) / recoveries.length;
  const typeSet = new Set(recoveries.map(r => r.type));
  const resilience = Math.min(1, typeSet.size / 6);
  const arc: RecoveryArc = { arcId, recoveryIds, cumulativeImprovement, resilience };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeRecovery({ ...state, arcs, totalArcs: arcs.size });
}

// Get recoveries by type
export function getRecoveriesByType(state: NarrativeRecoveryEngineState, type: RecoveryType): Recovery[] {
  return Array.from(state.recoveries.values()).filter(r => r.type === type);
}

// Get recovery report
export function getRecoveryReport(state: NarrativeRecoveryEngineState): {
  totalRecoveries: number;
  totalArcs: number;
  averageImprovement: number;
  averageCompleteness: number;
  recoveryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRecoveries === 0) recommendations.push('No recoveries — add recoveries');
  if (state.averageImprovement < 0.2) recommendations.push('Low improvement — strengthen');
  if (state.recoveryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRecoveries: state.totalRecoveries,
    totalArcs: state.totalArcs,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    averageCompleteness: Math.round(state.averageCompleteness * 100) / 100,
    recoveryMastery: Math.round(state.recoveryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRecovery(state: NarrativeRecoveryEngineState): NarrativeRecoveryEngineState {
  const recoveries = Array.from(state.recoveries.values());
  const averageImprovement = recoveries.length === 0 ? 0.5
    : recoveries.reduce((s, r) => s + r.improvement, 0) / recoveries.length;
  const averageCompleteness = recoveries.length === 0 ? 0.5
    : recoveries.reduce((s, r) => s + (r.completeness === 'enhanced' ? 1 : r.completeness === 'fully' ? 0.85 : r.completeness === 'mostly' ? 0.7 : r.completeness === 'partial' ? 0.5 : 0.3), 0) / recoveries.length;

  const arcs = Array.from(state.arcs.values());
  const arcResilience = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.resilience, 0) / arcs.length;

  const recoveryMastery = (averageImprovement * 0.4 + averageCompleteness * 0.3 + arcResilience * 0.3);

  return { ...state, averageImprovement, averageCompleteness, arcResilience, recoveryMastery };
}

// Reset
export function resetNarrativeRecoveryEngineState(): NarrativeRecoveryEngineState {
  return createNarrativeRecoveryEngineState();
}