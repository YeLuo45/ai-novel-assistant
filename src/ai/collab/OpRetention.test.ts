import { describe, it, expect } from 'vitest';
import { createOpRetentionState, addOpRetentionPolicy, trackOpRecord, applyOpRetention, opRetentionHealth } from './OpRetention';

describe('V2226 OpRetention', () => {
  it('should create empty state', () => {
    const s = createOpRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createOpRetentionState();
    s = addOpRetentionPolicy(s, { policyId: 'p1', scope: 'op', ttlMs: 1000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createOpRetentionState();
    s = trackOpRecord(s, 'op1', 'op');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention', () => {
    let s = createOpRetentionState();
    s = addOpRetentionPolicy(s, { policyId: 'p1', scope: 'op', ttlMs: 1, action: 'delete' });
    s = trackOpRecord(s, 'op1', 'op');
    s = applyOpRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should compute health', () => {
    let s = createOpRetentionState();
    s = addOpRetentionPolicy(s, { policyId: 'p1', scope: 'op', ttlMs: 1000, action: 'delete' });
    const h = opRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
