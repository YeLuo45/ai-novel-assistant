import { describe, it, expect } from 'vitest';
import { createOpQuotaState, setOpQuota, checkOpQuota, opQuotaFor, opQuotaHealth } from './OpQuota';

describe('V2225 OpQuota', () => {
  it('should create empty state', () => {
    const s = createOpQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createOpQuotaState();
    s = setOpQuota(s, 'u1', 60);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing quota', () => {
    let s = createOpQuotaState();
    s = setOpQuota(s, 'u1', 60);
    s = setOpQuota(s, 'u1', 100);
    expect(opQuotaFor(s, 'u1')?.opsPerMinute).toBe(100);
  });

  it('should allow within limit', () => {
    let s = createOpQuotaState();
    s = setOpQuota(s, 'u1', 5);
    const r = checkOpQuota(s, 'u1');
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  it('should deny over limit', () => {
    let s = createOpQuotaState();
    s = setOpQuota(s, 'u1', 2);
    s = checkOpQuota(s, 'u1').state;
    s = checkOpQuota(s, 'u1').state;
    const r = checkOpQuota(s, 'u1');
    expect(r.allowed).toBe(false);
  });

  it('should allow unknown user', () => {
    const s = createOpQuotaState();
    const r = checkOpQuota(s, 'unknown');
    expect(r.allowed).toBe(true);
  });

  it('should compute health', () => {
    let s = createOpQuotaState();
    s = setOpQuota(s, 'u1', 60);
    const h = opQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
