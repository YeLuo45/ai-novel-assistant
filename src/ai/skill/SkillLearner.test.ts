import { describe, it, expect } from 'vitest';
import { createSkillLearnerState, createSkillRule, recordSkillHit, recordSkillMiss, getSkillPriority, topSkillKeys, setSkillLearningRate, skillLearnerHealth } from './SkillLearner';

describe('V2321 SkillLearner', () => {
  it('should create empty state', () => {
    const s = createSkillLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createSkillLearnerState();
    s = createSkillRule(s, 'k1');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit', () => {
    let s = createSkillLearnerState(0.1);
    s = createSkillRule(s, 'k1', 0.5);
    s = recordSkillHit(s, 'k1');
    expect(getSkillPriority(s, 'k1')).toBe(0.6);
  });

  it('should record miss', () => {
    let s = createSkillLearnerState(0.1);
    s = createSkillRule(s, 'k1', 0.5);
    s = recordSkillMiss(s, 'k1');
    expect(getSkillPriority(s, 'k1')).toBe(0.4);
  });

  it('should clamp weight 0-1', () => {
    let s = createSkillLearnerState(0.1);
    s = createSkillRule(s, 'k1', 0.95);
    s = recordSkillHit(s, 'k1');
    expect(getSkillPriority(s, 'k1')).toBe(1);
  });

  it('should return default for unknown', () => {
    const s = createSkillLearnerState();
    expect(getSkillPriority(s, 'nope')).toBe(0.5);
  });

  it('should rank top keys', () => {
    let s = createSkillLearnerState(0.1);
    s = createSkillRule(s, 'a', 0.3);
    s = createSkillRule(s, 'b', 0.8);
    const top = topSkillKeys(s, 2);
    expect(top[0].key).toBe('b');
  });

  it('should set learning rate', () => {
    let s = createSkillLearnerState();
    s = setSkillLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createSkillLearnerState();
    s = createSkillRule(s, 'k1');
    const h = skillLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
