/**
 * realtime/demo/sync-integration-demo.ts (N26)
 */

import {
  ConnectionManager, SyncMessageBuilder, OperationQueue, CRDTSync,
  PresenceBroadcaster, CursorShare, AwarenessProtocol, LatencyOptimizer,
  OfflineQueue, ReconnectReplay, WireConflictResolver, PartialSync, BandwidthThrottle,
  MessageEncryption, AuthTokenManager, RoomMembership, PermissionSync, AuditBroadcast,
} from '../index'
import { CRDT } from '../../ai/persistence/PersistenceAdvanced'
import type { WebSocketTransport, TransportMessage } from '../SyncTransport'

class MockTransport implements WebSocketTransport {
  private _state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' = 'disconnected'
  private _handlers: Set<(m: TransportMessage) => void> = new Set()
  connect(): Promise<void> { this._state = 'connected'; return Promise.resolve() }
  disconnect(): void { this._state = 'disconnected' }
  send(): void {}
  onMessage(h: (m: TransportMessage) => void): () => void { this._handlers.add(h); return () => this._handlers.delete(h) }
  getState() { return this._state }
}

export interface DemoResult {
  connected: boolean
  presence: number
  cursors: number
  awareness: number
  ops: number
  encrypted: boolean
  tokenValid: boolean
  roomMembers: number
  audits: number
  bandwidth: number
}

export async function runSyncDemo(): Promise<DemoResult> {
  // 1. Connection
  const cm = new ConnectionManager(new MockTransport())
  await cm.connect('wss://demo.com')
  const connected = cm.getState() === 'connected'

  // 2. CRDT sync
  const crdt = new CRDT<unknown>('d1')
  const sync = new CRDTSync(crdt, new OperationQueue(3))
  sync.localSet('counter', 42)
  sync.receiveRemote({ key: 'counter', value: 100, timestamp: Date.now() + 100, deviceId: 'd2' })
  const ops = sync.getPendingOps().length

  // 3. Presence + cursor + awareness
  const presence = new PresenceBroadcaster()
  presence.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })
  presence.broadcast({ userId: 'u2', status: 'away', lastSeen: Date.now() })

  const cursors = new CursorShare()
  cursors.update('u1', 100, 200, 'ch1')
  cursors.update('u2', 300, 400, 'ch1')

  const awareness = new AwarenessProtocol()
  awareness.update({ userId: 'u1', status: 'typing', lastUpdate: 0 })

  // 4. Latency
  const latency = new LatencyOptimizer()
  for (let i = 0; i < 10; i++) latency.record(50 + i * 10)
  const batchSize = latency.recommendBatchSize()

  // 5. Offline + replay
  const offline = new OfflineQueue()
  offline.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
  const replay = new ReconnectReplay()
  replay.enqueue({ key: 'k2', value: 'v2', timestamp: 0, deviceId: 'd' })
  await replay.replay(async () => true)

  // 6. Conflict resolution
  const resolver = new WireConflictResolver()
  resolver.resolve('local', 'remote', Date.now() + 1000)

  // 7. Partial sync
  const partial = new PartialSync()
  partial.setVersion('ch1', 10)

  // 8. Bandwidth
  const bw = new BandwidthThrottle(100_000)
  bw.record(5000)
  bw.record(3000)

  // 9. Encryption
  const enc = new MessageEncryption('xor', 'key')
  const encResult = enc.decrypt(enc.encrypt('hello')) === 'hello'

  // 10. Auth
  const tm = new AuthTokenManager()
  const token = tm.issue('u1', 'r1')
  const tokenValid = tm.verify(token).valid

  // 11. Room membership
  const rm = new RoomMembership()
  rm.join('r1', 'u1', 'editor')
  rm.join('r1', 'u2', 'commenter')

  // 12. Permission sync
  const ps = new PermissionSync()
  ps.define('editor', ['read', 'write'])

  // 13. Audit
  const audit = new AuditBroadcast()
  audit.emit('login', 'u1', 'r1', 'logged in')
  audit.emit('edit', 'u2', 'r1', 'updated ch1')

  return {
    connected,
    presence: presence.list().length,
    cursors: cursors.active().length,
    awareness: awareness.list().length,
    ops,
    encrypted: encResult,
    tokenValid,
    roomMembers: rm.members('r1').length,
    audits: audit.count(),
    bandwidth: bw.currentLoad(),
  }
}