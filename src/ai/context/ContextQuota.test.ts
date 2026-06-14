import { describe, it, expect } from 'vitest';
import { createContextQuotaState, setContextQuota, consumeContextQuota, releaseContextQuota, contextQuotaFor, contextQuotaHealth } from './ContextQuota';

describe('V2285 ContextQuota', () => {
  it('should create empty state', () => {
    const s = createContextQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 1000);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 1000);
    s = setContextQuota(s, 'u1', 2000);
    expect(contextQuotaFor(s, 'u1')?.tokensLimit).toBe(2000);
  });

  it('should consume within limit', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 1000);
    s = consumeContextQuota(s, 'u1', 500).state;
    expect(contextQuotaFor(s, 'u1')?.used).toBe(500);
  });

  it('should deny over limit', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 100);
    const r = consumeContextQuota(s, 'u1', 200);
    expect(r.ok).toBe(false);
  });

  it('should release quota', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 1000);
    s = consumeContextQuota(s, 'u1', 500).state;
    s = releaseContextQuota(s, 'u1', 200);
    expect(contextQuotaFor(s, 'u1')?.used).toBe(300);
  });

  it('should compute health', () => {
    let s = createContextQuotaState();
    s = setContextQuota(s, 'u1', 1000);
    s = consumeContextQuota(s, 'u1', 100).state;
    const h = contextQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
