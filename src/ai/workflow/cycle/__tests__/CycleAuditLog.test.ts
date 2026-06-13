import { describe, it, expect } from 'vitest';
import {
  createAuditLog,
  appendEvent,
  queryByType,
  queryByTimeRange,
  countByType,
  lastEntry,
  exportAuditLog,
} from '../CycleAuditLog';

describe('CycleAuditLog - appendEvent', () => {
  it('appends events with monotonic ids', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', { foo: 'bar' }, () => 1000);
    appendEvent(log, 'iteration', { iter: 1 }, () => 1100);
    expect(log.entries.length).toBe(2);
    expect(log.entries[0].id).toBe(1);
    expect(log.entries[1].id).toBe(2);
  });

  it('records payload as-is', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'iteration', { quality: 0.7 }, () => 1000);
    expect(log.entries[0].payload).toEqual({ quality: 0.7 });
  });
});

describe('CycleAuditLog - queryByType', () => {
  it('filters by type', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', {});
    appendEvent(log, 'iteration', {});
    appendEvent(log, 'iteration', {});
    appendEvent(log, 'completed', {});
    expect(queryByType(log, 'iteration').length).toBe(2);
  });
});

describe('CycleAuditLog - queryByTimeRange', () => {
  it('filters by timestamp range', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', {}, () => 1000);
    appendEvent(log, 'iteration', {}, () => 2000);
    appendEvent(log, 'iteration', {}, () => 3000);
    expect(queryByTimeRange(log, 1500, 2500).length).toBe(1);
  });
});

describe('CycleAuditLog - countByType', () => {
  it('counts all event types', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', {});
    appendEvent(log, 'iteration', {});
    appendEvent(log, 'converged', {});
    const counts = countByType(log);
    expect(counts.start).toBe(1);
    expect(counts.iteration).toBe(1);
    expect(counts.converged).toBe(1);
    expect(counts['exit-condition']).toBe(0);
  });
});

describe('CycleAuditLog - lastEntry', () => {
  it('returns null for empty log', () => {
    expect(lastEntry(createAuditLog('c1'))).toBeNull();
  });

  it('returns the last appended entry', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', {}, () => 1000);
    appendEvent(log, 'completed', {}, () => 2000);
    expect(lastEntry(log)?.type).toBe('completed');
  });
});

describe('CycleAuditLog - exportAuditLog', () => {
  it('returns valid JSON', () => {
    const log = createAuditLog('c1');
    appendEvent(log, 'start', { x: 1 }, () => 1000);
    const exported = exportAuditLog(log);
    const parsed = JSON.parse(exported);
    expect(parsed[0].type).toBe('start');
    expect(parsed[0].payload.x).toBe(1);
  });
});
