import { describe, it, expect } from 'vitest';
import {
  createFlagState,
  addFlag,
  setFlag,
  isEnabled,
  recordEvaluation,
  getFlag,
  listFlags,
  flagStats,
  flagHealth,
} from './FeatureFlagRouter';

describe('V2139 FeatureFlagRouter', () => {
  it('should create empty flag state', () => {
    const s = createFlagState();
    expect(s.flags.size).toBe(0);
  });

  it('should add flag', () => {
    const s = addFlag(createFlagState(), { flagId: 'f1', name: 'NewUI', state: 'on', rolloutPct: 100, createdAt: Date.now(), cohort: 'all' });
    expect(s.flags.size).toBe(1);
  });

  it('should set flag state', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'X', state: 'off', rolloutPct: 0, createdAt: Date.now(), cohort: 'all' });
    s = setFlag(s, 'f1', 'on', 100);
    expect(getFlag(s, 'f1')?.state).toBe('on');
  });

  it('should deny when flag is off', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'X', state: 'off', rolloutPct: 0, createdAt: Date.now(), cohort: 'all' });
    expect(isEnabled(s, 'f1', 'user1')).toBe(false);
  });

  it('should allow when flag is on', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'X', state: 'on', rolloutPct: 100, createdAt: Date.now(), cohort: 'all' });
    expect(isEnabled(s, 'f1', 'user1')).toBe(true);
  });

  it('should rollout based on userId hash', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'X', state: 'rollout', rolloutPct: 50, createdAt: Date.now(), cohort: 'all' });
    const enabled = new Set<string>();
    for (let i = 0; i < 100; i++) enabled.add(String(i));
    const allowed = Array.from(enabled).filter((u) => isEnabled(s, 'f1', u)).length;
    expect(allowed).toBeGreaterThan(30);
    expect(allowed).toBeLessThan(70);
  });

  it('should record evaluation', () => {
    let s = createFlagState();
    s = recordEvaluation(s, 'f1', true);
    s = recordEvaluation(s, 'f1', false);
    const stats = flagStats(s, 'f1');
    expect(stats.allowed).toBe(1);
    expect(stats.denied).toBe(1);
  });

  it('should list flags', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'A', state: 'on', rolloutPct: 100, createdAt: Date.now(), cohort: 'all' });
    s = addFlag(s, { flagId: 'f2', name: 'B', state: 'off', rolloutPct: 0, createdAt: Date.now(), cohort: 'all' });
    expect(listFlags(s)).toHaveLength(2);
  });

  it('should compute flag health', () => {
    let s = createFlagState();
    s = addFlag(s, { flagId: 'f1', name: 'A', state: 'on', rolloutPct: 100, createdAt: Date.now(), cohort: 'all' });
    const h = flagHealth(s);
    expect(h.totalFlags).toBe(1);
    expect(h.health).toBe(1);
  });
});
