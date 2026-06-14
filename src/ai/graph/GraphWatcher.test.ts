import { describe, it, expect } from 'vitest';
import { createGraphWatcherState, addGraphWatch, removeGraphWatch, fireGraphEvent, graphWatchCount, graphWatchFireCount, graphWatcherHealth } from './GraphWatcher';

describe('V2193 GraphWatcher', () => {
  it('should create empty state', () => {
    const s = createGraphWatcherState();
    expect(graphWatchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createGraphWatcherState();
    s = addGraphWatch(s, 'w1', 'n1', ['add']);
    expect(graphWatchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createGraphWatcherState();
    s = addGraphWatch(s, 'w1', 'n1', ['add']);
    s = removeGraphWatch(s, 'w1');
    expect(graphWatchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createGraphWatcherState();
    s = addGraphWatch(s, 'w1', 'n1', ['add']);
    s = fireGraphEvent(s, 'add', 'n1');
    expect(graphWatchFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createGraphWatcherState();
    s = addGraphWatch(s, 'w1', 'n1', ['add']);
    s = fireGraphEvent(s, 'remove', 'n1');
    expect(graphWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching node', () => {
    let s = createGraphWatcherState();
    s = addGraphWatch(s, 'w1', 'n1', ['add']);
    s = fireGraphEvent(s, 'add', 'n2');
    expect(graphWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should compute health', () => {
    const s = createGraphWatcherState();
    const h = graphWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
