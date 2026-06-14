import { describe, it, expect } from 'vitest';
import { createSkillQuotaState, setSkillQuota, consumeSkillQuota, releaseSkillQuota, skillQuotaFor, skillQuotaHealth } from './SkillQuota';

describe('V2315 SkillQuota', () => {
  it('should create empty state', () => {
    const s = createSkillQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 1000);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 1000);
    s = setSkillQuota(s, 'u1', 2000);
    expect(skillQuotaFor(s, 'u1')?.tokensLimit).toBe(2000);
  });

  it('should consume within limit', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 1000);
    s = consumeSkillQuota(s, 'u1', 500).state;
    expect(skillQuotaFor(s, 'u1')?.used).toBe(500);
  });

  it('should deny over limit', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 100);
    const r = consumeSkillQuota(s, 'u1', 200);
    expect(r.ok).toBe(false);
  });

  it('should release quota', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 1000);
    s = consumeSkillQuota(s, 'u1', 500).state;
    s = releaseSkillQuota(s, 'u1', 200);
    expect(skillQuotaFor(s, 'u1')?.used).toBe(300);
  });

  it('should compute health', () => {
    let s = createSkillQuotaState();
    s = setSkillQuota(s, 'u1', 1000);
    s = consumeSkillQuota(s, 'u1', 100).state;
    const h = skillQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
