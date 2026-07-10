// V5266-V5275: CW Multi-Modal Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  MultiModalDashboard,
  AssetLibrary,
  AssetConfig,
  AssetAudit,
  AssetMigration,
  MultiModalIntegrationIndex,
  MultiModalMasterIndex,
  CW_BATCH_3_ENGINES,
  CW_ALL_ENGINES
} from './MultiModalIntegration';

describe('MultiModalDashboard + AssetLibrary', () => {
  it('MultiModalDashboard setPanel + getPanel + names + count', () => {
    const d = new MultiModalDashboard();
    d.setPanel('img', 'Images', 100).setPanel('vid', 'Videos', 10);
    expect(d.getPanel('img')).toEqual({ title: 'Images', value: 100 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['img', 'vid']);
    expect(d.panelCount()).toBe(2);
  });

  it('AssetLibrary register + get + byType + remove + count', () => {
    const l = new AssetLibrary();
    l.register('a1', 'image', 'http://img.png');
    l.register('a2', 'audio', 'http://a.mp3');
    l.register('a3', 'image', 'http://img2.png');
    expect(l.get('a1')?.type).toBe('image');
    expect(l.byType('image')).toEqual(['a1', 'a3']);
    expect(l.byType('video')).toEqual([]);
    expect(l.remove('a1')).toBe(true);
    expect(l.count()).toBe(2);
    expect(l.get('missing')).toBeNull();
  });
});

describe('AssetConfig + AssetAudit + AssetMigration', () => {
  it('AssetConfig typed accessors', () => {
    const c = new AssetConfig();
    c.set('maxSize', 100_000_000).set('storage', 's3').set('cache', true);
    expect(c.getNumber('maxSize')).toBe(100_000_000);
    expect(c.getString('storage')).toBe('s3');
    expect(c.getBoolean('cache')).toBe(true);
    expect(c.getNumber('missing', 50)).toBe(50);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });

  it('AssetAudit record + records + forAsset + count + clear', () => {
    const a = new AssetAudit();
    a.record('u1', 'upload', 'a1').record('u2', 'delete', 'a2');
    expect(a.count()).toBe(2);
    expect(a.forAsset('a1')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('AssetMigration define + run + isApplied + counts', async () => {
    const m = new AssetMigration();
    let n = 0;
    m.define('v1', () => { n += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.migrationCount()).toBe(1);
    expect(m.appliedCount()).toBe(1);
  });
});

describe('MultiModalIntegrationIndex', () => {
  it('list has 7', () => {
    expect(new MultiModalIntegrationIndex().list()).toHaveLength(7);
  });

  it('count + engines + has', () => {
    const idx = new MultiModalIntegrationIndex();
    expect(idx.count()).toBe(7);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('MultiModalDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CW_BATCH_3_ENGINES const has 7', () => {
    expect(CW_BATCH_3_ENGINES).toHaveLength(7);
  });
});

describe('MultiModalMasterIndex', () => {
  it('list contains all 27 engines', () => {
    expect(new MultiModalMasterIndex().list()).toHaveLength(27);
  });

  it('count 27', () => {
    expect(new MultiModalMasterIndex().count()).toBe(27);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new MultiModalMasterIndex();
    expect(idx.has('TextToImage')).toBe(true);
    expect(idx.has('DiffusionPipeline')).toBe(true);
    expect(idx.has('MultiModalDashboard')).toBe(true);
  });

  it('CW_ALL_ENGINES const has 27', () => {
    expect(CW_ALL_ENGINES).toHaveLength(27);
  });
});