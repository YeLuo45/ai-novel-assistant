import { describe, it, expect } from 'vitest';
import { createSkillTTLState, setSkillTTL, getSkillTTL, isSkillExpired, evictSkillExpired, extendSkillTTL, skillTTLHealth } from './SkillTTL';

describe('V2308 SkillTTL', () => {
  it('should create empty state', () => {
    const s = createSkillTTLState();
    expect(s.entries.size).toBe(0);
  });

  it('should set TTL', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1000);
    expect(s.entries.size).toBe(1);
  });

  it('should get TTL', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1000);
    expect(getSkillTTL(s, 'k1')).toBeGreaterThan(0);
  });

  it('should return 0 for unknown', () => {
    const s = createSkillTTLState();
    expect(getSkillTTL(s, 'nope')).toBe(0);
  });

  it('should detect expired', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1);
    expect(isSkillExpired(s, 'k1', Date.now() + 1000)).toBe(true);
  });

  it('should evict expired', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1);
    s = evictSkillExpired(s, Date.now() + 1000);
    expect(s.totalExpirations).toBe(1);
  });

  it('should extend TTL', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1000);
    s = extendSkillTTL(s, 'k1', 500);
    expect(s.entries.get('k1')?.ttlMs).toBe(1500);
  });

  it('should compute health', () => {
    let s = createSkillTTLState();
    s = setSkillTTL(s, 'k1', 1000);
    const h = skillTTLHealth(s);
    expect(h.health).toBe(1);
  });
});
