import { describe, it, expect } from 'vitest';
import { createMemoryLearnerState, createRule, recordHit, recordMiss, getWeight, topMemories, setLearningRate, memoryLearnerHealth } from './MemoryLearner';

describe('V2171 MemoryLearner', () => {
  it('should create empty state', () => {
    const s = createMemoryLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createMemoryLearnerState();
    s = createRule(s, 'm1');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit and increase weight', () => {
    let s = createMemoryLearnerState(0.1);
    s = createRule(s, 'm1', 0.5);
    s = recordHit(s, 'm1');
    expect(getWeight(s, 'm1')).toBe(0.6);
  });

  it('should record miss and decrease weight', () => {
    let s = createMemoryLearnerState(0.1);
    s = createRule(s, 'm1', 0.5);
    s = recordMiss(s, 'm1');
    expect(getWeight(s, 'm1')).toBe(0.4);
  });

  it('should clamp weight to 0-1', () => {
    let s = createMemoryLearnerState(0.1);
    s = createRule(s, 'm1', 0.95);
    s = recordHit(s, 'm1');
    expect(getWeight(s, 'm1')).toBe(1);
  });

  it('should return default weight for unknown', () => {
    const s = createMemoryLearnerState();
    expect(getWeight(s, 'unknown')).toBe(0.5);
  });

  it('should rank top memories', () => {
    let s = createMemoryLearnerState(0.1);
    s = createRule(s, 'a', 0.3);
    s = createRule(s, 'b', 0.8);
    s = createRule(s, 'c', 0.5);
    const top = topMemories(s, 2);
    expect(top[0].memId).toBe('b');
  });

  it('should set learning rate clamped 0-1', () => {
    let s = createMemoryLearnerState();
    s = setLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createMemoryLearnerState();
    s = createRule(s, 'm1');
    const h = memoryLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
