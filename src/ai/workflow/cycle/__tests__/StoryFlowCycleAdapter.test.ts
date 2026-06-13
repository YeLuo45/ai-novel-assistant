import { describe, it, expect } from 'vitest';
import {
  mapStoryFlowToCycle,
  remapEdges,
  buildExecutionPlan,
  describeAdapter,
  isAdapterValid,
} from '../StoryFlowCycleAdapter';

describe('StoryFlowCycleAdapter - mapStoryFlowToCycle', () => {
  it('maps each flow node to a cycle node', () => {
    const flow = { id: 'flow1', nodes: [{ id: 'a' }, { id: 'b' }], edges: [] };
    const m = mapStoryFlowToCycle(flow, 'cyc1');
    expect(m.cycleId).toBe('cyc1');
    expect(m.nodeMap.get('a')).toBe('cyc1__a');
    expect(m.nodeMap.get('b')).toBe('cyc1__b');
    expect(m.cycleNodes).toEqual(['cyc1__a', 'cyc1__b']);
  });
});

describe('StoryFlowCycleAdapter - remapEdges', () => {
  it('remaps edges via nodeMap', () => {
    const flow = {
      id: 'flow1',
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ from: 'a', to: 'b' }],
    };
    const m = mapStoryFlowToCycle(flow, 'c');
    const edges = remapEdges(flow.edges, m.nodeMap);
    expect(edges).toEqual([{ from: 'c__a', to: 'c__b' }]);
  });

  it('drops edges referencing unknown nodes', () => {
    const flow = {
      id: 'flow1',
      nodes: [{ id: 'a' }],
      edges: [{ from: 'a', to: 'unknown' }],
    };
    const m = mapStoryFlowToCycle(flow, 'c');
    expect(remapEdges(flow.edges, m.nodeMap)).toEqual([]);
  });
});

describe('StoryFlowCycleAdapter - buildExecutionPlan', () => {
  it('returns mapping and remapped edges', () => {
    const flow = {
      id: 'f',
      nodes: [{ id: 'x' }, { id: 'y' }],
      edges: [{ from: 'x', to: 'y' }],
    };
    const plan = buildExecutionPlan(flow, 'cyc');
    expect(plan.mapping.flowId).toBe('f');
    expect(plan.remappedEdges.length).toBe(1);
  });
});

describe('StoryFlowCycleAdapter - describeAdapter', () => {
  it('produces a human-readable string', () => {
    const flow = { id: 'flow1', nodes: [{ id: 'a' }], edges: [] };
    const m = mapStoryFlowToCycle(flow, 'cyc1');
    const s = describeAdapter(m);
    expect(s).toContain('flow1');
    expect(s).toContain('cyc1');
  });
});

describe('StoryFlowCycleAdapter - isAdapterValid', () => {
  it('returns true for a valid flow', () => {
    expect(isAdapterValid({ id: 'f', nodes: [{ id: 'a' }], edges: [] })).toBe(true);
  });

  it('returns false for missing nodes array', () => {
    expect(isAdapterValid({ id: 'f' } as never)).toBe(false);
  });

  it('returns false for duplicate node ids', () => {
    expect(isAdapterValid({ id: 'f', nodes: [{ id: 'a' }, { id: 'a' }], edges: [] })).toBe(false);
  });

  it('returns false for edges referencing unknown nodes', () => {
    expect(
      isAdapterValid({ id: 'f', nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'x' }] })
    ).toBe(false);
  });
});
