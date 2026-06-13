import { describe, it, expect } from 'vitest';
import {
  createPowerSyncState,
  markPending,
  beginSync,
  completeSync,
  markConflict,
  computeMaster,
  resetState,
} from './PowerSyncEngineCore';

describe('V2116 PowerSyncEngineCore', () => {
  it('should initialize with idle defaults', () => {
    const s = createPowerSyncState();
    expect(s.aspect).toBe('idle');
    expect(s.version).toBe(0);
    expect(s.pendingOps).toBe(0);
  });

  it('should mark pending on local mutation', () => {
    const s = markPending(createPowerSyncState(), 3);
    expect(s.aspect).toBe('pending_upload');
    expect(s.version).toBe(3);
    expect(s.pendingOps).toBe(3);
  });

  it('should transition to syncing from pending', () => {
    const pending = markPending(createPowerSyncState());
    const s = beginSync(pending);
    expect(s.aspect).toBe('syncing');
  });

  it('should complete sync and update remote version', () => {
    const syncing = beginSync(markPending(createPowerSyncState()));
    const done = completeSync(syncing, 5);
    expect(done.aspect).toBe('synced');
    expect(done.remoteVersion).toBe(5);
    expect(done.pendingOps).toBe(0);
  });

  it('should mark conflict and increment retry', () => {
    const c = markConflict(beginSync(markPending(createPowerSyncState())));
    expect(c.aspect).toBe('conflict');
    expect(c.retryCount).toBe(1);
  });

  it('should compute master with healthy and conflict counts', () => {
    const e1 = completeSync(beginSync(markPending({ ...createPowerSyncState(), entityId: 'e1' })), 1);
    const e2 = markConflict(beginSync(markPending({ ...createPowerSyncState(), entityId: 'e2' })));
    const m = computeMaster([e1, e2]);
    expect(m.healthyCount).toBe(1);
    expect(m.conflictCount).toBe(1);
    expect(m.mastery).toBeGreaterThan(0);
    expect(m.mastery).toBeLessThan(1);
  });

  it('should return zero mastery for empty input', () => {
    const m = computeMaster([]);
    expect(m.density).toBe(0);
    expect(m.coherence).toBe(1);
    expect(m.mastery).toBe(0);
  });

  it('should not transition beginSync from invalid aspect', () => {
    const synced = completeSync(beginSync(markPending(createPowerSyncState())), 1);
    const noChange = beginSync(synced);
    expect(noChange.aspect).toBe('synced');
  });

  it('should reset state to idle', () => {
    const dirty = markPending({ ...createPowerSyncState(), entityId: 'x' }, 10);
    const r = resetState(dirty);
    expect(r.entityId).toBe('x');
    expect(r.aspect).toBe('idle');
    expect(r.version).toBe(0);
    expect(r.pendingOps).toBe(0);
  });
});
