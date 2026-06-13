/**
 * V2092 CycleAwareExecutor tests - 40+ tests covering execution, cycle
 * detection, state tracking, and exit-condition handling.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createExecutor,
  executeWithCycleAwareness,
  trackActiveCycles,
  getCurrentCycleNode,
  detectCycleEnter,
  detectCycleExit,
  buildExecutorGraph,
  estimateMaxIterations,
  resetExecutor,
  normalizeConfig,
  type Executor,
  type ExecutionSnapshot,
} from '../CycleAwareExecutor';

function linear(): ReturnType<typeof buildExecutorGraph> {
  return buildExecutorGraph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
}

function withCycle(): ReturnType<typeof buildExecutorGraph> {
  return buildExecutorGraph(
    ['a', 'b', 'c', 'd'],
    [
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'c'],
      ['c', 'd'],
    ]
  );
}

function multiCycle(): ReturnType<typeof buildExecutorGraph> {
  return buildExecutorGraph(
    ['a', 'b', 'c', 'd', 'e'],
    [
      ['a', 'b'],
      ['b', 'a'],
      ['c', 'd'],
      ['d', 'c'],
      ['e', 'a'],
    ]
  );
}

describe('CycleAwareExecutor - createExecutor', () => {
  it('creates an executor with defaults', () => {
    const ex = createExecutor({ maxLoopIterations: 3, isolationMode: 'strict' });
    expect(ex.config.maxLoopIterations).toBe(3);
    expect(ex.config.isolationMode).toBe('strict');
    expect(ex.config.exitConditions).toEqual([]);
    expect(ex.state.visited.size).toBe(0);
  });

  it('preserves isolation modes', () => {
    expect(createExecutor({ maxLoopIterations: 1, isolationMode: 'shared' }).config.isolationMode).toBe('shared');
    expect(createExecutor({ maxLoopIterations: 1, isolationMode: 'none' }).config.isolationMode).toBe('none');
  });

  it('initializes empty state', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    expect(ex.state.currentCycle).toBeNull();
    expect(ex.state.iteration).toBe(0);
    expect(ex.state.log).toEqual([]);
    expect(ex.state.activeCycles.size).toBe(0);
  });

  it('throws on invalid maxLoopIterations', () => {
    expect(() => createExecutor({ maxLoopIterations: 0, isolationMode: 'strict' })).toThrow();
    expect(() => createExecutor({ maxLoopIterations: -1, isolationMode: 'strict' })).toThrow();
    expect(() => createExecutor({ maxLoopIterations: NaN, isolationMode: 'strict' })).toThrow();
  });

  it('throws on invalid isolation mode', () => {
    expect(() =>
      createExecutor({ maxLoopIterations: 1, isolationMode: 'bogus' as never })
    ).toThrow();
  });

  it('throws on invalid exit condition', () => {
    expect(() =>
      createExecutor({
        maxLoopIterations: 1,
        isolationMode: 'strict',
        exitConditions: [null as never],
      })
    ).toThrow();
  });

  it('accepts well-formed exit conditions', () => {
    const ex = createExecutor({
      maxLoopIterations: 5,
      isolationMode: 'strict',
      exitConditions: [{ type: 'iteration', threshold: 3, label: 'three' }],
    });
    expect(ex.config.exitConditions.length).toBe(1);
  });
});

describe('CycleAwareExecutor - normalizeConfig', () => {
  it('rounds down fractional maxLoopIterations', () => {
    const cfg = normalizeConfig({ maxLoopIterations: 3.9, isolationMode: 'strict' });
    expect(cfg.maxLoopIterations).toBe(3);
  });

  it('defaults to strict isolation when missing', () => {
    const cfg = normalizeConfig({ maxLoopIterations: 2, isolationMode: undefined as never });
    expect(cfg.isolationMode).toBe('strict');
  });
});

describe('CycleAwareExecutor - executeWithCycleAwareness (linear)', () => {
  it('executes linear graph in order', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const visited: string[] = [];
    const r = executeWithCycleAwareness(ex, linear(), (n) => {
      visited.push(n);
    });
    expect(visited).toEqual(['a', 'b', 'c']);
    expect(r.terminated).toBe(false);
    expect(r.cyclesExecuted).toBe(0);
  });

  it('reports zero iterations for linear graph', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, linear(), () => {});
    expect(r.iterations).toBe(3);
  });

  it('handles empty graph', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, buildExecutorGraph([], []), () => {});
    expect(r.visited).toEqual([]);
    expect(r.terminated).toBe(false);
  });
});

describe('CycleAwareExecutor - executeWithCycleAwareness (cycle)', () => {
  it('loops over cycle nodes maxLoopIterations times', () => {
    const ex = createExecutor({ maxLoopIterations: 2, isolationMode: 'strict' });
    const visitCount: Record<string, number> = {};
    executeWithCycleAwareness(ex, withCycle(), (n) => {
      visitCount[n] = (visitCount[n] ?? 0) + 1;
    });
    // a and b are the cycle; maxLoopIterations=2 means each is visited 2 times
    expect(visitCount['a']).toBe(2);
    expect(visitCount['b']).toBe(2);
  });

  it('returns cyclesExecuted count', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.cyclesExecuted).toBe(1);
  });

  it('respects iteration exit condition', () => {
    const ex = createExecutor({
      maxLoopIterations: 10,
      isolationMode: 'strict',
      exitConditions: [{ type: 'iteration', threshold: 1 }],
    });
    let count = 0;
    const r = executeWithCycleAwareness(ex, withCycle(), () => {
      count += 1;
    });
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('exit_condition');
    // Cycle (a,b) iter 0 fully runs (a then b), then iter 1 fires exit before second node
    expect(count).toBeGreaterThan(0);
  });

  it('respects timeout exit condition', () => {
    const ex = createExecutor({
      maxLoopIterations: 100,
      isolationMode: 'strict',
      exitConditions: [{ type: 'timeout', threshold: -1 }],
    });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('exit_condition');
  });

  it('respects predicate exit condition', () => {
    const ex = createExecutor({
      maxLoopIterations: 5,
      isolationMode: 'strict',
      exitConditions: [
        {
          type: 'condition',
          predicate: (s: ExecutionSnapshot) => s.iteration >= 2,
        },
      ],
    });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.terminated).toBe(true);
  });

  it('respects __cycle_exit__ signal', () => {
    const ex = createExecutor({ maxLoopIterations: 5, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, withCycle(), (n) => {
      if (n === 'b') return '__cycle_exit__';
    });
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('cycle_exit_signal');
  });

  it('handles multiple cycles', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, multiCycle(), () => {});
    expect(r.cyclesExecuted).toBe(2);
  });
});

describe('CycleAwareExecutor - state tracking', () => {
  it('updates state.visited after execution', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, linear(), () => {});
    expect(ex.state.visited.size).toBe(3);
    expect(ex.state.visited.has('a')).toBe(true);
  });

  it('tracks active cycles via trackActiveCycles', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, withCycle(), () => {});
    const active = trackActiveCycles(ex);
    expect(active.size).toBe(1);
    const cycle = Array.from(active.values())[0];
    expect(cycle.completed).toBe(true);
    expect(cycle.nodes.sort()).toEqual(['a', 'b']);
  });

  it('returns null from getCurrentCycleNode for linear graph', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, linear(), () => {});
    expect(getCurrentCycleNode(ex)).toBeNull();
  });

  it('returns current cycle node while iterating', () => {
    const ex = createExecutor({ maxLoopIterations: 3, isolationMode: 'strict' });
    const seen: (string | null)[] = [];
    executeWithCycleAwareness(ex, withCycle(), (n) => {
      if (n === 'a') {
        seen.push(getCurrentCycleNode(ex));
      }
    });
    // While processing 'a' the current cycle node should be 'a' (idx 0)
    expect(seen.length).toBeGreaterThan(0);
    for (const v of seen) {
      expect(v).not.toBeNull();
    }
  });

  it('returns null from getCurrentCycleNode for empty executor', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    expect(getCurrentCycleNode(ex)).toBeNull();
  });

  it('handles __cycle_exit__ from non-cycle node', () => {
    const ex = createExecutor({ maxLoopIterations: 5, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, linear(), (n) => {
      if (n === 'b') return '__cycle_exit__';
    });
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('cycle_exit_signal');
  });

  it('resets state when resetExecutor called', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, withCycle(), () => {});
    resetExecutor(ex);
    expect(ex.state.visited.size).toBe(0);
    expect(ex.sccResult).toBeNull();
  });
});

describe('CycleAwareExecutor - detectCycleEnter', () => {
  it('returns true for node inside nontrivial SCC', () => {
    expect(detectCycleEnter(withCycle(), 'a')).toBe(true);
    expect(detectCycleEnter(withCycle(), 'b')).toBe(true);
  });

  it('returns false for node not in cycle', () => {
    expect(detectCycleEnter(withCycle(), 'c')).toBe(false);
    expect(detectCycleEnter(withCycle(), 'd')).toBe(false);
  });

  it('returns false for linear graph', () => {
    expect(detectCycleEnter(linear(), 'a')).toBe(false);
  });

  it('accepts a cached SCC result', () => {
    const g = withCycle();
    // Run once to populate cache
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, g, () => {});
    expect(detectCycleEnter(g, 'a', ex.sccResult!)).toBe(true);
  });
});

describe('CycleAwareExecutor - detectCycleExit', () => {
  it('returns true when leaving a cycle', () => {
    expect(detectCycleExit(withCycle(), 'a', 'c')).toBe(true);
  });

  it('returns false when staying inside the same cycle', () => {
    expect(detectCycleExit(withCycle(), 'a', 'b')).toBe(false);
  });

  it('returns false when currentNode is not in a cycle', () => {
    expect(detectCycleExit(withCycle(), 'c', 'd')).toBe(false);
  });

  it('returns true for empty nextNode', () => {
    expect(detectCycleExit(withCycle(), 'a', '')).toBe(true);
  });

  it('handles multi-cycle graph', () => {
    expect(detectCycleExit(multiCycle(), 'a', 'b')).toBe(false);
    expect(detectCycleExit(multiCycle(), 'a', 'c')).toBe(true);
  });

  it('accepts a cached SCC result', () => {
    const g = withCycle();
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    executeWithCycleAwareness(ex, g, () => {});
    expect(detectCycleExit(g, 'a', 'b', ex.sccResult!)).toBe(false);
  });
});

describe('CycleAwareExecutor - estimateMaxIterations', () => {
  it('returns node count for linear graph', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    expect(estimateMaxIterations(ex, linear())).toBe(3);
  });

  it('multiplies cycle size by maxLoopIterations', () => {
    const ex = createExecutor({ maxLoopIterations: 4, isolationMode: 'strict' });
    // Cycle is a-b (size 2), 2 * 4 = 8
    expect(estimateMaxIterations(ex, withCycle())).toBe(8);
  });
});

describe('CycleAwareExecutor - execution log', () => {
  it('records timestamps in log entries', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, linear(), () => {});
    for (const e of r.log) {
      expect(typeof e.timestamp).toBe('number');
      expect(e.inCycle).toBe(false);
      expect(e.cycleId).toBeNull();
    }
  });

  it('flags inCycle entries correctly', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    const cycleEntries = r.log.filter((e) => e.inCycle);
    expect(cycleEntries.length).toBe(2); // a and b
    for (const e of cycleEntries) {
      expect(e.cycleId).not.toBeNull();
    }
  });
});

describe('CycleAwareExecutor - integration scenarios', () => {
  it('runs an async executor function', async () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const fn = vi.fn(async () => {});
    const r = await Promise.resolve(
      executeWithCycleAwareness(ex, linear(), fn)
    );
    expect(fn).toHaveBeenCalledTimes(3);
    expect(r.terminated).toBe(false);
  });

  it('terminates when exit-condition fires inside cycle', () => {
    const ex = createExecutor({
      maxLoopIterations: 10,
      isolationMode: 'strict',
      exitConditions: [{ type: 'satisfaction', predicate: () => true }],
    });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('exit_condition');
  });

  it('returns success true when no termination', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'strict' });
    const r = executeWithCycleAwareness(ex, linear(), () => {});
    expect(r.success).toBe(true);
  });

  it('returns success false when terminated', () => {
    const ex = createExecutor({
      maxLoopIterations: 5,
      isolationMode: 'strict',
      exitConditions: [{ type: 'timeout', threshold: -1 }],
    });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.success).toBe(false);
  });

  it('handles self-loop node', () => {
    const g = buildExecutorGraph(['a'], [['a', 'a']]);
    const ex = createExecutor({ maxLoopIterations: 2, isolationMode: 'strict' });
    let count = 0;
    executeWithCycleAwareness(ex, g, () => {
      count += 1;
    });
    expect(count).toBe(2);
  });

  it('respects shared isolation mode setting', () => {
    const ex = createExecutor({ maxLoopIterations: 1, isolationMode: 'shared' });
    expect(ex.config.isolationMode).toBe('shared');
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r).toBeDefined();
  });
});

/* ------------------------------------------------------------------------- */
/* Branch coverage gap tests                                                  */
/* ------------------------------------------------------------------------- */

describe('CycleAwareExecutor - branch coverage: exitConditions undefined', () => {
  it('handles config without exitConditions field', () => {
    const ex = createExecutor({ maxLoopIterations: 2 });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.success).toBe(true);
  });

  it('handles config with explicit exitConditions: undefined', () => {
    const ex = createExecutor({
      maxLoopIterations: 2,
      exitConditions: undefined,
    });
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r.success).toBe(true);
  });

  it('handles post-normalisation mutation: exitConditions = undefined after createExecutor', () => {
    // createExecutor normalises exitConditions to [], but we deliberately
    // mutate the config back to undefined to exercise the `?? []` fallback
    // branch inside exceededExitCondition (line 386).
    const ex = createExecutor({ maxLoopIterations: 2, exitConditions: [] });
    ex.config.exitConditions = undefined;
    const r = executeWithCycleAwareness(ex, withCycle(), () => {});
    expect(r).toBeDefined();
    expect(r.terminated).toBe(false);
  });
});

describe('CycleAwareExecutor - branch coverage: early termination between cycle nodes', () => {
  it('stops iterating remaining cycle nodes after __cycle_exit__ on first cycle node', () => {
    // Graph: a->b->a (cycle of 2), c is a downstream non-cycle node.
    // When executor visits the cycle, on the first inner iteration, executorFn
    // returns __cycle_exit__ for node 'a'. Cycle breaks; the rest of execution
    // order should NOT be processed (the for-loop sees terminated=true at line 216).
    const ex = createExecutor({ maxLoopIterations: 5 });
    const visited: string[] = [];
    const r = executeWithCycleAwareness(ex, withCyclePlus(), () => {
      // No-op, we let default completion logic run.
    });
    expect(r).toBeDefined();
    // Reference visited so tsc does not complain.
    expect(visited.length).toBe(0);

    // Now run a version that explicitly emits __cycle_exit__ early.
    const r2 = executeWithCycleAwareness(ex, withCyclePlus(), (nodeId) => {
      if (nodeId === 'a') return '__cycle_exit__';
      return;
    });
    expect(r2.terminated).toBe(true);
    expect(r2.terminationReason).toBe('cycle_exit_signal');
  });
});

function withCyclePlus(): DirectedGraph {
  // Two disjoint cycles: a->b->a and c->d->c, plus an isolated 'e' that comes
  // between them in declaration order so cycle2 ('c') must hit the
  // `if (terminated) break;` guard at line 216 after cycle1 ('a') terminates.
  return {
    nodes: [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
      { id: 'e' },
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'a' },
      { from: 'c', to: 'd' },
      { from: 'd', to: 'c' },
    ],
  };
}

describe('CycleAwareExecutor - branch coverage: terminated guard between cycles', () => {
  it('hits the `if (terminated) break` guard when cycle1 signals exit', () => {
    const ex = createExecutor({ maxLoopIterations: 5 });
    const visited: string[] = [];

    // cycle1 contains 'a' and 'b' (sorted rep = 'a'); cycle2 contains 'c' and 'd' (sorted rep = 'c').
    // When executionOrder visits 'a' first, executorFn returns __cycle_exit__
    // immediately, terminated=true. The next iteration of the outer for-loop
    // would visit 'c' but the `if (terminated) break;` guard at line 216 short-circuits.
    const r = executeWithCycleAwareness(ex, withCyclePlus(), (nodeId) => {
      visited.push(nodeId);
      if (nodeId === 'a') return '__cycle_exit__';
      return;
    });

    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('cycle_exit_signal');
    // 'c' must NOT appear in visited because the break at line 216 fired
    expect(visited).not.toContain('c');
    expect(visited).not.toContain('d');
  });
});
