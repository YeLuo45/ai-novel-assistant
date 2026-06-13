import { describe, it, expect } from 'vitest';
import {
  createThreatModel,
  addThreat,
  mitigate,
  unmitigate,
  removeThreat,
  threatsByCategory,
  unmitigatedCount,
  riskScore,
  validateModel,
  threatModelHealth,
} from './ThreatModelValidator';

describe('V2144 ThreatModelValidator', () => {
  it('should create empty threat model', () => {
    const s = createThreatModel();
    expect(s.threats.size).toBe(0);
  });

  it('should add threat', () => {
    const s = addThreat(createThreatModel(), { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    expect(s.threats.size).toBe(1);
  });

  it('should mitigate threat', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = mitigate(s, 't1', 'use 2FA');
    expect(s.threats.get('t1')?.mitigated).toBe(true);
    expect(s.threats.get('t1')?.mitigation).toBe('use 2FA');
  });

  it('should unmitigate threat', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = mitigate(s, 't1', 'use 2FA');
    s = unmitigate(s, 't1');
    expect(s.threats.get('t1')?.mitigated).toBe(false);
  });

  it('should remove threat', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = removeThreat(s, 't1');
    expect(s.threats.size).toBe(0);
  });

  it('should filter by category', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = addThreat(s, { id: 't2', category: 'tampering', description: 'Y', severity: 3, mitigated: false });
    expect(threatsByCategory(s, 'spoofing')).toHaveLength(1);
  });

  it('should count unmitigated', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = addThreat(s, { id: 't2', category: 'tampering', description: 'Y', severity: 3, mitigated: false });
    s = mitigate(s, 't1', 'fix');
    expect(unmitigatedCount(s)).toBe(1);
  });

  it('should compute risk score', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    expect(riskScore(s)).toBe(5);
  });

  it('should validate model', () => {
    const s = createThreatModel();
    const v = validateModel(s);
    expect(v.valid).toBe(false);
    expect(v.issues).toContain('no threats defined');
  });

  it('should compute threat model health', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 5, mitigated: false });
    s = mitigate(s, 't1', 'fix');
    const h = threatModelHealth(s);
    expect(h.mitigated).toBe(1);
    expect(h.unmitigated).toBe(0);
    expect(h.health).toBe(1);
  });

  it('should not unmitigate unknown threat', () => {
    const s = unmitigate(createThreatModel(), 'no-such');
    expect(s.threats.size).toBe(0);
  });

  it('should not mitigate unknown threat', () => {
    const s = mitigate(createThreatModel(), 'no-such', 'fix');
    expect(s.threats.size).toBe(0);
  });

  it('should detect high risk model', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 10, mitigated: false });
    s = addThreat(s, { id: 't2', category: 'tampering', description: 'Y', severity: 10, mitigated: false });
    const v = validateModel(s);
    expect(v.valid).toBe(false);
  });
});
