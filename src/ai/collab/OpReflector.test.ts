import { describe, it, expect } from 'vitest';
import { createOpReflectorState, reflectOnOp, opReflectionsForPeriod, avgThroughput, lowThroughputPeriods, opReflectorHealth } from './OpReflector';

describe('V2232 OpReflector', () => {
  it('should create empty state', () => {
    const s = createOpReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createOpReflectorState();
    s = reflectOnOp(s, 'p1', 100, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by period', () => {
    let s = createOpReflectorState();
    s = reflectOnOp(s, 'p1', 100, []);
    s = reflectOnOp(s, 'p2', 200, []);
    expect(opReflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg throughput', () => {
    let s = createOpReflectorState();
    s = reflectOnOp(s, 'p1', 100, []);
    s = reflectOnOp(s, 'p1', 200, []);
    expect(avgThroughput(s, 'p1')).toBe(150);
  });

  it('should find low-throughput periods', () => {
    let s = createOpReflectorState();
    s = reflectOnOp(s, 'p1', 50, []);
    s = reflectOnOp(s, 'p2', 500, []);
    expect(lowThroughputPeriods(s, 100)).toEqual(['p1']);
  });

  it('should compute health', () => {
    let s = createOpReflectorState();
    s = reflectOnOp(s, 'p1', 100, []);
    const h = opReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
