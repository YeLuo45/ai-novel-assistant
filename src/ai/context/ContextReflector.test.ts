import { describe, it, expect } from 'vitest';
import { createContextReflectorState, reflectOnContext, contextReflectionsForPeriod, avgContextRelevance, lowContextRelevancePeriods, contextReflectorHealth } from './ContextReflector';

describe('V2292 ContextReflector', () => {
  it('should create empty state', () => {
    const s = createContextReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createContextReflectorState();
    s = reflectOnContext(s, 'p1', 0.7, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by period', () => {
    let s = createContextReflectorState();
    s = reflectOnContext(s, 'p1', 0.5, []);
    s = reflectOnContext(s, 'p2', 0.7, []);
    expect(contextReflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg relevance', () => {
    let s = createContextReflectorState();
    s = reflectOnContext(s, 'p1', 0.4, []);
    s = reflectOnContext(s, 'p1', 0.6, []);
    expect(avgContextRelevance(s, 'p1')).toBeCloseTo(0.5);
  });

  it('should find low-relevance periods', () => {
    let s = createContextReflectorState();
    s = reflectOnContext(s, 'p1', 0.1, []);
    s = reflectOnContext(s, 'p2', 0.9, []);
    expect(lowContextRelevancePeriods(s, 0.3)).toEqual(['p1']);
  });

  it('should compute health', () => {
    let s = createContextReflectorState();
    s = reflectOnContext(s, 'p1', 0.5, []);
    const h = contextReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
