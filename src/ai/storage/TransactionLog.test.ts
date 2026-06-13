import { describe, it, expect } from 'vitest';
import {
  createTxLogState,
  beginTx,
  addOp,
  commitTx,
  abortTx,
  getTx,
  activeTransactions,
  txCountByStatus,
  transactionHealth,
} from './TransactionLog';

describe('V2136 TransactionLog', () => {
  it('should create empty tx log', () => {
    const s = createTxLogState();
    expect(s.transactions.size).toBe(0);
  });

  it('should begin a transaction', () => {
    const s = beginTx(createTxLogState(), 't1');
    expect(s.transactions.size).toBe(1);
    expect(s.activeTx.has('t1')).toBe(true);
  });

  it('should add operation to in-progress tx', () => {
    let s = beginTx(createTxLogState(), 't1');
    s = addOp(s, 't1', 'insert', { x: 1 });
    const tx = getTx(s, 't1');
    expect(tx?.operations).toHaveLength(1);
  });

  it('should not add op to non-active tx', () => {
    let s = beginTx(createTxLogState(), 't1');
    s = commitTx(s, 't1');
    s = addOp(s, 't1', 'insert', {});
    const tx = getTx(s, 't1');
    expect(tx?.operations).toHaveLength(0);
  });

  it('should commit transaction', () => {
    let s = beginTx(createTxLogState(), 't1');
    s = commitTx(s, 't1');
    expect(getTx(s, 't1')?.status).toBe('committed');
    expect(s.activeTx.has('t1')).toBe(false);
  });

  it('should abort transaction', () => {
    let s = beginTx(createTxLogState(), 't1');
    s = abortTx(s, 't1');
    expect(getTx(s, 't1')?.status).toBe('aborted');
  });

  it('should list active transactions', () => {
    let s = createTxLogState();
    s = beginTx(s, 't1');
    s = beginTx(s, 't2');
    const active = activeTransactions(s);
    expect(active).toHaveLength(2);
  });

  it('should count by status', () => {
    let s = createTxLogState();
    s = beginTx(s, 't1');
    s = commitTx(s, 't1');
    s = beginTx(s, 't2');
    s = abortTx(s, 't2');
    const counts = txCountByStatus(s);
    expect(counts.committed).toBe(1);
    expect(counts.aborted).toBe(1);
  });

  it('should compute transaction health', () => {
    let s = createTxLogState();
    s = beginTx(s, 't1');
    s = commitTx(s, 't1');
    const h = transactionHealth(s);
    expect(h.committed).toBe(1);
    expect(h.atomicity).toBe(1);
    expect(h.health).toBe(1);
  });
});
