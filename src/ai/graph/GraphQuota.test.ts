import { describe, it, expect } from 'vitest';
import { createGraphQuotaState, setGraphQuota, addNodeForOwner, addEdgeForOwner, graphQuotaFor, graphQuotaHealth } from './GraphQuota';

describe('V2195 GraphQuota', () => {
  it('should create empty state', () => {
    const s = createGraphQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing quota', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    s = setGraphQuota(s, 'u1', 500, 1000);
    expect(graphQuotaFor(s, 'u1')?.nodeLimit).toBe(500);
  });

  it('should add node within limit', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    const r = addNodeForOwner(s, 'u1', 50);
    expect(r.ok).toBe(true);
    expect(graphQuotaFor(r.state, 'u1')?.nodes).toBe(50);
  });

  it('should deny node over limit', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    const r = addNodeForOwner(s, 'u1', 200);
    expect(r.ok).toBe(false);
  });

  it('should add edge within limit', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    const r = addEdgeForOwner(s, 'u1', 100);
    expect(r.ok).toBe(true);
  });

  it('should deny unknown owner', () => {
    const s = createGraphQuotaState();
    const r = addNodeForOwner(s, 'unknown', 1);
    expect(r.ok).toBe(false);
  });

  it('should compute health', () => {
    let s = createGraphQuotaState();
    s = setGraphQuota(s, 'u1', 100, 200);
    const h = graphQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
