// V5336-V5345: Serverless Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  FunctionDeployer,
  ColdStartOptimizer,
  WarmPool,
  RequestRouter,
  EdgeCache,
  FunctionRegistry,
  EventTrigger,
  InvocationQueue,
  ConcurrencyLimiter,
  ServerlessCoreIndex,
  FunctionDefinition
} from './ServerlessCore';

const sampleFn = (name = 'hello'): FunctionDefinition => ({
  name,
  runtime: 'nodejs20',
  handler: 'index.handler',
  memoryMb: 256,
  timeoutSec: 30,
  env: { STAGE: 'prod' },
  code: 'exports.handler = async () => ({ ok: true });'
});

describe('FunctionDeployer', () => {
  it('deploys with monotonic version numbers', () => {
    const d = new FunctionDeployer();
    const r1 = d.deploy(sampleFn());
    const r2 = d.deploy(sampleFn());
    expect(r1.version).toBe('v1');
    expect(r2.version).toBe('v2');
    expect(r2.status).toBe('active');
  });

  it('rolls back to previous version', () => {
    const d = new FunctionDeployer();
    d.deploy(sampleFn('a'));
    d.deploy(sampleFn('a'));
    const restored = d.rollback('a');
    expect(restored?.version).toBe('v1');
    expect(restored?.status).toBe('active');
    expect(d.history('a').length).toBe(2);
  });

  it('returns null rollback when no history', () => {
    const d = new FunctionDeployer();
    expect(d.rollback('missing')).toBeNull();
  });

  it('lists active deployments only', () => {
    const d = new FunctionDeployer();
    d.deploy(sampleFn('a'));
    d.deploy(sampleFn('a'));
    d.deploy(sampleFn('b'));
    d.rollback('a');
    expect(d.activeDeployments().length).toBe(2);
    expect(d.totalDeployments()).toBe(3);
  });

  it('latestVersion returns most recent', () => {
    const d = new FunctionDeployer();
    d.deploy(sampleFn('x'));
    d.deploy(sampleFn('x'));
    expect(d.latestVersion('x')).toBe('v2');
    expect(d.latestVersion('missing')).toBeNull();
  });
});

describe('ColdStartOptimizer', () => {
  it('records cold starts with reasons', () => {
    const o = new ColdStartOptimizer();
    o.recordColdStart('a', 200, 'init');
    o.recordColdStart('a', 1500, 'cold-pool');
    expect(o.coldStarts()).toBe(2);
    expect(o.byReason('cold-pool').length).toBe(1);
  });

  it('recommends prewarm for slow cold starts', () => {
    const o = new ColdStartOptimizer();
    expect(o.shouldPreWarm('a')).toBe(false);
    o.recordColdStart('a', 2000, 'cold-disk');
    expect(o.shouldPreWarm('a')).toBe(true);
  });

  it('averageColdStartMs is zero when empty', () => {
    const o = new ColdStartOptimizer();
    expect(o.averageColdStartMs()).toBe(0);
    expect(o.averageColdStartMs('any')).toBe(0);
  });

  it('averageColdStartMs per function', () => {
    const o = new ColdStartOptimizer();
    o.recordColdStart('a', 100, 'init');
    o.recordColdStart('a', 200, 'init');
    o.recordColdStart('b', 400, 'init');
    expect(o.averageColdStartMs('a')).toBe(150);
    expect(o.averageColdStartMs('b')).toBe(400);
  });

  it('reset clears state', () => {
    const o = new ColdStartOptimizer();
    o.recordColdStart('a', 2000, 'cold-disk');
    o.reset();
    expect(o.coldStarts()).toBe(0);
    expect(o.shouldPreWarm('a')).toBe(false);
  });
});

describe('WarmPool', () => {
  it('acquires warm instance and increments invocations', () => {
    const p = new WarmPool();
    p.add('fn', 'us-east-1', 2);
    const i = p.acquire('fn');
    expect(i?.invocations).toBe(1);
    expect(p.poolSize('fn')).toBe(2);
  });

  it('returns null when pool empty', () => {
    const p = new WarmPool();
    expect(p.acquire('fn')).toBeNull();
  });

  it('release removes from pool', () => {
    const p = new WarmPool();
    p.add('fn', 'us-east-1', 1);
    expect(p.release('fn', 'us-east-1')).toBe(true);
    expect(p.poolSize('fn')).toBe(0);
    expect(p.release('fn', 'us-east-1')).toBe(false);
  });

  it('detects idle instances by threshold (no idle when fresh)', () => {
    const p = new WarmPool();
    p.add('fn', 'us-east-1', 2);
    expect(p.idleInstances('fn', 60000).length).toBe(0);
  });

  it('totalInstances sums across functions', () => {
    const p = new WarmPool();
    p.add('a', 'r', 2);
    p.add('b', 'r', 3);
    expect(p.totalInstances()).toBe(5);
  });
});

describe('RequestRouter', () => {
  it('matches exact paths', () => {
    const r = new RequestRouter();
    r.addRule({ pattern: '/api/users', functionName: 'listUsers', weight: 1 });
    expect(r.route('/api/users').matchedFunction).toBe('listUsers');
    expect(r.route('/other').matchedFunction).toBeNull();
  });

  it('matches wildcard patterns', () => {
    const r = new RequestRouter();
    r.addRule({ pattern: '/api/*', functionName: 'apiHandler', weight: 1 });
    expect(r.route('/api/users/1').matchedFunction).toBe('apiHandler');
  });

  it('rulesForFunction filters by name', () => {
    const r = new RequestRouter();
    r.addRule({ pattern: '/a', functionName: 'fn1', weight: 1 });
    r.addRule({ pattern: '/b', functionName: 'fn2', weight: 1 });
    expect(r.rulesForFunction('fn1').length).toBe(1);
  });

  it('clear empties rules', () => {
    const r = new RequestRouter();
    r.addRule({ pattern: '/x', functionName: 'fn', weight: 1 });
    r.clear();
    expect(r.rules().length).toBe(0);
  });

  it('route records method', () => {
    const r = new RequestRouter();
    r.addRule({ pattern: '/x', functionName: 'fn', weight: 1 });
    expect(r.route('/x', 'POST').method).toBe('POST');
  });
});

describe('EdgeCache', () => {
  it('put and get returns value', () => {
    const c = new EdgeCache();
    c.put('k', 'v', 60000);
    expect(c.get('k')).toBe('v');
  });

  it('expires by TTL', async () => {
    const c = new EdgeCache();
    c.put('k', 'v', 1);
    await new Promise(r => setTimeout(r, 5));
    expect(c.get('k')).toBeNull();
  });

  it('invalidatePrefix removes prefix keys', () => {
    const c = new EdgeCache();
    c.put('user:1', 'a');
    c.put('user:2', 'b');
    c.put('post:1', 'c');
    expect(c.invalidatePrefix('user:')).toBe(2);
    expect(c.size()).toBe(1);
  });

  it('hotKeys sorted by hits', () => {
    const c = new EdgeCache();
    c.put('a', 'x');
    c.put('b', 'y');
    c.get('a'); c.get('a'); c.get('b');
    const top = c.hotKeys(2);
    expect(top[0].key).toBe('a');
  });

  it('hitRate is zero when empty', () => {
    const c = new EdgeCache();
    expect(c.hitRate()).toBe(0);
  });
});

describe('FunctionRegistry', () => {
  it('registers and retrieves', () => {
    const r = new FunctionRegistry();
    r.register(sampleFn('fn1'));
    expect(r.get('fn1')?.name).toBe('fn1');
    expect(r.get('missing')).toBeNull();
  });

  it('unregister removes function', () => {
    const r = new FunctionRegistry();
    r.register(sampleFn('a'));
    expect(r.unregister('a')).toBe(true);
    expect(r.unregister('a')).toBe(false);
  });

  it('byRuntime filters', () => {
    const r = new FunctionRegistry();
    r.register(sampleFn('a'));
    r.register({ ...sampleFn('b'), runtime: 'python3.11' });
    expect(r.byRuntime('nodejs20').length).toBe(1);
  });

  it('totalMemoryMb sums allocation', () => {
    const r = new FunctionRegistry();
    r.register({ ...sampleFn('a'), memoryMb: 128 });
    r.register({ ...sampleFn('b'), memoryMb: 512 });
    expect(r.totalMemoryMb()).toBe(640);
  });

  it('names returns all keys', () => {
    const r = new FunctionRegistry();
    r.register(sampleFn('x'));
    r.register(sampleFn('y'));
    expect(r.names().sort()).toEqual(['x', 'y']);
  });
});

describe('EventTrigger', () => {
  it('binds and fires matching events', () => {
    const t = new EventTrigger();
    t.bind({ eventType: 'order.created', functionName: 'processOrder' });
    const matched = t.fire('order.created', { id: 1 });
    expect(matched.length).toBe(1);
    expect(t.totalFired()).toBe(1);
  });

  it('returns empty when no match', () => {
    const t = new EventTrigger();
    expect(t.fire('missing', {}).length).toBe(0);
  });

  it('bindingsFor filters by function', () => {
    const t = new EventTrigger();
    t.bind({ eventType: 'a', functionName: 'fn1' });
    t.bind({ eventType: 'b', functionName: 'fn2' });
    expect(t.bindingsFor('fn1').length).toBe(1);
  });

  it('history records payload and ts', () => {
    const t = new EventTrigger();
    t.bind({ eventType: 'x', functionName: 'fn' });
    t.fire('x', { foo: 1 });
    const h = t.history('fn');
    expect(h.length).toBe(1);
    expect((h[0].payload as any).foo).toBe(1);
  });

  it('totalBindings counts registered', () => {
    const t = new EventTrigger();
    t.bind({ eventType: 'a', functionName: 'fn' });
    t.bind({ eventType: 'b', functionName: 'fn' });
    expect(t.totalBindings()).toBe(2);
  });
});

describe('InvocationQueue', () => {
  it('enqueue assigns ids and queued status', () => {
    const q = new InvocationQueue();
    const inv = q.enqueue('fn', { a: 1 });
    expect(inv.id).toBe('inv-1');
    expect(inv.status).toBe('queued');
    expect(q.queueDepth()).toBe(1);
  });

  it('dequeue marks running', () => {
    const q = new InvocationQueue();
    q.enqueue('fn', {});
    const inv = q.dequeue();
    expect(inv?.status).toBe('running');
    expect(inv?.startedAt).not.toBeNull();
  });

  it('dequeue returns null when empty', () => {
    const q = new InvocationQueue();
    expect(q.dequeue()).toBeNull();
  });

  it('complete marks done or failed', () => {
    const q = new InvocationQueue();
    const inv = q.enqueue('fn', {});
    expect(q.complete(inv.id, false)).toBe(true);
    expect(q.complete('missing', true)).toBe(false);
  });

  it('averageWaitMs is zero when no completions', () => {
    const q = new InvocationQueue();
    expect(q.averageWaitMs()).toBe(0);
  });

  it('queueDepth per function', () => {
    const q = new InvocationQueue();
    q.enqueue('a', {});
    q.enqueue('b', {});
    expect(q.queueDepth('a')).toBe(1);
    expect(q.queueDepth('b')).toBe(1);
  });
});

describe('ConcurrencyLimiter', () => {
  it('tryAcquire respects limits', () => {
    const l = new ConcurrencyLimiter();
    l.setLimit('fn', 2);
    expect(l.tryAcquire('fn')).toBe(true);
    expect(l.tryAcquire('fn')).toBe(true);
    expect(l.tryAcquire('fn')).toBe(false);
  });

  it('release decrements counter', () => {
    const l = new ConcurrencyLimiter();
    l.setLimit('fn', 1);
    l.tryAcquire('fn');
    l.release('fn');
    expect(l.tryAcquire('fn')).toBe(true);
  });

  it('utilization ratio', () => {
    const l = new ConcurrencyLimiter();
    l.setLimit('fn', 10);
    l.tryAcquire('fn');
    l.tryAcquire('fn');
    expect(l.utilization('fn')).toBe(0.2);
  });

  it('overloadedFunctions lists saturated', () => {
    const l = new ConcurrencyLimiter();
    l.setLimit('a', 1);
    l.setLimit('b', 1);
    l.tryAcquire('a');
    l.tryAcquire('b');
    expect(l.overloadedFunctions().sort()).toEqual(['a', 'b']);
  });

  it('default limit is 10', () => {
    const l = new ConcurrencyLimiter();
    for (let i = 0; i < 10; i++) l.tryAcquire('fn');
    expect(l.tryAcquire('fn')).toBe(false);
    expect(l.activeFor('fn')).toBe(10);
  });
});

describe('ServerlessCoreIndex', () => {
  it('summary includes counts', () => {
    const d = new FunctionDeployer();
    const o = new ColdStartOptimizer();
    const p = new WarmPool();
    const q = new InvocationQueue();
    d.deploy(sampleFn('a'));
    o.recordColdStart('a', 100, 'init');
    p.add('a', 'r', 2);
    q.enqueue('a', {});
    const s = ServerlessCoreIndex.summary(d, o, p, q);
    expect(s).toContain('Deployments: 1');
    expect(s).toContain('Cold starts: 1');
    expect(s).toContain('Warm instances: 2');
    expect(s).toContain('Queue depth: 1');
  });
});