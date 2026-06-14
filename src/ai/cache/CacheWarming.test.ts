import { describe, it, expect } from 'vitest';
import { createCacheWarmingState, addWarmingTask, startWarming, completeWarming, failWarming, isWarmed, warmedCount, cacheWarmingHealth } from './CacheWarming';

describe('V2249 CacheWarming', () => {
  it('should create empty state', () => {
    const s = createCacheWarmingState();
    expect(s.tasks.size).toBe(0);
  });

  it('should add task', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    expect(s.tasks.size).toBe(1);
  });

  it('should start warming', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    s = startWarming(s, 't1');
    expect(s.tasks.get('t1')?.status).toBe('warming');
  });

  it('should complete warming', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    s = startWarming(s, 't1');
    s = completeWarming(s, 't1');
    expect(isWarmed(s, 'k1')).toBe(true);
  });

  it('should fail warming', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    s = failWarming(s, 't1');
    expect(s.tasks.get('t1')?.status).toBe('failed');
  });

  it('should count warmed', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    s = completeWarming(s, 't1');
    expect(warmedCount(s)).toBe(1);
  });

  it('should not warmed unknown', () => {
    const s = createCacheWarmingState();
    expect(isWarmed(s, 'nope')).toBe(false);
  });

  it('should compute health', () => {
    let s = createCacheWarmingState();
    s = addWarmingTask(s, 't1', 'k1');
    s = completeWarming(s, 't1');
    const h = cacheWarmingHealth(s);
    expect(h.health).toBe(1);
  });
});
