import { describe, it, expect } from 'vitest';
import { createSkillRetentionState, addSkillRetentionPolicy, trackSkillRecord, applySkillRetention, skillRetentionHealth } from './SkillRetention';

describe('V2316 SkillRetention', () => {
  it('should create empty state', () => {
    const s = createSkillRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createSkillRetentionState();
    s = addSkillRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createSkillRetentionState();
    s = trackSkillRecord(s, 'k1', 'k');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention', () => {
    let s = createSkillRetentionState();
    s = addSkillRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1, action: 'delete' });
    s = trackSkillRecord(s, 'k1', 'k');
    s = applySkillRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should compute health', () => {
    let s = createSkillRetentionState();
    s = addSkillRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    const h = skillRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
