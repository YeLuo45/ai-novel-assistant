import { describe, it, expect } from 'vitest';
import { createGraphEventLogState, appendGraphLogEvent, eventsForNode, eventsOfOp, replayFromGraph, truncateGraphLog, graphEventLogCount, graphEventLogHealth } from './GraphEventLog';

describe('V2192 GraphEventLog', () => {
  it('should create empty log', () => {
    const s = createGraphEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event', () => {
    let s = createGraphEventLogState();
    s = appendGraphLogEvent(s, 'add_node', 'n1', {});
    expect(s.events).toHaveLength(1);
  });

  it('should query events for node', () => {
    let s = createGraphEventLogState();
    s = appendGraphLogEvent(s, 'add_node', 'n1', {});
    s = appendGraphLogEvent(s, 'add_node', 'n2', {});
    expect(eventsForNode(s, 'n1')).toHaveLength(1);
  });

  it('should query events of op', () => {
    let s = createGraphEventLogState();
    s = appendGraphLogEvent(s, 'add_node', 'n1', {});
    s = appendGraphLogEvent(s, 'remove_node', 'n2', {});
    expect(eventsOfOp(s, 'add_node')).toHaveLength(1);
  });

  it('should replay from seq', () => {
    let s = createGraphEventLogState();
    s = appendGraphLogEvent(s, 'add_node', 'n1', {});
    s = appendGraphLogEvent(s, 'add_node', 'n2', {});
    s = appendGraphLogEvent(s, 'add_node', 'n3', {});
    expect(replayFromGraph(s, 2)).toHaveLength(2);
  });

  it('should truncate log', () => {
    let s = createGraphEventLogState();
    for (let i = 0; i < 5; i++) s = appendGraphLogEvent(s, 'add_node', `n${i}`, {});
    s = truncateGraphLog(s, 2);
    expect(graphEventLogCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createGraphEventLogState();
    const h = graphEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
