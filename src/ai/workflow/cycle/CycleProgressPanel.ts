/**
 * V2110 Direction A Iteration 25/30 Round 6: CycleProgressPanel
 *
 * Real-time progress panel data for a running cycle. Aggregates iteration
 * counts, ETA, quality trajectory, and recent activity into a snapshot
 * suitable for a UI render.
 *
 * Inspired by:
 * - thunderbolt-design: progress panel
 * - claude-code-design: status panel
 */

export interface ProgressEntry {
  iteration: number;
  timestamp: number;
  quality: number;
  durationMs: number;
}

export interface CycleProgressPanel {
  cycleId: string;
  currentIteration: number;
  maxIterations: number;
  currentQuality: number;
  averageQuality: number;
  qualityTrajectory: number[];
  etaMs: number;
  status: 'idle' | 'running' | 'converged' | 'stalled' | 'failed';
  recentActivity: ProgressEntry[];
}

export function buildPanel(input: {
  cycleId: string;
  maxIterations: number;
  entries: ProgressEntry[];
  status: CycleProgressPanel['status'];
  now?: () => number;
}): CycleProgressPanel {
  const entries = input.entries;
  const last = entries[entries.length - 1];
  const currentIteration = last ? last.iteration : 0;
  const currentQuality = last ? last.quality : 0;
  const sum = entries.reduce((acc, e) => acc + e.quality, 0);
  const averageQuality = entries.length === 0 ? 0 : sum / entries.length;
  const qualityTrajectory = entries.map((e) => e.quality);
  const now = input.now ?? (() => Date.now());
  const totalElapsed = entries.reduce((acc, e) => acc + e.durationMs, 0);
  const avgDuration = entries.length === 0 ? 0 : totalElapsed / entries.length;
  const remainingIterations = Math.max(0, input.maxIterations - currentIteration);
  const etaMs = remainingIterations * avgDuration;
  const recent = entries.slice(-5);
  return {
    cycleId: input.cycleId,
    currentIteration,
    maxIterations: input.maxIterations,
    currentQuality,
    averageQuality,
    qualityTrajectory,
    etaMs,
    status: input.status,
    recentActivity: recent,
  };
}

export function renderProgressBar(panel: CycleProgressPanel, width: number = 20): string {
  const ratio =
    panel.maxIterations === 0 ? 1 : panel.currentIteration / panel.maxIterations;
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${panel.currentIteration}/${panel.maxIterations}`;
}

export function summarizeActivity(panel: CycleProgressPanel): string {
  return `cycle=${panel.cycleId} iter=${panel.currentIteration}/${panel.maxIterations} q=${panel.currentQuality.toFixed(2)} avg=${panel.averageQuality.toFixed(2)} status=${panel.status}`;
}
