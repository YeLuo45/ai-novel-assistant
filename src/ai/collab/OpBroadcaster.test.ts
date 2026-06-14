import { describe, it, expect } from 'vitest';
import { createBroadcasterState, subscribeOp, unsubscribeOp, broadcastOp, broadcasterSubCount, deliveredCount, broadcasterHealth } from './OpBroadcaster';

describe('V2208 OpBroadcaster', () => {
  it('should create empty state', () => {
    const s = createBroadcasterState();
    expect(broadcasterSubCount(s)).toBe(0);
  });

  it('should subscribe', () => {
    let s = createBroadcasterState();
    s = subscribeOp(s, 'sub1', null);
    expect(broadcasterSubCount(s)).toBe(1);
  });

  it('should unsubscribe', () => {
    let s = createBroadcasterState();
    s = subscribeOp(s, 'sub1', null);
    s = unsubscribeOp(s, 'sub1');
    expect(broadcasterSubCount(s)).toBe(0);
  });

  it('should deliver to all subs', () => {
    let s = createBroadcasterState();
    s = subscribeOp(s, 'sub1', null);
    s = broadcastOp(s, 'alice', 'set');
    expect(deliveredCount(s, 'sub1')).toBe(1);
  });

  it('should filter by author', () => {
    let s = createBroadcasterState();
    s = subscribeOp(s, 'sub1', { authorId: 'alice' });
    s = broadcastOp(s, 'bob', 'set');
    expect(deliveredCount(s, 'sub1')).toBe(0);
  });

  it('should filter by kind', () => {
    let s = createBroadcasterState();
    s = subscribeOp(s, 'sub1', { opKind: 'add' });
    s = broadcastOp(s, 'alice', 'set');
    expect(deliveredCount(s, 'sub1')).toBe(0);
  });

  it('should increment totalBroadcasts', () => {
    let s = createBroadcasterState();
    s = broadcastOp(s, 'alice', 'set');
    expect(s.totalBroadcasts).toBe(1);
  });

  it('should compute health', () => {
    let s = createBroadcasterState();
    s = broadcastOp(s, 'alice', 'set');
    const h = broadcasterHealth(s);
    expect(h.health).toBe(1);
  });
});
