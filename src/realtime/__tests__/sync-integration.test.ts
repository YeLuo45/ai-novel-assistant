/**
 * realtime/__tests__/sync-integration.test.ts (N27)
 */

import { describe, it, expect } from 'vitest'
import {
  ConnectionManager, OperationQueue, CRDTSync, PresenceBroadcaster,
  CursorShare, AwarenessProtocol, LatencyOptimizer, OfflineQueue, ReconnectReplay,
  WireConflictResolver, PartialSync, BandwidthThrottle, MessageEncryption,
  AuthTokenManager, RoomMembership, PermissionSync, AuditBroadcast,
} from '../index'
import { CRDT } from '../../ai/persistence/PersistenceAdvanced'
import type { WebSocketTransport, TransportMessage } from '../SyncTransport'

class MockTransport implements WebSocketTransport {
  private _handlers: Set<(m: TransportMessage) => void> = new Set()
  connect(): Promise<void> { return Promise.resolve() }
  disconnect(): void {}
  send(): void {}
  onMessage(h: (m: TransportMessage) => void): () => void { this._handlers.add(h); return () => this._handlers.delete(h) }
  getState(): 'disconnected' | 'connecting' | 'connected' { return 'connected' }
}

describe('Sync — end-to-end', () => {
  it('full flow: connect + sync + presence + audit', async () => {
    const cm = new ConnectionManager(new MockTransport())
    await cm.connect('wss://x')

    const crdt = new CRDT<number>('d1')
    const sync = new CRDTSync(crdt, new OperationQueue())
    sync.localSet('x', 1)

    const presence = new PresenceBroadcaster()
    presence.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })

    const audit = new AuditBroadcast()
    audit.emit('login', 'u1', 'r1', 'logged in')

    expect(cm.getState()).toBe('connected')
    expect(presence.list().length).toBe(1)
    expect(audit.count()).toBe(1)
  })

  it('encryption + auth + permission', () => {
    const enc = new MessageEncryption('xor', 'k')
    expect(enc.decrypt(enc.encrypt('test'))).toBe('test')

    const tm = new AuthTokenManager()
    const t = tm.issue('u1', 'r1', ['read'])
    expect(tm.verify(t).valid).toBe(true)

    const ps = new PermissionSync()
    ps.define('editor', ['read', 'write'])
    expect(ps.can('editor', 'write')).toBe(true)
  })

  it('room membership + cursor + awareness', () => {
    const rm = new RoomMembership()
    rm.join('r1', 'u1', 'editor')
    rm.join('r1', 'u2', 'viewer')
    expect(rm.members('r1').length).toBe(2)

    const cs = new CursorShare()
    cs.update('u1', 100, 200)
    expect(cs.get('u1')?.x).toBe(100)

    const aw = new AwarenessProtocol()
    aw.update({ userId: 'u1', status: 'editing', lastUpdate: 0 })
    expect(aw.list().length).toBe(1)
  })

  it('latency + bandwidth + partial sync', () => {
    const lat = new LatencyOptimizer()
    lat.record(20)  // < 50ms
    expect(lat.recommendBatchSize()).toBe(100)

    const bw = new BandwidthThrottle(1000)
    expect(bw.record(500)).toBe(true)
    expect(bw.record(600)).toBe(false)

    const ps = new PartialSync()
    ps.setVersion('ch1', 5)
    expect(ps.getVersion('ch1')).toBe(5)
  })

  it('offline + replay + conflict', async () => {
    const oq = new OfflineQueue()
    oq.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    expect(oq.size()).toBe(1)

    const rp = new ReconnectReplay()
    rp.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    const r = await rp.replay(async () => true)
    expect(r.replayed).toBe(1)

    const cr = new WireConflictResolver()
    const res = cr.resolve('local', 'remote', 0, 0, 'local-wins')
    expect(res.winner).toBe('local')
  })
})