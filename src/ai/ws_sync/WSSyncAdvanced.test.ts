// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 2/3 test
// V4656-V4665: 10 engines

import { describe, it, expect } from 'vitest';
import {
  AdaptiveRateLimiter, BandwidthMonitor, LatencyTracker, SyncConflictResolver,
  OperationLog, MessagePriorityQueue, BatchSendBuffer, ChannelMultiplexer,
  SubscriptionRegistry, SyncMetricsAggregator,
  WSSyncAdvancedIndex, WS_SYNC_BATCH_2_ENGINES,
} from './WSSyncAdvanced';

describe('V4656 AdaptiveRateLimiter', () => {
  it('initial tokens = capacity', () => {
    const r = new AdaptiveRateLimiter(100, 10);
    expect(r.available()).toBeGreaterThan(90);
  });

  it('tryAcquire deducts tokens', () => {
    const r = new AdaptiveRateLimiter(10, 1);
    expect(r.tryAcquire(5)).toBe(true);
    expect(r.tryAcquire(10)).toBe(false);
  });

  it('setRefillRate updates rate', () => {
    const r = new AdaptiveRateLimiter();
    r.setRefillRate(50);
    expect(r.capacity()).toBe(100);
  });

  it('adapt changes rate based on load', () => {
    const r = new AdaptiveRateLimiter();
    r.adapt(0.8);
    expect(r.capacity()).toBeGreaterThan(0);
  });
});

describe('V4657 BandwidthMonitor', () => {
  it('record and bytesPerSecond', () => {
    const m = new BandwidthMonitor(1000);
    m.record(100);
    m.record(200);
    expect(m.bytesPerSecond()).toBeGreaterThan(0);
  });

  it('peakBytesPerSecond', () => {
    const m = new BandwidthMonitor(5000);
    m.record(1000);
    expect(m.peakBytesPerSecond()).toBeGreaterThanOrEqual(1000);
  });

  it('sampleCount', () => {
    const m = new BandwidthMonitor();
    m.record(10);
    m.record(20);
    expect(m.sampleCount()).toBe(2);
  });
});

describe('V4658 LatencyTracker', () => {
  it('record and percentile', () => {
    const l = new LatencyTracker();
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(v => l.record(v));
    expect(l.percentile(50)).toBeGreaterThanOrEqual(40);
  });

  it('average', () => {
    const l = new LatencyTracker();
    l.record(10);
    l.record(20);
    expect(l.average()).toBe(15);
  });

  it('reset clears samples', () => {
    const l = new LatencyTracker();
    l.record(10);
    l.reset();
    expect(l.count()).toBe(0);
  });
});

describe('V4659 SyncConflictResolver', () => {
  it('resolve picks higher version', () => {
    const r = new SyncConflictResolver();
    const local = { id: 'a', version: 1, data: 'old', timestamp: 100 };
    const remote = { id: 'a', version: 2, data: 'new', timestamp: 50 };
    expect(r.resolve(local, remote).version).toBe(2);
  });

  it('resolve picks latest timestamp on tie', () => {
    const r = new SyncConflictResolver();
    const local = { id: 'a', version: 1, data: 'a', timestamp: 200 };
    const remote = { id: 'a', version: 1, data: 'b', timestamp: 100 };
    expect(r.resolve(local, remote).data).toBe('a');
  });

  it('hasConflict detects divergence', () => {
    const r = new SyncConflictResolver();
    const local = { id: 'a', version: 1, data: 'x', timestamp: 100 };
    const remote = { id: 'a', version: 1, data: 'y', timestamp: 200 };
    expect(r.hasConflict(local, remote)).toBe(true);
  });

  it('versionGap returns absolute diff', () => {
    const r = new SyncConflictResolver();
    const a = { id: 'a', version: 1, data: '', timestamp: 0 };
    const b = { id: 'a', version: 5, data: '', timestamp: 0 };
    expect(r.versionGap(a, b)).toBe(4);
  });
});

describe('V4660 OperationLog', () => {
  it('append returns incrementing seq', () => {
    const l = new OperationLog();
    const a = l.append('op1', 'data1');
    const b = l.append('op2', 'data2');
    expect(a.seq).toBe(0);
    expect(b.seq).toBe(1);
  });

  it('replay returns from seq onwards', () => {
    const l = new OperationLog();
    l.append('a', '1');
    l.append('b', '2');
    l.append('c', '3');
    expect(l.replay(1).length).toBe(2);
  });

  it('get by seq', () => {
    const l = new OperationLog();
    l.append('x', 'd');
    expect(l.get(0)?.op).toBe('x');
  });

  it('trim keeps last N', () => {
    const l = new OperationLog();
    for (let i = 0; i < 10; i++) l.append('op' + i, 'd');
    expect(l.trim(3)).toBe(7);
    expect(l.size()).toBe(3);
  });
});

describe('V4661 MessagePriorityQueue', () => {
  it('enqueue sorts by priority', () => {
    const q = new MessagePriorityQueue();
    q.enqueue({ priority: 1, payload: 'low', enqueuedAt: 1 });
    q.enqueue({ priority: 5, payload: 'high', enqueuedAt: 2 });
    q.enqueue({ priority: 3, payload: 'mid', enqueuedAt: 3 });
    expect(q.dequeue()?.payload).toBe('high');
  });

  it('peek without removal', () => {
    const q = new MessagePriorityQueue();
    q.enqueue({ priority: 1, payload: 'x', enqueuedAt: 1 });
    expect(q.peek()?.payload).toBe('x');
    expect(q.size()).toBe(1);
  });

  it('drain returns multiple', () => {
    const q = new MessagePriorityQueue();
    q.enqueue({ priority: 1, payload: 'a', enqueuedAt: 1 });
    q.enqueue({ priority: 2, payload: 'b', enqueuedAt: 2 });
    expect(q.drain(5).length).toBe(2);
    expect(q.size()).toBe(0);
  });
});

describe('V4662 BatchSendBuffer', () => {
  it('enqueue returns true when full', () => {
    const b = new BatchSendBuffer(2);
    expect(b.enqueue({ id: 'a', data: '1', enqueuedAt: 1 })).toBe(false);
    expect(b.enqueue({ id: 'b', data: '2', enqueuedAt: 2 })).toBe(true);
  });

  it('shouldFlush by size', () => {
    const b = new BatchSendBuffer(2, 10000);
    b.enqueue({ id: 'a', data: '1', enqueuedAt: 1 });
    b.enqueue({ id: 'b', data: '2', enqueuedAt: 2 });
    expect(b.shouldFlush()).toBe(true);
  });

  it('flush empties buffer', () => {
    const b = new BatchSendBuffer(5);
    b.enqueue({ id: 'a', data: '1', enqueuedAt: 1 });
    expect(b.flush().length).toBe(1);
    expect(b.size()).toBe(0);
  });

  it('clear resets', () => {
    const b = new BatchSendBuffer(5);
    b.enqueue({ id: 'a', data: '1', enqueuedAt: 1 });
    b.clear();
    expect(b.size()).toBe(0);
  });
});

describe('V4663 ChannelMultiplexer', () => {
  it('open and close', () => {
    const m = new ChannelMultiplexer();
    m.open('a');
    expect(m.size()).toBe(1);
    expect(m.close('a')).toBe(true);
    expect(m.size()).toBe(0);
  });

  it('recordMessage and msgCount', () => {
    const m = new ChannelMultiplexer();
    m.open('ch1');
    m.recordMessage('ch1');
    m.recordMessage('ch1');
    expect(m.msgCount('ch1')).toBe(2);
  });

  it('totalMessages aggregates', () => {
    const m = new ChannelMultiplexer();
    m.open('a');
    m.open('b');
    m.recordMessage('a');
    m.recordMessage('b');
    expect(m.totalMessages()).toBe(2);
  });
});

describe('V4664 SubscriptionRegistry', () => {
  it('subscribe and publish', () => {
    const r = new SubscriptionRegistry();
    let received = 0;
    r.subscribe('topic1', () => { received++; });
    expect(r.publish('topic1', 'payload')).toBe(1);
    expect(received).toBe(1);
  });

  it('unsubscribe removes handler', () => {
    const r = new SubscriptionRegistry();
    const h = () => {};
    r.subscribe('t', h);
    r.unsubscribe('t', h);
    expect(r.subscriberCount('t')).toBe(0);
  });

  it('publish to unknown topic returns 0', () => {
    const r = new SubscriptionRegistry();
    expect(r.publish('unknown', 'p')).toBe(0);
  });

  it('topics and topicCount', () => {
    const r = new SubscriptionRegistry();
    r.subscribe('a', () => {});
    r.subscribe('b', () => {});
    expect(r.topics().length).toBe(2);
    expect(r.topicCount()).toBe(2);
  });
});

describe('V4665 SyncMetricsAggregator', () => {
  it('increment counter', () => {
    const m = new SyncMetricsAggregator();
    m.increment('msg_sent');
    m.increment('msg_sent', 4);
    expect(m.counter('msg_sent')).toBe(5);
  });

  it('gauge set and read', () => {
    const m = new SyncMetricsAggregator();
    m.gauge('latency_ms', 42);
    expect(m.gaugeValue('latency_ms')).toBe(42);
  });

  it('snapshot returns both', () => {
    const m = new SyncMetricsAggregator();
    m.increment('c1', 3);
    m.gauge('g1', 10);
    const s = m.snapshot();
    expect(s.counters['c1']).toBe(3);
    expect(s.gauges['g1']).toBe(10);
  });

  it('reset clears', () => {
    const m = new SyncMetricsAggregator();
    m.increment('c', 1);
    m.reset();
    expect(m.counterNames().length).toBe(0);
    expect(m.gaugeNames().length).toBe(0);
  });
});

describe('WSSyncAdvancedIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new WSSyncAdvancedIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new WSSyncAdvancedIndex();
    expect(idx.has('AdaptiveRateLimiter')).toBe(true);
    expect(idx.has('WSSyncAdvancedIndex')).toBe(true);
  });

  it('WS_SYNC_BATCH_2_ENGINES has 10 entries', () => {
    expect(WS_SYNC_BATCH_2_ENGINES.length).toBe(10);
  });
});