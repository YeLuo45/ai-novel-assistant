import { describe, it, expect } from 'vitest';
import { createCacheReflectorState, reflectOnCache, cacheReflectionsForPeriod, avgHitRate, lowHitRatePeriods, cacheReflectorHealth } from './CacheReflector';

describe('V2262 CacheReflector', () => {
  it('should create empty state', () => {
    const s = createCacheReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createCacheReflectorState();
    s = reflectOnCache(s, 'p1', 0.8, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by period', () => {
    let s = createCacheReflectorState();
    s = reflectOnCache(s, 'p1', 0.5, []);
    s = reflectOnCache(s, 'p2', 0.7, []);
    expect(cacheReflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg hit rate', () => {
    let s = createCacheReflectorState();
    s = reflectOnCache(s, 'p1', 0.4, []);
    s = reflectOnCache(s, 'p1', 0.6, []);
    expect(avgHitRate(s, 'p1')).toBeCloseTo(0.5);
  });

  it('should find low-hit-rate periods', () => {
    let s = createCacheReflectorState();
    s = reflectOnCache(s, 'p1', 0.1, []);
    s = reflectOnCache(s, 'p2', 0.9, []);
    expect(lowHitRatePeriods(s, 0.5)).toEqual(['p1']);
  });

  it('should compute health', () => {
    let s = createCacheReflectorState();
    s = reflectOnCache(s, 'p1', 0.5, []);
    const h = cacheReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
