// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 1/3 (Core Tests)
// V4856-V4865: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  SandboxCore, PermissionManager, CapabilitySet, CodeLoader, ResourceLimiter,
  ExecutionContext, ApiGateway, HookRegistry, EventEmitter, SandboxCoreIndex, CJ_BATCH_1_ENGINES
} from './SandboxCore';

describe('SandboxCore', () => {
  it('create + exists + state', () => {
    const s = new SandboxCore();
    s.create('sb1');
    expect(s.exists('sb1')).toBe(true);
    expect(s.getState('sb1')).toBe('idle');
    expect(s.count()).toBe(1);
  });

  it('create returns false on duplicate', () => {
    const s = new SandboxCore();
    s.create('sb1');
    expect(s.create('sb1')).toBe(false);
  });

  it('setState transitions', () => {
    const s = new SandboxCore();
    s.create('sb1');
    s.setState('sb1', 'running');
    expect(s.getState('sb1')).toBe('running');
  });

  it('destroy removes', () => {
    const s = new SandboxCore();
    s.create('sb1');
    expect(s.destroy('sb1')).toBe(true);
    expect(s.exists('sb1')).toBe(false);
  });

  it('activeCount counts running/loaded', () => {
    const s = new SandboxCore();
    s.create('a');
    s.create('b');
    s.create('c');
    s.setState('a', 'running');
    s.setState('b', 'loaded');
    expect(s.activeCount()).toBe(2);
  });

  it('sandboxPermissions returns set', () => {
    const s = new SandboxCore();
    s.create('a', ['read', 'write']);
    expect(s.sandboxPermissions('a')!.has('read')).toBe(true);
  });
});

describe('PermissionManager', () => {
  it('grant + check', () => {
    const p = new PermissionManager();
    p.grant('sb1', 'read');
    expect(p.check('sb1', 'read')).toBe(true);
    expect(p.check('sb1', 'write')).toBe(false);
  });

  it('revoke removes permission', () => {
    const p = new PermissionManager();
    p.grant('sb1', 'read');
    p.revoke('sb1', 'read');
    expect(p.check('sb1', 'read')).toBe(false);
  });

  it('checkMany returns array', () => {
    const p = new PermissionManager();
    p.grant('sb1', 'read');
    const result = p.checkMany('sb1', ['read', 'write']);
    expect(result[0].granted).toBe(true);
    expect(result[1].granted).toBe(false);
  });

  it('request + history', () => {
    const p = new PermissionManager();
    p.request('sb1', 'network', true);
    expect(p.history('sb1')).toHaveLength(1);
    expect(p.check('sb1', 'network')).toBe(true);
  });

  it('grantCount tracks permissions', () => {
    const p = new PermissionManager();
    p.grant('sb1', 'read');
    p.grant('sb1', 'write');
    expect(p.grantCount('sb1')).toBe(2);
  });
});

describe('CapabilitySet', () => {
  it('define + get', () => {
    const c = new CapabilitySet();
    c.define('writer', ['read', 'write']);
    const cap = c.get('writer');
    expect(cap!.permissions).toEqual(['read', 'write']);
  });

  it('remove deletes', () => {
    const c = new CapabilitySet();
    c.define('writer', ['read']);
    expect(c.remove('writer')).toBe(true);
    expect(c.has('writer')).toBe(false);
  });

  it('size + names', () => {
    const c = new CapabilitySet();
    c.define('a', ['read']);
    c.define('b', ['write']);
    expect(c.size()).toBe(2);
    expect(c.names()).toEqual(['a', 'b']);
  });

  it('allPermissions returns array', () => {
    const c = new CapabilitySet();
    c.define('reader', ['read', 'storage']);
    expect(c.allPermissions('reader')).toHaveLength(2);
  });

  it('has check', () => {
    const c = new CapabilitySet();
    c.define('admin', ['*' as never].slice(0, 0));
    expect(c.has('admin')).toBe(true);
  });
});

describe('CodeLoader', () => {
  it('hash deterministic 8-hex', () => {
    const c = new CodeLoader();
    expect(c.hash('hello')).toMatch(/^[0-9a-f]{8}$/);
    expect(c.hash('hello')).toBe(c.hash('hello'));
  });

  it('load + isLoaded', () => {
    const c = new CodeLoader();
    const r = c.load('p1', 'console.log("hi")');
    expect(r.success).toBe(true);
    expect(c.isLoaded('p1')).toBe(true);
  });

  it('untrusted signer rejected', () => {
    const c = new CodeLoader();
    const r = c.load('p1', 'code', 'unknown-signer');
    expect(r.success).toBe(false);
    expect(r.reason).toBe('untrusted_signer');
  });

  it('trusted signer accepted', () => {
    const c = new CodeLoader();
    c.addTrustedSigner('official');
    const r = c.load('p1', 'code', 'official');
    expect(r.success).toBe(true);
  });

  it('integrity check', () => {
    const c = new CodeLoader();
    c.load('p1', 'abc');
    expect(c.integrity('p1', 'abc')).toBe(true);
    expect(c.integrity('p1', 'xyz')).toBe(false);
  });

  it('size tracks content length', () => {
    const c = new CodeLoader();
    c.load('p1', '12345');
    expect(c.size('p1')).toBe(5);
  });
});

describe('ResourceLimiter', () => {
  it('setLimit + getLimit', () => {
    const r = new ResourceLimiter();
    r.setLimit('sb1', 'memory', 1024);
    expect(r.getLimit('sb1', 'memory')).toBe(1024);
  });

  it('recordUsage + exceedsLimit', () => {
    const r = new ResourceLimiter();
    r.setLimit('sb1', 'memory', 100);
    r.recordUsage('sb1', 'memory', 50);
    expect(r.exceedsLimit('sb1', 'memory')).toBe(false);
    r.recordUsage('sb1', 'memory', 60);
    expect(r.exceedsLimit('sb1', 'memory')).toBe(true);
  });

  it('resetUsage clears', () => {
    const r = new ResourceLimiter();
    r.setLimit('sb1', 'memory', 100);
    r.recordUsage('sb1', 'memory', 50);
    r.resetUsage('sb1');
    expect(r.getUsage('sb1', 'memory')).toBe(0);
  });

  it('utilization ratio', () => {
    const r = new ResourceLimiter();
    r.setLimit('sb1', 'cpu', 100);
    r.recordUsage('sb1', 'cpu', 25);
    expect(r.utilization('sb1', 'cpu')).toBe(0.25);
  });

  it('exceedsLimit returns false when limit=0', () => {
    const r = new ResourceLimiter();
    r.recordUsage('sb1', 'cpu', 999999);
    expect(r.exceedsLimit('sb1', 'cpu')).toBe(false);
  });
});

describe('ExecutionContext', () => {
  it('start + setVariable + getVariable', () => {
    const e = new ExecutionContext();
    e.start('sb1');
    e.setVariable('sb1', 'user', 'alice');
    expect(e.getVariable('sb1', 'user')).toBe('alice');
  });

  it('pushStack + popStack + stackDepth', () => {
    const e = new ExecutionContext();
    e.start('sb1');
    e.pushStack('sb1', 'frame1');
    e.pushStack('sb1', 'frame2');
    expect(e.stackDepth('sb1')).toBe(2);
    expect(e.popStack('sb1')).toBe('frame2');
  });

  it('pause + isPaused + resume', () => {
    const e = new ExecutionContext();
    e.start('sb1');
    e.pause('sb1');
    expect(e.isPaused('sb1')).toBe(true);
    e.resume('sb1');
    expect(e.isPaused('sb1')).toBe(false);
  });

  it('duration tracks time', async () => {
    const e = new ExecutionContext();
    e.start('sb1');
    await new Promise(r => setTimeout(r, 10));
    expect(e.duration('sb1')).toBeGreaterThanOrEqual(10);
  });

  it('end removes context', () => {
    const e = new ExecutionContext();
    e.start('sb1');
    e.end('sb1');
    expect(e.getVariable('sb1', 'x')).toBeUndefined();
  });
});

describe('ApiGateway', () => {
  it('expose + isExposed', () => {
    const a = new ApiGateway();
    a.expose('api.read');
    expect(a.isExposed('api.read')).toBe(true);
  });

  it('revoke disables', () => {
    const a = new ApiGateway();
    a.expose('api.read');
    a.revoke('api.read');
    expect(a.isExposed('api.read')).toBe(false);
  });

  it('call returns success for exposed', () => {
    const a = new ApiGateway();
    a.expose('api.read');
    expect(a.call('api.read').success).toBe(true);
  });

  it('call rate-limited after max', () => {
    const a = new ApiGateway().setMaxCalls(3);
    a.expose('api.read');
    a.call('api.read');
    a.call('api.read');
    a.call('api.read');
    expect(a.call('api.read').reason).toBe('rate_limited');
  });

  it('callCount tracks', () => {
    const a = new ApiGateway();
    a.expose('api.read');
    a.call('api.read');
    a.call('api.read');
    expect(a.callCount('api.read')).toBe(2);
  });

  it('exposedApis lists callable', () => {
    const a = new ApiGateway();
    a.expose('a');
    a.expose('b');
    a.revoke('b');
    expect(a.exposedApis()).toEqual(['a']);
  });
});

describe('HookRegistry', () => {
  it('register + handlerCount', () => {
    const h = new HookRegistry();
    h.register('before-load', () => {});
    expect(h.handlerCount('before-load')).toBe(1);
  });

  it('fire invokes handlers', async () => {
    const h = new HookRegistry();
    let called = 0;
    h.register('after-load', () => { called++; });
    await h.fire('after-load', {});
    expect(called).toBe(1);
  });

  it('fireCount tracks fires', async () => {
    const h = new HookRegistry();
    h.register('error', () => {});
    await h.fire('error', {});
    await h.fire('error', {});
    expect(h.fireCount('error')).toBe(2);
  });

  it('unregister removes handler', () => {
    const h = new HookRegistry();
    const fn = () => {};
    h.register('error', fn);
    expect(h.unregister('error', fn)).toBe(true);
    expect(h.handlerCount('error')).toBe(0);
  });

  it('hasHandlers check', () => {
    const h = new HookRegistry();
    expect(h.hasHandlers('error')).toBe(false);
    h.register('error', () => {});
    expect(h.hasHandlers('error')).toBe(true);
  });
});

describe('EventEmitter', () => {
  it('on + emit fires listeners', () => {
    const e = new EventEmitter();
    let n = 0;
    e.on('test', () => n++);
    e.emit('test', {});
    expect(n).toBe(1);
  });

  it('off removes listener', () => {
    const e = new EventEmitter();
    let n = 0;
    const listener = () => n++;
    e.on('test', listener);
    e.off('test', listener);
    e.emit('test', {});
    expect(n).toBe(0);
  });

  it('listenerCount', () => {
    const e = new EventEmitter();
    e.on('test', () => {});
    e.on('test', () => {});
    expect(e.listenerCount('test')).toBe(2);
  });

  it('emit returns count', () => {
    const e = new EventEmitter();
    expect(e.emit('test', {})).toBe(0);
    e.on('test', () => {});
    e.on('test', () => {});
    expect(e.emit('test', {})).toBe(2);
  });

  it('history tracks events', () => {
    const e = new EventEmitter();
    e.emit('a', 1);
    e.emit('b', 2);
    expect(e.history()).toHaveLength(2);
  });

  it('eventCount filters by event', () => {
    const e = new EventEmitter();
    e.emit('a', 1);
    e.emit('a', 2);
    e.emit('b', 3);
    expect(e.eventCount('a')).toBe(2);
  });
});

describe('SandboxCoreIndex', () => {
  it('list has 10 engines', () => {
    expect(new SandboxCoreIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new SandboxCoreIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new SandboxCoreIndex().has('SandboxCore')).toBe(true);
    expect(new SandboxCoreIndex().has('Unknown')).toBe(false);
  });

  it('CJ_BATCH_1_ENGINES const has 10', () => {
    expect(CJ_BATCH_1_ENGINES).toHaveLength(10);
  });
});