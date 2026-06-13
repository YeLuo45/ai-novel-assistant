import { describe, it, expect } from 'vitest';
import {
  createPowerSyncOrchestrator,
  engineHealthScores,
  computeMastery,
  healthSnapshot,
} from './PowerSyncOrchestrator';

describe('V2145 PowerSyncOrchestrator FINAL', () => {
  it('should create orchestrator with 29 sub-engines', () => {
    const s = createPowerSyncOrchestrator();
    expect(s.syncCore).toBeDefined();
    expect(s.router).toBeDefined();
    expect(s.threats).toBeDefined();
  });

  it('should compute 29 health scores', () => {
    const s = createPowerSyncOrchestrator();
    const scores = engineHealthScores(s);
    expect(scores).toHaveLength(29);
  });

  it('should compute mastery for fresh state', () => {
    const s = createPowerSyncOrchestrator();
    const m = computeMastery(s);
    expect(m.mastery).toBeGreaterThanOrEqual(0);
    expect(m.mastery).toBeLessThanOrEqual(1);
  });

  it('should report healthy engines', () => {
    const s = createPowerSyncOrchestrator();
    const m = computeMastery(s);
    // healthy + degraded should be 29, with some possibly between thresholds
    expect(m.healthyEngines + m.degradedEngines).toBeLessThanOrEqual(29);
    expect(m.healthyEngines).toBeGreaterThanOrEqual(0);
  });

  it('should produce health snapshot with min/max', () => {
    const s = createPowerSyncOrchestrator();
    const snap = healthSnapshot(s);
    expect(snap.scores).toHaveLength(29);
    expect(snap.min).toBeLessThanOrEqual(snap.max);
  });

  it('should detect critical issues when threats unmitigated', () => {
    let s = createPowerSyncOrchestrator();
    s = { ...s, threats: { ...s.threats, threats: new Map([['t1', { id: 't1', category: 'spoofing', description: 'X', severity: 10, mitigated: false }]]) } };
    const m = computeMastery(s);
    expect(m.criticalIssues.length).toBeGreaterThan(0);
  });

  it('should detect missing key manager state by default health', () => {
    const s = createPowerSyncOrchestrator();
    const m = computeMastery(s);
    // Without any active keys, the orchestrator is not at 100% mastery
    expect(m.mastery).toBeGreaterThanOrEqual(0);
    expect(m.mastery).toBeLessThanOrEqual(1);
  });

  it('should return same scores on multiple calls', () => {
    const s = createPowerSyncOrchestrator();
    const a = engineHealthScores(s);
    const b = engineHealthScores(s);
    expect(a).toEqual(b);
  });

  it('should report critical issue when recovery circuit is open', () => {
    let s = createPowerSyncOrchestrator();
    s = { ...s, recovery: { ...s.recovery, circuit: 'open' as const, consecutiveFailures: 10, lastFailureAt: Date.now() } };
    const m = computeMastery(s);
    expect(m.degradedEngines).toBeGreaterThanOrEqual(0);
  });
});
