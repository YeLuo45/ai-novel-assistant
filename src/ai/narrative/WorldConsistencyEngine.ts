/**
 * V784 WorldConsistencyEngine — Direction C Iter 6/9 (Round 3)
 * World consistency engine: world coherence + cross-reference checking
 * Sources: ruflo consistency + nanobot world + thunderbolt
 */

export type ConsistencyCheck = 'geography' | 'timeline' | 'culture' | 'technology' | 'language' | 'magic_system';
export type ConsistencyStatus = 'consistent' | 'minor_issue' | 'major_issue' | 'broken' | 'unverified';
export type IssueSeverity = 'trivial' | 'minor' | 'moderate' | 'major' | 'critical';

export interface ConsistencyCheckRecord {
  checkId: string;
  type: ConsistencyCheck;
  status: ConsistencyStatus;
  description: string;
  chapter: number;
  severity: IssueSeverity;
  resolved: boolean;
}

export interface WorldReference {
  referenceId: string;
  type: ConsistencyCheck;
  fact: string;
  established: number;
  lastUsed: number;
  usages: number;
}

export interface WorldConsistencyEngineState {
  checks: Map<string, ConsistencyCheckRecord>;
  references: Map<string, WorldReference>;
  totalChecks: number;
  totalReferences: number;
  resolvedChecks: number;
  majorIssues: number;
  overallConsistency: number;
  referenceCoverage: number;
  dominantCheckType: ConsistencyCheck | null;
}

// Factory
export function createWorldConsistencyEngineState(): WorldConsistencyEngineState {
  return {
    checks: new Map(),
    references: new Map(),
    totalChecks: 0,
    totalReferences: 0,
    resolvedChecks: 0,
    majorIssues: 0,
    overallConsistency: 0.8,
    referenceCoverage: 0,
    dominantCheckType: null,
  };
}

// Add reference
export function addWorldReference(
  state: WorldConsistencyEngineState,
  referenceId: string,
  type: ConsistencyCheck,
  fact: string
): WorldConsistencyEngineState {
  const reference: WorldReference = { referenceId, type, fact, established: Date.now(), lastUsed: Date.now(), usages: 0 };
  const references = new Map(state.references).set(referenceId, reference);
  return recomputeConsistency({ ...state, references, totalReferences: references.size });
}

// Use reference
export function useWorldReference(state: WorldConsistencyEngineState, referenceId: string): WorldConsistencyEngineState {
  const reference = state.references.get(referenceId);
  if (!reference) return state;

  const updated: WorldReference = { ...reference, lastUsed: Date.now(), usages: reference.usages + 1 };
  const references = new Map(state.references).set(referenceId, updated);
  return recomputeConsistency({ ...state, references });
}

// Record check
export function recordConsistencyCheck(
  state: WorldConsistencyEngineState,
  checkId: string,
  type: ConsistencyCheck,
  status: ConsistencyStatus,
  description: string,
  chapter: number,
  severity: IssueSeverity = 'minor'
): WorldConsistencyEngineState {
  const check: ConsistencyCheckRecord = { checkId, type, status, description, chapter, severity, resolved: false };
  const checks = new Map(state.checks).set(checkId, check);
  const majorIssues = (severity === 'major' || severity === 'critical') ? state.majorIssues + 1 : state.majorIssues;
  return recomputeConsistency({ ...state, checks, totalChecks: checks.size, majorIssues });
}

// Resolve check
export function resolveConsistencyCheck(state: WorldConsistencyEngineState, checkId: string): WorldConsistencyEngineState {
  const check = state.checks.get(checkId);
  if (!check) return state;

  const updated: ConsistencyCheckRecord = { ...check, resolved: true, status: 'consistent' };
  const checks = new Map(state.checks).set(checkId, updated);
  return recomputeConsistency({ ...state, checks, resolvedChecks: state.resolvedChecks + 1 });
}

// Get checks by type
export function getChecksByType(state: WorldConsistencyEngineState, type: ConsistencyCheck): ConsistencyCheckRecord[] {
  return Array.from(state.checks.values()).filter(c => c.type === type);
}

// Get references by type
export function getReferencesByType(state: WorldConsistencyEngineState, type: ConsistencyCheck): WorldReference[] {
  return Array.from(state.references.values()).filter(r => r.type === type);
}

// Get consistency report
export function getWorldConsistencyReport(state: WorldConsistencyEngineState): {
  totalChecks: number;
  totalReferences: number;
  resolvedChecks: number;
  majorIssues: number;
  overallConsistency: number;
  referenceCoverage: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalChecks === 0) recommendations.push('No checks — perform consistency checks');
  if (state.majorIssues > 0) recommendations.push(`${state.majorIssues} major issues — fix immediately`);
  if (state.referenceCoverage < 0.3) recommendations.push('Low reference coverage — add world references');

  return {
    totalChecks: state.totalChecks,
    totalReferences: state.totalReferences,
    resolvedChecks: state.resolvedChecks,
    majorIssues: state.majorIssues,
    overallConsistency: Math.round(state.overallConsistency * 100) / 100,
    referenceCoverage: Math.round(state.referenceCoverage * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeConsistency(state: WorldConsistencyEngineState): WorldConsistencyEngineState {
  const checks = Array.from(state.checks.values());
  const consistentCount = checks.filter(c => c.status === 'consistent').length;
  const overallConsistency = state.totalChecks === 0 ? 0.8 : consistentCount / state.totalChecks;

  const typeSet = new Set(state.references.values ? Array.from(state.references.values()).map(r => r.type) : []);
  const referenceCoverage = Math.min(1, typeSet.size / 5);

  let dominantCheckType: ConsistencyCheck | null = null;
  let maxCount = -1;
  const typeCounts = new Map<ConsistencyCheck, number>();
  checks.forEach(c => typeCounts.set(c.type, (typeCounts.get(c.type) || 0) + 1));
  typeCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantCheckType = t; } });

  return { ...state, overallConsistency, referenceCoverage, dominantCheckType };
}

// Reset consistency state
export function resetWorldConsistencyEngineState(): WorldConsistencyEngineState {
  return createWorldConsistencyEngineState();
}