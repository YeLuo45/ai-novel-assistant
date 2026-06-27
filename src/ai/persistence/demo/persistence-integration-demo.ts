/**
 * ai/persistence/demo/persistence-integration-demo.ts
 */

import {
  ProjectSnapshotBuilder, BackupManager, RecoveryManager, VersioningManager,
  WorkspaceSerializer, AutoSave, ConflictResolver, Migrator,
  CloudStorage, IndexedDBAdapter, DexieSchema, BatchWriter,
  CRDT, MultiDeviceSync,
} from '../index'

export interface DemoResult {
  snapshots: number
  backups: number
  checkpoints: number
  versions: number
  cloudFiles: number
  idbRecords: number
  dexieTables: number
  crdtItems: number
  devices: number
}

export function runPersistenceIntegrationDemo(): DemoResult {
  // 1. Snapshot
  const snaps = new ProjectSnapshotBuilder()
  snaps.create('p1', { chapters: [], metadata: { name: 'Demo' } }, 'initial')
  snaps.create('p1', { chapters: [], metadata: { name: 'Demo v2' } }, 'updated')

  // 2. Backup
  const backups = new BackupManager()
  backups.create({ x: 1 }, 'manual')
  backups.create({ x: 2 }, 'auto')

  // 3. Recovery
  const recovery = new RecoveryManager()
  recovery.save({ state: 'foo' }, 'checkpoint 1')

  // 4. Versioning
  const versioning = new VersioningManager<Record<string, unknown>>()
  versioning.commit({ v: 1 }, '1.0.0', 'user1')
  versioning.commit({ v: 2 }, '1.1.0', 'user2')

  // 5. Cloud storage
  const cloud = new CloudStorage('s3')
  cloud.upload('projects/p1/main.json', '{"x":1}')
  cloud.upload('projects/p2/main.json', '{"x":2}')

  // 6. IndexedDB
  const idb = new IndexedDBAdapter()
  idb.put('k1', { data: 'hello' })
  idb.put('k2', { data: 'world' })

  // 7. Dexie schema
  const dexie = new DexieSchema()
  dexie.addTable({ name: 'projects', primaryKey: 'id', indexes: ['name'] })
  dexie.addTable({ name: 'chapters', primaryKey: 'id', indexes: ['projectId', 'index'] })

  // 8. CRDT
  const crdt = new CRDT<number>('device-1')
  crdt.set('counter', 42)

  // 9. Multi-device
  const multi = new MultiDeviceSync()
  multi.registerDevice({ deviceId: 'd1', deviceName: 'Phone', lastSync: 0, pendingChanges: 0 })
  multi.registerDevice({ deviceId: 'd2', deviceName: 'Laptop', lastSync: 0, pendingChanges: 0 })
  multi.syncToDevice('d1', 5)

  return {
    snapshots: snaps.list().length,
    backups: backups.list().length,
    checkpoints: recovery.list().length,
    versions: versioning.list().length,
    cloudFiles: cloud.list().length,
    idbRecords: idb.count(),
    dexieTables: dexie.tables().length,
    crdtItems: crdt.items().length,
    devices: multi.list().length,
  }
}