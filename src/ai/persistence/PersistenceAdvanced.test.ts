/**
 * ai/persistence/PersistenceAdvanced.test.ts (K16-K25) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  CloudStorage, IndexedDBAdapter, DexieSchema, BatchWriter, StreamingPersist,
  PersistenceHookEmitter, AutoRestore, MultiDeviceSync, CRDT, OperationalTransform,
  type TextOp,
} from './PersistenceAdvanced'

describe('K16: StreamingPersist', () => {
  it('push + assemble', () => {
    const s = new StreamingPersist()
    s.push('hello ', false)
    s.push('world', true)
    expect(s.assemble()).toBe('hello world')
  })

  it('chunks', () => {
    const s = new StreamingPersist()
    s.push('a', false)
    s.push('b', true)
    expect(s.chunks().length).toBe(2)
  })

  it('reset', () => {
    const s = new StreamingPersist()
    s.push('abc', true)
    s.reset()
    expect(s.size()).toBe(0)
  })
})

describe('K17: BatchWriter', () => {
  it('enqueue + queueSize', () => {
    const w = new BatchWriter({ batchSize: 3, flushIntervalMs: 1000, onFlush: () => {} })
    w.enqueue({ a: 1 })
    expect(w.queueSize()).toBe(1)
  })

  it('flush on success', async () => {
    const w = new BatchWriter({ batchSize: 5, flushIntervalMs: 1000, onFlush: () => {} })
    for (let i = 0; i < 3; i++) w.enqueue({ i })
    const r = await w.flush()
    expect(r.flushed).toBe(3)
  })

  it('re-enqueue on failure', async () => {
    const w = new BatchWriter({ batchSize: 5, flushIntervalMs: 1000, onFlush: () => { throw new Error('fail') } })
    w.enqueue({ a: 1 })
    const r = await w.flush()
    expect(r.flushed).toBe(0)
    expect(w.queueSize()).toBe(1)
  })
})

describe('K18: CloudStorage', () => {
  it('upload + download', () => {
    const s = new CloudStorage('local')
    s.upload('a.json', '{"x":1}')
    const d = s.download('a.json')
    expect(d?.content).toBe('{"x":1}')
  })

  it('verify checksum', () => {
    const s = new CloudStorage('local')
    s.upload('a.json', 'content')
    expect(s.verify('a.json')).toBe(true)
  })

  it('list with prefix', () => {
    const s = new CloudStorage('local')
    s.upload('a/1.txt', 'x')
    s.upload('a/2.txt', 'y')
    s.upload('b/1.txt', 'z')
    expect(s.list('a/').length).toBe(2)
  })

  it('delete', () => {
    const s = new CloudStorage('local')
    s.upload('a.txt', 'x')
    expect(s.delete('a.txt')).toBe(true)
  })
})

describe('K19: IndexedDBAdapter', () => {
  it('put + get', () => {
    const db = new IndexedDBAdapter()
    db.put('k1', { x: 1 })
    expect(db.get('k1')?.value).toEqual({ x: 1 })
  })

  it('delete + has + count', () => {
    const db = new IndexedDBAdapter()
    db.put('a', 1)
    db.put('b', 2)
    expect(db.count()).toBe(2)
    expect(db.has('a')).toBe(true)
    expect(db.delete('a')).toBe(true)
    expect(db.count()).toBe(1)
  })

  it('list + clear', () => {
    const db = new IndexedDBAdapter()
    db.put('a', 1)
    db.put('b', 2)
    expect(db.list().length).toBe(2)
    db.clear()
    expect(db.count()).toBe(0)
  })
})

describe('K20: DexieSchema', () => {
  it('addTable + tables', () => {
    const s = new DexieSchema()
    s.addTable({ name: 'users', primaryKey: 'id', indexes: ['email'] })
    expect(s.tables().length).toBe(1)
  })

  it('bumpVersion', () => {
    const s = new DexieSchema()
    s.bumpVersion()
    expect(s.version).toBe(2)
  })

  it('toDexieString', () => {
    const s = new DexieSchema()
    s.addTable({ name: 'users', primaryKey: 'id', indexes: ['email'] })
    const str = s.toDexieString()
    expect(str).toContain('users')
    expect(str).toContain('id, email')
  })

  it('removeTable', () => {
    const s = new DexieSchema()
    s.addTable({ name: 'x', primaryKey: 'id', indexes: [] })
    expect(s.removeTable('x')).toBe(true)
  })
})

describe('K21: PersistenceHookEmitter', () => {
  it('on + emit', () => {
    const h = new PersistenceHookEmitter()
    let called = 0
    h.on('after-save', () => { called += 1 })
    h.emit('after-save', { path: 'a' })
    expect(called).toBe(1)
  })

  it('unsubscribe', () => {
    const h = new PersistenceHookEmitter()
    let called = 0
    const off = h.on('after-save', () => { called += 1 })
    h.emit('after-save', { path: 'a' })
    off()
    h.emit('after-save', { path: 'b' })
    expect(called).toBe(1)
  })
})

describe('K22: AutoRestore', () => {
  it('checks checkpoints', () => {
    let restored: unknown = null
    const ar = new AutoRestore(
      { checkIntervalMs: 100, maxAge: 0, onRestore: (d) => { restored = d } },
      () => [{ timestamp: Date.now() - 1000, data: { x: 1 } }],
    )
    ar.start()
    return new Promise<void>(resolve => {
      setTimeout(() => {
        ar.stop()
        expect(restored).toEqual({ x: 1 })
        resolve()
      }, 200)
    })
  })
})

describe('K23: MultiDeviceSync', () => {
  it('registerDevice + syncToDevice', () => {
    const s = new MultiDeviceSync()
    s.registerDevice({ deviceId: 'd1', deviceName: 'Phone', lastSync: 0, pendingChanges: 0 })
    expect(s.list().length).toBe(1)
    expect(s.syncToDevice('d1', 5)).toBe(true)
    expect(s.totalPending).toBe(5)
  })

  it('unregister', () => {
    const s = new MultiDeviceSync()
    s.registerDevice({ deviceId: 'd1', deviceName: 'A', lastSync: 0, pendingChanges: 0 })
    expect(s.unregister('d1')).toBe(true)
  })
})

describe('K24: CRDT', () => {
  it('set + get', () => {
    const c = new CRDT<string>('d1')
    c.set('k1', 'v1')
    expect(c.get('k1')).toBe('v1')
  })

  it('mergeRemote with newer timestamp wins', async () => {
    const c1 = new CRDT<number>('d1')
    c1.set('x', 1)
    await new Promise(r => setTimeout(r, 5))  // ensure timestamp diff
    const c2 = new CRDT<number>('d2')
    c2.set('x', 2)
    c1.mergeRemote(c2.export().find(i => i.key === 'x')!)
    expect(c1.get('x')).toBe(2)
  })

  it('export + import', () => {
    const c1 = new CRDT<number>('d1')
    c1.set('x', 1)
    c1.set('y', 2)
    const c2 = new CRDT<number>('d2')
    c2.import(c1.export())
    expect(c2.get('x')).toBe(1)
    expect(c2.get('y')).toBe(2)
  })
})

describe('K25: OperationalTransform', () => {
  it('insert', () => {
    const ot = new OperationalTransform()
    expect(ot.apply('hello', { type: 'insert', position: 0, chars: 'X' })).toBe('Xhello')
  })

  it('delete', () => {
    const ot = new OperationalTransform()
    expect(ot.apply('hello', { type: 'delete', position: 1, count: 2 })).toBe('hlo')
  })

  it('applyAll', () => {
    const ot = new OperationalTransform()
    expect(ot.applyAll('hello', [
      { type: 'insert', position: 5, chars: ' world' },
      { type: 'delete', position: 0, count: 1 },
    ])).toBe('ello world')
  })

  it('transform insert/insert', () => {
    const ot = new OperationalTransform()
    const op1: TextOp = { type: 'insert', position: 2, chars: 'XX' }
    const op2: TextOp = { type: 'insert', position: 4, chars: 'YY' }
    const transformed = ot.transform(op1, op2)
    expect(transformed.position).toBe(6)  // 4 + 2 (XX length)
  })
})