import { describe, it, expect } from 'vitest';
import { createWatcherState, addWatch, removeWatch, fireEvent, watchCount, getFireCount, watchesForMemory, memoryWatcherHealth } from './MemoryWatcher';

describe('V2163 MemoryWatcher', () => {
  it('should create empty state', () => {
    const s = createWatcherState();
    expect(watchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    expect(watchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    s = removeWatch(s, 'w1');
    expect(watchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    s = fireEvent(s, 'update', 'm1');
    expect(getFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    s = fireEvent(s, 'delete', 'm1');
    expect(getFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching memory', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    s = fireEvent(s, 'update', 'm2');
    expect(getFireCount(s, 'w1')).toBe(0);
  });

  it('should find watches for memory', () => {
    let s = createWatcherState();
    s = addWatch(s, 'w1', 'm1', ['update'], () => {});
    s = addWatch(s, 'w2', 'm2', ['update'], () => {});
    expect(watchesForMemory(s, 'm1')).toHaveLength(1);
  });

  it('should compute health', () => {
    const s = createWatcherState();
    const h = memoryWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
