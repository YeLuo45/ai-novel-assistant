import { describe, it, expect } from 'vitest';
import {
  hasCycles,
  runE2EScenario,
  assertScenarioValid,
  describeScenario,
} from '../CycleEndToEndTest';

describe('CycleEndToEndTest - hasCycles', () => {
  it('returns true for cyclic graph', () => {
    expect(
      hasCycles({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
      })
    ).toBe(true);
  });

  it('returns false for acyclic graph', () => {
    expect(
      hasCycles({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }],
      })
    ).toBe(false);
  });
});

describe('CycleEndToEndTest - runE2EScenario', () => {
  it('reports no-cycles when graph is acyclic', () => {
    const r = runE2EScenario({
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }],
      },
      maxIterations: 5,
      maxTokens: 1000,
      maxMs: 1000,
    });
    expect(r.terminated).toBe(true);
    expect(r.terminationReason).toBe('no-cycles');
  });

  it('runs iterations until maxIterations on a cyclic graph', () => {
    const r = runE2EScenario({
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
      },
      maxIterations: 3,
      maxTokens: 100_000,
      maxMs: 100_000,
    });
    expect(r.cycleDetected).toBe(true);
    expect(r.ranIterations).toBe(3);
    expect(r.terminationReason).toBe('completed');
  });

  it('terminates with budget when tokens exhausted', () => {
    const r = runE2EScenario({
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
      },
      maxIterations: 100,
      maxTokens: 250, // 100 tokens/iter * 3 = 300 > 250
      maxMs: 100_000,
    });
    expect(r.terminationReason).toBe('budget');
  });

  it('terminates with sanitizer when time exceeded', () => {
    let now = 0;
    const r = runE2EScenario(
      {
        graph: {
          nodes: [{ id: 'a' }, { id: 'b' }],
          edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
        },
        maxIterations: 100,
        maxTokens: 100_000,
        maxMs: 50,
      },
      {
        now: () => {
          now += 100;
          return now;
        },
      }
    );
    expect(r.terminationReason).toBe('sanitizer');
  });

  it('reports completed when iterations hit max without budget or time cap', () => {
    // After the in-flight iteration budget check, when neither budget nor
    // sanitizer fired, we always reach maxIterations → 'completed'.
    const r = runE2EScenario({
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
      },
      maxIterations: 4,
      maxTokens: 100_000,
      maxMs: 100_000,
    });
    expect(r.terminationReason).toBe('completed');
    expect(r.ranIterations).toBe(4);
    expect(r.terminated).toBe(true);
  });
});

describe('CycleEndToEndTest - assertScenarioValid', () => {
  it('returns no errors for valid scenario', () => {
    expect(
      assertScenarioValid({
        graph: { nodes: [{ id: 'a' }], edges: [] },
        maxIterations: 1,
        maxTokens: 100,
        maxMs: 100,
      })
    ).toEqual([]);
  });

  it('flags missing graph.nodes', () => {
    expect(
      assertScenarioValid({
        graph: { edges: [] } as never,
        maxIterations: 1,
        maxTokens: 0,
        maxMs: 0,
      }).length
    ).toBeGreaterThan(0);
  });

  it('flags invalid maxIterations', () => {
    expect(
      assertScenarioValid({
        graph: { nodes: [{ id: 'a' }], edges: [] },
        maxIterations: 0,
        maxTokens: 0,
        maxMs: 0,
      }).length
    ).toBeGreaterThan(0);
  });

  it('flags negative maxTokens', () => {
    expect(
      assertScenarioValid({
        graph: { nodes: [{ id: 'a' }], edges: [] },
        maxIterations: 1,
        maxTokens: -1,
        maxMs: 0,
      }).length
    ).toBeGreaterThan(0);
  });

  it('flags negative maxMs', () => {
    expect(
      assertScenarioValid({
        graph: { nodes: [{ id: 'a' }], edges: [] },
        maxIterations: 1,
        maxTokens: 0,
        maxMs: -1,
      }).length
    ).toBeGreaterThan(0);
  });

  it('flags missing graph.edges', () => {
    expect(
      assertScenarioValid({
        graph: { nodes: [{ id: 'a' }] } as never,
        maxIterations: 1,
        maxTokens: 0,
        maxMs: 0,
      }).length
    ).toBeGreaterThan(0);
  });
});

describe('CycleEndToEndTest - describeScenario', () => {
  it('returns a summary string', () => {
    const s = describeScenario({
      graph: { nodes: [{ id: 'a' }], edges: [] },
      maxIterations: 5,
      maxTokens: 100,
      maxMs: 1000,
    });
    expect(s).toContain('maxIter=5');
    expect(s).toContain('maxTokens=100');
  });
});
