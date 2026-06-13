import { describe, it, expect } from 'vitest';
import {
  createSecureBackupState,
  dataHash,
  createBackup,
  restoreBackup,
  deleteBackup,
  verifyBackup,
  listBackups,
  totalSize,
  backupHealth,
} from './SecureBackup';

describe('V2129 SecureBackup', () => {
  it('should create empty backup state', () => {
    const s = createSecureBackupState();
    expect(s.snapshots).toEqual([]);
  });

  it('should compute data hash deterministically', () => {
    expect(dataHash('hello')).toBe(dataHash('hello'));
    expect(dataHash('hello')).not.toBe(dataHash('world'));
  });

  it('should create and restore backup', () => {
    let s = createSecureBackupState();
    const { state, id } = createBackup(s, 'my data');
    const restored = restoreBackup(state, id);
    expect(restored).toBe('my data');
  });

  it('should fail to restore unknown id', () => {
    const s = createSecureBackupState();
    const r = restoreBackup(s, 'nope');
    expect('error' in (r as any)).toBe(true);
  });

  it('should delete backup', () => {
    let s = createSecureBackupState();
    const { state, id } = createBackup(s, 'x');
    const d = deleteBackup(state, id);
    expect(d.snapshots).toHaveLength(0);
  });

  it('should verify backup integrity', () => {
    let s = createSecureBackupState();
    const { state, id } = createBackup(s, 'important');
    const v = verifyBackup(state, id);
    expect(v.valid).toBe(true);
  });

  it('should list backups newest first', () => {
    let s = createSecureBackupState();
    const a = createBackup(s, 'first');
    s = { ...a.state, snapshots: a.state.snapshots.map((snap) => ({ ...snap, createdAt: snap.createdAt - 1000 })) };
    const b = createBackup(s, 'second');
    s = b.state;
    const ids = listBackups(s);
    expect(ids[0]).toBe(b.id);
    expect(ids[1]).toBe(a.id);
  });

  it('should compute total size', () => {
    let s = createSecureBackupState();
    const { state } = createBackup(s, 'hello');
    const { state: s2 } = createBackup(state, 'world!');
    expect(totalSize(s2)).toBe(11);
  });

  it('should compute backup health', () => {
    const s = createSecureBackupState();
    const h = backupHealth(s);
    expect(h.snapshotCount).toBe(0);
    expect(h.health).toBe(0);
  });
});
