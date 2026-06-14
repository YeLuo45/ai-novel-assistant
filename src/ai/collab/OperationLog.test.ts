import { describe, it, expect } from 'vitest';
import { createOperationLogState, appendToLog, markApplied, getEntry, entriesByAuthor, unappliedCount, truncateLog, operationLogHealth } from './OperationLog';

describe('V2207 OperationLog', () => {
  it('should create empty log', () => {
    const s = createOperationLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append entry', () => {
    let s = createOperationLogState();
    s = appendToLog(s, 'op1', 'alice');
    expect(s.entries).toHaveLength(1);
  });

  it('should mark applied', () => {
    let s = createOperationLogState();
    s = appendToLog(s, 'op1', 'alice');
    s = markApplied(s, 1);
    expect(getEntry(s, 1)?.applied).toBe(true);
  });

  it('should query by author', () => {
    let s = createOperationLogState();
    s = appendToLog(s, 'op1', 'alice');
    s = appendToLog(s, 'op2', 'bob');
    expect(entriesByAuthor(s, 'alice')).toHaveLength(1);
  });

  it('should count unapplied', () => {
    let s = createOperationLogState();
    s = appendToLog(s, 'op1', 'alice');
    s = appendToLog(s, 'op2', 'bob');
    s = markApplied(s, 1);
    expect(unappliedCount(s)).toBe(1);
  });

  it('should truncate log', () => {
    let s = createOperationLogState();
    for (let i = 0; i < 5; i++) s = appendToLog(s, `op${i}`, 'alice');
    s = truncateLog(s, 2);
    expect(s.entries).toHaveLength(2);
  });

  it('should compute health', () => {
    const s = createOperationLogState();
    const h = operationLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
