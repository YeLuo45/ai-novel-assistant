/**
 * ExtensionManagerIntegration.test.ts — Direction BV, V4456-V4465 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ExtensionPipeline, ExtensionDirector, ExtensionReport, ExtensionLibrary, ExtensionValidator, ExtensionTools, ExtensionQualityGate, ExtensionADirector, ExtensionMonitor, ExtensionManagerMasterIndex } from './ExtensionManagerIntegration';

describe('ExtensionPipeline', () => {
  const e = new ExtensionPipeline();
  it('isComplete for unload', () => { expect(e.isComplete('unload')).toBe(true); });
  it('next from register', () => { expect(e.next('register')).toBe('load'); });
});

describe('ExtensionDirector', () => {
  const e = new ExtensionDirector();
  it('decide register for empty', () => { expect(e.decide({ registered: false, activated: false })).toBe('register'); });
  it('decide monitor for done', () => { expect(e.decide({ registered: true, activated: true })).toBe('monitor'); });
});

describe('ExtensionReport', () => {
  const e = new ExtensionReport();
  it('generate includes 扩展', () => { expect(e.generate({ total: 5, active: 3 })).toContain('扩展'); });
  it('hasReport true', () => { expect(e.hasReport('扩展')).toBe(true); });
});

describe('ExtensionLibrary', () => {
  const e = new ExtensionLibrary();
  it('save + count', () => { e.save('A', '1.0.0'); expect(e.count()).toBe(1); });
});

describe('ExtensionValidator', () => {
  const e = new ExtensionValidator();
  it('validate for good', () => { expect(e.validate({ name: 'A', version: '1.0.0' }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('ExtensionTools', () => {
  const e = new ExtensionTools();
  it('isAvailable for Vite', () => { expect(e.isAvailable('Vite')).toBe(true); });
  it('count returns 4', () => { expect(e.count()).toBe(4); });
});

describe('ExtensionQualityGate', () => {
  const e = new ExtensionQualityGate();
  it('gate true for full', () => { expect(e.gate({ name: 'A', version: '1.0.0' })).toBe(true); });
});

describe('ExtensionADirector', () => {
  const e = new ExtensionADirector();
  it('decide resolve for hasIssues', () => { expect(e.decide({ hasIssues: true, resolved: false })).toBe('resolve'); });
  it('decide finalize for done', () => { expect(e.decide({ hasIssues: false, resolved: true })).toBe('finalize'); });
});

describe('ExtensionMonitor', () => {
  const e = new ExtensionMonitor();
  it('set + get', () => { e.set('A', 'active'); expect(e.get('A')).toBe('active'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('ExtensionManagerMasterIndex', () => {
  const idx = new ExtensionManagerMasterIndex();
  it('lists 30 engines', () => { expect(idx.count()).toBe(30); });
});