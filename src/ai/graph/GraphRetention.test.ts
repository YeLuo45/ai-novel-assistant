import { describe, it, expect } from 'vitest';
import { createGraphRetentionState, addGraphPolicy, trackGraphRecord, applyGraphRetention, graphPolicyFor, graphRetentionHealth } from './GraphRetention';

describe('V2196 GraphRetention', () => {
  it('should create empty state', () => {
    const s = createGraphRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createGraphRetentionState();
    s = addGraphPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createGraphRetentionState();
    s = trackGraphRecord(s, 'n1', 'user');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention to expired', () => {
    let s = createGraphRetentionState();
    s = addGraphPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1, action: 'delete' });
    s = trackGraphRecord(s, 'n1', 'user');
    s = applyGraphRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should find policy for scope', () => {
    let s = createGraphRetentionState();
    s = addGraphPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1000, action: 'archive' });
    expect(graphPolicyFor(s, 'user')?.action).toBe('archive');
  });

  it('should return undefined for unknown scope', () => {
    const s = createGraphRetentionState();
    expect(graphPolicyFor(s, 'nope')).toBeUndefined();
  });

  it('should compute health', () => {
    let s = createGraphRetentionState();
    s = addGraphPolicy(s, { policyId: 'p1', scope: 'user', ttlMs: 1000, action: 'delete' });
    const h = graphRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
