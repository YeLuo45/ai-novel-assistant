import { describe, it, expect } from 'vitest';
import { createOpLearnerState, createOpRule, recordOpHit, recordOpMiss, getOpPriority, topOpKinds, setOpLearningRate, opLearnerHealth } from './OpLearner';

describe('V2231 OpLearner', () => {
  it('should create empty state', () => {
    const s = createOpLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createOpLearnerState();
    s = createOpRule(s, 'set');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit', () => {
    let s = createOpLearnerState(0.1);
    s = createOpRule(s, 'set', 0.5);
    s = recordOpHit(s, 'set');
    expect(getOpPriority(s, 'set')).toBe(0.6);
  });

  it('should record miss', () => {
    let s = createOpLearnerState(0.1);
    s = createOpRule(s, 'set', 0.5);
    s = recordOpMiss(s, 'set');
    expect(getOpPriority(s, 'set')).toBe(0.4);
  });

  it('should clamp weight 0-1', () => {
    let s = createOpLearnerState(0.1);
    s = createOpRule(s, 'set', 0.95);
    s = recordOpHit(s, 'set');
    expect(getOpPriority(s, 'set')).toBe(1);
  });

  it('should return default for unknown', () => {
    const s = createOpLearnerState();
    expect(getOpPriority(s, 'unknown')).toBe(0.5);
  });

  it('should rank top kinds', () => {
    let s = createOpLearnerState(0.1);
    s = createOpRule(s, 'a', 0.3);
    s = createOpRule(s, 'b', 0.8);
    const top = topOpKinds(s, 2);
    expect(top[0].opKind).toBe('b');
  });

  it('should set learning rate', () => {
    let s = createOpLearnerState();
    s = setOpLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createOpLearnerState();
    s = createOpRule(s, 'set');
    const h = opLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
