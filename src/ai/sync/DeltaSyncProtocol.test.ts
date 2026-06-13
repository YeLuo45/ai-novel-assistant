import { describe, it, expect } from 'vitest';
import {
  createDeltaState,
  tickClock,
  appendOp,
  opsSince,
  mergeDelta,
  compareClocks,
  compactLog,
  opsByAspect,
} from './DeltaSyncProtocol';

describe('V2118 DeltaSyncProtocol', () => {
  it('should create empty delta state', () => {
    const s = createDeltaState();
    expect(s.ops).toEqual([]);
    expect(s.lastAppliedOpId).toBe('');
  });

  it('should tick vector clock per node', () => {
    const c1 = tickClock({}, 'nodeA');
    const c2 = tickClock(c1, 'nodeA');
    expect(c2['nodeA']).toBe(2);
  });

  it('should append op with auto timestamp', () => {
    const s = appendOp(createDeltaState(), {
      opId: 'op1',
      entityId: 'e1',
      aspect: 'create',
      payload: { x: 1 },
      vectorClock: { nodeA: 1 },
    });
    expect(s.ops).toHaveLength(1);
    expect(s.lastAppliedOpId).toBe('op1');
  });

  it('should filter ops newer than since clock', () => {
    let s = createDeltaState();
    s = appendOp(s, { opId: 'a', entityId: 'e1', aspect: 'update', payload: {}, vectorClock: { nodeA: 1 } });
    s = appendOp(s, { opId: 'b', entityId: 'e1', aspect: 'update', payload: {}, vectorClock: { nodeA: 2 } });
    const newer = opsSince(s, { nodeA: 1 });
    expect(newer).toHaveLength(1);
    expect(newer[0].opId).toBe('b');
  });

  it('should merge remote delta with new ops', () => {
    let s = createDeltaState();
    s = appendOp(s, { opId: 'a', entityId: 'e1', aspect: 'update', payload: {}, vectorClock: { nodeA: 1 } });
    const remote = [{
      opId: 'b', entityId: 'e2', aspect: 'create' as const, payload: {},
      vectorClock: { nodeB: 1 }, timestamp: Date.now(),
    }];
    const merged = mergeDelta(s, remote);
    expect(merged.ops).toHaveLength(2);
    expect(merged.lastAppliedOpId).toBe('b');
  });

  it('should preserve lastAppliedOpId when remote is empty', () => {
    let s = createDeltaState();
    s = appendOp(s, { opId: 'a', entityId: 'e1', aspect: 'update', payload: {}, vectorClock: { nodeA: 1 } });
    const merged = mergeDelta(s, []);
    expect(merged.lastAppliedOpId).toBe('a');
  });

  it('should merge remote delta without duplicating', () => {
    let s = createDeltaState();
    s = appendOp(s, { opId: 'a', entityId: 'e1', aspect: 'update', payload: {}, vectorClock: { nodeA: 1 } });
    const remote = [{
      opId: 'a', entityId: 'e1', aspect: 'update' as const, payload: {},
      vectorClock: { nodeA: 1 }, timestamp: Date.now(),
    }];
    const merged = mergeDelta(s, remote);
    expect(merged.ops).toHaveLength(1);
  });

  it('should compare clocks: a > b', () => {
    expect(compareClocks({ nodeA: 2 }, { nodeA: 1 })).toBe(1);
  });

  it('should detect concurrent clocks', () => {
    expect(compareClocks({ nodeA: 2, nodeB: 1 }, { nodeA: 1, nodeB: 2 })).toBe(0);
  });

  it('should compact log to last N ops', () => {
    let s = createDeltaState();
    for (let i = 0; i < 10; i++) {
      s = appendOp(s, { opId: `o${i}`, entityId: 'e', aspect: 'update', payload: {}, vectorClock: { n: i } });
    }
    const compact = compactLog(s, 3);
    expect(compact.ops).toHaveLength(3);
    expect(compact.ops[0].opId).toBe('o7');
  });

  it('should count ops by aspect', () => {
    let s = createDeltaState();
    s = appendOp(s, { opId: 'a', entityId: 'e', aspect: 'create', payload: {}, vectorClock: {} });
    s = appendOp(s, { opId: 'b', entityId: 'e', aspect: 'update', payload: {}, vectorClock: {} });
    s = appendOp(s, { opId: 'c', entityId: 'e', aspect: 'update', payload: {}, vectorClock: {} });
    const counts = opsByAspect(s);
    expect(counts.create).toBe(1);
    expect(counts.update).toBe(2);
  });
});
