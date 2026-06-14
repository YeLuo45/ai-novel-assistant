import { describe, it, expect } from 'vitest';
import { createContextRetentionState, addContextRetentionPolicy, trackContextRecord, applyContextRetention, contextRetentionHealth } from './ContextRetention';

describe('V2286 ContextRetention', () => {
  it('should create empty state', () => {
    const s = createContextRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createContextRetentionState();
    s = addContextRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createContextRetentionState();
    s = trackContextRecord(s, 'k1', 'k');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention', () => {
    let s = createContextRetentionState();
    s = addContextRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1, action: 'delete' });
    s = trackContextRecord(s, 'k1', 'k');
    s = applyContextRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should compute health', () => {
    let s = createContextRetentionState();
    s = addContextRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    const h = contextRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
