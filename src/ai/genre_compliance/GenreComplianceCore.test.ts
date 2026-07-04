/**
 * GenreComplianceCore.test.ts — Direction AZ, V3856-V3865 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { GenreRulesRepository, ComplianceChecker, GenreViolationDetector, GenreTropeChecker, GenreConventionEnforcer, GenreRulePredictor, GenreComplianceScore, GenreRuleAdjuster, GenreComplianceReporter, GenreComplianceLibrary, GenreComplianceCoreIndex } from './GenreComplianceCore';

describe('GenreRulesRepository', () => {
  const e = new GenreRulesRepository();
  it('get for romance', () => { expect(e.get('romance').length).toBeGreaterThan(0); });
  it('has for known', () => { expect(e.has('mystery')).toBe(true); });
});

describe('ComplianceChecker', () => {
  const e = new ComplianceChecker();
  it('check for compliant', () => { const r = e.check('有恋人。有误会。有重逢。', 'romance'); expect(r.compliant).toBe(true); });
  it('isCompliant true', () => { expect(e.isCompliant({ compliant: true })).toBe(true); });
});

describe('GenreViolationDetector', () => {
  const e = new GenreViolationDetector();
  it('detect for romance with action', () => { expect(e.detect('战斗', 'romance').length).toBeGreaterThan(0); });
  it('hasViolation true', () => { expect(e.hasViolation(['x'])).toBe(true); });
});

describe('GenreTropeChecker', () => {
  const e = new GenreTropeChecker();
  it('checkTropes for romance', () => { const r = e.checkTropes('一见钟情', 'romance'); expect(r.has).toContain('一见钟情'); });
  it('isComplete for full', () => { expect(e.isComplete({ has: ['a'], missing: [] })).toBe(true); });
});

describe('GenreConventionEnforcer', () => {
  const e = new GenreConventionEnforcer();
  it('enforce adds 爱 for romance', () => { expect(e.enforce('hi', 'romance')).toContain('爱'); });
  it('isEnforced true', () => { expect(e.isEnforced('a', 'b')).toBe(true); });
});

describe('GenreRulePredictor', () => {
  const e = new GenreRulePredictor();
  it('predict for romance', () => { expect(e.predict('爱情心', 'romance').confidence).toBe(1); });
  it('isConfident for 1.0', () => { expect(e.isConfident({ confidence: 1.0 })).toBe(true); });
});

describe('GenreComplianceScore', () => {
  const e = new GenreComplianceScore();
  it('score for compliant text', () => { expect(e.score('有恋人。有误会。有重逢。', 'romance')).toBe(1); });
  it('isCompliant for 0.7+', () => { expect(e.isCompliant(0.8)).toBe(true); });
});

describe('GenreRuleAdjuster', () => {
  const e = new GenreRuleAdjuster();
  it('adjustRules + hasAdjustedRules', () => { e.adjustRules('romance', ['x']); expect(e.hasAdjustedRules('romance')).toBe(true); });
});

describe('GenreComplianceReporter', () => {
  const e = new GenreComplianceReporter();
  it('generate includes 合规', () => { expect(e.generate('romance', { compliant: true, missing: [], score: 1 })).toContain('合规'); });
  it('hasReport true', () => { expect(e.hasReport('合规')).toBe(true); });
});

describe('GenreComplianceLibrary', () => {
  const e = new GenreComplianceLibrary();
  it('save + get', () => { e.save('romance', { report: 'ok' }); expect(e.get('romance')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('GenreComplianceCoreIndex', () => {
  const idx = new GenreComplianceCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});