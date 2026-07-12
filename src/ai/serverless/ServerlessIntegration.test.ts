// V5356-V5365: Serverless Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  APIGateway,
  EdgeMiddleware,
  CostOptimizer,
  PerformanceMonitor,
  DistributedTraceLinker,
  HealthChecker,
  MigrationTool,
  ServerlessIntegrationIndex,
  DAEdgeBridge,
  ServerlessMasterIndex,
  ApiRequest
} from './ServerlessIntegration';
import { FunctionRegistry, RequestRouter } from './ServerlessCore';

const sampleFn = (name: string) => ({
  name,
  runtime: 'nodejs20',
  handler: 'index.handler',
  memoryMb: 256,
  timeoutSec: 30,
  env: {},
  code: ''
});

describe('APIGateway', () => {
  it('handles existing route', async () => {
    const g = new APIGateway();
    g.addRoute({ path: '/api/users', method: 'GET', functionName: 'listUsers', authRequired: false, rateLimitPerMin: 100 });
    const r = await g.handle({ path: '/api/users', method: 'GET', headers: {} });
    expect(r.status).toBe(200);
    expect(r.requestId).toMatch(/^req-/);
  });

  it('returns 404 for unknown route', async () => {
    const g = new APIGateway();
    const r = await g.handle({ path: '/missing', method: 'GET', headers: {} });
    expect(r.status).toBe(404);
  });

  it('returns 401 when auth missing', async () => {
    const g = new APIGateway();
    g.addRoute({ path: '/secure', method: 'POST', functionName: 'fn', authRequired: true, rateLimitPerMin: 60 });
    const r = await g.handle({ path: '/secure', method: 'POST', headers: {} });
    expect(r.status).toBe(401);
  });

  it('accepts auth header', async () => {
    const g = new APIGateway();
    g.addRoute({ path: '/secure', method: 'POST', functionName: 'fn', authRequired: true, rateLimitPerMin: 60 });
    const r = await g.handle({ path: '/secure', method: 'POST', headers: { authorization: 'Bearer x' } });
    expect(r.status).toBe(200);
  });

  it('routes() returns registered', () => {
    const g = new APIGateway();
    g.addRoute({ path: '/a', method: 'GET', functionName: 'fn1', authRequired: false, rateLimitPerMin: 10 });
    expect(g.routes().length).toBe(1);
  });
});

describe('EdgeMiddleware', () => {
  it('executes middleware chain', async () => {
    const m = new EdgeMiddleware();
    let called: string[] = [];
    m.use('first', async (req) => { called.push('first'); return req; });
    m.use('second', async (req) => { called.push('second'); return req; });
    await m.execute({ path: '/', method: 'GET', headers: {} });
    expect(called).toEqual(['first', 'second']);
  });

  it('middlewareNames returns names', () => {
    const m = new EdgeMiddleware();
    m.use('a', async (req) => req);
    m.use('b', async (req) => req);
    expect(m.middlewareNames()).toEqual(['a', 'b']);
  });

  it('remove by name', () => {
    const m = new EdgeMiddleware();
    m.use('a', async (req) => req);
    m.use('b', async (req) => req);
    expect(m.remove('a')).toBe(true);
    expect(m.remove('a')).toBe(false);
    expect(m.size()).toBe(1);
  });

  it('size starts at 0', () => {
    const m = new EdgeMiddleware();
    expect(m.size()).toBe(0);
  });

  it('mutates request headers in chain', async () => {
    const m = new EdgeMiddleware();
    m.use('inject', async (req) => ({ ...req, headers: { ...req.headers, 'x-trace': 'abc' } }));
    const result = await m.execute({ path: '/', method: 'GET', headers: {} });
    expect(result.headers['x-trace']).toBe('abc');
  });
});

describe('CostOptimizer', () => {
  it('records invocations and gb-seconds', () => {
    const c = new CostOptimizer();
    c.recordInvocation('fn', 1000, 512);
    c.recordInvocation('fn', 2000, 512);
    const b = c.breakdown().find(x => x.functionName === 'fn');
    expect(b?.invocations).toBe(2);
    expect(b?.gbSeconds).toBeGreaterThan(0);
  });

  it('topSpenders sorts by cost desc', () => {
    const c = new CostOptimizer();
    c.recordInvocation('cheap', 100, 128);
    c.recordInvocation('expensive', 5000, 1024);
    const top = c.topSpenders(1);
    expect(top[0].functionName).toBe('expensive');
  });

  it('totalCost sums breakdown', () => {
    const c = new CostOptimizer();
    c.recordInvocation('a', 1000, 512);
    c.recordInvocation('b', 2000, 512);
    expect(c.totalCost()).toBeGreaterThan(0);
  });

  it('breakdown returns empty when no invocations', () => {
    const c = new CostOptimizer();
    expect(c.breakdown()).toEqual([]);
  });

  it('setPricing updates costs', () => {
    const c = new CostOptimizer();
    c.setPricing(0.0001, 0.00001);
    c.recordInvocation('fn', 1000, 512);
    const b = c.breakdown()[0];
    expect(b.estimatedCostUsd).toBeGreaterThan(0);
  });
});

describe('PerformanceMonitor', () => {
  it('record and snapshot', () => {
    const p = new PerformanceMonitor();
    p.record('fn', 100);
    p.record('fn', 200);
    p.record('fn', 300);
    const s = p.snapshot('fn');
    expect(s.p50Ms).toBeGreaterThan(0);
    expect(s.p99Ms).toBeGreaterThan(0);
    expect(s.errorRate).toBe(0);
  });

  it('tracks errorRate', () => {
    const p = new PerformanceMonitor();
    p.record('fn', 100, false);
    p.record('fn', 100, true);
    expect(p.snapshot('fn').errorRate).toBe(0.5);
  });

  it('snapshots returns all functions', () => {
    const p = new PerformanceMonitor();
    p.record('a', 100);
    p.record('b', 200);
    expect(p.snapshots().length).toBe(2);
  });

  it('worstP99 finds slowest', () => {
    const p = new PerformanceMonitor();
    for (let i = 0; i < 20; i++) p.record('a', 100);
    for (let i = 0; i < 20; i++) p.record('b', 5000);
    expect(p.worstP99()?.functionName).toBe('b');
  });

  it('totalInvocations sums', () => {
    const p = new PerformanceMonitor();
    p.record('a', 100);
    p.record('b', 200);
    expect(p.totalInvocations()).toBe(2);
  });
});

describe('DistributedTraceLinker', () => {
  it('link and hops', () => {
    const t = new DistributedTraceLinker();
    t.link('trace-1', 'fn-a');
    t.link('trace-1', 'fn-b');
    expect(t.hops('trace-1')).toEqual(['fn-a', 'fn-b']);
  });

  it('hopCount', () => {
    const t = new DistributedTraceLinker();
    t.link('t', 'a');
    t.link('t', 'b');
    t.link('t', 'c');
    expect(t.hopCount('t')).toBe(3);
  });

  it('tracesInvolving finds function', () => {
    const t = new DistributedTraceLinker();
    t.link('t1', 'fn');
    t.link('t2', 'other');
    t.link('t3', 'fn');
    expect(t.tracesInvolving('fn').sort()).toEqual(['t1', 't3']);
  });

  it('totalTraces counts', () => {
    const t = new DistributedTraceLinker();
    t.link('t1', 'a');
    t.link('t2', 'a');
    expect(t.totalTraces()).toBe(2);
  });

  it('clear empties', () => {
    const t = new DistributedTraceLinker();
    t.link('t1', 'a');
    t.clear();
    expect(t.totalTraces()).toBe(0);
  });
});

describe('HealthChecker', () => {
  it('check returns status', () => {
    const h = new HealthChecker();
    const c = h.check('fn', true, 50);
    expect(c.healthy).toBe(true);
    expect(c.latencyMs).toBe(50);
  });

  it('unhealthy filters', () => {
    const h = new HealthChecker();
    h.check('a', true, 50);
    h.check('b', false, 5000);
    expect(h.unhealthy().length).toBe(1);
    expect(h.healthy().length).toBe(1);
  });

  it('status returns null for unknown', () => {
    const h = new HealthChecker();
    expect(h.status('missing')).toBeNull();
  });

  it('averageLatency is 0 when empty', () => {
    const h = new HealthChecker();
    expect(h.averageLatency()).toBe(0);
  });

  it('totalChecked counts', () => {
    const h = new HealthChecker();
    h.check('a', true, 10);
    h.check('b', true, 20);
    expect(h.totalChecked()).toBe(2);
  });
});

describe('MigrationTool', () => {
  it('plan creates pending step', () => {
    const m = new MigrationTool();
    const s = m.plan('fn', 'nodejs18', 'nodejs20');
    expect(s.status).toBe('pending');
  });

  it('execute marks in-progress', () => {
    const m = new MigrationTool();
    const s = m.execute('fn', 'r1', 'r2');
    expect(s.status).toBe('in-progress');
    expect(m.pending().length).toBe(1);
  });

  it('complete marks done', () => {
    const m = new MigrationTool();
    m.execute('fn', 'r1', 'r2');
    expect(m.complete('fn', true)).toBe(true);
    expect(m.completed().length).toBe(1);
  });

  it('complete fails when none in-progress', () => {
    const m = new MigrationTool();
    expect(m.complete('fn', true)).toBe(false);
  });

  it('progress counts done/total', () => {
    const m = new MigrationTool();
    m.execute('fn', 'r1', 'r2');
    m.complete('fn', true);
    m.execute('fn', 'r2', 'r3');
    const p = m.progress('fn');
    expect(p.done).toBe(1);
    expect(p.total).toBe(2);
  });
});

describe('ServerlessIntegrationIndex', () => {
  it('summary combines counts', async () => {
    const g = new APIGateway();
    const c = new CostOptimizer();
    const p = new PerformanceMonitor();
    const h = new HealthChecker();
    g.addRoute({ path: '/a', method: 'GET', functionName: 'fn1', authRequired: false, rateLimitPerMin: 10 });
    c.recordInvocation('fn1', 100, 256);
    p.record('fn1', 100);
    h.check('fn1', true, 50);
    const s = ServerlessIntegrationIndex.summary(g, c, p, h);
    expect(s).toContain('Routes: 1');
    expect(s).toContain('Invocations: 1');
    expect(s).toContain('Healthy: 1/1');
  });
});

describe('DAEdgeBridge', () => {
  it('wireRouter adds routes from registry', () => {
    const reg = new FunctionRegistry();
    const router = new RequestRouter();
    reg.register(sampleFn('a'));
    reg.register(sampleFn('b'));
    const wired = DAEdgeBridge.wireRouter(router, reg);
    expect(wired).toBe(2);
    expect(router.route('/a').matchedFunction).toBe('a');
  });

  it('healthFromMonitor creates checks', () => {
    const monitor = new PerformanceMonitor();
    const checker = new HealthChecker();
    monitor.record('a', 100);
    monitor.record('b', 6000);
    monitor.record('b', 6000, true);
    const checks = DAEdgeBridge.healthFromMonitor(monitor, checker);
    expect(checks.length).toBe(2);
  });
});

describe('ServerlessMasterIndex', () => {
  it('totalEngines returns count', () => {
    expect(ServerlessMasterIndex.totalEngines()).toBeGreaterThan(20);
  });

  it('allModules returns string list', () => {
    const modules = ServerlessMasterIndex.allModules();
    expect(modules).toContain('FunctionDeployer');
    expect(modules).toContain('APIGateway');
  });
});