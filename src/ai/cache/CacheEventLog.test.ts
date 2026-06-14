import { describe, it, expect } from 'vitest';
import { createCacheEventLogState, appendCacheEvent, eventsForKey, eventsByKind, replayFromSeq, truncateCacheLog, cacheEventLogCount, cacheEventLogHealth } from './CacheEventLog';

describe('V2252 CacheEventLog', () => {
  it('should create empty log', () => {
    const s = createCacheEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event', () => {
    let s = createCacheEventLogState();
    s = appendCacheEvent(s, 'set', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should query by key', () => {
    let s = createCacheEventLogState();
    s = appendCacheEvent(s, 'set', 'k1');
    s = appendCacheEvent(s, 'set', 'k2');
    expect(eventsForKey(s, 'k1')).toHaveLength(1);
  });

  it('should query by kind', () => {
    let s = createCacheEventLogState();
    s = appendCacheEvent(s, 'set', 'k1');
    s = appendCacheEvent(s, 'get', 'k1');
    expect(eventsByKind(s, 'set')).toHaveLength(1);
  });

  it('should replay from seq', () => {
    let s = createCacheEventLogState();
    s = appendCacheEvent(s, 'set', 'k1');
    s = appendCacheEvent(s, 'set', 'k2');
    s = appendCacheEvent(s, 'set', 'k3');
    expect(replayFromSeq(s, 2)).toHaveLength(2);
  });

  it('should truncate', () => {
    let s = createCacheEventLogState();
    for (let i = 0; i < 5; i++) s = appendCacheEvent(s, 'set', `k${i}`);
    s = truncateCacheLog(s, 2);
    expect(cacheEventLogCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createCacheEventLogState();
    const h = cacheEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
