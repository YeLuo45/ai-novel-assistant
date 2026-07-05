// V4886-V4895: CK CDN Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  CDNEdgeCache,
  AssetPipeline,
  CacheKeyGenerator,
  CacheInvalidator,
  PurgeStrategies,
  CDNCoreIndex,
  CK_BATCH_1_ENGINES,
  GeoRouter,
  LoadBalancer,
  OriginShield,
  CacheWarmer
} from './CDNCore';

describe('CDNEdgeCache', () => {
  it('set + get', () => {
    const c = new CDNEdgeCache();
    c.set('k1', 'v1');
    expect(c.get('k1')).toBe('v1');
  });

  it('get returns null for missing', () => {
    const c = new CDNEdgeCache();
    expect(c.get('missing')).toBeNull();
  });

  it('hits counter increments', () => {
    const c = new CDNEdgeCache();
    c.set('k', 'v');
    c.get('k');
    c.get('k');
    expect(c.hits('k')).toBe(2);
  });

  it('TTL expiry', async () => {
    const c = new CDNEdgeCache(100, 10);
    c.set('k', 'v', 10);
    await new Promise(r => setTimeout(r, 20));
    expect(c.get('k')).toBeNull();
  });

  it('eviction at maxSize', () => {
    const c = new CDNEdgeCache(2);
    c.set('a', '1');
    c.set('b', '2');
    c.get('a'); // a has more hits
    c.set('c', '3'); // should evict b
    expect(c.has('a')).toBe(true);
    expect(c.has('b')).toBe(false);
    expect(c.has('c')).toBe(true);
  });

  it('size + keys + clear', () => {
    const c = new CDNEdgeCache();
    c.set('a', '1');
    c.set('b', '2');
    expect(c.size()).toBe(2);
    expect(c.keys()).toEqual(['a', 'b']);
    c.clear();
    expect(c.size()).toBe(0);
  });
});

describe('AssetPipeline', () => {
  it('process runs all stages', () => {
    const p = new AssetPipeline();
    p.addStage(s => s.toUpperCase()).addStage(s => s + '!');
    expect(p.process('hello')).toBe('HELLO!');
  });

  it('minify + hash + gzip', () => {
    const p = new AssetPipeline();
    expect(p.minify('  hello   world  ')).toBe('hello world');
    expect(p.hash('hello')).toMatch(/^[0-9a-f]{8}$/);
    expect(p.gzip('abc')).toBe('cba');
  });

  it('stageCount + reset', () => {
    const p = new AssetPipeline();
    p.addStage(s => s);
    expect(p.stageCount()).toBe(1);
    p.reset();
    expect(p.stageCount()).toBe(0);
  });
});

describe('CacheKeyGenerator', () => {
  it('generate with no params', () => {
    const g = new CacheKeyGenerator();
    expect(g.generate('/api/users')).toBe('/api/users');
  });

  it('generate sorts params', () => {
    const g = new CacheKeyGenerator();
    expect(g.generate('/api', { b: '2', a: '1' })).toBe('/api?a=1&b=2');
  });

  it('normalize', () => {
    const g = new CacheKeyGenerator();
    expect(g.normalize('/API/USERS//')).toBe('/api/users');
  });

  it('hash + withVersion', () => {
    const g = new CacheKeyGenerator();
    expect(g.hash('hello')).toMatch(/^[a-z0-9]+$/);
    expect(g.withVersion('/api', '1.0')).toBe('/api@v=1.0');
  });

  it('patternMatches with wildcard', () => {
    const g = new CacheKeyGenerator();
    expect(g.patternMatches('/api/users/123', '/api/users/*')).toBe(true);
    expect(g.patternMatches('/api/posts/1', '/api/users/*')).toBe(false);
  });

  it('tag + extractTags', () => {
    const g = new CacheKeyGenerator();
    expect(g.extractTags(g.tag('/api', ['x', 'y']))).toEqual(['x', 'y']);
  });

  it('isValid rejects bad keys', () => {
    const g = new CacheKeyGenerator();
    expect(g.isValid('/api')).toBe(true);
    expect(g.isValid('')).toBe(false);
    expect(g.isValid('/a b')).toBe(false);
  });
});

describe('CacheInvalidator', () => {
  it('invalidate pattern', () => {
    const cache = new CDNEdgeCache();
    cache.set('/api/users/1', 'a');
    cache.set('/api/users/2', 'b');
    cache.set('/api/posts/1', 'c');
    const inv = new CacheInvalidator();
    const removed = inv.invalidate(cache, '/api/users/*');
    expect(removed).toBe(2);
    expect(cache.has('/api/posts/1')).toBe(true);
  });

  it('invalidateAll', () => {
    const cache = new CDNEdgeCache();
    cache.set('a', '1');
    cache.set('b', '2');
    const inv = new CacheInvalidator();
    expect(inv.invalidateAll(cache)).toBe(2);
    expect(cache.size()).toBe(0);
  });
});

describe('PurgeStrategies', () => {
  it('planImmediate + planSoft + planHard', () => {
    const cache = new CDNEdgeCache();
    cache.set('/a/1', 'x');
    cache.set('/a/2', 'y');
    const p = new PurgeStrategies();
    expect(p.planImmediate(cache, '/a/*')).toEqual(['/a/1', '/a/2']);
    expect(p.planSoft(cache, '/a/*')).toEqual(['/a/1', '/a/2']);
    expect(p.planHard(cache, '/a/*')).toEqual(['/a/1', '/a/2']);
  });

  it('planSurrogateKey', () => {
    const cache = new CDNEdgeCache();
    cache.set('/api#users', '1');
    cache.set('/api#posts', '2');
    const p = new PurgeStrategies();
    expect(p.planSurrogateKey(cache, 'users')).toEqual(['/api#users']);
  });

  it('shouldPurge + estimateImpact', () => {
    const p = new PurgeStrategies();
    expect(p.shouldPurge(0.3, 0.5)).toBe(true);
    expect(p.shouldPurge(0.7, 0.5)).toBe(false);
    const cache = new CDNEdgeCache();
    cache.set('/a', 'x');
    const impact = p.estimateImpact(cache, '/*');
    expect(impact.affected).toBe(1);
    expect(impact.ratio).toBe(1);
  });
});

describe('GeoRouter + LoadBalancer + OriginShield + CacheWarmer', () => {
  it('GeoRouter routes by prefix', () => {
    const g = new GeoRouter();
    g.addRegion('eu', ['/eu/']).addRegion('us', ['/us/']);
    expect(g.route('/eu/users')).toBe('eu');
    expect(g.route('/jp/users')).toBe('us-east');
  });

  it('GeoRouter regions + regionCount', () => {
    const g = new GeoRouter();
    g.addRegion('eu', ['/eu/']).addRegion('us', ['/us/']);
    expect(g.regions()).toEqual(['eu', 'us']);
    expect(g.regionCount()).toBe(2);
  });

  it('LoadBalancer round-robin + weighted', () => {
    const lb = new LoadBalancer();
    lb.addEndpoint('a').addEndpoint('b').addEndpoint('c');
    expect(lb.next()).toBe('a');
    expect(lb.next()).toBe('b');
    expect(lb.next()).toBe('c');
    expect(lb.next()).toBe('a');
    lb.reset();
    expect(lb.next()).toBe('a');

    const wlb = new LoadBalancer();
    wlb.addEndpoint('a', 1).addEndpoint('b', 3);
    expect(wlb.pick(0)).toBe('a');
    expect(wlb.pick(1)).toBe('b');
    expect(wlb.pick(2)).toBe('b');
    expect(wlb.pick(3)).toBe('b');
    expect(wlb.endpointCount()).toBe(2);
  });

  it('LoadBalancer empty endpoints', () => {
    const lb = new LoadBalancer();
    expect(lb.next()).toBeNull();
    expect(lb.pick(0)).toBeNull();
  });

  it('OriginShield shouldFetchFromOrigin + ratio', () => {
    const s = new OriginShield();
    expect(s.shouldFetchFromOrigin(0.3)).toBe(true);
    expect(s.shouldFetchFromOrigin(0.8)).toBe(false);
    s.recordPass();
    s.recordCached();
    s.recordCached();
    expect(s.ratio()).toBeCloseTo(2 / 3);
    expect(s.passThroughCount()).toBe(1);
    expect(s.cachedCount()).toBe(2);
  });

  it('OriginShield empty ratio', () => {
    const s = new OriginShield();
    expect(s.ratio()).toBe(0);
  });

  it('CacheWarmer warms + tracks + forget', async () => {
    const c = new CDNEdgeCache();
    const w = new CacheWarmer();
    const n = await w.warmBatch(c, [{ key: '/a', value: '1' }, { key: '/b', value: '2' }]);
    expect(n).toBe(2);
    expect(w.isWarmed('/a')).toBe(true);
    expect(c.get('/a')).toBe('1');
    expect(w.forget('/a')).toBe(true);
    expect(w.isWarmed('/a')).toBe(false);
    expect(w.warmedCount()).toBe(1);
    w.clear();
    expect(w.warmedCount()).toBe(0);
  });
});

describe('CDNCoreIndex', () => {
  it('list has 10 engines', () => {
    const idx = new CDNCoreIndex();
    expect(idx.list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new CDNCoreIndex().count()).toBe(10);
  });

  it('engines() same as list()', () => {
    const idx = new CDNCoreIndex();
    expect(idx.engines()).toEqual(idx.list());
  });

  it('has returns true for batch 1 engines', () => {
    const idx = new CDNCoreIndex();
    expect(idx.has('CDNEdgeCache')).toBe(true);
    expect(idx.has('CDNCoreIndex')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('CK_BATCH_1_ENGINES const has 10', () => {
    expect(CK_BATCH_1_ENGINES).toHaveLength(10);
  });
});