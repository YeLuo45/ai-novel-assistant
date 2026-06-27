/**
 * ai/persistence/demo/persistence-integration-demo.test.ts
 */

import { describe, it, expect } from 'vitest'
import { runPersistenceIntegrationDemo } from './persistence-integration-demo'

describe('persistence-integration-demo', () => {
  it('creates 2 snapshots', () => {
    expect(runPersistenceIntegrationDemo().snapshots).toBe(2)
  })

  it('creates 2 backups', () => {
    expect(runPersistenceIntegrationDemo().backups).toBe(2)
  })

  it('creates 1 recovery checkpoint', () => {
    expect(runPersistenceIntegrationDemo().checkpoints).toBe(1)
  })

  it('creates 2 versions', () => {
    expect(runPersistenceIntegrationDemo().versions).toBe(2)
  })

  it('uploads 2 cloud files', () => {
    expect(runPersistenceIntegrationDemo().cloudFiles).toBe(2)
  })

  it('stores 2 IDB records', () => {
    expect(runPersistenceIntegrationDemo().idbRecords).toBe(2)
  })

  it('has 2 dexie tables', () => {
    expect(runPersistenceIntegrationDemo().dexieTables).toBe(2)
  })

  it('1 CRDT item', () => {
    expect(runPersistenceIntegrationDemo().crdtItems).toBe(1)
  })

  it('2 devices registered', () => {
    expect(runPersistenceIntegrationDemo().devices).toBe(2)
  })

  it('end-to-end summary', () => {
    const r = runPersistenceIntegrationDemo()
    expect(r.snapshots + r.backups + r.cloudFiles).toBeGreaterThan(4)
  })
})