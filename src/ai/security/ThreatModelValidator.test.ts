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
  type ThreatCategory,
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

  it('should validate model as invalid when >50% unmitigated', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 1, mitigated: false });
    s = addThreat(s, { id: 't2', category: 'tampering', description: 'Y', severity: 1, mitigated: false });
    s = addThreat(s, { id: 't3', category: 'repudiation', description: 'Z', severity: 1, mitigated: true });
    const v = validateModel(s);
    expect(v.issues.some((i) => i.includes('50%'))).toBe(true);
  });

  it('should filter threats by info_disclosure category', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'info_disclosure', description: 'X', severity: 5, mitigated: false });
    expect(threatsByCategory(s, 'info_disclosure')).toHaveLength(1);
  });

  it('should compute risk with mitigation discount', () => {
    let s = createThreatModel();
    s = addThreat(s, { id: 't1', category: 'spoofing', description: 'X', severity: 10, mitigated: true });
    expect(riskScore(s)).toBe(1);
  });

  it('should cover all 6 STRIDE categories', () => {
    const cats: ThreatCategory[] = ['spoofing', 'tampering', 'repudiation', 'info_disclosure', 'denial_of_service', 'elevation_of_privilege'];
    for (const c of cats) {
      const s = addThreat(createThreatModel(), { id: c, category: c, description: 'X', severity: 1, mitigated: false });
      expect(s.threats.size).toBe(1);
    }
  });
});
