import { describe, it, expect } from 'vitest';
import { createSkillStreamState, publishSkillEvent, subscribeSkill, unsubscribeSkill, skillEventsForTopic, skillStreamHealth } from './SkillStream';

describe('V2306 SkillStream', () => {
  it('should create empty state', () => {
    const s = createSkillStreamState();
    expect(s.events).toEqual([]);
  });

  it('should publish event', () => {
    let s = createSkillStreamState();
    s = publishSkillEvent(s, 'skill.add', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should subscribe', () => {
    let s = createSkillStreamState();
    s = subscribeSkill(s, 'sub1', 'skill.add');
    expect(s.subs.size).toBe(1);
  });

  it('should deliver to subs', () => {
    let s = createSkillStreamState();
    s = subscribeSkill(s, 'sub1', 'skill.add');
    s = publishSkillEvent(s, 'skill.add', 'k1');
    expect(s.delivered.get('sub1')).toBe(1);
  });

  it('should unsubscribe', () => {
    let s = createSkillStreamState();
    s = subscribeSkill(s, 'sub1', 'skill.add');
    s = unsubscribeSkill(s, 'sub1');
    expect(s.subs.size).toBe(0);
  });

  it('should query by topic', () => {
    let s = createSkillStreamState();
    s = publishSkillEvent(s, 'skill.add', 'k1');
    s = publishSkillEvent(s, 'skill.del', 'k2');
    expect(skillEventsForTopic(s, 'skill.add')).toHaveLength(1);
  });

  it('should compute health', () => {
    const s = createSkillStreamState();
    const h = skillStreamHealth(s);
    expect(h.health).toBe(0.5);
  });
});
