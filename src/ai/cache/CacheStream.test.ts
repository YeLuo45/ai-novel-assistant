import { describe, it, expect } from 'vitest';
import { createCacheStreamState, publishCacheEvent, subscribeCache, unsubscribeCache, cacheEventsForTopic, cacheStreamHealth } from './CacheStream';

describe('V2246 CacheStream', () => {
  it('should create empty state', () => {
    const s = createCacheStreamState();
    expect(s.events).toEqual([]);
  });

  it('should publish event', () => {
    let s = createCacheStreamState();
    s = publishCacheEvent(s, 'cache.set', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should subscribe', () => {
    let s = createCacheStreamState();
    s = subscribeCache(s, 'sub1', 'cache.set');
    expect(s.subs.size).toBe(1);
  });

  it('should deliver to subs', () => {
    let s = createCacheStreamState();
    s = subscribeCache(s, 'sub1', 'cache.set');
    s = publishCacheEvent(s, 'cache.set', 'k1');
    expect(s.delivered.get('sub1')).toBe(1);
  });

  it('should unsubscribe', () => {
    let s = createCacheStreamState();
    s = subscribeCache(s, 'sub1', 'cache.set');
    s = unsubscribeCache(s, 'sub1');
    expect(s.subs.size).toBe(0);
  });

  it('should query by topic', () => {
    let s = createCacheStreamState();
    s = publishCacheEvent(s, 'cache.set', 'k1');
    s = publishCacheEvent(s, 'cache.del', 'k2');
    expect(cacheEventsForTopic(s, 'cache.set')).toHaveLength(1);
  });

  it('should compute health', () => {
    const s = createCacheStreamState();
    const h = cacheStreamHealth(s);
    expect(h.health).toBe(0.5);
  });
});
