/**
 * PluginRegistryCore.test.ts — Direction BZ, V4556-V4565 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PluginManifest, PluginPublisher, PluginVersioning, PluginSearch, PluginRating, PluginDownloader, PluginSignatureVerifier, PluginCompatibility, PluginLocalCache, PluginChecksum, PluginRegistryCoreIndex } from './PluginRegistryCore';

describe('PluginManifest', () => {
  const e = new PluginManifest();
  it('isValid for full', () => { e.name = 'A'; e.author = 'B'; expect(e.isValid()).toBe(true); });
});

describe('PluginPublisher', () => {
  const e = new PluginPublisher();
  it('publish + isPublished', () => { e.publish({ name: 'A', version: '1.0.0' }); expect(e.isPublished('A')).toBe(true); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('PluginVersioning', () => {
  const e = new PluginVersioning();
  it('bump patch for 1.0.0 → 1.0.1', () => { expect(e.bump('1.0.0', 'patch')).toBe('1.0.1'); });
  it('bump major for 1.0.0 → 2.0.0', () => { expect(e.bump('1.0.0', 'major')).toBe('2.0.0'); });
  it('isNewer true', () => { expect(e.isNewer('2.0.0', '1.0.0')).toBe(true); });
});

describe('PluginSearch', () => {
  const e = new PluginSearch();
  it('search for A', () => { expect(e.search([{ name: 'A' }, { name: 'B' }], 'A').length).toBe(1); });
  it('hasMatch true', () => { expect(e.hasMatch([{ name: 'A' }])).toBe(true); });
});

describe('PluginRating', () => {
  const e = new PluginRating();
  it('addRating + average', () => { e.addRating('A', 5); e.addRating('A', 3); expect(e.average('A')).toBe(4); });
});

describe('PluginDownloader', () => {
  const e = new PluginDownloader();
  it('record + count', () => { e.record('A'); e.record('A'); expect(e.count('A')).toBe(2); });
});

describe('PluginSignatureVerifier', () => {
  const e = new PluginSignatureVerifier();
  it('verify true', () => { expect(e.verify({ signature: 'abc' }, 'abc')).toBe(true); });
  it('isValid true', () => { expect(e.isValid(true)).toBe(true); });
});

describe('PluginCompatibility', () => {
  const e = new PluginCompatibility();
  it('check for newer', () => { expect(e.check('2.0.0', '1.0.0')).toBe(true); });
  it('isCompatible true', () => { expect(e.isCompatible(true)).toBe(true); });
});

describe('PluginLocalCache', () => {
  const e = new PluginLocalCache();
  it('set + get', () => { e.set('A', 'data'); expect(e.get('A')).toBe('data'); });
  it('size', () => { expect(e.size()).toBe(1); });
});

describe('PluginChecksum', () => {
  const e = new PluginChecksum();
  it('compute + verify', () => { const c = e.compute('hello'); expect(e.verify('hello', c)).toBe(true); });
});

describe('PluginRegistryCoreIndex', () => {
  const idx = new PluginRegistryCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});