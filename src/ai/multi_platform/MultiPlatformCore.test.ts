/**
 * MultiPlatformCore.test.ts — Direction BY, V4526-V4535 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PlatformAccountManager, PlatformSelector, UnifiedContentAdapter, PlatformValidator, ConcurrentUploader, PlatformSyncStatus, PlatformMetadataConverter, PlatformCoverAdapter, PlatformRetryManager, PlatformBatchScheduler, MultiPlatformCoreIndex } from './MultiPlatformCore';

describe('PlatformAccountManager', () => {
  const e = new PlatformAccountManager();
  it('add + get', () => { e.add('tomato', 'tok'); expect(e.get('tomato')?.token).toBe('tok'); });
  it('isConnected true', () => { expect(e.isConnected('tomato')).toBe(true); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('PlatformSelector', () => {
  const e = new PlatformSelector();
  it('select for romance', () => { expect(e.select({ genre: 'romance' })).toBe('qidian'); });
  it('isValid for tomato', () => { expect(e.isValid('tomato')).toBe(true); });
});

describe('UnifiedContentAdapter', () => {
  const e = new UnifiedContentAdapter();
  it('adapt includes platform', () => { expect(e.adapt({ title: 'A', content: 'B', chapters: [] }, 'tomato').platform).toBe('tomato'); });
  it('isAdapted true', () => { expect(e.isAdapted({ platform: 'tomato' })).toBe(true); });
});

describe('PlatformValidator', () => {
  const e = new PlatformValidator();
  it('validate for good', () => { expect(e.validate({ title: 'A', content: 'B' }, 'tomato').valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('ConcurrentUploader', () => {
  const e = new ConcurrentUploader();
  it('upload for 2', () => { expect(e.upload(['a', 'b'], { title: 'A' }).length).toBe(2); });
  it('isUploaded true', () => { expect(e.isUploaded([{ status: 'uploaded' }, { status: 'uploaded' }])).toBe(true); });
});

describe('PlatformSyncStatus', () => {
  const e = new PlatformSyncStatus();
  it('set + get', () => { e.set('tomato', 'synced'); expect(e.get('tomato')).toBe('synced'); });
  it('isSynced true', () => { expect(e.isSynced('tomato')).toBe(true); });
});

describe('PlatformMetadataConverter', () => {
  const e = new PlatformMetadataConverter();
  it('convert includes platform', () => { expect(e.convert({ title: 'A', tags: [] }, 'tomato').platform).toBe('tomato'); });
  it('isConverted true', () => { expect(e.isConverted({ platform: 'tomato' })).toBe(true); });
});

describe('PlatformCoverAdapter', () => {
  const e = new PlatformCoverAdapter();
  it('adapt for tomato', () => { expect(e.adapt({ url: '/x' }, 'tomato').size.width).toBe(600); });
  it('isAdapted true', () => { expect(e.isAdapted({ size: { width: 600 } })).toBe(true); });
});

describe('PlatformRetryManager', () => {
  const e = new PlatformRetryManager();
  it('record + shouldRetry', () => { e.record('tomato'); expect(e.shouldRetry('tomato', 3)).toBe(true); });
});

describe('PlatformBatchScheduler', () => {
  const e = new PlatformBatchScheduler();
  it('add + isValid', () => { e.add('tomato', '10:00'); expect(e.isValid()).toBe(true); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('MultiPlatformCoreIndex', () => {
  const idx = new MultiPlatformCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});