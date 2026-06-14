import { describe, it, expect } from 'vitest';
import { createSkillEventLogState, appendSkillEvent, skillEventsForKey, skillEventsByKind, replaySkillFromSeq, truncateSkillLog, skillEventLogCount, skillEventLogHealth } from './SkillEventLog';

describe('V2312 SkillEventLog', () => {
  it('should create empty log', () => {
    const s = createSkillEventLogState();
    expect(s.nextSeq).toBe(1);
  });

  it('should append event', () => {
    let s = createSkillEventLogState();
    s = appendSkillEvent(s, 'create', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should query by key', () => {
    let s = createSkillEventLogState();
    s = appendSkillEvent(s, 'create', 'k1');
    s = appendSkillEvent(s, 'create', 'k2');
    expect(skillEventsForKey(s, 'k1')).toHaveLength(1);
  });

  it('should query by kind', () => {
    let s = createSkillEventLogState();
    s = appendSkillEvent(s, 'create', 'k1');
    s = appendSkillEvent(s, 'update', 'k1');
    expect(skillEventsByKind(s, 'create')).toHaveLength(1);
  });

  it('should replay from seq', () => {
    let s = createSkillEventLogState();
    s = appendSkillEvent(s, 'create', 'k1');
    s = appendSkillEvent(s, 'create', 'k2');
    s = appendSkillEvent(s, 'create', 'k3');
    expect(replaySkillFromSeq(s, 2)).toHaveLength(2);
  });

  it('should truncate', () => {
    let s = createSkillEventLogState();
    for (let i = 0; i < 5; i++) s = appendSkillEvent(s, 'create', `k${i}`);
    s = truncateSkillLog(s, 2);
    expect(skillEventLogCount(s)).toBe(2);
  });

  it('should compute health', () => {
    const s = createSkillEventLogState();
    const h = skillEventLogHealth(s);
    expect(h.health).toBe(0.5);
  });
});
