import { describe, it, expect } from 'vitest';
import { createOpEventLogState, appendOpEvent, eventsForOp, eventsOfKind, eventsByActor, replayOpEvents, truncateOpLog, opEventLogCount, opEventLogHealth } from './OpEventLog';

describe('V2222 OpEventLog', () => {
  it('should create empty log', () => {
    const s = createOpEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event', () => {
    let s = createOpEventLogState();
    s = appendOpEvent(s, 'op1', 'enqueue', 'alice');
    expect(s.events).toHaveLength(1);
  });

  it('should query by opId', () => {
    let s = createOpEventLogState();
    s = appendOpEvent(s, 'op1', 'enqueue', 'alice');
    s = appendOpEvent(s, 'op2', 'enqueue', 'bob');
    expect(eventsForOp(s, 'op1')).toHaveLength(1);
  });

  it('should query by kind', () => {
    let s = createOpEventLogState();
    s = appendOpEvent(s, 'op1', 'enqueue', 'alice');
    s = appendOpEvent(s, 'op1', 'apply', 'bob');
    expect(eventsOfKind(s, 'enqueue')).toHaveLength(1);
  });

  it('should query by actor', () => {
    let s = createOpEventLogState();
    s = appendOpEvent(s, 'op1', 'enqueue', 'alice');
    s = appendOpEvent(s, 'op2', 'enqueue', 'alice');
    s = appendOpEvent(s, 'op3', 'enqueue', 'bob');
    expect(eventsByActor(s, 'alice')).toHaveLength(2);
  });

  it('should replay from seq', () => {
    let s = createOpEventLogState();
    s = appendOpEvent(s, 'op1', 'enqueue', 'alice');
    s = appendOpEvent(s, 'op2', 'enqueue', 'bob');
    s = appendOpEvent(s, 'op3', 'enqueue', 'alice');
    expect(replayOpEvents(s, 2)).toHaveLength(2);
  });

  it('should truncate', () => {
    let s = createOpEventLogState();
    for (let i = 0; i < 5; i++) s = appendOpEvent(s, `op${i}`, 'enqueue', 'alice');
    s = truncateOpLog(s, 2);
    expect(opEventLogCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createOpEventLogState();
    const h = opEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
