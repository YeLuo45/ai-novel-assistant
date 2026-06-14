import { describe, it, expect } from 'vitest';
import { createContextEventLogState, appendContextEvent, eventsForContextKey, eventsOfContextKind, replayContextFromSeq, truncateContextLog, contextEventLogCount, contextEventLogHealth } from './ContextEventLog';

describe('V2282 ContextEventLog', () => {
  it('should create empty log', () => {
    const s = createContextEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event', () => {
    let s = createContextEventLogState();
    s = appendContextEvent(s, 'add', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should query by key', () => {
    let s = createContextEventLogState();
    s = appendContextEvent(s, 'add', 'k1');
    s = appendContextEvent(s, 'add', 'k2');
    expect(eventsForContextKey(s, 'k1')).toHaveLength(1);
  });

  it('should query by kind', () => {
    let s = createContextEventLogState();
    s = appendContextEvent(s, 'add', 'k1');
    s = appendContextEvent(s, 'update', 'k1');
    expect(eventsOfContextKind(s, 'add')).toHaveLength(1);
  });

  it('should replay from seq', () => {
    let s = createContextEventLogState();
    s = appendContextEvent(s, 'add', 'k1');
    s = appendContextEvent(s, 'add', 'k2');
    s = appendContextEvent(s, 'add', 'k3');
    expect(replayContextFromSeq(s, 2)).toHaveLength(2);
  });

  it('should truncate', () => {
    let s = createContextEventLogState();
    for (let i = 0; i < 5; i++) s = appendContextEvent(s, 'add', `k${i}`);
    s = truncateContextLog(s, 2);
    expect(contextEventLogCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createContextEventLogState();
    const h = contextEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
