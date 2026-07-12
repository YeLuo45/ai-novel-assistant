// V5346-V5355: Serverless Advanced Batch 2/3 tests
import { describe, it, expect, vi } from 'vitest';
import {
  MemoryManager,
  EnvVarResolver,
  SecretVault,
  LogStreamer,
  MetricsCollector,
  ProvisionedConcurrency,
  FailureInjector,
  TimeoutGuard,
  VersionManager,
  ServerlessAdvancedIndex
} from './ServerlessAdvanced';

describe('MemoryManager', () => {
  it('allocate and recordUsage tracks peak', () => {
    const m = new MemoryManager();
    m.allocate('fn', 256);
    m.recordUsage('fn', 100);
    m.recordUsage('fn', 200);
    expect(m.peakUsage('fn')).toBe(200);
  });

  it('averageUtilization is 0 when no allocations', () => {
    const m = new MemoryManager();
    expect(m.averageUtilization()).toBe(0);
    expect(m.averageUtilization('fn')).toBe(0);
  });

  it('averageUtilization computes ratio', () => {
    const m = new MemoryManager();
    m.allocate('fn', 100);
    m.recordUsage('fn', 50);
    expect(m.averageUtilization('fn')).toBe(0.5);
  });

  it('overProvisioned finds underused', () => {
    const m = new MemoryManager();
    m.allocate('a', 256);
    m.allocate('b', 256);
    m.recordUsage('a', 50);
    m.recordUsage('b', 200);
    const over = m.overProvisioned(0.5);
    expect(over).toContain('a');
    expect(over).not.toContain('b');
  });

  it('totalAllocations counts', () => {
    const m = new MemoryManager();
    m.allocate('a', 128);
    m.allocate('b', 256);
    expect(m.totalAllocations()).toBe(2);
  });
});

describe('EnvVarResolver', () => {
  it('set and resolve literal', () => {
    const e = new EnvVarResolver();
    e.set('FOO', 'bar');
    expect(e.resolve('FOO')).toBe('bar');
  });

  it('resolve null when missing', () => {
    const e = new EnvVarResolver();
    expect(e.resolve('MISSING')).toBeNull();
  });

  it('secrets source redacted', () => {
    const e = new EnvVarResolver();
    e.setSecret('DB_PASS', 'real-pwd');
    e.set('PASSWORD', 'DB_PASS', 'secrets');
    expect(e.resolve('PASSWORD')).toBe('real-pwd');
  });

  it('bySource filters', () => {
    const e = new EnvVarResolver();
    e.set('A', '1', 'literal');
    e.set('B', '2', 'parameter-store');
    expect(e.bySource('literal').length).toBe(1);
  });

  it('resolveAll returns all', () => {
    const e = new EnvVarResolver();
    e.set('A', '1');
    e.set('B', '2');
    expect(e.resolveAll()).toEqual({ A: '1', B: '2' });
  });
});

describe('SecretVault', () => {
  it('put and current returns latest', () => {
    const v = new SecretVault();
    const s = v.put('DB', 'cipher-1');
    expect(s.version).toBe(1);
    expect(v.current('DB')?.cipherText).toBe('cipher-1');
  });

  it('rotate increments version', () => {
    const v = new SecretVault();
    v.put('DB', 'c1');
    v.rotate('DB', 'c2');
    expect(v.current('DB')?.version).toBe(2);
    expect(v.previousVersion('DB')?.version).toBe(1);
  });

  it('history returns all versions', () => {
    const v = new SecretVault();
    v.put('DB', 'c1');
    v.rotate('DB', 'c2');
    v.rotate('DB', 'c3');
    expect(v.history('DB').length).toBe(3);
  });

  it('current returns null when missing', () => {
    const v = new SecretVault();
    expect(v.current('MISSING')).toBeNull();
  });

  it('isStale checks age', () => {
    const v = new SecretVault();
    v.put('DB', 'c1');
    expect(v.isStale('DB', 365 * 24 * 3600 * 1000)).toBe(false);
  });
});

describe('LogStreamer', () => {
  it('log buffers and notifies subscribers', () => {
    const s = new LogStreamer();
    const cb = vi.fn();
    s.subscribe(cb);
    s.log({ level: 'info', message: 'hello', functionName: 'fn' });
    expect(cb).toHaveBeenCalledOnce();
    expect(s.totalLines()).toBe(1);
  });

  it('unsubscribe stops notifications', () => {
    const s = new LogStreamer();
    const cb = vi.fn();
    const unsub = s.subscribe(cb);
    unsub();
    s.log({ level: 'info', message: 'x', functionName: 'fn' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('byLevel and byFunction filter', () => {
    const s = new LogStreamer();
    s.log({ level: 'error', message: 'a', functionName: 'fn1' });
    s.log({ level: 'info', message: 'b', functionName: 'fn2' });
    expect(s.byLevel('error').length).toBe(1);
    expect(s.byFunction('fn1').length).toBe(1);
  });

  it('recent returns last N', () => {
    const s = new LogStreamer();
    for (let i = 0; i < 5; i++) {
      s.log({ level: 'info', message: `m${i}`, functionName: 'fn' });
    }
    expect(s.recent(2).length).toBe(2);
    expect(s.recent(2)[1].message).toBe('m4');
  });

  it('clear empties buffer', () => {
    const s = new LogStreamer();
    s.log({ level: 'info', message: 'a', functionName: 'fn' });
    s.clear();
    expect(s.totalLines()).toBe(0);
  });
});

describe('MetricsCollector', () => {
  it('record updates aggregates', () => {
    const m = new MetricsCollector();
    m.record({ name: 'invocations', value: 1, tags: {} });
    m.record({ name: 'invocations', value: 3, tags: {} });
    const s = m.summary('invocations');
    expect(s?.avg).toBe(2);
    expect(s?.min).toBe(1);
    expect(s?.max).toBe(3);
    expect(s?.count).toBe(2);
  });

  it('summary returns null for missing', () => {
    const m = new MetricsCollector();
    expect(m.summary('missing')).toBeNull();
  });

  it('byTag filters by tags', () => {
    const m = new MetricsCollector();
    m.record({ name: 'latency', value: 100, tags: { region: 'us' } });
    m.record({ name: 'latency', value: 200, tags: { region: 'eu' } });
    expect(m.byTag('latency', 'region', 'us').length).toBe(1);
  });

  it('metricNames lists unique', () => {
    const m = new MetricsCollector();
    m.record({ name: 'a', value: 1, tags: {} });
    m.record({ name: 'a', value: 2, tags: {} });
    m.record({ name: 'b', value: 1, tags: {} });
    expect(m.metricNames().sort()).toEqual(['a', 'b']);
  });

  it('totalSamples counts', () => {
    const m = new MetricsCollector();
    m.record({ name: 'a', value: 1, tags: {} });
    m.record({ name: 'b', value: 1, tags: {} });
    expect(m.totalSamples()).toBe(2);
  });
});

describe('ProvisionedConcurrency', () => {
  it('setProvisioned and provisionedFor', () => {
    const p = new ProvisionedConcurrency();
    p.setProvisioned('fn', 5);
    expect(p.provisionedFor('fn')).toBe(5);
  });

  it('expired windows return 0', () => {
    const p = new ProvisionedConcurrency();
    p.setProvisioned('fn', 5, -1);
    expect(p.provisionedFor('fn')).toBe(0);
  });

  it('cleanup removes expired', () => {
    const p = new ProvisionedConcurrency();
    p.setProvisioned('fn', 5, -1);
    p.setProvisioned('fn', 10);
    expect(p.cleanup()).toBe(1);
    expect(p.activeWindows().length).toBe(1);
  });

  it('activeWindows returns non-expired', () => {
    const p = new ProvisionedConcurrency();
    p.setProvisioned('a', 5);
    expect(p.activeWindows().length).toBe(1);
  });

  it('totalProvisioned sums active', () => {
    const p = new ProvisionedConcurrency();
    p.setProvisioned('a', 5);
    p.setProvisioned('b', 10);
    expect(p.totalProvisioned()).toBe(15);
  });
});

describe('FailureInjector', () => {
  it('configure and shouldFail', () => {
    const f = new FailureInjector();
    f.configure({ functionName: 'fn', type: 'error', probability: 1, active: true });
    expect(f.shouldFail('fn')).toBe(true);
  });

  it('shouldFail false when no active faults', () => {
    const f = new FailureInjector();
    expect(f.shouldFail('fn')).toBe(false);
  });

  it('disable deactivates', () => {
    const f = new FailureInjector();
    f.configure({ functionName: 'fn', type: 'error', probability: 1, active: true });
    f.disable('fn');
    expect(f.shouldFail('fn')).toBe(false);
  });

  it('injectType returns null when none', () => {
    const f = new FailureInjector();
    expect(f.injectType('fn')).toBeNull();
  });

  it('failureRate tracks', () => {
    const f = new FailureInjector();
    f.configure({ functionName: 'fn', type: 'error', probability: 1, active: true });
    f.shouldFail('fn');
    f.shouldFail('fn');
    f.shouldFail('fn');
    expect(f.failureRate()).toBe(1);
  });
});

describe('TimeoutGuard', () => {
  it('check returns breached boolean', () => {
    const t = new TimeoutGuard();
    const r = t.check('fn', 5, 6000);
    expect(r.breached).toBe(true);
    const r2 = t.check('fn', 5, 1000);
    expect(r2.breached).toBe(false);
  });

  it('breachRate computes', () => {
    const t = new TimeoutGuard();
    t.check('fn', 5, 1000);
    t.check('fn', 5, 6000);
    expect(t.breachRate('fn')).toBe(0.5);
  });

  it('breachRate is 0 when empty', () => {
    const t = new TimeoutGuard();
    expect(t.breachRate()).toBe(0);
  });

  it('breachesFor filters', () => {
    const t = new TimeoutGuard();
    t.check('fn', 5, 6000);
    t.check('fn', 5, 1000);
    expect(t.breachesFor('fn').length).toBe(1);
  });

  it('worstOffender finds highest breach rate', () => {
    const t = new TimeoutGuard();
    t.check('a', 5, 6000);
    t.check('a', 5, 1000);
    t.check('b', 5, 6000);
    t.check('b', 5, 6000);
    expect(t.worstOffender()?.name).toBe('b');
  });
});

describe('VersionManager', () => {
  it('publish and resolve latest', () => {
    const v = new VersionManager();
    v.publish('fn', 'v1');
    v.publish('fn', 'v2');
    expect(v.resolve('fn')).toBe('v2');
  });

  it('alias maps to version', () => {
    const v = new VersionManager();
    v.publish('fn', 'v1');
    v.publish('fn', 'v2');
    v.alias('fn', 'stable', 'v1');
    expect(v.resolve('fn', 'stable')).toBe('v1');
  });

  it('alias fails on unknown version', () => {
    const v = new VersionManager();
    expect(v.alias('fn', 'stable', 'v9')).toBe(false);
  });

  it('versions returns all', () => {
    const v = new VersionManager();
    v.publish('fn', 'v1');
    v.publish('fn', 'v2');
    expect(v.versions('fn')).toEqual(['v1', 'v2']);
  });

  it('totalVersions sums', () => {
    const v = new VersionManager();
    v.publish('a', 'v1');
    v.publish('b', 'v1');
    v.publish('b', 'v2');
    expect(v.totalVersions()).toBe(3);
  });
});

describe('ServerlessAdvancedIndex', () => {
  it('summary includes counts', () => {
    const s = new SecretVault();
    const m = new MetricsCollector();
    const l = new LogStreamer();
    const t = new TimeoutGuard();
    s.put('DB', 'x');
    m.record({ name: 'a', value: 1, tags: {} });
    l.log({ level: 'info', message: 'x', functionName: 'fn' });
    t.check('fn', 5, 1000);
    const summary = ServerlessAdvancedIndex.summary(s, m, l, t);
    expect(summary).toContain('Secrets: 1');
    expect(summary).toContain('Metrics: 1');
    expect(summary).toContain('Logs: 1');
    expect(summary).toContain('Timeout records: 1');
  });
});