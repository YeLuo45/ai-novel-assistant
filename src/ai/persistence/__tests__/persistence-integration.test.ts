/**
 * ai/persistence/__tests__/persistence-integration.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  ProjectSnapshotBuilder, BackupManager, VersioningManager, Migrator,
  ConflictResolver, Compressor, Exporter, Importer,
  CloudStorage, IndexedDBAdapter, DexieSchema, CRDT, OperationalTransform,
} from '../index'

describe('Persistence — end-to-end', () => {
  it('snapshot + checksum + restore cycle', () => {
    const b = new ProjectSnapshotBuilder()
    const s = b.create('p1', { chapters: [], metadata: {} })
    expect(b.verify(s.snapshotId)).toBe(true)
    expect(b.latest('p1')?.snapshotId).toBe(s.snapshotId)
  })

  it('backup + restore', () => {
    const b = new BackupManager()
    const data = { chapters: [], metadata: { name: 'X' } }
    b.create(data)
    expect(b.latest()?.data).toEqual(data)
  })

  it('versioning diff', () => {
    const v = new VersioningManager<Record<string, unknown>>()
    v.commit({ x: 1, y: 2 }, '1.0.0')
    v.commit({ x: 1, y: 3, z: 4 }, '1.1.0')
    const d = v.diff('1.0.0', '1.1.0')
    expect(d.added).toContain('z')
    expect(d.modified).toContain('y')
  })

  it('migrator up + down', () => {
    const m = new Migrator()
    m.add({
      fromVersion: '1.0.0', toVersion: '2.0.0',
      up: (d) => ({ ...(d as object), added: true }),
      down: (d) => { const { added, ...rest } = d as any; return rest },
    })
    const upgraded = m.up({ old: 1 }, '2.0.0', '1.0.0') as any
    expect(upgraded.added).toBe(true)
    const downgraded = m.down(upgraded, '1.0.0', '2.0.0') as any
    expect(downgraded.added).toBeUndefined()
  })

  it('conflict resolution 3-way merge', () => {
    const r = new ConflictResolver()
    const base = { a: 1, b: 2 }
    const local = { a: 1, b: 99 }
    const remote = { a: 99, b: 2 }
    const merged = r.threeWayMerge(local, remote, base)
    expect(merged.a).toBe(99)
    expect(merged.b).toBe(99)
  })

  it('compressor RLE', () => {
    const c = new Compressor()
    const orig = 'aaabbbccc'
    expect(c.rleDecompress(c.rleCompress(orig))).toBe(orig)
  })

  it('exporter + importer roundtrip', () => {
    const e = new Exporter()
    const i = new Importer()
    const data = { a: 1, b: [1, 2, 3] }
    const json = e.export(data, 'json')
    expect(i.import(json)).toEqual(data)
  })

  it('cloud + IDB + dexie integration', () => {
    const cloud = new CloudStorage('s3')
    const idb = new IndexedDBAdapter()
    const dexie = new DexieSchema()
    cloud.upload('main.json', 'data')
    idb.put('main', { from: 'cloud' })
    dexie.addTable({ name: 'projects', primaryKey: 'id', indexes: [] })
    expect(cloud.list().length).toBe(1)
    expect(idb.count()).toBe(1)
    expect(dexie.tables().length).toBe(1)
  })

  it('CRDT sync + OT', async () => {
    const c1 = new CRDT<number>('d1')
    c1.set('x', 1)
    await new Promise(r => setTimeout(r, 5))
    const c2 = new CRDT<number>('d2')
    c2.set('x', 2)
    c1.mergeRemote(c2.export()[0])
    expect(c1.get('x')).toBe(2)

    const ot = new OperationalTransform()
    expect(ot.apply('hello', { type: 'insert', position: 5, chars: ' world' })).toBe('hello world')
  })
})