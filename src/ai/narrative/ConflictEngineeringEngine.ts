/**
 * V870 ConflictEngineeringEngine — Direction B Iter 13/15 (Round 4)
 * Conflict engineering engine: conflict design + escalation
 * Sources: thunderbolt conflict + chatdev + nanobot
 */

export type ConflictType = 'internal' | 'interpersonal' | 'societal' | 'physical' | 'moral' | 'cosmic';
export type ConflictIntensity = 'subtle' | 'moderate' | 'intense' | 'extreme' | 'climactic';
export type ConflictStatus = 'building' | 'active' | 'climactic' | 'resolving' | 'resolved' | 'lingering';

export interface Conflict {
  conflictId: string;
  type: ConflictType;
  intensity: ConflictIntensity;
  status: ConflictStatus;
  parties: string[];
  stakes: string;
  description: string;
  escalation: number;
  chapter: number;
}

export interface ConflictEscalation {
  escalationId: string;
  conflictId: string;
  level: number;
  trigger: string;
  consequence: string;
  chapter: number;
}

export interface ConflictResolution {
  resolutionId: string;
  conflictId: string;
  type: 'victory' | 'defeat' | 'compromise' | 'transformation' | 'sacrifice';
  description: string;
  satisfactory: number;
  consequences: string[];
  chapter: number;
}

export interface ConflictEngineeringEngineState {
  conflicts: Map<string, Conflict>;
  escalations: Map<string, ConflictEscalation>;
  resolutions: Map<string, ConflictResolution>;
  totalConflicts: number;
  totalEscalations: number;
  totalResolutions: number;
  averageEscalation: number;
  conflictComplexity: number;
  averageSatisfaction: number;
  engineeringQuality: number;
}

// Factory
export function createConflictEngineeringEngineState(): ConflictEngineeringEngineState {
  return {
    conflicts: new Map(),
    escalations: new Map(),
    resolutions: new Map(),
    totalConflicts: 0,
    totalEscalations: 0,
    totalResolutions: 0,
    averageEscalation: 0.5,
    conflictComplexity: 0.5,
    averageSatisfaction: 0.5,
    engineeringQuality: 0.5,
  };
}

// Add conflict
export function addConflict(
  state: ConflictEngineeringEngineState,
  conflictId: string,
  type: ConflictType,
  parties: string[],
  stakes: string,
  description: string,
  chapter: number,
  intensity: ConflictIntensity = 'moderate'
): ConflictEngineeringEngineState {
  const conflict: Conflict = { conflictId, type, intensity, status: 'building', parties, stakes, description, escalation: 0.3, chapter };
  const conflicts = new Map(state.conflicts).set(conflictId, conflict);
  return recomputeConflictEng({ ...state, conflicts, totalConflicts: conflicts.size });
}

// Escalate conflict
export function escalateConflict(
  state: ConflictEngineeringEngineState,
  escalationId: string,
  conflictId: string,
  level: number,
  trigger: string,
  consequence: string,
  chapter: number
): ConflictEngineeringEngineState {
  const escalation: ConflictEscalation = { escalationId, conflictId, level, trigger, consequence, chapter };
  const escalations = new Map(state.escalations).set(escalationId, escalation);

  // Update conflict
  const conflict = state.conflicts.get(conflictId);
  let conflicts = state.conflicts;
  if (conflict) {
    const newEscalation = Math.min(1, conflict.escalation + 0.2);
    const status: ConflictStatus = newEscalation > 0.9 ? 'climactic' : newEscalation > 0.5 ? 'active' : 'building';
    const updated: Conflict = { ...conflict, escalation: newEscalation, status };
    conflicts = new Map(state.conflicts).set(conflictId, updated);
  }

  return recomputeConflictEng({ ...state, conflicts, escalations, totalEscalations: escalations.size });
}

// Resolve conflict
export function resolveConflict(
  state: ConflictEngineeringEngineState,
  resolutionId: string,
  conflictId: string,
  type: ConflictResolution['type'],
  description: string,
  satisfactory: number,
  consequences: string[],
  chapter: number
): ConflictEngineeringEngineState {
  const resolution: ConflictResolution = { resolutionId, conflictId, type, description, satisfactory, consequences, chapter };
  const resolutions = new Map(state.resolutions).set(resolutionId, resolution);

  // Update conflict
  const conflict = state.conflicts.get(conflictId);
  let conflicts = state.conflicts;
  if (conflict) {
    const updated: Conflict = { ...conflict, status: 'resolved' };
    conflicts = new Map(state.conflicts).set(conflictId, updated);
  }

  return recomputeConflictEng({ ...state, conflicts, resolutions, totalResolutions: resolutions.size });
}

// Get conflicts by type
export function getConflictsByType(state: ConflictEngineeringEngineState, type: ConflictType): Conflict[] {
  return Array.from(state.conflicts.values()).filter(c => c.type === type);
}

// Get conflict engineering report
export function getConflictEngineeringReport(state: ConflictEngineeringEngineState): {
  totalConflicts: number;
  totalEscalations: number;
  totalResolutions: number;
  averageEscalation: number;
  conflictComplexity: number;
  engineeringQuality: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalConflicts === 0) recommendations.push('No conflicts — add conflicts');
  if (state.averageEscalation < 0.4) recommendations.push('Low escalation — escalate');
  if (state.engineeringQuality < 0.5) recommendations.push('Low quality — refine');

  return {
    totalConflicts: state.totalConflicts,
    totalEscalations: state.totalEscalations,
    totalResolutions: state.totalResolutions,
    averageEscalation: Math.round(state.averageEscalation * 100) / 100,
    conflictComplexity: Math.round(state.conflictComplexity * 100) / 100,
    engineeringQuality: Math.round(state.engineeringQuality * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeConflictEng(state: ConflictEngineeringEngineState): ConflictEngineeringEngineState {
  const conflicts = Array.from(state.conflicts.values());
  const averageEscalation = conflicts.length === 0 ? 0.5
    : conflicts.reduce((s, c) => s + c.escalation, 0) / conflicts.length;

  const typeSet = new Set(conflicts.map(c => c.type));
  const conflictComplexity = Math.min(1, typeSet.size / 5);

  const resolutions = Array.from(state.resolutions.values());
  const averageSatisfaction = resolutions.length === 0 ? 0.5
    : resolutions.reduce((s, r) => s + r.satisfactory, 0) / resolutions.length;

  const engineeringQuality = (averageEscalation * 0.4 + conflictComplexity * 0.3 + averageSatisfaction * 0.3);

  return { ...state, averageEscalation, conflictComplexity, averageSatisfaction, engineeringQuality };
}

// Reset conflict engineering state
export function resetConflictEngineeringEngineState(): ConflictEngineeringEngineState {
  return createConflictEngineeringEngineState();
}