/**
 * TMEngineIntegration.test.ts — Direction BC, V3966-V3975 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TMEngine, TMEngineMetrics, TMEngineConfig, TMEngineSync, TMEngineAudit, TMEngineLibrary, TMEngineADirector, TMEngineTools, TMEngineExportFormat, TMEngineMasterIndex } from './TMEngineIntegration';
import { TMStore } from './TMEngineCore';

describe('TMEngine', () => {
  const e = new TMEngine();
  it('import + size', () => { e.importTM('[{"source":"a","target":"b","quality":1}]'); expect(e.size()).toBe(1); });
  it('lookup for known', () => { expect(e.lookup('a')).toBe('b'); });
});

describe('TMEngineMetrics', () => {
  const e = new TMEngineMetrics();
  it('recordQuery + exactMatchRate', () => { e.recordQuery(true); e.recordQuery(false); expect(e.exactMatchRate()).toBe(0.5); });
});

describe('TMEngineConfig', () => {
  const e = new TMEngineConfig();
  it('isValid for default', () => { expect(e.isValid({ maxEntries: 1000, minQuality: 0.5 })).toBe(true); });
});

describe('TMEngineSync', () => {
  const e = new TMEngineSync();
  it('sync adds new', () => { e.remote.add({ source: 'a', target: 'b', quality: 1 }); const r = e.sync(); expect(r.added).toBe(1); });
});

describe('TMEngineAudit', () => {
  const e = new TMEngineAudit();
  it('audit for clean', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.audit(s).lowQuality).toBe(0); });
  it('isHealthy true', () => { expect(e.isHealthy({ lowQuality: 0, duplicates: 0 })).toBe(true); });
});

describe('TMEngineLibrary', () => {
  const e = new TMEngineLibrary();
  it('save + get', () => { e.save('A', new TMStore()); expect(e.get('A')).not.toBeNull(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('TMEngineADirector', () => {
  const e = new TMEngineADirector();
  it('decide seed for 0', () => { expect(e.decide({ queryCount: 0, cacheHitRate: 0 })).toBe('seed'); });
  it('decide expand for low', () => { expect(e.decide({ queryCount: 10, cacheHitRate: 0.3 })).toBe('expand'); });
});

describe('TMEngineTools', () => {
  const e = new TMEngineTools();
  it('isAvailable for Trados', () => { expect(e.isAvailable('Trados')).toBe(true); });
  it('count returns 4', () => { expect(e.count()).toBe(4); });
});

describe('TMEngineExportFormat', () => {
  const e = new TMEngineExportFormat();
  it('exportTMX for 1', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.exportTMX(s)).toContain('<?xml'); });
  it('isValid true', () => { expect(e.isValid('<?xml test')).toBe(true); });
});

describe('TMEngineMasterIndex', () => {
  const idx = new TMEngineMasterIndex();
  it('lists 29 engines', () => { expect(idx.count()).toBe(29); });
});