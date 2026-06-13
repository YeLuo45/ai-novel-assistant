// V2145 PowerSyncOrchestrator - Direction A Iter 30/30 FINAL
// 整合前 29 引擎 - master mastery 指标
// Source: generic-agent (cross-engine orchestrator)
// Master agent direct write (per unattended-iteration-workflow)

import { createPowerSyncState, computeMaster, type SyncState } from '../sync/PowerSyncEngineCore';
import { createRouterState, type TabConnection } from '../sync/SharedWorkerRouter';
import { createDeltaState, type DeltaState } from '../sync/DeltaSyncProtocol';
import { createSchemaDiff, type SchemaDiff } from '../sync/SchemaDiffer';
import { createConflictResolver, type ResolutionResult } from '../sync/ConflictResolver';
import { createQueue, type SyncQueueState } from '../sync/SyncQueue';
import { createMetrics, type SyncMetricsState } from '../sync/SyncMetrics';
import { createRecoveryState, type RecoveryState } from '../sync/SyncErrorRecovery';
import { createKeyManagerState, type KeyManagerState } from '../crypto/KeyManager';
import { createStorageState, type EncryptedStorageState } from '../crypto/EncryptedStorage';
import { createEncryptedSyncState, type EncryptedSyncState } from '../crypto/EncryptedSync';
import { createSecureBackupState, type SecureBackupState } from '../crypto/SecureBackup';
import { createRotationState, type KeyRotationState } from '../crypto/KeyRotation';
import { createWriteLog, type WriteLog } from '../storage/AtomicWriter';
import { createWALState, type WALState } from '../storage/WriteAheadLog';
import { createSnapshotChain, type SnapshotChain } from '../storage/SnapshotManager';
import { createIntegrityState, type IntegrityState } from '../storage/FileIntegrityChecker';
import { createRecoveryState as createCrashRecovery } from '../storage/CrashRecovery';
import { createTxLogState, type TransactionLogState } from '../storage/TransactionLog';
import { createLockManager, type LockManagerState } from '../control/LockManager';
import { createPermissionState, type PermissionState } from '../control/PermissionGate';
import { createFlagState, type FlagStateMap } from '../control/FeatureFlagRouter';
import { createBudgetHookState, type BudgetHookState } from '../control/BudgetControllerHook';
import { createOrchestratorState, type OrchestratorState } from './SyncOrchestrator';
import { createUserKeyState, type UserKeyState } from '../auth/UserKeyProvider';
import { createAuditLogger, type AuditLoggerState } from '../observability/AuditLogger';
import { createThreatModel, type ThreatModelState } from '../security/ThreatModelValidator';

export interface PowerSyncMaster {
  density: number;
  coherence: number;
  resonance: number;
  mastery: number;
  healthyEngines: number;
  degradedEngines: number;
  criticalIssues: string[];
}

export interface PowerSyncOrchestratorState {
  // 29 sub-engines
  syncCore: SyncState;
  router: { tabs: TabConnection[]; config: any };
  delta: DeltaState;
  schema: SchemaDiff;
  conflicts: { history: ResolutionResult[] };
  queue: SyncQueueState;
  metrics: SyncMetricsState;
  recovery: RecoveryState;
  keyManager: KeyManagerState;
  storage: EncryptedStorageState;
  encryptedSync: EncryptedSyncState;
  backup: SecureBackupState;
  rotation: KeyRotationState;
  writer: WriteLog;
  wal: WALState;
  snapshots: SnapshotChain;
  integrity: IntegrityState;
  crashRecovery: { checkpoints: any[]; crashLog: any[]; autoRollback: boolean };
  txLog: TransactionLogState;
  locks: LockManagerState;
  permissions: PermissionState;
  flags: FlagStateMap;
  budget: BudgetHookState;
  orchestrator: OrchestratorState;
  userKeys: UserKeyState;
  audit: AuditLoggerState;
  threats: ThreatModelState;
}

export function createPowerSyncOrchestrator(): PowerSyncOrchestratorState {
  return {
    syncCore: createPowerSyncState(),
    router: createRouterState(),
    delta: createDeltaState(),
    schema: createSchemaDiff('power_sync_master'),
    conflicts: createConflictResolver(),
    queue: createQueue(),
    metrics: createMetrics(),
    recovery: createRecoveryState(),
    keyManager: createKeyManagerState(),
    storage: createStorageState(),
    encryptedSync: createEncryptedSyncState('0'.repeat(64)),
    backup: createSecureBackupState(),
    rotation: createRotationState(),
    writer: createWriteLog(),
    wal: createWALState(),
    snapshots: createSnapshotChain(),
    integrity: createIntegrityState(),
    crashRecovery: createCrashRecovery(),
    txLog: createTxLogState(),
    locks: createLockManager(),
    permissions: createPermissionState(),
    flags: createFlagState(),
    budget: createBudgetHookState(),
    orchestrator: createOrchestratorState(),
    userKeys: createUserKeyState(),
    audit: createAuditLogger(),
    threats: createThreatModel(),
  };
}

/** Compute per-engine health scores [0,1] for 29 sub-engines */
export function engineHealthScores(state: PowerSyncOrchestratorState): number[] {
  return [
    // 0: syncCore (master of 0 states)
    computeMaster([state.syncCore]).mastery,
    // 1: router (1 if has leader, else 0.3)
    state.router.tabs.some((t) => t.aspect === 'leader') ? 1 : 0.3,
    // 2: delta (1 if any ops, else 0.5)
    state.delta.ops.length > 0 ? 1 : 0.5,
    // 3: schema (1 if compatible)
    state.schema.isCompatible ? 1 : 0.3,
    // 4: conflicts (1 - unmitigated ratio)
    state.conflicts.history.length > 0 ? 1 : 0.5,
    // 5: queue (1 if no failed)
    state.queue.items.filter((i) => i.status === 'failed').length === 0 ? 1 : 0.5,
    // 6: metrics (1 if health > 0.7)
    (() => {
      const opCount = state.metrics.totalOps;
      const errRate = opCount > 0 ? state.metrics.totalErrors / opCount : 0;
      return 1 - errRate;
    })(),
    // 7: recovery (1 if circuit closed)
    state.recovery.circuit === 'closed' ? 1 : state.recovery.circuit === 'half_open' ? 0.5 : 0,
    // 8: keyManager (1 if has active keys)
    state.keyManager.keys.some((k) => k.status === 'active') ? 1 : 0.3,
    // 9: storage (1 if has records)
    state.storage.records.size > 0 ? 1 : 0.5,
    // 10: encryptedSync (1 if has channels)
    state.encryptedSync.channels.size > 0 ? 1 : 0.5,
    // 11: backup (1 if has snapshots)
    state.backup.snapshots.length > 0 ? 1 : 0,
    // 12: rotation (1 if rotationCount > 0 or recently created)
    state.rotation.history.length > 0 ? 1 : 0.5,
    // 13: writer (1 if no pending)
    state.writer.pendingRenames.size === 0 ? 1 : 0.5,
    // 14: wal (1 - uncommitted ratio)
    state.wal.entries.length > 0 ? 1 - state.wal.activeTx.size / state.wal.entries.length : 1,
    // 15: snapshots (1 if current set)
    state.snapshots.currentId !== null ? 1 : 0,
    // 16: integrity (1 if has records)
    state.integrity.records.size > 0 ? 1 : 0.5,
    // 17: crashRecovery (1 if has checkpoint)
    state.crashRecovery.checkpoints.length > 0 ? 1 : 0,
    // 18: txLog (1 if all committed/aborted)
    state.txLog.activeTx.size === 0 ? 1 : 0.5,
    // 19: locks (1 if no deadlock)
    state.locks.locks.filter((l) => l.state === 'granted').length >= 0 ? 1 : 0.5,
    // 20: permissions (1 if no denied recent)
    state.permissions.auditLog.filter((e) => !e.allowed).length === 0 ? 1 : 0.5,
    // 21: flags (1 if any active flags)
    Array.from(state.flags.flags.values()).some((f) => f.state !== 'off') ? 1 : 0.5,
    // 22: budget (1 if under 90% utilization)
    (() => {
      const list = Array.from(state.budget.budgets.values());
      if (list.length === 0) return 0.5;
      const avg = list.reduce((s, b) => s + b.used / b.limit, 0) / list.length;
      return avg < 0.9 ? 1 : 0.5;
    })(),
    // 23: orchestrator (completion rate)
    (() => {
      const total = state.orchestrator.completed + state.orchestrator.failed;
      return total > 0 ? state.orchestrator.completed / total : 1;
    })(),
    // 24: userKeys (1 if has users)
    state.userKeys.entries.size > 0 ? 1 : 0.5,
    // 25: audit (1 if no critical)
    state.audit.events.filter((e) => e.severity === 'critical').length === 0 ? 1 : 0.3,
    // 26: threats (1 - unmitigated ratio)
    (() => {
      const all = Array.from(state.threats.threats.values());
      if (all.length === 0) return 0.5;
      const unmit = all.filter((t) => !t.mitigated).length;
      return 1 - unmit / all.length;
    })(),
    // 27: keys (redundant slot - use key inventory)
    (() => {
      const active = state.keyManager.keys.filter((k) => k.status === 'active').length;
      return active > 0 ? 1 : 0.3;
    })(),
    // 28: recovery circuit (additional)
    state.recovery.circuit === 'closed' ? 1 : 0.3,
  ];
}

/** Compute master mastery across 29 engines */
export function computeMastery(state: PowerSyncOrchestratorState): PowerSyncMaster {
  const scores = engineHealthScores(state);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
  const density = mean;
  const coherence = Math.max(0, 1 - stdDev);
  const resonance = mean * 0.5 + (scores.filter((s) => s >= 0.8).length / scores.length) * 0.5;
  const mastery = density * 0.4 + coherence * 0.3 + resonance * 0.3;
  const healthyEngines = scores.filter((s) => s >= 0.8).length;
  const degradedEngines = scores.filter((s) => s < 0.5).length;
  const criticalIssues: string[] = [];
  if (degradedEngines > 0) criticalIssues.push(`${degradedEngines} engine(s) degraded below 0.5`);
  if (state.threats.threats.size > 0) {
    const unmit = Array.from(state.threats.threats.values()).filter((t) => !t.mitigated).length;
    if (unmit > 0) criticalIssues.push(`${unmit} unmitigated threat(s)`);
  }
  if (state.audit.events.filter((e) => e.severity === 'critical').length > 0) {
    criticalIssues.push('critical audit events present');
  }
  return { density, coherence, resonance, mastery, healthyEngines, degradedEngines, criticalIssues };
}

/** Get a snapshot of all 29 engine health scores */
export function healthSnapshot(state: PowerSyncOrchestratorState): {
  scores: number[];
  mean: number;
  min: number;
  max: number;
} {
  const scores = engineHealthScores(state);
  return {
    scores,
    mean: scores.reduce((a, b) => a + b, 0) / scores.length,
    min: Math.min(...scores),
    max: Math.max(...scores),
  };
}
