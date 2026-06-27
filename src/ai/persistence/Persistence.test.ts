/**
 * ai/persistence/Persistence.test.ts (K1-K15) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  Checksum, ProjectSnapshotBuilder, WorkspaceSerializer, AutoSave,
  VersioningManager, RecoveryManager, ConflictResolver, Migrator,
  BackupManager, SyncEngine, SnapshotDiffer, Exporter, Importer, Compressor,
} from './Persistence'

describe('K1: ProjectSnapshot', () => {
  it('create + verify', () => {
    const b = new ProjectSnapshotBuilder()
    const s = b.create('p1', { chapters: [], metadata: { name: 'X' } })
    expect(b.verify(s.snapshotId)).toBe(true)
  })

  it('byProject + latest', () => {
    const b = new ProjectSnapshotBuilder()
    b.create('p1', { chapters: [], metadata: {} })
    b.create('p1', { chapters: [], metadata: {} })
    b.create('p2', { chapters: [], metadata: {} })
    expect(b.byProject('p1').length).toBe(2)
    expect(b.latest('p1')?.version).toBe(2)
  })
})

describe('K2: WorkspaceSerializer', () => {
  it('serialize + deserialize', () => {
    const s = new WorkspaceSerializer()
    const data = { foo: 'bar' }
    const round = s.deserialize(s.serialize(data))
    expect(round).toEqual(data)
  })

  it('isValidJson', () => {
    const s = new WorkspaceSerializer()
    expect(s.isValidJson('{"a":1}')).toBe(true)
    expect(s.isValidJson('bad json')).toBe(false)
  })
})

describe('K3: AutoSave', () => {
  it('saveCount starts at 0', () => {
    const a = new AutoSave(() => {})
    expect(a.saveCount).toBe(0)
  })

  it('start + stop', () => {
    const a = new AutoSave(() => {})
    a.start(() => 'state')
    a.stop()
    expect(a.saveCount).toBe(0)
  })
})

describe('K4: Versioning', () => {
  it('commit + at + latest', () => {
    const v = new VersioningManager<Record<string, unknown>>()
    v.commit({ x: 1 }, '1.0.0')
    v.commit({ x: 2 }, '1.1.0')
    expect(v.at('1.0.0')?.data.x).toBe(1)
    expect(v.latest()?.version).toBe('1.1.0')
  })

  it('diff', () => {
    const v = new VersioningManager<Record<string, unknown>>()
    v.commit({ x: 1, y: 2 }, '1.0.0')
    v.commit({ x: 1, y: 3, z: 4 }, '1.1.0')
    const d = v.diff('1.0.0', '1.1.0')
    expect(d.added).toContain('z')
    expect(d.modified).toContain('y')
  })
})

describe('K5: Recovery', () => {
  it('save + restore', () => {
    const r = new RecoveryManager()
    const cp = r.save({ x: 1 }, 'test')
    expect(r.restore(cp.checkpointId)).toEqual({ x: 1 })
  })

  it('latest', () => {
    const r = new RecoveryManager()
    r.save({ x: 1 }, 'a')
    r.save({ x: 2 }, 'b')
    expect(r.latest()?.data).toEqual({ x: 2 })
  })
})

describe('K6: ConflictResolver', () => {
  it('autoMerge prefers local', () => {
    const r = new ConflictResolver()
    expect(r.autoMerge(1, 2)).toBe(1)
  })

  it('autoMerge handles null', () => {
    const r = new ConflictResolver()
    expect(r.autoMerge(null, 'x')).toBe('x')
  })

  it('threeWayMerge', () => {
    const r = new ConflictResolver()
    const base = { a: 1, b: 2 }
    const local = { a: 1, b: 99 }  // 改 b
    const remote = { a: 99, b: 2 } // 改 a
    const merged = r.threeWayMerge(local, remote, base)
    expect(merged.a).toBe(99)  // remote 改
    expect(merged.b).toBe(99)  // local 改
  })

  it('detectConflicts', () => {
    const r = new ConflictResolver()
    const c = r.detectConflicts({ a: 1, b: 2 }, { a: 1, b: 3 })
    expect(c).toContain('b')
    expect(c).not.toContain('a')
  })
})

describe('K7: Migrator', () => {
  it('up + down', () => {
    const m = new Migrator()
    m.add({ fromVersion: '1.0.0', toVersion: '2.0.0', up: (d) => ({ ...(d as object), newField: 1 }), down: (d) => { const { newField, ...rest } = d as any; return rest } })
    const upgraded = m.up({ oldField: 'x' }, '2.0.0', '1.0.0') as any
    expect(upgraded.newField).toBe(1)
    const downgraded = m.down(upgraded, '1.0.0', '2.0.0') as any
    expect(downgraded.newField).toBeUndefined()
  })
})

describe('K8: Backup', () => {
  it('create + list + latest', () => {
    const b = new BackupManager()
    b.create({ x: 1 })
    b.create({ x: 2 })
    expect(b.list().length).toBe(2)
    expect(b.latest()?.data).toEqual({ x: 2 })
  })

  it('maxBackups cap', () => {
    const b = new BackupManager(2)
    b.create({ x: 1 })
    b.create({ x: 2 })
    b.create({ x: 3 })
    expect(b.list().length).toBe(2)
  })

  it('delete + totalSize', () => {
    const b = new BackupManager()
    const x = b.create({ a: 'x'.repeat(100) })
    expect(b.totalSize()).toBeGreaterThan(100)
    expect(b.delete(x.backupId)).toBe(true)
  })
})

describe('K9: Sync', () => {
  it('push + records', () => {
    const s = new SyncEngine()
    s.push({ x: 1 })
    expect(s.records().length).toBe(1)
    expect(s.records()[0].direction).toBe('push')
  })

  it('pull + sync', () => {
    const s = new SyncEngine()
    s.pull()
    s.sync({ x: 1 })
    expect(s.records().length).toBe(2)
  })
})

describe('K10: SnapshotDiffer', () => {
  it('diff objects', () => {
    const d = new SnapshotDiffer()
    const r = d.diff({ a: 1 }, { a: 2 })
    expect(r.modified).toContain('a')
  })

  it('arrayDiff by id', () => {
    const d = new SnapshotDiffer()
    const r = d.arrayDiff([{ id: '1', v: 'a' }], [{ id: '2', v: 'b' }, { id: '1', v: 'a' }])
    expect(r.added.length).toBe(1)
  })
})

describe('K11: Exporter', () => {
  it('export to JSON', () => {
    const e = new Exporter()
    const out = e.export({ a: 1 }, 'json')
    expect(JSON.parse(out).a).toBe(1)
  })

  it('export to CSV (array)', () => {
    const e = new Exporter()
    const out = e.export([{ a: 1, b: 2 }, { a: 3, b: 4 }], 'csv')
    expect(out).toContain('a,b')
    expect(out).toContain('1,2')
  })

  it('export to binary (base64)', () => {
    const e = new Exporter()
    const out = e.export({ a: 1 }, 'binary')
    expect(typeof out).toBe('string')
  })
})

describe('K12: Importer', () => {
  it('import JSON', () => {
    expect(new Importer().import('{"a":1}')).toEqual({ a: 1 })
  })

  it('import from CSV', () => {
    const r = new Importer().importFromFormat('a,b\n1,2\n3,4', 'csv') as Array<Record<string, string>>
    expect(r[0].a).toBe('1')
  })
})

describe('K13: Compressor', () => {
  it('RLE roundtrip', () => {
    const c = new Compressor()
    const original = 'aaabbbccc'
    const compressed = c.rleCompress(original)
    const decompressed = c.rleDecompress(compressed)
    expect(decompressed).toBe(original)
  })

  it('RLE different from original', () => {
    const c = new Compressor()
    expect(c.rleCompress('aaabbbccc')).not.toBe('aaabbbccc')
  })

  it('estimateCompressionRatio', () => {
    const c = new Compressor()
    expect(c.estimateCompressionRatio('aaabbbccc')).toBeLessThan(1)
  })

  it('RLE empty', () => {
    expect(new Compressor().rleCompress('')).toBe('')
  })
})

describe('K15: Checksum', () => {
  it('deterministic', () => {
    const c = new Checksum()
    expect(c.compute('hello')).toBe(c.compute('hello'))
  })

  it('different inputs different checksums', () => {
    const c = new Checksum()
    expect(c.compute('hello')).not.toBe(c.compute('world'))
  })

  it('verify', () => {
    const c = new Checksum()
    const s = c.compute('test')
    expect(c.verify('test', s)).toBe(true)
    expect(c.verify('test2', s)).toBe(false)
  })
})