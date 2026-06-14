import { describe, it, expect } from 'vitest';
import { createMemoryRetentionState, addPolicy, trackRecord, applyRetention, policyFor, expiredRecords, memoryRetentionHealth } from './MemoryRetention';

describe('V2166 MemoryRetention', () => {
  it('should create empty state', () => {
    const s = createMemoryRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createMemoryRetentionState();
    s = addPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 86400000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createMemoryRetentionState();
    s = trackRecord(s, 'm1', 'user');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention to expired', () => {
    let s = createMemoryRetentionState();
    s = addPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1, action: 'delete' });
    s = trackRecord(s, 'm1', 'user');
    s = applyRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should find policy for scope', () => {
    let s = createMemoryRetentionState();
    s = addPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1000, action: 'archive' });
    expect(policyFor(s, 'user')?.action).toBe('archive');
  });

  it('should return undefined for unknown scope', () => {
    const s = createMemoryRetentionState();
    expect(policyFor(s, 'nope')).toBeUndefined();
  });

  it('should list expired records', () => {
    let s = createMemoryRetentionState();
    s = addPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1, action: 'delete' });
    s = trackRecord(s, 'm1', 'user');
    expect(expiredRecords(s, Date.now() + 1000)).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createMemoryRetentionState();
    s = addPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1000, action: 'delete' });
    const h = memoryRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
