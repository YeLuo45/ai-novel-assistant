import { describe, it, expect } from 'vitest';
import {
  createWALState,
  appendWAL,
  markFlushed,
  replayWAL,
  uncommittedTx,
  verifyEntry,
  countByOpType,
  compactWAL,
  walHealth,
} from './WriteAheadLog';

describe('V2132 WriteAheadLog', () => {
  it('should create empty WAL', () => {
    const s = createWALState();
    expect(s.entries).toEqual([]);
    expect(s.nextLsn).toBe(1);
  });

  it('should append entry with auto LSN', () => {
    const s = createWALState();
    const { state, entry } = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'users' });
    expect(entry.lsn).toBe(1);
    expect(state.nextLsn).toBe(2);
  });

  it('should mark flushed up to LSN', () => {
    let s = createWALState();
    s = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'x' }).state;
    s = markFlushed(s, 1);
    expect(s.flushedLsn).toBe(1);
  });

  it('should replay from LSN', () => {
    let s = createWALState();
    s = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'a' }).state;
    s = appendWAL(s, { txId: 't1', opType: 'update', entity: 'a' }).state;
    const replayed = replayWAL(s, 2);
    expect(replayed).toHaveLength(1);
  });

  it('should track uncommitted transactions', () => {
    let s = createWALState();
    s = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'a' }).state;
    s = appendWAL(s, { txId: 't2', opType: 'insert', entity: 'b' }).state;
    expect(uncommittedTx(s)).toEqual(['t1', 't2']);
  });

  it('should clear active tx on commit', () => {
    let s = createWALState();
    s = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'a' }).state;
    s = appendWAL(s, { txId: 't1', opType: 'commit', entity: 'a' }).state;
    expect(uncommittedTx(s)).toEqual([]);
  });

  it('should verify entry checksum', () => {
    const s = createWALState();
    const { entry } = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'a' });
    // Mutate the entry to simulate corruption
    const corrupted = { ...entry, entity: 'tampered' };
    expect(verifyEntry(entry)).toBe(true);
    expect(verifyEntry(corrupted)).toBe(false);
  });

  it('should count by op type', () => {
    let s = createWALState();
    s = appendWAL(s, { txId: 't1', opType: 'insert', entity: 'a' }).state;
    s = appendWAL(s, { txId: 't1', opType: 'update', entity: 'a' }).state;
    s = appendWAL(s, { txId: 't1', opType: 'commit', entity: 'a' }).state;
    const counts = countByOpType(s);
    expect(counts.insert).toBe(1);
    expect(counts.update).toBe(1);
    expect(counts.commit).toBe(1);
  });

  it('should compact WAL to last N', () => {
    let s = createWALState();
    for (let i = 0; i < 5; i++) {
      s = appendWAL(s, { txId: 't', opType: 'insert', entity: 'x' }).state;
    }
    const compact = compactWAL(s, 2);
    expect(compact.entries).toHaveLength(2);
  });

  it('should compute WAL health', () => {
    const s = createWALState();
    const h = walHealth(s);
    expect(h.entryCount).toBe(0);
    expect(h.health).toBe(1);
  });
});
