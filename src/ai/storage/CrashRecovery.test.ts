import { describe, it, expect } from 'vitest';
import {
  createRecoveryState,
  createCheckpoint,
  decideRecovery,
  latestCheckpoint,
  logCrash,
  rollbackToLatest,
  setAutoRollback,
  recentCrashCount,
  pruneCheckpoints,
  recoveryHealth,
} from './CrashRecovery';

describe('V2135 CrashRecovery', () => {
  it('should create empty recovery state', () => {
    const s = createRecoveryState();
    expect(s.checkpoints).toEqual([]);
    expect(s.autoRollback).toBe(true);
  });

  it('should create a checkpoint', () => {
    const { state, checkpoint } = createCheckpoint(createRecoveryState(), { x: 1 }, 'pre-update');
    expect(state.checkpoints).toHaveLength(1);
    expect(checkpoint.label).toBe('pre-update');
  });

  it('should decide recovery action by reason', () => {
    expect(decideRecovery('data corrupt')).toBe('rollback');
    expect(decideRecovery('crash detected')).toBe('replay');
    expect(decideRecovery('manual checkpoint')).toBe('checkpoint');
    expect(decideRecovery('other')).toBe('noop');
  });

  it('should get latest checkpoint', () => {
    let s = createRecoveryState();
    const cp1 = createCheckpoint(s, { v: 1 }, 'cp1');
    s = { ...cp1.state, checkpoints: cp1.state.checkpoints.map((cp) => ({ ...cp, createdAt: cp.createdAt - 100 })) };
    s = createCheckpoint(s, { v: 2 }, 'cp2').state;
    const latest = latestCheckpoint(s);
    expect(latest?.label).toBe('cp2');
  });

  it('should log crash events', () => {
    let s = createRecoveryState();
    s = logCrash(s, 'crash detected');
    expect(s.crashLog).toHaveLength(1);
  });

  it('should rollback to latest checkpoint', () => {
    let s = createRecoveryState();
    const cp1 = createCheckpoint(s, { v: 1 }, 'cp1');
    s = { ...cp1.state, checkpoints: cp1.state.checkpoints.map((cp) => ({ ...cp, createdAt: cp.createdAt - 100 })) };
    s = createCheckpoint(s, { v: 2 }, 'cp2').state;
    const { restored } = rollbackToLatest(s);
    expect(restored).toEqual({ v: 2 });
  });

  it('should return null when no checkpoint to rollback', () => {
    const s = createRecoveryState();
    const { restored } = rollbackToLatest(s);
    expect(restored).toBe(null);
  });

  it('should toggle auto-rollback', () => {
    let s = createRecoveryState();
    s = setAutoRollback(s, false);
    expect(s.autoRollback).toBe(false);
  });

  it('should count recent crashes in window', () => {
    let s = createRecoveryState();
    s = logCrash(s, 'x');
    s = logCrash(s, 'y');
    expect(recentCrashCount(s, 60000)).toBe(2);
  });

  it('should prune old checkpoints', () => {
    let s = createRecoveryState();
    s = createCheckpoint(s, { v: 1 }, 'a').state;
    s = createCheckpoint(s, { v: 2 }, 'b').state;
    s = createCheckpoint(s, { v: 3 }, 'c').state;
    s = pruneCheckpoints(s, 1);
    expect(s.checkpoints).toHaveLength(1);
  });

  it('should compute recovery health', () => {
    let s = createRecoveryState();
    s = createCheckpoint(s, { v: 1 }, 'cp1').state;
    const h = recoveryHealth(s);
    expect(h.checkpointCount).toBe(1);
    expect(h.health).toBe(1);
  });
});
