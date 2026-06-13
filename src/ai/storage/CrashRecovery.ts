// V2135 CrashRecovery - Direction A Iter 20/30
// 崩溃恢复 - 自动回滚机制
// Source: ruflo (recovery / resilience)

export type RecoveryAction = 'rollback' | 'replay' | 'checkpoint' | 'noop';

export interface RecoveryCheckpoint {
  id: string;
  state: Record<string, unknown>;
  createdAt: number;
  label: string;
}

export interface CrashRecoveryState {
  checkpoints: RecoveryCheckpoint[];
  crashLog: { timestamp: number; reason: string }[];
  autoRollback: boolean;
}

export function createRecoveryState(): CrashRecoveryState {
  return { checkpoints: [], crashLog: [], autoRollback: true };
}

/** Create a checkpoint of current state */
export function createCheckpoint(
  state: CrashRecoveryState,
  stateSnapshot: Record<string, unknown>,
  label: string
): { state: CrashRecoveryState; checkpoint: RecoveryCheckpoint } {
  const cp: RecoveryCheckpoint = {
    id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    state: JSON.parse(JSON.stringify(stateSnapshot)),
    createdAt: Date.now(),
    label,
  };
  return { state: { ...state, checkpoints: [...state.checkpoints, cp] }, checkpoint: cp };
}

/** Determine recovery action based on crash reason */
export function decideRecovery(reason: string): RecoveryAction {
  if (reason.includes('corrupt')) return 'rollback';
  if (reason.includes('crash')) return 'replay';
  if (reason.includes('manual')) return 'checkpoint';
  return 'noop';
}

/** Get latest checkpoint */
export function latestCheckpoint(state: CrashRecoveryState): RecoveryCheckpoint | undefined {
  if (state.checkpoints.length === 0) return undefined;
  return [...state.checkpoints].sort((a, b) => b.createdAt - a.createdAt)[0];
}

/** Log a crash event */
export function logCrash(state: CrashRecoveryState, reason: string): CrashRecoveryState {
  return { ...state, crashLog: [...state.crashLog, { timestamp: Date.now(), reason }] };
}

/** Rollback to latest checkpoint, returns the checkpoint state */
export function rollbackToLatest(state: CrashRecoveryState): { state: CrashRecoveryState; restored: Record<string, unknown> | null } {
  const cp = latestCheckpoint(state);
  if (!cp) return { state, restored: null };
  return { state: { ...state, autoRollback: state.autoRollback }, restored: cp.state };
}

/** Toggle auto-rollback */
export function setAutoRollback(state: CrashRecoveryState, enabled: boolean): CrashRecoveryState {
  return { ...state, autoRollback: enabled };
}

/** Get crash count in last N ms */
export function recentCrashCount(state: CrashRecoveryState, windowMs: number, now = Date.now()): number {
  return state.crashLog.filter((c) => now - c.timestamp <= windowMs).length;
}

/** Prune old checkpoints keeping last N */
export function pruneCheckpoints(state: CrashRecoveryState, keepLastN: number): CrashRecoveryState {
  if (state.checkpoints.length <= keepLastN) return state;
  return { ...state, checkpoints: [...state.checkpoints].slice(-keepLastN) };
}

/** Recovery master metric */
export function recoveryHealth(state: CrashRecoveryState): {
  checkpointCount: number;
  crashCount: number;
  autoRollback: boolean;
  health: number;
} {
  const hasCheckpoint = state.checkpoints.length > 0;
  const health = hasCheckpoint && state.autoRollback ? 1 : hasCheckpoint ? 0.7 : 0;
  return { checkpointCount: state.checkpoints.length, crashCount: state.crashLog.length, autoRollback: state.autoRollback, health };
}
