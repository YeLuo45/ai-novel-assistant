// V2116 PowerSyncEngineCore - Direction A Iter 1/30
// PowerSync 核心引擎 - 双向同步状态机
// Sources: thunderbolt (PowerSync) + nanobot (atomic ops)

/**
 * Sync aspect - 7-level strength rating for sync operations
 */
export type SyncAspect =
  | 'idle'
  | 'local_only'
  | 'pending_upload'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'reconciling';

/**
 * Sync state — per-entity row state
 */
export interface SyncState {
  entityId: string;
  aspect: SyncAspect;
  version: number;          // local version vector
  remoteVersion: number;    // last known remote version
  lastSyncAt: number;       // ms timestamp
  pendingOps: number;       // queued operations count
  retryCount: number;
}

/**
 * Master metric — composite sync health score (0-1)
 */
export interface SyncMaster {
  density: number;          // mean progress
  coherence: number;        // 1 - stdDev
  mastery: number;          // 0.4·density + 0.3·coherence + 0.3·resonance
  resonance: number;        // weighted sum
  healthyCount: number;     // count of synced entities
  conflictCount: number;    // count of conflicts
}

export function createPowerSyncState(): SyncState {
  return {
    entityId: '',
    aspect: 'idle',
    version: 0,
    remoteVersion: 0,
    lastSyncAt: 0,
    pendingOps: 0,
    retryCount: 0,
  };
}

/** Transition state to pending_upload (local mutation) */
export function markPending(state: SyncState, opCount = 1): SyncState {
  return {
    ...state,
    aspect: 'pending_upload',
    version: state.version + opCount,
    pendingOps: state.pendingOps + opCount,
  };
}

/** Transition state to syncing */
export function beginSync(state: SyncState): SyncState {
  if (state.aspect !== 'pending_upload' && state.aspect !== 'conflict' && state.aspect !== 'idle') {
    return state;
  }
  return { ...state, aspect: 'syncing' };
}

/** Resolve sync successfully */
export function completeSync(state: SyncState, remoteVersion: number): SyncState {
  return {
    ...state,
    aspect: 'synced',
    remoteVersion,
    lastSyncAt: Date.now(),
    pendingOps: 0,
    retryCount: 0,
  };
}

/** Mark conflict detected */
export function markConflict(state: SyncState): SyncState {
  return { ...state, aspect: 'conflict', retryCount: state.retryCount + 1 };
}

/** Compute master metric across N states */
export function computeMaster(states: SyncState[]): SyncMaster {
  if (states.length === 0) {
    return { density: 0, coherence: 1, mastery: 0, resonance: 0, healthyCount: 0, conflictCount: 0 };
  }
  const aspectScores: Record<SyncAspect, number> = {
    idle: 0,
    local_only: 0.15,
    pending_upload: 0.35,
    syncing: 0.55,
    synced: 1.0,
    conflict: 0.2,
    reconciling: 0.6,
  };
  const values = states.map((s) => aspectScores[s.aspect]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const density = mean;
  const coherence = Math.max(0, 1 - stdDev);
  const resonance = mean * 0.5 + (states.filter((s) => s.aspect === 'synced').length / states.length) * 0.5;
  const mastery = density * 0.4 + coherence * 0.3 + resonance * 0.3;
  const healthyCount = states.filter((s) => s.aspect === 'synced').length;
  const conflictCount = states.filter((s) => s.aspect === 'conflict').length;
  return { density, coherence, mastery, resonance, healthyCount, conflictCount };
}

/** Reset to idle */
export function resetState(state: SyncState): SyncState {
  return {
    entityId: state.entityId,
    aspect: 'idle',
    version: 0,
    remoteVersion: 0,
    lastSyncAt: 0,
    pendingOps: 0,
    retryCount: 0,
  };
}
