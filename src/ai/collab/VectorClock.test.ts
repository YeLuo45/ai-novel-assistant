import { describe, it, expect } from 'vitest';
import { createVectorClockState, tickClock, mergeClocks, compareClocks, getClock, ownerCount, vectorClockHealth } from './VectorClock';

describe('V2211 VectorClock', () => {
  it('should create empty state', () => {
    const s = createVectorClockState();
    expect(ownerCount(s)).toBe(0);
  });

  it('should tick clock', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'owner1', 'proc1');
    expect(getClock(s, 'owner1').get('proc1')).toBe(1);
  });

  it('should tick multiple times', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'owner1', 'proc1');
    s = tickClock(s, 'owner1', 'proc1');
    expect(getClock(s, 'owner1').get('proc1')).toBe(2);
  });

  it('should merge clocks', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'a', 'p1');
    s = tickClock(s, 'b', 'p1');
    s = tickClock(s, 'b', 'p2');
    s = mergeClocks(s, 'a', 'b', 'merged');
    expect(getClock(s, 'merged').get('p1')).toBe(1);
    expect(getClock(s, 'merged').get('p2')).toBe(1);
  });

  it('should compare equal', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'a', 'p1');
    s = tickClock(s, 'b', 'p1');
    expect(compareClocks(s, 'a', 'b')).toBe('equal');
  });

  it('should compare before/after', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'a', 'p1');
    s = tickClock(s, 'b', 'p1');
    s = tickClock(s, 'b', 'p1');
    expect(compareClocks(s, 'a', 'b')).toBe('before');
  });

  it('should detect concurrent', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'a', 'p1');
    s = tickClock(s, 'b', 'p2');
    expect(compareClocks(s, 'a', 'b')).toBe('concurrent');
  });

  it('should compute health', () => {
    let s = createVectorClockState();
    s = tickClock(s, 'a', 'p1');
    const h = vectorClockHealth(s);
    expect(h.health).toBe(1);
  });
});
