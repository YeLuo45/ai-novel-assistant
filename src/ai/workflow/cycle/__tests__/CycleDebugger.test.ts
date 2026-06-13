import { describe, it, expect } from 'vitest';
import {
  createDebugger,
  recordFrame,
  setBreakpoint,
  clearBreakpoint,
  shouldPause,
  pause,
  resume,
  isPaused,
  replayFrames,
  describeSnapshot,
  findFrameByIteration,
} from '../CycleDebugger';
import type { DirectedGraph } from '../TarjanSCCCore';

describe('CycleDebugger - recordFrame', () => {
  it('records frames with monotonic ids', () => {
    const dbg = createDebugger('c1');
    recordFrame(dbg, 'a', ['a'], 1, 'first', () => 1000);
    recordFrame(dbg, 'b', ['a', 'b'], 2, 'second', () => 1100);
    expect(dbg.frames.length).toBe(2);
    expect(dbg.frames[0].id).toBe(1);
  });

  it('copies visitedNodes defensively', () => {
    const dbg = createDebugger('c1');
    const visited = ['a'];
    recordFrame(dbg, 'a', visited, 1);
    visited.push('b');
    expect(dbg.frames[0].visitedNodes).toEqual(['a']);
  });
});

describe('CycleDebugger - breakpoints', () => {
  it('starts with no breakpoints', () => {
    const dbg = createDebugger('c1');
    expect(shouldPause(dbg, 'a')).toBe(false);
  });

  it('sets and clears breakpoints', () => {
    const dbg = createDebugger('c1');
    setBreakpoint(dbg, 'a');
    expect(shouldPause(dbg, 'a')).toBe(true);
    expect(shouldPause(dbg, 'b')).toBe(false);
    expect(clearBreakpoint(dbg, 'a')).toBe(true);
    expect(shouldPause(dbg, 'a')).toBe(false);
    expect(clearBreakpoint(dbg, 'a')).toBe(false);
  });

  it('returns false when currentNode is null', () => {
    const dbg = createDebugger('c1');
    setBreakpoint(dbg, 'a');
    expect(shouldPause(dbg, null)).toBe(false);
  });
});

describe('CycleDebugger - pause / resume', () => {
  it('tracks paused state', () => {
    const dbg = createDebugger('c1');
    expect(isPaused(dbg)).toBe(false);
    pause(dbg, () => 1000);
    expect(isPaused(dbg)).toBe(true);
    resume(dbg);
    expect(isPaused(dbg)).toBe(false);
  });
});

describe('CycleDebugger - replayFrames', () => {
  it('returns all frames from index', () => {
    const dbg = createDebugger('c1');
    recordFrame(dbg, 'a', [], 1);
    recordFrame(dbg, 'b', [], 2);
    recordFrame(dbg, 'c', [], 3);
    expect(replayFrames(dbg).length).toBe(3);
    expect(replayFrames(dbg, 1).length).toBe(2);
  });
});

describe('CycleDebugger - describeSnapshot', () => {
  it('includes cycle id and SCC count', () => {
    const dbg = createDebugger('c1');
    const g: DirectedGraph = {
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
    };
    const s = describeSnapshot(dbg, g);
    expect(s).toContain('c1');
    expect(s).toContain('nontrivial: 1');
  });
});

describe('CycleDebugger - findFrameByIteration', () => {
  it('returns frame with matching iteration', () => {
    const dbg = createDebugger('c1');
    recordFrame(dbg, 'a', [], 1);
    recordFrame(dbg, 'b', [], 2);
    expect(findFrameByIteration(dbg, 2)?.currentNode).toBe('b');
    expect(findFrameByIteration(dbg, 99)).toBeNull();
  });
});

describe('CycleDebugger - default now() / default note clocks', () => {
  it('uses default `now` and default `note` for recordFrame', () => {
    // Exercises both the default `note = ''` and the default `now = Date.now`.
    const dbg = createDebugger('c1');
    const f1 = recordFrame(dbg, 'a', [], 1);
    expect(f1.note).toBe('');
    expect(typeof f1.timestamp).toBe('number');
  });

  it('uses default `now` for pause', () => {
    // Exercises the default `now = Date.now` in `pause(dbg)`.
    const dbg = createDebugger('c1');
    pause(dbg);
    expect(isPaused(dbg)).toBe(true);
  });
});
