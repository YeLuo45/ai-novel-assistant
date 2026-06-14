import { describe, it, expect } from 'vitest';
import { createContextWatcherState, addContextWatch, removeContextWatch, fireContextWatch, contextWatchCount, contextWatchFireCount, contextWatcherHealth } from './ContextWatcher';

describe('V2283 ContextWatcher', () => {
  it('should create empty state', () => {
    const s = createContextWatcherState();
    expect(contextWatchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createContextWatcherState();
    s = addContextWatch(s, 'w1', 'k1', ['add']);
    expect(contextWatchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createContextWatcherState();
    s = addContextWatch(s, 'w1', 'k1', ['add']);
    s = removeContextWatch(s, 'w1');
    expect(contextWatchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createContextWatcherState();
    s = addContextWatch(s, 'w1', 'k1', ['add']);
    s = fireContextWatch(s, 'add', 'k1');
    expect(contextWatchFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createContextWatcherState();
    s = addContextWatch(s, 'w1', 'k1', ['add']);
    s = fireContextWatch(s, 'delete', 'k1');
    expect(contextWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching key', () => {
    let s = createContextWatcherState();
    s = addContextWatch(s, 'w1', 'k1', ['add']);
    s = fireContextWatch(s, 'add', 'k2');
    expect(contextWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should compute health', () => {
    const s = createContextWatcherState();
    const h = contextWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
