// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 3/3 (Integration Tests)
// V4876-V4885: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  PluginLifecycle, VersionCompatibility, AuditLog, PolicyEnforcer, SandboxPool,
  CrashRecovery, SandboxedPluginRunner, SandboxMetrics, SandboxIntegrationIndex,
  SandboxMasterIndex, CJ_BATCH_3_ENGINES, CJ_ALL_ENGINES
} from './SandboxIntegration';

describe('PluginLifecycle', () => {
  it('register + getState', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    expect(l.getState('p1')).toBe('registered');
  });

  it('register returns false on duplicate', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    expect(l.register('p1', '1.0.0')).toBe(false);
  });

  it('load transitions registered→loaded', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    expect(l.load('p1')).toBe(true);
    expect(l.getState('p1')).toBe('loaded');
  });

  it('activate transitions loaded→activated', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    l.load('p1');
    expect(l.activate('p1')).toBe(true);
    expect(l.isActive('p1')).toBe(true);
  });

  it('crash + recover', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    l.load('p1');
    l.activate('p1');
    l.crash('p1');
    expect(l.getState('p1')).toBe('crashed');
    expect(l.recover('p1')).toBe(true);
    expect(l.getState('p1')).toBe('activated');
  });

  it('transitionHistory tracks transitions', () => {
    const l = new PluginLifecycle();
    l.register('p1', '1.0.0');
    l.load('p1');
    l.activate('p1');
    const history = l.transitionHistory('p1');
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('registered');
    expect(history[0].to).toBe('loaded');
  });
});

describe('VersionCompatibility', () => {
  it('setCompatible + isCompatible true', () => {
    const v = new VersionCompatibility();
    v.setCompatible('p1', '1.0.0', '2.0.0');
    expect(v.isCompatible('p1', '1.5.0')).toBe(true);
  });

  it('isCompatible false when below min', () => {
    const v = new VersionCompatibility();
    v.setCompatible('p1', '1.0.0');
    expect(v.isCompatible('p1', '0.5.0')).toBe(false);
  });

  it('isCompatible false when above max', () => {
    const v = new VersionCompatibility();
    v.setCompatible('p1', '1.0.0', '2.0.0');
    expect(v.isCompatible('p1', '3.0.0')).toBe(false);
  });

  it('satisfies ^ caret', () => {
    const v = new VersionCompatibility();
    expect(v.satisfies('1.5.0', '^1.0.0')).toBe(true);
    expect(v.satisfies('2.0.0', '^1.0.0')).toBe(false);
  });

  it('satisfies ~ tilde (same minor)', () => {
    const v = new VersionCompatibility();
    expect(v.satisfies('1.5.0', '~1.5.0')).toBe(true);
    expect(v.satisfies('1.6.0', '~1.5.0')).toBe(false);
  });

  it('satisfies >= <= > <', () => {
    const v = new VersionCompatibility();
    expect(v.satisfies('2.0.0', '>=1.0.0')).toBe(true);
    expect(v.satisfies('0.5.0', '<=1.0.0')).toBe(true);
    expect(v.satisfies('2.0.0', '>1.0.0')).toBe(true);
    expect(v.satisfies('0.5.0', '<1.0.0')).toBe(true);
  });

  it('count', () => {
    const v = new VersionCompatibility();
    v.setCompatible('a', '1.0.0');
    v.setCompatible('b', '2.0.0');
    expect(v.count()).toBe(2);
  });
});

describe('AuditLog', () => {
  it('log + query by action', () => {
    const a = new AuditLog();
    a.log('install', 'p1');
    a.log('execute', 'p1');
    const installs = a.query({ action: 'install' });
    expect(installs).toHaveLength(1);
  });

  it('query by severity', () => {
    const a = new AuditLog();
    a.log('install', 'p1', {}, 'info');
    a.log('error', 'p1', {}, 'error');
    expect(a.query({ severity: 'error' })).toHaveLength(1);
  });

  it('errors returns only error entries', () => {
    const a = new AuditLog();
    a.log('error', 'p1', { msg: 'failed' }, 'error');
    a.log('info', 'p1', {}, 'info');
    expect(a.errors()).toHaveLength(1);
  });

  it('count + errorCount', () => {
    const a = new AuditLog();
    a.log('a', 'x');
    a.log('b', 'y', {}, 'error');
    expect(a.count()).toBe(2);
    expect(a.errorCount()).toBe(1);
  });

  it('setMaxEntries + truncation', () => {
    const a = new AuditLog().setMaxEntries(105);
    for (let i = 0; i < 110; i++) a.log('a', 'x');
    expect(a.count()).toBeLessThanOrEqual(105);
  });
});

describe('PolicyEnforcer', () => {
  it('deny policy blocks', () => {
    const p = new PolicyEnforcer();
    p.addPolicy('no-network', ctx => ctx.network === true, 'deny', 'Network disabled');
    expect(p.enforce({ network: true }).allowed).toBe(false);
  });

  it('allow policy passes', () => {
    const p = new PolicyEnforcer();
    p.addPolicy('allow-all', () => true, 'allow', 'always allowed');
    expect(p.enforce({}).allowed).toBe(true);
  });

  it('default allow when no matching policy', () => {
    const p = new PolicyEnforcer();
    expect(p.enforce({}).reason).toBe('default_allow');
  });

  it('policyCount', () => {
    const p = new PolicyEnforcer();
    p.addPolicy('a', () => true, 'allow', 'x');
    p.addPolicy('b', () => true, 'deny', 'y');
    expect(p.policyCount()).toBe(2);
  });

  it('matchedPolicies returns all matching', () => {
    const p = new PolicyEnforcer();
    p.addPolicy('a', ctx => ctx.x === 1, 'log', 'x');
    p.addPolicy('b', ctx => ctx.x === 1, 'log', 'y');
    const matched = p.matchedPolicies({ x: 1 });
    expect(matched).toHaveLength(2);
  });
});

describe('SandboxPool', () => {
  it('add + size', () => {
    const p = new SandboxPool();
    p.add('sb1');
    expect(p.size()).toBe(1);
  });

  it('setMax enforced', () => {
    const p = new SandboxPool().setMax(2);
    p.add('a');
    p.add('b');
    expect(p.add('c')).toBe(false);
  });

  it('borrow + release', () => {
    const p = new SandboxPool();
    p.add('sb1');
    expect(p.borrow()).toBe('sb1');
    expect(p.borrow()).toBeNull();
    p.release('sb1');
    expect(p.borrow()).toBe('sb1');
  });

  it('available + borrowed tracking', () => {
    const p = new SandboxPool();
    p.add('a');
    p.add('b');
    p.borrow();
    expect(p.available()).toEqual(['b']);
    expect(p.borrowed()).toEqual(['a']);
  });

  it('remove', () => {
    const p = new SandboxPool();
    p.add('a');
    expect(p.remove('a')).toBe(true);
    expect(p.size()).toBe(0);
  });

  it('release returns false for non-borrowed', () => {
    const p = new SandboxPool();
    p.add('a');
    expect(p.release('a')).toBe(false);
  });
});

describe('CrashRecovery', () => {
  it('recordCrash + crashCount', () => {
    const c = new CrashRecovery();
    c.recordCrash('p1', 'OOM', 'major');
    expect(c.crashCount('p1')).toBe(1);
  });

  it('canRecover true when retries < max', () => {
    const c = new CrashRecovery().setMaxRetries(3);
    c.recordCrash('p1', 'error');
    expect(c.canRecover('p1')).toBe(true);
  });

  it('canRecover false when retries >= max', () => {
    const c = new CrashRecovery().setMaxRetries(1);
    c.recordCrash('p1', 'err');
    expect(c.canRecover('p1')).toBe(false);
  });

  it('recover resets retryCount', () => {
    const c = new CrashRecovery().setMaxRetries(2);
    c.recordCrash('p1', 'err');
    c.recover('p1');
    expect(c.retryCount('p1')).toBe(0);
  });

  it('isCriticalCrash', () => {
    const c = new CrashRecovery();
    c.recordCrash('p1', 'segfault', 'critical');
    expect(c.isCriticalCrash('p1')).toBe(true);
  });

  it('history returns crash records', () => {
    const c = new CrashRecovery();
    c.recordCrash('p1', 'err1');
    c.recordCrash('p1', 'err2');
    expect(c.history('p1')).toHaveLength(2);
  });
});

describe('SandboxedPluginRunner', () => {
  it('install end-to-end', () => {
    const r = new SandboxedPluginRunner();
    const ok = r.install('p1', '1.0.0', 'console.log("hi")', ['read']);
    expect(ok).toBe(true);
    expect(r.lifecycle().getState('p1')).toBe('loaded');
  });

  it('execute transitions to activated', () => {
    const r = new SandboxedPluginRunner();
    r.install('p1', '1.0.0', 'code');
    const result = r.execute('p1');
    expect(result.success).toBe(true);
    expect(r.lifecycle().isActive('p1')).toBe(true);
  });

  it('stop deactivates', () => {
    const r = new SandboxedPluginRunner();
    r.install('p1', '1.0.0', 'code');
    r.execute('p1');
    r.stop('p1');
    expect(r.lifecycle().isActive('p1')).toBe(false);
  });

  it('uninstall removes', () => {
    const r = new SandboxedPluginRunner();
    r.install('p1', '1.0.0', 'code');
    r.execute('p1');
    expect(r.uninstall('p1')).toBe(true);
    expect(r.lifecycle().getState('p1')).toBe('uninstalled');
  });

  it('audit log tracks events', () => {
    const r = new SandboxedPluginRunner();
    r.install('p1', '1.0.0', 'code');
    r.execute('p1');
    r.stop('p1');
    expect(r.audit().count()).toBeGreaterThan(0);
  });
});

describe('SandboxMetrics', () => {
  it('recordExecution + get', () => {
    const m = new SandboxMetrics();
    m.recordExecution('sb1', 100);
    expect(m.get('sb1')!.executions).toBe(1);
    expect(m.get('sb1')!.cpuTime).toBe(100);
  });

  it('recordError + errorRate', () => {
    const m = new SandboxMetrics();
    m.recordExecution('sb1', 100);
    m.recordExecution('sb1', 100);
    m.recordError('sb1');
    expect(m.errorRate('sb1')).toBe(0.5);
  });

  it('recordMemoryPeak only highest', () => {
    const m = new SandboxMetrics();
    m.recordMemory('sb1', 100);
    m.recordMemory('sb1', 200);
    m.recordMemory('sb1', 150);
    expect(m.get('sb1')!.memoryPeak).toBe(200);
  });

  it('recordNetworkCall', () => {
    const m = new SandboxMetrics();
    m.recordNetworkCall('sb1');
    m.recordNetworkCall('sb1');
    expect(m.get('sb1')!.networkCalls).toBe(2);
  });

  it('errorRate 0 when no executions', () => {
    expect(new SandboxMetrics().errorRate('unknown')).toBe(0);
  });

  it('trackedSandboxes', () => {
    const m = new SandboxMetrics();
    m.recordExecution('a', 10);
    m.recordExecution('b', 10);
    expect(m.trackedSandboxes()).toHaveLength(2);
  });
});

describe('SandboxIntegrationIndex', () => {
  it('list has 9+1 = 10 engines (incl Index self)', () => {
    expect(new SandboxIntegrationIndex().list()).toHaveLength(10);
  });

  it('count 10 (incl Index self)', () => {
    expect(new SandboxIntegrationIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new SandboxIntegrationIndex().has('PluginLifecycle')).toBe(true);
    expect(new SandboxIntegrationIndex().has('Unknown')).toBe(false);
  });

  it('CJ_BATCH_3_ENGINES const has 9', () => {
    expect(CJ_BATCH_3_ENGINES).toHaveLength(9);
  });
});

describe('SandboxMasterIndex', () => {
  it('list contains all 30 engines', () => {
    const idx = new SandboxMasterIndex();
    expect(idx.list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new SandboxMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new SandboxMasterIndex();
    expect(idx.has('SandboxCore')).toBe(true);
    expect(idx.has('CodeValidator')).toBe(true);
    expect(idx.has('PluginLifecycle')).toBe(true);
  });

  it('CJ_ALL_ENGINES const has 30', () => {
    expect(CJ_ALL_ENGINES).toHaveLength(30);
  });
});