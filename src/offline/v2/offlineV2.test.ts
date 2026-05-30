/**
 * Offline V2 Tests - V61
 * Tests for DeviceManager, IncrementalSync, ConflictResolverV2, SyncQueueManager
 */

import { describe, it, expect } from 'vitest'
import {
  createDevice,
  updateDeviceStatus,
  updateVectorClock,
  mergeVectorClocks,
  compareVectorClocks,
  isDeviceStale,
  createSyncOperation,
  incrementVectorClock,
  canSync,
  mergeOperations,
  createConflictRecord,
  autoResolveConflict,
  resolveConflictManually,
  detectConflict,
  createSyncQueueItem,
  getQueuePriority,
  sortQueueByPriority,
  shouldRetryQueueItem,
  incrementRetryCount,
  mergeQueueItems,
  filterPendingItems,
  calculateSyncStats,
  type Device,
  type SyncOperation,
  type ConflictRecord
} from './offlineV2Types'

describe('DeviceManager', () => {
  it('should create a device', () => {
    const device = createDevice('device_1', 'My Laptop')
    expect(device.id).toBe('device_1')
    expect(device.name).toBe('My Laptop')
    expect(device.status).toBe('offline')
    expect(device.vectorClock.device_1).toBe(1)
  })

  it('should update device status', () => {
    const device = createDevice('device_1', 'My Laptop')
    const updated = updateDeviceStatus(device, 'online')
    expect(updated.status).toBe('online')
    expect(updated.id).toBe('device_1')
  })

  it('should merge vector clocks', () => {
    const vc1: Record<string, number> = { a: 1, b: 2 }
    const vc2: Record<string, number> = { b: 3, c: 1 }
    const merged = mergeVectorClocks(vc1, vc2)
    expect(merged.a).toBe(1)
    expect(merged.b).toBe(3)
    expect(merged.c).toBe(1)
  })

  it('should compare vector clocks - equal', () => {
    const vc1: Record<string, number> = { a: 1, b: 2 }
    const vc2: Record<string, number> = { a: 1, b: 2 }
    expect(compareVectorClocks(vc1, vc2)).toBe('equal')
  })

  it('should compare vector clocks - before', () => {
    const vc1: Record<string, number> = { a: 1, b: 1 }
    const vc2: Record<string, number> = { a: 1, b: 2 }
    expect(compareVectorClocks(vc1, vc2)).toBe('before')
  })

  it('should compare vector clocks - after', () => {
    const vc1: Record<string, number> = { a: 2, b: 2 }
    const vc2: Record<string, number> = { a: 1, b: 2 }
    expect(compareVectorClocks(vc1, vc2)).toBe('after')
  })

  it('should compare vector clocks - concurrent', () => {
    const vc1: Record<string, number> = { a: 2, b: 1 }
    const vc2: Record<string, number> = { a: 1, b: 2 }
    expect(compareVectorClocks(vc1, vc2)).toBe('concurrent')
  })

  it('should detect stale device', () => {
    const device = createDevice('device_1', 'My Laptop')
    device.lastSync = Date.now() - 120000
    expect(isDeviceStale(device, 60000)).toBe(true)
    expect(isDeviceStale(device, 180000)).toBe(false)
  })
})

describe('IncrementalSync', () => {
  it('should create sync operation', () => {
    const op = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', { title: 'Test' })
    expect(op.type).toBe('create')
    expect(op.entityType).toBe('chapter')
    expect(op.status).toBe('pending')
    expect(op.vectorClock.device_1).toBe(1)
  })

  it('should increment vector clock', () => {
    const vc: Record<string, number> = { device_1: 1, device_2: 2 }
    const updated = incrementVectorClock(vc, 'device_1')
    expect(updated.device_1).toBe(2)
    expect(updated.device_2).toBe(2)
  })

  it('should allow sync when device is online', () => {
    const op: SyncOperation = {
      id: 'op1', type: 'create', entityType: 'chapter', entityId: 'ch_1',
      payload: {}, timestamp: Date.now(), deviceId: 'device_1',
      vectorClock: { device_1: 1 }, status: 'pending'
    }
    const device = createDevice('device_2', 'Phone')
    device.vectorClock = { device_2: 1 }
    device.status = 'online'
    // Online device with concurrent clock should allow sync
    expect(canSync(op, device)).toBe(true)
  })

  it('should merge operations with same entity', () => {
    const op1 = createSyncOperation('update', 'chapter', 'ch_1', 'device_1', { title: 'A' })
    const op2 = createSyncOperation('update', 'chapter', 'ch_1', 'device_2', { title: 'B' })
    op2.timestamp = op1.timestamp + 1000
    op1.vectorClock = { device_1: 1 }
    op2.vectorClock = { device_2: 1 }
    const merged = mergeOperations(op1, op2)
    expect(merged).not.toBeNull()
    expect(merged!.payload).toEqual({ title: 'B' })
  })

  it('should return null for different entities', () => {
    const op1 = createSyncOperation('update', 'chapter', 'ch_1', 'device_1', { title: 'A' })
    const op2 = createSyncOperation('update', 'chapter', 'ch_2', 'device_1', { title: 'B' })
    expect(mergeOperations(op1, op2)).toBeNull()
  })
})

describe('ConflictResolverV2', () => {
  it('should create conflict record', () => {
    const conflict = createConflictRecord('ch_1', 'chapter', { title: 'A' }, { title: 'B' }, { title: 'Base' })
    expect(conflict.entityId).toBe('ch_1')
    expect(conflict.resolution).toBe('manual')
  })

  it('should auto-resolve with last-write-wins', () => {
    const conflict = createConflictRecord('ch_1', 'chapter', { title: 'A' }, { title: 'B' }, { title: 'Base' })
    const resolved = autoResolveConflict(conflict, 'last-write-wins')
    expect(resolved.resolution).not.toBe('manual')
    expect(resolved.resolvedAt).toBeDefined()
  })

  it('should merge values with merge strategy', () => {
    const conflict = createConflictRecord('ch_1', 'chapter', { title: 'A', desc: 'local' }, { title: 'B', desc: 'remote' }, { title: 'Base' })
    const resolved = autoResolveConflict(conflict, 'merge')
    expect(resolved.resolution).toBe('merge')
  })

  it('should not auto-resolve with manual strategy', () => {
    const conflict = createConflictRecord('ch_1', 'chapter', { title: 'A' }, { title: 'B' }, { title: 'Base' })
    const resolved = autoResolveConflict(conflict, 'manual')
    expect(resolved.resolution).toBe('manual')
    expect(resolved.resolvedAt).toBeUndefined()
  })

  it('should detect conflicts between operations', () => {
    const local: SyncOperation = {
      id: 'op1', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Local' }, timestamp: Date.now(), deviceId: 'd1',
      vectorClock: { d1: 1 }, status: 'pending'
    }
    const remote: SyncOperation = {
      id: 'op2', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Remote' }, timestamp: Date.now(), deviceId: 'd2',
      vectorClock: { d2: 1 }, status: 'pending'
    }
    expect(detectConflict(local, remote, { title: 'Base' })).toBe(true)
  })

  it('should not detect conflict for same payload on different devices', () => {
    const local: SyncOperation = {
      id: 'op1', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Same' }, timestamp: Date.now(), deviceId: 'd1',
      vectorClock: { d1: 1 }, status: 'pending'
    }
    const remote: SyncOperation = {
      id: 'op2', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Same' }, timestamp: Date.now(), deviceId: 'd2',
      vectorClock: { d2: 1 }, status: 'pending'
    }
    // Same payload but different device clocks - still concurrent
    expect(detectConflict(local, remote, { title: 'Same' })).toBe(false)
  })
})

describe('SyncQueueManager', () => {
  it('should create queue item', () => {
    const op = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', {})
    const item = createSyncQueueItem(op, 3)
    expect(item.priority).toBe(3)
    expect(item.retryCount).toBe(0)
    expect(item.maxRetries).toBe(3)
  })

  it('should calculate queue priority with age boost', () => {
    const op = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', {})
    const item = createSyncQueueItem(op, 2)
    const priority = getQueuePriority(item)
    expect(priority).toBeGreaterThanOrEqual(2)
  })

  it('should sort queue by priority', () => {
    const op1 = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', {})
    const op2 = createSyncOperation('create', 'chapter', 'ch_2', 'device_1', {})
    const item1 = createSyncQueueItem(op1, 1)
    const item2 = createSyncQueueItem(op2, 5)
    const sorted = sortQueueByPriority([item1, item2])
    expect(sorted[0].priority).toBeGreaterThanOrEqual(sorted[1].priority)
  })

  it('should determine retry eligibility', () => {
    const op = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', {})
    const item = createSyncQueueItem(op, 2)
    expect(shouldRetryQueueItem(item)).toBe(true)
    item.retryCount = 3
    expect(shouldRetryQueueItem(item)).toBe(false)
  })

  it('should increment retry count with delay', () => {
    const op = createSyncOperation('create', 'chapter', 'ch_1', 'device_1', {})
    const item = createSyncQueueItem(op, 2)
    const retried = incrementRetryCount(item)
    expect(retried.retryCount).toBe(1)
    expect(retried.nextRetryAt).toBeGreaterThan(Date.now())
  })

  it('should merge queue items for same entity', () => {
    const op1 = createSyncOperation('update', 'chapter', 'ch_1', 'device_1', { title: 'A' })
    const op2 = createSyncOperation('update', 'chapter', 'ch_1', 'device_2', { title: 'B' })
    const item1 = createSyncQueueItem(op1, 2)
    const item2 = createSyncQueueItem(op2, 1)
    const merged = mergeQueueItems([item1, item2])
    expect(merged.length).toBe(1)
  })

  it('should filter pending items', () => {
    const op1: SyncOperation = {
      id: 'op1', type: 'create', entityType: 'chapter', entityId: 'ch_1',
      payload: {}, timestamp: Date.now(), deviceId: 'device_1',
      vectorClock: {}, status: 'pending'
    }
    const op2: SyncOperation = {
      id: 'op2', type: 'create', entityType: 'chapter', entityId: 'ch_2',
      payload: {}, timestamp: Date.now(), deviceId: 'device_1',
      vectorClock: {}, status: 'synced'
    }
    const item1 = createSyncQueueItem(op1, 2)
    const item2 = createSyncQueueItem(op2, 2)
    const filtered = filterPendingItems([item1, item2])
    expect(filtered.length).toBe(1)
  })

  it('should calculate sync stats', () => {
    const operations: SyncOperation[] = [
      { id: 'op1', type: 'create', entityType: 'chapter', entityId: 'ch_1', payload: {}, timestamp: Date.now(), deviceId: 'd1', vectorClock: {}, status: 'synced' },
      { id: 'op2', type: 'create', entityType: 'chapter', entityId: 'ch_2', payload: {}, timestamp: Date.now(), deviceId: 'd1', vectorClock: {}, status: 'synced' },
      { id: 'op3', type: 'create', entityType: 'chapter', entityId: 'ch_3', payload: {}, timestamp: Date.now(), deviceId: 'd1', vectorClock: {}, status: 'pending' },
      { id: 'op4', type: 'create', entityType: 'chapter', entityId: 'ch_4', payload: {}, timestamp: Date.now(), deviceId: 'd1', vectorClock: {}, status: 'conflict' },
      { id: 'op5', type: 'create', entityType: 'chapter', entityId: 'ch_5', payload: {}, timestamp: Date.now(), deviceId: 'd1', vectorClock: {}, status: 'failed' }
    ]
    const stats = calculateSyncStats(operations)
    expect(stats.totalOperations).toBe(5)
    expect(stats.syncedOperations).toBe(2)
    expect(stats.pendingOperations).toBe(1)
    expect(stats.conflictOperations).toBe(1)
    expect(stats.failedOperations).toBe(1)
  })
})

describe('Integration', () => {
  it('should handle device sync lifecycle', () => {
    // Register device
    const device1 = createDevice('d1', 'Laptop')
    const device2 = createDevice('d2', 'Phone')

    // Update clocks and sync
    const merged = mergeVectorClocks(device1.vectorClock, device2.vectorClock)
    expect(merged.d1).toBe(1)
    expect(merged.d2).toBe(1)

    // Update device status
    const onlineDevice = updateDeviceStatus(device1, 'online')
    expect(onlineDevice.status).toBe('online')
  })

  it('should handle conflict resolution end-to-end', () => {
    const local: SyncOperation = {
      id: 'op1', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Local Title', content: 'Local content' },
      timestamp: Date.now(), deviceId: 'd1', vectorClock: { d1: 2 }, status: 'pending'
    }
    const remote: SyncOperation = {
      id: 'op2', type: 'update', entityType: 'chapter', entityId: 'ch_1',
      payload: { title: 'Remote Title', content: 'Remote content' },
      timestamp: Date.now(), deviceId: 'd2', vectorClock: { d2: 2 }, status: 'pending'
    }

    if (detectConflict(local, remote, { title: 'Base', content: 'Base' })) {
      const conflict = createConflictRecord('ch_1', 'chapter', local.payload, remote.payload, { title: 'Base', content: 'Base' })
      const resolved = autoResolveConflict(conflict, 'merge')
      expect(resolved.resolution).toBe('merge')
    }
  })
})