import { describe, it, expect } from 'vitest';
import { createMemoryReflectorState, reflect, reflectionsForMemory, reflectionsForPeriod, avgEffectiveness, lowPerformingMems, memoryReflectorHealth } from './MemoryReflector';

describe('V2172 MemoryReflector', () => {
  it('should create empty state', () => {
    const s = createMemoryReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.8, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by memory', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.5, []);
    s = reflect(s, 'm2', 'p1', 0.7, []);
    expect(reflectionsForMemory(s, 'm1')).toHaveLength(1);
  });

  it('should query by period', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.5, []);
    s = reflect(s, 'm1', 'p2', 0.7, []);
    expect(reflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg effectiveness', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.6, []);
    s = reflect(s, 'm1', 'p2', 0.8, []);
    expect(avgEffectiveness(s, 'm1')).toBeCloseTo(0.7);
  });

  it('should find low-performing memories', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.1, []);
    s = reflect(s, 'm2', 'p1', 0.9, []);
    expect(lowPerformingMems(s, 0.3)).toEqual(['m1']);
  });

  it('should compute health', () => {
    let s = createMemoryReflectorState();
    s = reflect(s, 'm1', 'p1', 0.5, []);
    const h = memoryReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
