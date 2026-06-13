import { describe, it, expect } from 'vitest';
import {
  createWriteLog,
  tempPathFor,
  planWrite,
  commitWrite,
  rollbackWrite,
  pendingWrites,
  opCount,
  lastOpFor,
  isPending,
  clearLog,
  writeHealth,
} from './AtomicWriter';

describe('V2131 AtomicWriter', () => {
  it('should create empty write log', () => {
    const log = createWriteLog();
    expect(log.ops).toEqual([]);
    expect(pendingWrites(log)).toEqual([]);
  });

  it('should generate temp path', () => {
    expect(tempPathFor('/data/file.txt')).toMatch(/^\/data\/file\.txt\.tmp\./);
  });

  it('should plan a write op', () => {
    const log = createWriteLog();
    const { log: l2, tempPath } = planWrite(log, '/a.txt', 'data');
    expect(l2.ops).toHaveLength(1);
    expect(l2.pendingRenames.get('/a.txt')).toBe(tempPath);
    expect(isPending(l2, '/a.txt')).toBe(true);
  });

  it('should commit a staged write', () => {
    const log = createWriteLog();
    const { log: l2 } = planWrite(log, '/a.txt', 'x');
    const l3 = commitWrite(l2, '/a.txt');
    expect(isPending(l3, '/a.txt')).toBe(false);
  });

  it('should rollback a staged write', () => {
    const log = createWriteLog();
    const { log: l2 } = planWrite(log, '/a.txt', 'x');
    const l3 = rollbackWrite(l2, '/a.txt');
    expect(l3.ops).toHaveLength(0);
  });

  it('should count operations', () => {
    let log = createWriteLog();
    log = planWrite(log, '/a', '1').log;
    log = planWrite(log, '/b', '2').log;
    expect(opCount(log)).toBe(2);
  });

  it('should get last op for path', () => {
    let log = createWriteLog();
    log = planWrite(log, '/a', 'first').log;
    log = planWrite(log, '/a', 'second').log;
    const op = lastOpFor(log, '/a');
    expect(op?.data).toBe('second');
  });

  it('should clear log', () => {
    let log = createWriteLog();
    log = planWrite(log, '/a', 'x').log;
    log = clearLog(log);
    expect(opCount(log)).toBe(0);
  });

  it('should compute write health', () => {
    let log = createWriteLog();
    log = planWrite(log, '/a', 'x').log;
    log = commitWrite(log, '/a');
    const h = writeHealth(log);
    expect(h.completed).toBe(1);
    expect(h.pending).toBe(0);
    expect(h.health).toBe(1);
  });
});
