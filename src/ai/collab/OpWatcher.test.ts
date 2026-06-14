import { describe, it, expect } from 'vitest';
import { createOpWatcherState, addOpWatch, removeOpWatch, fireOpWatch, opWatchCount, opWatchFireCount, opWatcherHealth } from './OpWatcher';

describe('V2223 OpWatcher', () => {
  it('should create empty state', () => {
    const s = createOpWatcherState();
    expect(opWatchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createOpWatcherState();
    s = addOpWatch(s, 'w1', 'op1', ['enqueue']);
    expect(opWatchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createOpWatcherState();
    s = addOpWatch(s, 'w1', 'op1', ['enqueue']);
    s = removeOpWatch(s, 'w1');
    expect(opWatchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createOpWatcherState();
    s = addOpWatch(s, 'w1', 'op1', ['enqueue']);
    s = fireOpWatch(s, 'enqueue', 'op1');
    expect(opWatchFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createOpWatcherState();
    s = addOpWatch(s, 'w1', 'op1', ['enqueue']);
    s = fireOpWatch(s, 'apply', 'op1');
    expect(opWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching op', () => {
    let s = createOpWatcherState();
    s = addOpWatch(s, 'w1', 'op1', ['enqueue']);
    s = fireOpWatch(s, 'enqueue', 'op2');
    expect(opWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should compute health', () => {
    const s = createOpWatcherState();
    const h = opWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
