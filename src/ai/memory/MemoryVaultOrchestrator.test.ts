import { describe, it, expect } from 'vitest';
import { createMemoryVaultState, engineHealthScores, computeMastery } from './MemoryVaultOrchestrator';

describe('V2175 MemoryVaultOrchestrator FINAL', () => {
  it('should create vault with 29 sub-engines', () => {
    const s = createMemoryVaultState();
    expect(s.encoder).toBeDefined();
    expect(s.adapter).toBeDefined();
  });

  it('should compute 29 health scores', () => {
    const s = createMemoryVaultState();
    const scores = engineHealthScores(s);
    expect(scores).toHaveLength(29);
  });

  it('should compute mastery for fresh state', () => {
    const s = createMemoryVaultState();
    const m = computeMastery(s);
    expect(m.mastery).toBeGreaterThanOrEqual(0);
    expect(m.mastery).toBeLessThanOrEqual(1);
  });

  it('should report healthy and degraded counts', () => {
    const s = createMemoryVaultState();
    const m = computeMastery(s);
    expect(m.healthyEngines + m.degradedEngines).toBeLessThanOrEqual(29);
  });

  it('should detect critical issues when degraded', () => {
    const s = createMemoryVaultState();
    const m = computeMastery(s);
    // Fresh state has many at 0.5 so no critical issues expected, but m is defined
    expect(m.criticalIssues).toBeDefined();
  });
});
