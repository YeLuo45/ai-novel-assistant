import { describe, it, expect } from 'vitest';
import { createBackpressureState, canEnqueue, enqueueOp, completeOp, forceResume, backpressureHealth } from './OpBackpressure';

describe('V2218 OpBackpressure', () => {
  it('should create state', () => {
    const s = createBackpressureState(10);
    expect(s.inFlight).toBe(0);
  });

  it('should allow enqueue initially', () => {
    const s = createBackpressureState(10);
    expect(canEnqueue(s)).toBe(true);
  });

  it('should enqueue op', () => {
    const s = enqueueOp(createBackpressureState(10));
    expect(s.inFlight).toBe(1);
  });

  it('should pause at high water mark', () => {
    let s = createBackpressureState(10);
    for (let i = 0; i < 8; i++) s = enqueueOp(s);
    expect(s.paused).toBe(true);
  });

  it('should complete op', () => {
    let s = createBackpressureState(10);
    s = enqueueOp(s);
    s = completeOp(s);
    expect(s.inFlight).toBe(0);
  });

  it('should force resume', () => {
    let s = createBackpressureState(10);
    s = { ...s, paused: true };
    s = forceResume(s);
    expect(s.paused).toBe(false);
  });

  it('should throttle when paused', () => {
    let s = createBackpressureState(10);
    for (let i = 0; i < 10; i++) s = enqueueOp(s);
    s = { ...s, paused: true };
    s = enqueueOp(s);
    expect(s.totalThrottled).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createBackpressureState(10);
    s = enqueueOp(s);
    s = completeOp(s);
    const h = backpressureHealth(s);
    expect(h.health).toBe(1);
  });
});
