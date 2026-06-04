/**
 * V702 NarrativeIterationEngine — Direction D Iter 1/9 (Round 2)
 * Narrative iteration engine: iterative improvement + version control
 * Sources: thunderbolt feedback + generic-agent iterative + ruflo
 */

export type IterationPhase = 'draft' | 'review' | 'revise' | 'polish' | 'final';
export type IterationStatus = 'in_progress' | 'completed' | 'rejected' | 'needs_revision';
export type ChangeType = 'addition' | 'deletion' | 'modification' | 'reorder' | 'restructure';

export interface IterationChange {
  changeId: string;
  type: ChangeType;
  description: string;
  position: number;
  impact: number;
  reason: string;
}

export interface IterationRecord {
  iterationId: string;
  version: number;
  phase: IterationPhase;
  status: IterationStatus;
  content: string;
  changes: IterationChange[];
  qualityScore: number;
  timestamp: number;
  feedback: string;
}

export interface NarrativeIterationState {
  iterations: Map<string, IterationRecord>;
  currentVersion: number;
  totalIterations: number;
  completedIterations: number;
  totalChanges: number;
  averageQuality: number;
  improvementRate: number;
  bestVersion: number;
}

// Factory
export function createNarrativeIterationState(): NarrativeIterationState {
  return {
    iterations: new Map(),
    currentVersion: 0,
    totalIterations: 0,
    completedIterations: 0,
    totalChanges: 0,
    averageQuality: 0,
    improvementRate: 0,
    bestVersion: 0,
  };
}

// Create iteration
export function createIteration(
  state: NarrativeIterationState,
  iterationId: string,
  content: string,
  phase: IterationPhase = 'draft'
): NarrativeIterationState {
  const version = state.currentVersion + 1;
  const iteration: IterationRecord = {
    iterationId,
    version,
    phase,
    status: 'in_progress',
    content,
    changes: [],
    qualityScore: 0.5,
    timestamp: Date.now(),
    feedback: '',
  };
  const iterations = new Map(state.iterations).set(iterationId, iteration);
  return recomputeIteration({
    ...state,
    iterations,
    currentVersion: version,
    totalIterations: iterations.size,
  });
}

// Add change
export function addChange(
  state: NarrativeIterationState,
  iterationId: string,
  changeId: string,
  type: ChangeType,
  description: string,
  position: number,
  impact: number,
  reason: string
): NarrativeIterationState {
  const iteration = state.iterations.get(iterationId);
  if (!iteration) return state;

  const change: IterationChange = { changeId, type, description, position, impact, reason };
  const updated: IterationRecord = { ...iteration, changes: [...iteration.changes, change] };
  const iterations = new Map(state.iterations).set(iterationId, updated);
  return recomputeIteration({ ...state, iterations, totalChanges: state.totalChanges + 1 });
}

// Update iteration status
export function updateIterationStatus(
  state: NarrativeIterationState,
  iterationId: string,
  status: IterationStatus,
  qualityScore: number = 0.5,
  feedback: string = ''
): NarrativeIterationState {
  const iteration = state.iterations.get(iterationId);
  if (!iteration) return state;

  const updated: IterationRecord = {
    ...iteration,
    status,
    qualityScore: Math.min(1, Math.max(0, qualityScore)),
    feedback,
  };
  const iterations = new Map(state.iterations).set(iterationId, updated);

  const newCompleted = status === 'completed' ? state.completedIterations + 1 : state.completedIterations;
  return recomputeIteration({ ...state, iterations, completedIterations: newCompleted });
}

// Get iteration by version
export function getIterationByVersion(state: NarrativeIterationState, version: number): IterationRecord | null {
  return Array.from(state.iterations.values()).find(i => i.version === version) || null;
}

// Get latest iteration
export function getLatestIteration(state: NarrativeIterationState): IterationRecord | null {
  if (state.iterations.size === 0) return null;
  return Array.from(state.iterations.values()).reduce((latest, current) =>
    current.version > latest.version ? current : latest
  );
}

// Get iterations by status
export function getIterationsByStatus(state: NarrativeIterationState, status: IterationStatus): IterationRecord[] {
  return Array.from(state.iterations.values()).filter(i => i.status === status);
}

// Get iteration history
export function getIterationHistory(state: NarrativeIterationState): IterationRecord[] {
  return Array.from(state.iterations.values()).sort((a, b) => a.version - b.version);
}

// Get iteration report
export function getIterationReport(state: NarrativeIterationState): {
  totalIterations: number;
  completedIterations: number;
  currentVersion: number;
  totalChanges: number;
  averageQuality: number;
  improvementRate: number;
  bestVersion: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIterations === 0) recommendations.push('No iterations — start drafting');
  if (state.improvementRate < 0.05 && state.totalIterations > 3) recommendations.push('Low improvement — review approach');
  if (state.averageQuality < 0.6) recommendations.push('Quality below threshold — revise');

  return {
    totalIterations: state.totalIterations,
    completedIterations: state.completedIterations,
    currentVersion: state.currentVersion,
    totalChanges: state.totalChanges,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    improvementRate: Math.round(state.improvementRate * 100) / 100,
    bestVersion: state.bestVersion,
    recommendations,
  };
}

// Recompute metrics
function recomputeIteration(state: NarrativeIterationState): NarrativeIterationState {
  const iterations = Array.from(state.iterations.values());
  if (iterations.length === 0) return state;

  const completed = iterations.filter(i => i.status === 'completed');
  const averageQuality = completed.length > 0
    ? completed.reduce((s, i) => s + i.qualityScore, 0) / completed.length
    : 0;

  const best = iterations.reduce((best, current) =>
    current.qualityScore > best.qualityScore ? current : best
  );

  let improvementRate = 0;
  if (iterations.length > 1) {
    const sorted = iterations.sort((a, b) => a.version - b.version);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first && last && first.qualityScore > 0) {
      improvementRate = (last.qualityScore - first.qualityScore) / first.qualityScore;
    }
  }

  return { ...state, averageQuality, bestVersion: best?.version ?? 0, improvementRate };
}

// Reset iteration state
export function resetNarrativeIterationState(): NarrativeIterationState {
  return createNarrativeIterationState();
}