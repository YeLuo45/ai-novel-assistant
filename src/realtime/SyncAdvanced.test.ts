/**
 * realtime/SyncAdvanced.test.ts (N11-N20) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  PresenceBroadcaster, CursorShare, SelectionSync, AwarenessProtocol,
  LatencyOptimizer, OfflineQueue, ReconnectReplay, WireConflictResolver,
  PartialSync, BandwidthThrottle,
} from './SyncAdvanced'

describe('N11: PresenceBroadcaster', () => {
  it('broadcast + get', () => {
    const p = new PresenceBroadcaster()
    p.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })
    expect(p.get('u1')?.status).toBe('online')
  })

  it('online filter', () => {
    const p = new PresenceBroadcaster()
    p.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })
    p.broadcast({ userId: 'u2', status: 'offline', lastSeen: Date.now() })
    expect(p.online().length).toBe(1)
  })

  it('subscribe', () => {
    const p = new PresenceBroadcaster()
    let called = 0
    p.subscribe(() => { called += 1 })
    p.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })
    expect(called).toBe(1)
  })
})

describe('N12: CursorShare', () => {
  it('update + get', () => {
    const c = new CursorShare(5000)
    c.update('u1', 100, 200, 'ch1')
    expect(c.get('u1')?.x).toBe(100)
  })

  it('active excludes stale', () => {
    const c = new CursorShare(50)
    c.update('u1', 100, 200)
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.active().length).toBe(0)
        resolve()
      }, 100)
    })
  })

  it('remove + subscribe', () => {
    const c = new CursorShare(5000)
    c.update('u1', 100, 200)
    expect(c.remove('u1')).toBe(true)
    let called = 0
    c.subscribe(() => { called += 1 })
    c.update('u2', 0, 0)
    expect(called).toBe(1)
  })
})

describe('N13: SelectionSync', () => {
  it('set + get + forResource', () => {
    const s = new SelectionSync()
    s.set({ userId: 'u1', resourceType: 'chapter', resourceId: 'ch1', start: 0, end: 100, timestamp: 0 })
    s.set({ userId: 'u2', resourceType: 'chapter', resourceId: 'ch1', start: 50, end: 150, timestamp: 0 })
    expect(s.forResource('chapter', 'ch1').length).toBe(2)
  })

  it('clear', () => {
    const s = new SelectionSync()
    s.set({ userId: 'u1', resourceType: 'chapter', resourceId: 'ch1', start: 0, end: 100, timestamp: 0 })
    expect(s.clear('u1')).toBe(true)
  })
})

describe('N14: AwarenessProtocol', () => {
  it('update + get + active', () => {
    const a = new AwarenessProtocol(50_000)
    a.update({ userId: 'u1', status: 'typing', lastUpdate: 0 })
    expect(a.get('u1')?.status).toBe('typing')
    expect(a.active().length).toBe(1)
  })

  it('stale filter', () => {
    const a = new AwarenessProtocol(10)
    a.update({ userId: 'u1', status: 'typing', lastUpdate: 0 })
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(a.active().length).toBe(0)
        resolve()
      }, 30)
    })
  })
})

describe('N15: LatencyOptimizer', () => {
  it('record + average', () => {
    const o = new LatencyOptimizer()
    o.record(100)
    o.record(200)
    expect(o.average()).toBe(150)
  })

  it('p50', () => {
    const o = new LatencyOptimizer()
    for (let i = 1; i <= 100; i++) o.record(i)
    expect(o.p50()).toBeGreaterThan(40)
  })

  it('recommend batch size adapts to latency', () => {
    const o = new LatencyOptimizer()
    o.record(20)  // low latency → 100
    expect(o.recommendBatchSize()).toBe(100)
    o.record(300)  // high latency → 50 or 20
    expect(o.recommendBatchSize()).toBeLessThanOrEqual(50)
  })

  it('recommend send interval', () => {
    const o = new LatencyOptimizer()
    o.record(20)
    expect(o.recommendSendIntervalMs()).toBe(16)
  })
})

describe('N16: OfflineQueue', () => {
  it('enqueue + size', () => {
    const q = new OfflineQueue()
    q.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    expect(q.size()).toBe(1)
  })

  it('setOnline + flush gated by online', async () => {
    const q = new OfflineQueue()
    q.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    q.setOnline(false)
    const r = await q.flush()
    expect(r.flushed).toBe(0)
  })

  it('drain', () => {
    const q = new OfflineQueue()
    q.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    expect(q.drain().length).toBe(1)
    expect(q.size()).toBe(0)
  })
})

describe('N17: ReconnectReplay', () => {
  it('enqueue + replay', async () => {
    const r = new ReconnectReplay()
    r.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    const result = await r.replay(async () => true)
    expect(result.replayed).toBe(1)
    expect(r.count()).toBe(0)
  })

  it('replay with failure', async () => {
    const r = new ReconnectReplay()
    r.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    const result = await r.replay(async () => false)
    expect(result.failed).toBe(1)
  })

  it('clear', () => {
    const r = new ReconnectReplay()
    r.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    r.clear()
    expect(r.count()).toBe(0)
  })
})

describe('N18: WireConflictResolver', () => {
  const r = new WireConflictResolver()

  it('newer-wins', () => {
    const res = r.resolve('local', 'remote', Date.now() + 1000)
    expect(res.winner).toBe('remote')
  })

  it('local-wins', () => {
    const res = r.resolve('local', 'remote', Date.now(), Date.now() + 1000, 'local-wins')
    expect(res.winner).toBe('local')
  })

  it('remote-wins', () => {
    const res = r.resolve('local', 'remote', 0, 0, 'remote-wins')
    expect(res.winner).toBe('remote')
  })

  it('merge', () => {
    const res = r.resolve({ a: 1 }, { b: 2 }, 0, 0, 'merge')
    expect(res.resolved).toEqual({ a: 1, b: 2 })
  })

  it('reject keeps local', () => {
    const res = r.resolve('local', 'remote', 0, 0, 'reject')
    expect(res.resolved).toBe('local')
  })

  it('resolveBatch', () => {
    const out = r.resolveBatch([
      { local: 'a', remote: 'b', ts: 1000 },
      { local: 'c', remote: 'd', ts: 500 },
    ], 'local-wins')
    expect(out).toEqual(['a', 'c'])
  })
})

describe('N19: PartialSync', () => {
  it('getVersion + setVersion', () => {
    const p = new PartialSync()
    p.setVersion('ch1', 5)
    expect(p.getVersion('ch1')).toBe(5)
  })

  it('computeDiff needs full sync', () => {
    const p = new PartialSync()
    p.setVersion('ch1', 10)
    const r = p.computeDiff({ resourceType: 'chapter', resourceId: 'ch1', fromVersion: 5, toVersion: 10 }, 10)
    expect(r.needsFullSync).toBe(true)
  })

  it('computeDiff up to date', () => {
    const p = new PartialSync()
    const r = p.computeDiff({ resourceType: 'chapter', resourceId: 'ch1', fromVersion: 10, toVersion: 10 }, 10)
    expect(r.needsFullSync).toBe(false)
  })

  it('mergePartial', () => {
    const p = new PartialSync()
    const merged = p.mergePartial({ a: 1, b: 2 }, { b: 3, c: 4 })
    expect(merged).toEqual({ a: 1, b: 3, c: 4 })
  })
})

describe('N20: BandwidthThrottle', () => {
  it('records within limit', () => {
    const t = new BandwidthThrottle(1000)
    expect(t.record(500)).toBe(true)
    expect(t.record(500)).toBe(true)
  })

  it('rejects over limit', () => {
    const t = new BandwidthThrottle(1000)
    t.record(800)
    expect(t.record(500)).toBe(false)
  })

  it('estimateBytes', () => {
    expect(BandwidthThrottle.estimateBytes({ a: 1, b: 'hello' })).toBeGreaterThan(0)
  })

  it('reset', () => {
    const t = new BandwidthThrottle(1000)
    t.record(500)
    t.reset()
    expect(t.currentLoad()).toBe(0)
  })
})