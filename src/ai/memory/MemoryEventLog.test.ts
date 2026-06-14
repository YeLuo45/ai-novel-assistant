import { describe, it, expect } from 'vitest';
import { createMemoryEventLogState, appendLogEvent, eventsFor, eventsByKind, replayFrom, eventCount, latestEvent, truncateLog, memoryEventLogHealth } from './MemoryEventLog';

describe('V2162 MemoryEventLog', () => {
  it('should create empty log', () => {
    const s = createMemoryEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event with auto seq', () => {
    let s = createMemoryEventLogState();
    s = appendLogEvent(s, 'add', 'm1', { x: 1 });
    expect(s.nextSeq).toBe(2);
    expect(s.events[0].seq).toBe(1);
  });

  it('should query events for memory', () => {
    let s = createMemoryEventLogState();
    s = appendLogEvent(s, 'add', 'm1', {});
    s = appendLogEvent(s, 'add', 'm2', {});
    s = appendLogEvent(s, 'update', 'm1', {});
    expect(eventsFor(s, 'm1')).toHaveLength(2);
  });

  it('should query events by kind', () => {
    let s = createMemoryEventLogState();
    s = appendLogEvent(s, 'add', 'm1', {});
    s = appendLogEvent(s, 'add', 'm2', {});
    s = appendLogEvent(s, 'update', 'm1', {});
    expect(eventsByKind(s, 'add')).toHaveLength(2);
  });

  it('should replay from seq', () => {
    let s = createMemoryEventLogState();
    s = appendLogEvent(s, 'add', 'm1', {});
    s = appendLogEvent(s, 'add', 'm2', {});
    s = appendLogEvent(s, 'add', 'm3', {});
    expect(replayFrom(s, 2)).toHaveLength(2);
  });

  it('should get latest event', () => {
    let s = createMemoryEventLogState();
    s = appendLogEvent(s, 'add', 'm1', { x: 1 });
    s = appendLogEvent(s, 'update', 'm1', { x: 2 });
    expect(latestEvent(s)?.kind).toBe('update');
  });

  it('should truncate log', () => {
    let s = createMemoryEventLogState();
    for (let i = 0; i < 5; i++) s = appendLogEvent(s, 'add', `m${i}`, {});
    s = truncateLog(s, 2);
    expect(eventCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createMemoryEventLogState();
    const h = memoryEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
