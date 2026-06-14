import { describe, it, expect } from 'vitest';
import { createContextLearnerState, createContextRule, recordContextHit, recordContextMiss, getContextPriority, topContextKeys, setContextLearningRate, contextLearnerHealth } from './ContextLearner';

describe('V2291 ContextLearner', () => {
  it('should create empty state', () => {
    const s = createContextLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createContextLearnerState();
    s = createContextRule(s, 'k1');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit', () => {
    let s = createContextLearnerState(0.1);
    s = createContextRule(s, 'k1', 0.5);
    s = recordContextHit(s, 'k1');
    expect(getContextPriority(s, 'k1')).toBe(0.6);
  });

  it('should record miss', () => {
    let s = createContextLearnerState(0.1);
    s = createContextRule(s, 'k1', 0.5);
    s = recordContextMiss(s, 'k1');
    expect(getContextPriority(s, 'k1')).toBe(0.4);
  });

  it('should clamp weight 0-1', () => {
    let s = createContextLearnerState(0.1);
    s = createContextRule(s, 'k1', 0.95);
    s = recordContextHit(s, 'k1');
    expect(getContextPriority(s, 'k1')).toBe(1);
  });

  it('should return default for unknown', () => {
    const s = createContextLearnerState();
    expect(getContextPriority(s, 'nope')).toBe(0.5);
  });

  it('should rank top keys', () => {
    let s = createContextLearnerState(0.1);
    s = createContextRule(s, 'a', 0.3);
    s = createContextRule(s, 'b', 0.8);
    const top = topContextKeys(s, 2);
    expect(top[0].key).toBe('b');
  });

  it('should set learning rate', () => {
    let s = createContextLearnerState();
    s = setContextLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createContextLearnerState();
    s = createContextRule(s, 'k1');
    const h = contextLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
