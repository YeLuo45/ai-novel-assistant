import { describe, it, expect } from 'vitest';
import { createOpPartitionerState, addPartition, partitionOp, partitionOpAndUpdate, partitionCount, assignedOps, partitionerHealth } from './OpPartitioner';

describe('V2214 OpPartitioner', () => {
  it('should create default state', () => {
    const s = createOpPartitionerState(4);
    expect(partitionCount(s)).toBe(4);
  });

  it('should add partition', () => {
    let s = createOpPartitionerState(2);
    s = addPartition(s, 'p2');
    expect(partitionCount(s)).toBe(3);
  });

  it('should not add duplicate', () => {
    let s = createOpPartitionerState(2);
    s = addPartition(s, 'p0');
    expect(partitionCount(s)).toBe(2);
  });

  it('should partition op', () => {
    const s = createOpPartitionerState(4);
    const p = partitionOp(s, 'op1', 'key1');
    expect(p).toMatch(/^p\d$/);
  });

  it('should track assignments', () => {
    let s = createOpPartitionerState(2);
    s = partitionOpAndUpdate(s, 'op1', 'key1').state;
    s = partitionOpAndUpdate(s, 'op2', 'key2').state;
    const a = Array.from(s.assignment.values());
    expect(a).toHaveLength(2);
  });

  it('should count per-partition', () => {
    let s = createOpPartitionerState(2);
    s = partitionOpAndUpdate(s, 'op1', 'key1').state;
    s = partitionOpAndUpdate(s, 'op2', 'key2').state;
    const p0Count = assignedOps(s, 'p0');
    const p1Count = assignedOps(s, 'p1');
    expect(p0Count + p1Count).toBe(2);
  });

  it('should compute health', () => {
    const s = createOpPartitionerState(2);
    const h = partitionerHealth(s);
    expect(h.health).toBe(1);
  });
});
