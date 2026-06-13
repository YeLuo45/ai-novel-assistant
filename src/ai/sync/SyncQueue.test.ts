import { describe, it, expect } from 'vitest';
import {
  createQueue,
  enqueue,
  dequeue,
  markInFlight,
  markFailed,
  markDone,
  pendingItems,
  shouldRetry,
  nextRetryDelay,
  queueDepth,
  purgeDone,
} from './SyncQueue';

describe('V2121 SyncQueue', () => {
  it('should create empty queue', () => {
    const q = createQueue();
    expect(q.items).toEqual([]);
    expect(q.maxRetries).toBe(3);
  });

  it('should enqueue item', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', { x: 1 });
    expect(q.items).toHaveLength(1);
    expect(q.items[0].status).toBe('pending');
  });

  it('should not enqueue duplicate id', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = enqueue(q, 'op1', {});
    expect(q.items).toHaveLength(1);
  });

  it('should dequeue item by id', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = enqueue(q, 'op2', {});
    q = dequeue(q, 'op1');
    expect(q.items).toHaveLength(1);
    expect(q.items[0].id).toBe('op2');
  });

  it('should mark in-flight and increment attempts', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = markInFlight(q, 'op1');
    expect(q.items[0].status).toBe('in_flight');
    expect(q.items[0].attempts).toBe(1);
  });

  it('should mark failed and store error', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = markInFlight(q, 'op1');
    q = markFailed(q, 'op1', 'timeout');
    expect(q.items[0].status).toBe('failed');
    expect(q.items[0].lastError).toBe('timeout');
  });

  it('should mark done', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = markInFlight(q, 'op1');
    q = markDone(q, 'op1');
    expect(q.items[0].status).toBe('done');
  });

  it('should return pending items', () => {
    let q = createQueue();
    q = enqueue(q, 'op1', {});
    q = enqueue(q, 'op2', {});
    q = markInFlight(q, 'op1');
    q = markDone(q, 'op1');
    const pending = pendingItems(q);
    expect(pending).toHaveLength(1);
  });

  it('should check if should retry', () => {
    let q = createQueue(2);
    q = enqueue(q, 'op1', {});
    q = markInFlight(q, 'op1');
    q = markFailed(q, 'op1', 'err');
    expect(shouldRetry(q.items[0], 2)).toBe(true);
    expect(shouldRetry({ ...q.items[0], attempts: 5 }, 2)).toBe(false);
  });

  it('should compute next retry delay exponentially', () => {
    const item = { id: 'x', payload: {}, status: 'failed' as const, enqueuedAt: 0, attempts: 3 };
    expect(nextRetryDelay(item, 1000)).toBe(4000);
  });

  it('should report queue depth', () => {
    let q = createQueue();
    q = enqueue(q, 'a', {});
    q = enqueue(q, 'b', {});
    q = markInFlight(q, 'a');
    const d = queueDepth(q);
    expect(d.pending).toBe(1);
    expect(d.inFlight).toBe(1);
  });

  it('should purge done items', () => {
    let q = createQueue();
    q = enqueue(q, 'a', {});
    q = enqueue(q, 'b', {});
    q = markInFlight(q, 'a');
    q = markDone(q, 'a');
    q = purgeDone(q);
    expect(q.items).toHaveLength(1);
  });
});
