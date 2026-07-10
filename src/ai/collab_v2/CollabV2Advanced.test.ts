// V5286-V5295: CX Real-time Collaboration 2.0 Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  AwarenessProtocol2,
  SelectionSync2,
  CursorShare2,
  LatencyOptimizer2,
  OfflineQueue2,
  ReconnectReplay2,
  BandwidthOptimizer,
  RetryStrategy,
  BackoffCalculator,
  CollabV2AdvancedIndex,
  CX_BATCH_2_ENGINES
} from './CollabV2Advanced';

describe('AwarenessProtocol2 + SelectionSync2', () => {
  it('AwarenessProtocol2 setState + on + getState + activeUsers + clear', () => {
    const a = new AwarenessProtocol2();
    let captured: Map<string, { cursor: number; color: string }> | null = null;
    const off = a.on((s: Map<string, { cursor: number; color: string }>) => { captured = s; });
    a.setState('u1', 5, 'red');
    expect(captured?.get('u1')?.cursor).toBe(5);
    a.setState('u2', 10);
    expect(a.activeUsers().sort()).toEqual(['u1', 'u2']);
    expect(a.getState('u1')?.color).toBe('red');
    expect(a.getState('missing')).toBeNull();
    off();
    captured = null;
    a.setState('u3', 15);
    expect(captured).toBeNull(); // listener unsubscribed
    a.clear();
    expect(a.activeUsers()).toEqual([]);
  });

  it('SelectionSync2 set + get + isEmpty + range + remove', () => {
    const s = new SelectionSync2();
    s.set('u1', 5, 10);
    expect(s.get('u1')?.anchor).toBe(5);
    expect(s.isEmpty('u1')).toBe(false);
    expect(s.range('u1')).toEqual({ start: 5, end: 10 });
    s.set('u2', 10, 10);
    expect(s.isEmpty('u2')).toBe(true);
    expect(s.range('u2')).toEqual({ start: 10, end: 10 });
    expect(s.range('missing')).toEqual({ start: 0, end: 0 });
    expect(s.isEmpty('missing')).toBe(true);
    expect(s.remove('u1')).toBe(true);
  });
});

describe('CursorShare2 + LatencyOptimizer2 + OfflineQueue2 + ReconnectReplay2', () => {
  it('CursorShare2 publish + position + isVisible + hide + show + remove', () => {
    const c = new CursorShare2();
    c.publish('u1', 5);
    expect(c.position('u1')).toBe(5);
    expect(c.isVisible('u1')).toBe(true);
    c.hide('u1');
    expect(c.isVisible('u1')).toBe(false);
    c.show('u1');
    expect(c.isVisible('u1')).toBe(true);
    expect(c.isVisible('missing')).toBe(false);
    expect(c.position('missing')).toBe(0);
    expect(c.remove('u1')).toBe(true);
  });

  it('LatencyOptimizer2 optimalTimeout + predict + shouldRetry', () => {
    const l = new LatencyOptimizer2();
    expect(l.optimalTimeout(100)).toBe(300);
    expect(l.predict([])).toBe(0);
    // [10, 20, 30] with alpha=0.3: s0=10, s1=0.3*20+0.7*10=13, s2=0.3*30+0.7*13=18.1
    expect(l.predict([10, 20, 30])).toBeCloseTo(18.1);
    expect(l.shouldRetry(50, 100)).toBe(true);
    expect(l.shouldRetry(150, 100)).toBe(false);
  });

  it('OfflineQueue2 enqueue + dequeue + size + clear + ids', () => {
    const q = new OfflineQueue2();
    const id1 = q.enqueue('create', { x: 1 });
    const id2 = q.enqueue('update', { x: 2 });
    expect(q.size()).toBe(2);
    expect(q.ids()).toEqual([id1, id2]);
    expect(q.dequeue()?.op).toBe('create');
    expect(q.size()).toBe(1);
    expect(q.ids()).toEqual([id2]);
    expect(q.dequeue()).not.toBeNull();
    expect(q.dequeue()).toBeNull();
    q.clear();
    expect(q.size()).toBe(0);
  });

  it('ReconnectReplay2 record + bufferSize + clear + replay', () => {
    const r = new ReconnectReplay2();
    expect(r.bufferSize()).toBe(0);
    r.record('create', { a: 1 });
    r.record('update', { b: 2 });
    expect(r.bufferSize()).toBe(2);
    let count = 0;
    const n = r.replay((op, p) => {
      count += 1;
      expect(['create', 'update']).toContain(op);
      expect(p).toBeDefined();
    });
    expect(n).toBe(2);
    expect(count).toBe(2);
    r.clear();
    expect(r.bufferSize()).toBe(0);
  });
});

describe('BandwidthOptimizer + RetryStrategy + BackoffCalculator + CollabV2AdvancedIndex', () => {
  it('BandwidthOptimizer estimate + shouldThrottle + optimalBatchSize', () => {
    const b = new BandwidthOptimizer();
    expect(b.estimate({ x: 1 })).toBeGreaterThan(0);
    expect(b.shouldThrottle(1500, 1000)).toBe(true);
    expect(b.shouldThrottle(500, 1000)).toBe(false);
    expect(b.optimalBatchSize(1000, 100)).toBeGreaterThan(0);
  });

  it('RetryStrategy backoff + shouldRetry + nextDelay', () => {
    const r = new RetryStrategy();
    expect(r.backoff(0)).toBe(100);
    expect(r.backoff(3)).toBe(800);
    expect(r.backoff(20, 100, 10000)).toBe(10000); // cap
    expect(r.shouldRetry(0, 5)).toBe(true);
    expect(r.shouldRetry(5, 5)).toBe(false);
    const d = r.nextDelay(2);
    expect(d).toBeGreaterThan(0);
  });

  it('BackoffCalculator decorrelated + fullJitter + equalJitter', () => {
    const b = new BackoffCalculator();
    const d1 = b.decorrelated(100);
    const d2 = b.decorrelated(100);
    expect(d1).toBeGreaterThan(0);
    expect(d2).toBeGreaterThan(0);
    expect(b.fullJitter(1000)).toBeGreaterThanOrEqual(0);
    expect(b.fullJitter(1000)).toBeLessThanOrEqual(1000);
    const eq = b.equalJitter(100, 200);
    expect(eq).toBeGreaterThanOrEqual(50);
    expect(eq).toBeLessThanOrEqual(100);
  });

  it('CollabV2AdvancedIndex', () => {
    expect(new CollabV2AdvancedIndex().list()).toHaveLength(10);
    const idx = new CollabV2AdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('AwarenessProtocol2')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
    expect(CX_BATCH_2_ENGINES).toHaveLength(10);
  });
});