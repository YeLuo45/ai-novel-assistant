// V2143 AuditLogger - Direction A Iter 28/30
// 审计日志 - 操作追溯
// Source: generic-agent (audit / observability)

export type AuditSeverity = 'info' | 'warn' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  severity: AuditSeverity;
  details: Record<string, unknown>;
  timestamp: number;
}

export interface AuditLoggerState {
  events: AuditEvent[];
  retentionMs: number;
}

export function createAuditLogger(retentionMs = 30 * 24 * 60 * 60 * 1000): AuditLoggerState {
  return { events: [], retentionMs };
}

export function log(state: AuditLoggerState, event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditLoggerState {
  const full: AuditEvent = {
    ...event,
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  return { ...state, events: [...state.events, full] };
}

export function queryByActor(state: AuditLoggerState, actor: string): AuditEvent[] {
  return state.events.filter((e) => e.actor === actor);
}

export function queryByResource(state: AuditLoggerState, resource: string): AuditEvent[] {
  return state.events.filter((e) => e.resource === resource);
}

export function queryBySeverity(state: AuditLoggerState, severity: AuditSeverity): AuditEvent[] {
  return state.events.filter((e) => e.severity === severity);
}

export function queryInWindow(state: AuditLoggerState, fromMs: number, toMs: number): AuditEvent[] {
  return state.events.filter((e) => e.timestamp >= fromMs && e.timestamp <= toMs);
}

export function countBySeverity(state: AuditLoggerState): Record<AuditSeverity, number> {
  const counts: Record<AuditSeverity, number> = { info: 0, warn: 0, error: 0, critical: 0 };
  for (const e of state.events) counts[e.severity]++;
  return counts;
}

export function pruneExpired(state: AuditLoggerState, now = Date.now()): AuditLoggerState {
  return { ...state, events: state.events.filter((e) => now - e.timestamp <= state.retentionMs) };
}

export function auditHealth(state: AuditLoggerState): { eventCount: number; criticalCount: number; health: number } {
  const critical = countBySeverity(state).critical;
  return { eventCount: state.events.length, criticalCount: critical, health: critical === 0 ? 1 : 0.3 };
}
