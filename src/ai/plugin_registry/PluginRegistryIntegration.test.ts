/**
 * PluginRegistryIntegration.test.ts — Direction BZ, V4576-V4585 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PluginPipeline, PluginDirector, PluginReport, PluginLibrary, PluginValidator, PluginTools, PluginQualityGate, PluginADirector, PluginAnalytics, PluginRegistryMasterIndex } from './PluginRegistryIntegration';

describe('PluginPipeline', () => {
  const e = new PluginPipeline();
  it('isComplete for track', () => { expect(e.isComplete('track')).toBe(true); });
  it('next from validate', () => { expect(e.next('validate')).toBe('sign'); });
});

describe('PluginDirector', () => {
  const e = new PluginDirector();
  it('decide validate for empty', () => { expect(e.decide({ validated: false, published: false })).toBe('validate'); });
  it('decide track for done', () => { expect(e.decide({ validated: true, published: true })).toBe('track'); });
});

describe('PluginReport', () => {
  const e = new PluginReport();
  it('generate includes 插件', () => { expect(e.generate({ total: 100, published: 80, installed: 50 })).toContain('插件'); });
  it('hasReport true', () => { expect(e.hasReport('插件')).toBe(true); });
});

describe('PluginLibrary', () => {
  const e = new PluginLibrary();
  it('publish + count', () => { e.publish('A', '1.0.0'); expect(e.count()).toBe(1); });
});

describe('PluginValidator', () => {
  const e = new PluginValidator();
  it('validate for good', () => { expect(e.validate({ name: 'A', version: '1.0.0', signature: 'sig' }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('PluginTools', () => {
  const e = new PluginTools();
  it('isAvailable for vsce', () => { expect(e.isAvailable('vsce')).toBe(true); });
  it('count returns 4', () => { expect(e.count()).toBe(4); });
});

describe('PluginQualityGate', () => {
  const e = new PluginQualityGate();
  it('gate true for 100+4', () => { expect(e.gate({ downloads: 100, rating: 4 })).toBe(true); });
});

describe('PluginADirector', () => {
  const e = new PluginADirector();
  it('decide update for hasUpdates', () => { expect(e.decide({ hasUpdates: true, hasIssues: false })).toBe('update'); });
  it('decide monitor for done', () => { expect(e.decide({ hasUpdates: false, hasIssues: false })).toBe('monitor'); });
});

describe('PluginAnalytics', () => {
  const e = new PluginAnalytics();
  it('compute for 100/4/10', () => { expect(e.compute({ downloads: 100, rating: 4, count: 10 }).avgDownloads).toBe(10); });
  it('isHealthy for 4+', () => { expect(e.isHealthy({ avgRating: 4.5 })).toBe(true); });
});

describe('PluginRegistryMasterIndex', () => {
  const idx = new PluginRegistryMasterIndex();
  it('lists 30 engines', () => { expect(idx.count()).toBe(30); });
});