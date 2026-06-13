import { describe, it, expect } from 'vitest';
import {
  createAuditLogger,
  log,
  queryByActor,
  queryByResource,
  queryBySeverity,
  countBySeverity,
  auditHealth,
  queryInWindow,
  pruneExpired,
} from './AuditLogger';

describe('V2143 AuditLogger', () => {
  it('should create empty audit log', () => {
    const s = createAuditLogger();
    expect(s.events).toEqual([]);
  });

  it('should log an event', () => {
    const s = log(createAuditLogger(), { actor: 'u1', action: 'create', resource: 'book', severity: 'info', details: {} });
    expect(s.events).toHaveLength(1);
  });

  it('should query by actor', () => {
    let s = createAuditLogger();
    s = log(s, { actor: 'u1', action: 'create', resource: 'x', severity: 'info', details: {} });
    s = log(s, { actor: 'u2', action: 'create', resource: 'x', severity: 'info', details: {} });
    expect(queryByActor(s, 'u1')).toHaveLength(1);
  });

  it('should query by resource', () => {
    let s = createAuditLogger();
    s = log(s, { actor: 'u1', action: 'create', resource: 'book', severity: 'info', details: {} });
    expect(queryByResource(s, 'book')).toHaveLength(1);
  });

  it('should query by severity', () => {
    let s = createAuditLogger();
    s = log(s, { actor: 'u1', action: 'x', resource: 'r', severity: 'error', details: {} });
    s = log(s, { actor: 'u1', action: 'y', resource: 'r', severity: 'info', details: {} });
    expect(queryBySeverity(s, 'error')).toHaveLength(1);
  });

  it('should count by severity', () => {
    let s = createAuditLogger();
    s = log(s, { actor: 'u1', action: 'x', resource: 'r', severity: 'info', details: {} });
    s = log(s, { actor: 'u1', action: 'y', resource: 'r', severity: 'error', details: {} });
    const counts = countBySeverity(s);
    expect(counts.info).toBe(1);
    expect(counts.error).toBe(1);
  });

  it('should compute audit health', () => {
    const s = createAuditLogger();
    const h = auditHealth(s);
    expect(h.criticalCount).toBe(0);
    expect(h.health).toBe(1);
  });

  it('should report unhealthy when critical events present', () => {
    let s = createAuditLogger();
    s = log(s, { actor: 'u1', action: 'breach', resource: 'r', severity: 'critical', details: {} });
    const h = auditHealth(s);
    expect(h.health).toBeLessThan(1);
  });

  it('should query by time window', () => {
    let s = createAuditLogger();
    const t = Date.now();
    s = log(s, { actor: 'u1', action: 'create', resource: 'x', severity: 'info', details: {} });
    const events = queryInWindow(s, t - 1000, t + 1000);
    expect(events.length).toBe(1);
  });

  it('should prune expired events', () => {
    let s = createAuditLogger(0); // 0 retention
    s = log(s, { actor: 'u1', action: 'x', resource: 'r', severity: 'info', details: {} });
    // Wait briefly
    const start = Date.now();
    while (Date.now() - start < 5) {}
    s = pruneExpired(s);
    expect(s.events).toHaveLength(0);
  });
});
