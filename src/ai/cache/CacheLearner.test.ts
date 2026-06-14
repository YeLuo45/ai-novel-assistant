import { describe, it, expect } from 'vitest';
import { createCacheLearnerState, createCacheRule, recordCacheHit, recordCacheMiss, getCachePriority, topCacheKeys, setCacheLearningRate, cacheLearnerHealth } from './CacheLearner';

describe('V2261 CacheLearner', () => {
  it('should create empty state', () => {
    const s = createCacheLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createCacheLearnerState();
    s = createCacheRule(s, 'k1');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit', () => {
    let s = createCacheLearnerState(0.1);
    s = createCacheRule(s, 'k1', 0.5);
    s = recordCacheHit(s, 'k1');
    expect(getCachePriority(s, 'k1')).toBe(0.6);
  });

  it('should record miss', () => {
    let s = createCacheLearnerState(0.1);
    s = createCacheRule(s, 'k1', 0.5);
    s = recordCacheMiss(s, 'k1');
    expect(getCachePriority(s, 'k1')).toBe(0.4);
  });

  it('should clamp weight 0-1', () => {
    let s = createCacheLearnerState(0.1);
    s = createCacheRule(s, 'k1', 0.95);
    s = recordCacheHit(s, 'k1');
    expect(getCachePriority(s, 'k1')).toBe(1);
  });

  it('should return default for unknown', () => {
    const s = createCacheLearnerState();
    expect(getCachePriority(s, 'nope')).toBe(0.5);
  });

  it('should rank top keys', () => {
    let s = createCacheLearnerState(0.1);
    s = createCacheRule(s, 'a', 0.3);
    s = createCacheRule(s, 'b', 0.8);
    const top = topCacheKeys(s, 2);
    expect(top[0].key).toBe('b');
  });

  it('should set learning rate', () => {
    let s = createCacheLearnerState();
    s = setCacheLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createCacheLearnerState();
    s = createCacheRule(s, 'k1');
    const h = cacheLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
