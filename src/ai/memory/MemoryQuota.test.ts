import { describe, it, expect } from 'vitest';
import { createMemoryQuotaState, setQuota, consumeQuota, releaseQuota, quotaFor, utilization, overQuotaOwners, memoryQuotaHealth } from './MemoryQuota';

describe('V2165 MemoryQuota', () => {
  it('should create empty state', () => {
    const s = createMemoryQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 1000);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing quota', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 1000);
    s = setQuota(s, 'u1', 2000);
    expect(quotaFor(s, 'u1')?.limit).toBe(2000);
  });

  it('should consume within limit', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 1000);
    const r = consumeQuota(s, 'u1', 500);
    s = r.state;
    expect(r.ok).toBe(true);
    expect(quotaFor(s, 'u1')?.used).toBe(500);
  });

  it('should deny over limit', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 100);
    const r = consumeQuota(s, 'u1', 200);
    expect(r.ok).toBe(false);
  });

  it('should release quota', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 1000);
    s = consumeQuota(s, 'u1', 500).state;
    s = releaseQuota(s, 'u1', 200);
    expect(quotaFor(s, 'u1')?.used).toBe(300);
  });

  it('should compute utilization', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 100);
    s = consumeQuota(s, 'u1', 50).state;
    expect(utilization(s, 'u1')).toBeCloseTo(0.5);
  });

  it('should list over-quota owners', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 100);
    s = consumeQuota(s, 'u1', 100).state;
    expect(overQuotaOwners(s)).toEqual(['u1']);
  });

  it('should compute health', () => {
    let s = createMemoryQuotaState();
    s = setQuota(s, 'u1', 1000);
    s = consumeQuota(s, 'u1', 100).state;
    const h = memoryQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
