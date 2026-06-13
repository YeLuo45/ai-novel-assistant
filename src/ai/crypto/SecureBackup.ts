// V2129 SecureBackup - Direction A Iter 14/30
// 安全备份 - 加密快照 + 恢复
// Source: nanobot (backup + crypto)

import { encrypt, decrypt, generateKey } from '../crypto/AESGCMCipher';

export interface BackupSnapshot {
  id: string;
  ciphertext: string;
  aad: string;
  createdAt: number;
  sizeBytes: number;
  dataHash: string;
}

export interface SecureBackupState {
  snapshots: BackupSnapshot[];
  keyHex: string;
  maxSnapshots: number;
}

export function createSecureBackupState(maxSnapshots = 10): SecureBackupState {
  return { snapshots: [], keyHex: generateKey(), maxSnapshots };
}

/** Compute a simple hash of the data (FNV-1a 32-bit) */
export function dataHash(data: string): string {
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Create an encrypted backup of the data */
export function createBackup(state: SecureBackupState, data: string, aad = ''): { state: SecureBackupState; id: string } {
  const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ciphertext = encrypt(data, state.keyHex, aad);
  const snap: BackupSnapshot = {
    id,
    ciphertext,
    aad,
    createdAt: Date.now(),
    sizeBytes: data.length,
    dataHash: dataHash(data),
  };
  const snapshots = [...state.snapshots, snap];
  // Keep only last N
  const trimmed = snapshots.length > state.maxSnapshots ? snapshots.slice(-state.maxSnapshots) : snapshots;
  return { state: { ...state, snapshots: trimmed }, id };
}

/** Restore a backup by id */
export function restoreBackup(state: SecureBackupState, id: string, aad = ''): string | { error: string } {
  const snap = state.snapshots.find((s) => s.id === id);
  if (!snap) return { error: 'snapshot not found' };
  try {
    return decrypt(snap.ciphertext, state.keyHex, aad || snap.aad);
  } catch (e) {
    return { error: String(e) };
  }
}

/** Delete a backup by id */
export function deleteBackup(state: SecureBackupState, id: string): SecureBackupState {
  return { ...state, snapshots: state.snapshots.filter((s) => s.id !== id) };
}

/** Verify backup integrity (hash check) */
export function verifyBackup(state: SecureBackupState, id: string, aad = ''): { valid: boolean; reason?: string } {
  const snap = state.snapshots.find((s) => s.id === id);
  if (!snap) return { valid: false, reason: 'snapshot not found' };
  try {
    const pt = decrypt(snap.ciphertext, state.keyHex, aad || snap.aad);
    if (dataHash(pt) !== snap.dataHash) return { valid: false, reason: 'hash mismatch' };
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: String(e) };
  }
}

/** List all backup ids sorted by time (newest first) */
export function listBackups(state: SecureBackupState): string[] {
  return [...state.snapshots].sort((a, b) => b.createdAt - a.createdAt).map((s) => s.id);
}

/** Get total backup storage size in bytes */
export function totalSize(state: SecureBackupState): number {
  return state.snapshots.reduce((s, b) => s + b.sizeBytes, 0);
}

/** Backup health metric */
export function backupHealth(state: SecureBackupState): {
  snapshotCount: number;
  totalBytes: number;
  health: number;
} {
  const health = state.snapshots.length > 0 ? 1 : 0;
  return { snapshotCount: state.snapshots.length, totalBytes: totalSize(state), health };
}
