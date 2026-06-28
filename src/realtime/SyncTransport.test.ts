/**
 * realtime/SyncTransport.test.ts (N1-N10) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  Heartbeat, Backoff, ReconnectStrategy, ConnectionManager,
  SyncMessageBuilder, SyncError, SyncErrorHandler, SyncResponseBuilder,
  OperationQueue, CRDTSync,
  type WebSocketTransport, type TransportMessage, type ConnectionState,
} from './SyncTransport'
import { CRDT } from '../ai/persistence/PersistenceAdvanced'

describe('N4: Heartbeat', () => {
  it('start + tick', () => {
    const h = new Heartbeat(50, () => {})
    h.start()
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(h.tickCount).toBeGreaterThan(0)
        h.stop()
        resolve()
      }, 130)
    })
  })

  it('stop', () => {
    const h = new Heartbeat(50, () => {})
    h.start()
    h.stop()
    expect(h.tickCount).toBe(0)  // no more ticks
  })

  it('isStale', () => {
    const h = new Heartbeat(10000, () => {})
    h.start()
    expect(h.isStale(20000)).toBe(false)
    h.stop()
  })
})

describe('N5: Backoff', () => {
  it('delay grows', () => {
    const b = new Backoff({ initialMs: 100, multiplier: 2, jitter: false })
    expect(b.delay()).toBe(100)
    expect(b.delay()).toBe(200)
  })

  it('caps at max', () => {
    const b = new Backoff({ initialMs: 100, multiplier: 10, maxMs: 1000, jitter: false })
    expect(b.delay()).toBe(100)
    expect(b.delay()).toBe(1000)  // capped
  })

  it('reset', () => {
    const b = new Backoff({ initialMs: 100, jitter: false })
    b.delay()
    b.reset()
    expect(b.attempt).toBe(0)
  })
})

describe('N3: ReconnectStrategy', () => {
  it('recordAttempt returns delay', () => {
    const r = new ReconnectStrategy(3, { initialMs: 100, jitter: false })
    expect(r.recordAttempt()).toBe(100)
  })

  it('exceeds maxAttempts', () => {
    const r = new ReconnectStrategy(2, { initialMs: 100, jitter: false })
    r.recordAttempt()
    r.recordAttempt()
    expect(r.recordAttempt()).toBe(-1)
    expect(r.status()).toBe('failed')
  })

  it('canRetry', () => {
    const r = new ReconnectStrategy(1)
    expect(r.canRetry()).toBe(true)
    r.recordAttempt()
    expect(r.canRetry()).toBe(false)
  })

  it('reset', () => {
    const r = new ReconnectStrategy(1)
    r.recordAttempt()
    r.reset()
    expect(r.attempts).toBe(0)
  })
})

describe('N2: ConnectionManager', () => {
  // Mock transport
  class MockTransport implements WebSocketTransport {
    private _state: ConnectionState = 'disconnected'
    private _handlers: Set<(m: TransportMessage) => void> = new Set()
    connect(): Promise<void> { this._state = 'connected'; return Promise.resolve() }
    disconnect(): void { this._state = 'disconnected' }
    send(): void {}
    onMessage(h: (m: TransportMessage) => void): () => void { this._handlers.add(h); return () => this._handlers.delete(h) }
    getState(): ConnectionState { return this._state }
  }

  it('connect + state', async () => {
    const t = new MockTransport()
    const cm = new ConnectionManager(t)
    await cm.connect('wss://x.com')
    expect(cm.getState()).toBe('connected')
  })

  it('disconnect', async () => {
    const t = new MockTransport()
    const cm = new ConnectionManager(t)
    await cm.connect('wss://x.com')
    cm.disconnect()
    expect(cm.getState()).toBe('disconnected')
  })

  it('send only when connected', async () => {
    const t = new MockTransport()
    const cm = new ConnectionManager(t)
    expect(cm.send({ id: '1', type: 'op', senderId: 'a', payload: {}, timestamp: 0 })).toBe(false)
    await cm.connect('wss://x.com')
    expect(cm.send({ id: '1', type: 'op', senderId: 'a', payload: {}, timestamp: 0 })).toBe(true)
  })

  it('attemptReconnect', () => {
    const t = new MockTransport()
    const cm = new ConnectionManager(t, 3)
    const delay = cm.attemptReconnect()
    expect(delay).toBeGreaterThan(0)
  })
})

describe('N8: SyncMessage', () => {
  it('build', () => {
    const b = new SyncMessageBuilder()
    const m = b.build('operation', 'r1', 'u1', { op: 'set' })
    expect(m.roomId).toBe('r1')
    expect(m.type).toBe('operation')
    expect(m.id).toBeTruthy()
  })
})

describe('N10: SyncError', () => {
  it('has code + retryable', () => {
    const e = new SyncError('TIMEOUT', 'failed', true)
    expect(e.code).toBe('TIMEOUT')
    expect(e.retryable).toBe(true)
  })

  it('SyncErrorHandler reports', () => {
    const h = new SyncErrorHandler()
    h.report('CONNECTION_LOST', 'x', true)
    h.report('AUTH_FAILED', 'y', false)
    expect(h.getErrors().length).toBe(2)
    expect(h.hasRetryable()).toBe(true)
  })

  it('onError callback', () => {
    const h = new SyncErrorHandler()
    let called = 0
    h.onError(() => { called += 1 })
    h.report('TIMEOUT', 'x')
    expect(called).toBe(1)
  })

  it('clear', () => {
    const h = new SyncErrorHandler()
    h.report('TIMEOUT', 'x')
    h.clear()
    expect(h.getErrors().length).toBe(0)
  })
})

describe('N9: SyncResponse', () => {
  it('build response', () => {
    const r = new SyncResponseBuilder().build('ok', 'req-1', { data: 'x' })
    expect(r.status).toBe('ok')
    expect(r.requestId).toBe('req-1')
  })
})

describe('N7: OperationQueue', () => {
  it('enqueue + pending + markSent + markAcked', () => {
    const q = new OperationQueue()
    const op = q.enqueue({ key: 'k1', value: 'v1', timestamp: 0, deviceId: 'd1' })
    expect(q.pending().length).toBe(1)
    expect(q.markSent(op.id)).toBe(true)
    expect(q.markAcked(op.id)).toBe(true)
  })

  it('markFailed increments attempts', () => {
    const q = new OperationQueue(3)
    const op = q.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    q.markFailed(op.id)
    expect(q.pending().length).toBe(1)  // back to pending for retry
    q.markFailed(op.id)
    q.markFailed(op.id)
    expect(q.failed().length).toBe(1)
  })

  it('clearAcked', () => {
    const q = new OperationQueue()
    const op = q.enqueue({ key: 'k1', value: 'v', timestamp: 0, deviceId: 'd' })
    q.markAcked(op.id)
    q.clearAcked()
    expect(q.count()).toBe(0)
  })
})

describe('N6: CRDTSync', () => {
  it('localSet + queue', () => {
    const crdt = new CRDT<unknown>('d1')
    const sync = new CRDTSync(crdt)
    const op = sync.localSet('x', 1)
    expect(op.status).toBe('pending')
    expect(sync.getPendingOps().length).toBe(1)
  })

  it('receiveRemote', () => {
    const crdt = new CRDT<unknown>('d1')
    const sync = new CRDTSync(crdt)
    sync.localSet('x', 1)
    const r = sync.receiveRemote({ key: 'x', value: 2, timestamp: Date.now() + 100, deviceId: 'd2' })
    expect(r.merged).toBe(true)
  })

  it('ack', () => {
    const crdt = new CRDT<unknown>('d1')
    const sync = new CRDTSync(crdt)
    const op = sync.localSet('x', 1)
    expect(sync.ack(op.id)).toBe(true)
  })
})