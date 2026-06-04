/**
 * V676 ConflictResolutionEngine — Direction C Iter 6/9 (Round 2)
 * Conflict resolution engine: internal/external conflicts + resolution paths
 * Sources: thunderbolt resolution + chatdev + nanobot
 */

export type ConflictType = 'internal' | 'interpersonal' | 'societal' | 'cosmic' | 'environmental';
export type ConflictStage = 'setup' | 'escalation' | 'climax' | 'falling_action' | 'resolution';
export type ResolutionType = 'compromise' | 'transformation' | 'sacrifice' | 'discovery' | 'evasion';

export interface Conflict {
  conflictId: string;
  type: ConflictType;
  description: string;
  stage: ConflictStage;
  parties: string[];
  intensity: number;
  resolutionType: ResolutionType | null;
  resolutionOutcome: string;
}

export interface ConflictResolutionState {
  conflicts: Map<string, Conflict>;
  activeConflicts: number;
  resolvedConflicts: number;
  averageIntensity: number;
  resolutionEffectiveness: number;
  totalConflicts: number;
}

// Factory
export function createConflictResolutionState(): ConflictResolutionState {
  return {
    conflicts: new Map(),
    activeConflicts: 0,
    resolvedConflicts: 0,
    averageIntensity: 0.5,
    resolutionEffectiveness: 0.7,
    totalConflicts: 0,
  };
}

// Add conflict
export function addConflict(
  state: ConflictResolutionState,
  conflictId: string,
  type: ConflictType,
  description: string,
  parties: string[],
  intensity: number = 0.5
): ConflictResolutionState {
  const conflict: Conflict = {
    conflictId,
    type,
    description,
    stage: 'setup',
    parties,
    intensity: Math.min(1, Math.max(0, intensity)),
    resolutionType: null,
    resolutionOutcome: '',
  };

  const conflicts = new Map(state.conflicts).set(conflictId, conflict);
  return recomputeConflictMetrics({ ...state, conflicts, totalConflicts: state.totalConflicts + 1 });
}

// Escalate conflict
export function escalateConflict(state: ConflictResolutionState, conflictId: string, newIntensity: number): ConflictResolutionState {
  const conflict = state.conflicts.get(conflictId);
  if (!conflict) return state;

  const stages: ConflictStage[] = ['setup', 'escalation', 'climax', 'falling_action', 'resolution'];
  const currentIdx = stages.indexOf(conflict.stage);
  const newStage = Math.min(stages.length - 1, currentIdx + 1) as number;
  const newStageValue = stages[newStage] as ConflictStage;

  const updated: Conflict = {
    ...conflict,
    intensity: Math.min(1, newIntensity),
    stage: newStageValue,
  };
  const conflicts = new Map(state.conflicts).set(conflictId, updated);
  return recomputeConflictMetrics({ ...state, conflicts });
}

// Resolve conflict
export function resolveConflict(
  state: ConflictResolutionState,
  conflictId: string,
  resolutionType: ResolutionType,
  outcome: string
): ConflictResolutionState {
  const conflict = state.conflicts.get(conflictId);
  if (!conflict) return state;

  const updated: Conflict = {
    ...conflict,
    stage: 'resolution',
    resolutionType,
    resolutionOutcome: outcome,
  };
  const conflicts = new Map(state.conflicts).set(conflictId, updated);
  return recomputeConflictMetrics({ ...state, conflicts });
}

// Get conflicts by type
export function getConflictsByType(state: ConflictResolutionState, type: ConflictType): Conflict[] {
  return Array.from(state.conflicts.values()).filter(c => c.type === type);
}

// Get unresolved conflicts
export function getUnresolvedConflicts(state: ConflictResolutionState): Conflict[] {
  return Array.from(state.conflicts.values()).filter(c => c.stage !== 'resolution');
}

// Get resolution recommendations
export function getResolutionRecommendations(state: ConflictResolutionState): string[] {
  const recommendations: string[] = [];
  if (state.activeConflicts > 5) recommendations.push('Many active conflicts — consider resolving some');
  if (state.averageIntensity > 0.85) recommendations.push('Very high average intensity — reduce for balance');
  if (state.resolvedConflicts / Math.max(1, state.totalConflicts) < 0.3) {
    recommendations.push('Low resolution rate — work toward resolutions');
  }
  return recommendations;
}

// Get conflict report
export function getConflictReport(state: ConflictResolutionState): {
  totalConflicts: number;
  activeConflicts: number;
  resolvedConflicts: number;
  averageIntensity: number;
  resolutionEffectiveness: number;
  recommendations: string[];
} {
  return {
    totalConflicts: state.totalConflicts,
    activeConflicts: state.activeConflicts,
    resolvedConflicts: state.resolvedConflicts,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    resolutionEffectiveness: Math.round(state.resolutionEffectiveness * 100) / 100,
    recommendations: getResolutionRecommendations(state),
  };
}

// Recompute metrics
function recomputeConflictMetrics(state: ConflictResolutionState): ConflictResolutionState {
  const conflicts = Array.from(state.conflicts.values());
  const activeConflicts = conflicts.filter(c => c.stage !== 'resolution').length;
  const resolvedConflicts = conflicts.filter(c => c.stage === 'resolution').length;
  const averageIntensity = conflicts.length > 0
    ? conflicts.reduce((s, c) => s + c.intensity, 0) / conflicts.length
    : 0.5;
  const resolutionEffectiveness = conflicts.length === 0
    ? 0.7
    : Math.min(1, resolvedConflicts / conflicts.length + 0.4);

  return { ...state, activeConflicts, resolvedConflicts, averageIntensity, resolutionEffectiveness };
}

// Reset conflict state
export function resetConflictResolutionState(): ConflictResolutionState {
  return createConflictResolutionState();
}