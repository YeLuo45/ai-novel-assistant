/**
 * Offline V2 Types - V61
 * Types for DeviceManager, IncrementalSyncEngine, ConflictResolverV2, SyncQueueManager
 */

export type DeviceStatus = 'online' | 'offline' | 'syncing'
export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual'
export type SyncOperationType = 'create' | 'update' | 'delete'
export type SyncOperationStatus = 'pending' | 'synced' | 'conflict' | 'failed'
export type SyncStrategy = 'last-write-wins' | 'merge' | 'manual'

export interface Device {
  id: string
  name: string
  lastSync: number
  status: DeviceStatus
  vectorClock: Record<string, number>
  capabilities: string[]
}

export interface SyncOperation {
  id: string
  type: SyncOperationType
  entityType: string
  entityId: string
  payload: unknown
  timestamp: number
  deviceId: string
  vectorClock: Record<string, number>
  status: SyncOperationStatus
  conflictInfo?: {
    localVersion: unknown
    remoteVersion: unknown
  }
}

export interface ConflictRecord {
  id: string
  entityId: string
  entityType: string
  localVersion: unknown
  remoteVersion: unknown
  baseVersion: unknown
  resolution: ConflictResolution
  resolvedAt?: number
  resolvedBy?: string
}

export interface SyncQueueItem {
  id: string
  priority: number
  operation: SyncOperation
  retryCount: number
  maxRetries: number
  createdAt: number
  nextRetryAt?: number
}

export interface VectorClock {
  [deviceId: string]: number
}

export interface SyncStats {
  totalOperations: number
  syncedOperations: number
  pendingOperations: number
  conflictOperations: number
  failedOperations: number
  averageSyncTime: number
  lastSyncTime: number
}

// DeviceManager Functions

export function createDevice(id: string, name: string): Device {
  return {
    id,
    name,
    lastSync: Date.now(),
    status: 'offline',
    vectorClock: { [id]: 1 },
    capabilities: ['read', 'write', 'sync']
  }
}

export function updateDeviceStatus(device: Device, status: DeviceStatus): Device {
  return { ...device, status }
}

export function updateVectorClock(device: Device, clock: Record<string, number>): Device {
  return { ...device, vectorClock: clock }
}

export function mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
  const result: VectorClock = {}
  const allKeys = Object.keys(vc1).concat(Object.keys(vc2))
  const seen = new Set<string>()
  const uniqueKeys: string[] = []
  for (const key of allKeys) {
    if (!seen.has(key)) { seen.add(key); uniqueKeys.push(key) }
  }
  for (const key of uniqueKeys) {
    const max = Math.max(vc1[key] || 0, vc2[key] || 0)
    result[key] = max
  }
  return result
}

export function compareVectorClocks(vc1: VectorClock, vc2: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
  const keys1 = Object.keys(vc1)
  const keys2 = Object.keys(vc2)
  const seen3 = new Set<string>()
  const allKeys: string[] = []
  for (const k of keys1) { if (!seen3.has(k)) { seen3.add(k); allKeys.push(k) } }
  for (const k of keys2) { if (!seen3.has(k)) { seen3.add(k); allKeys.push(k) } }
  let less = false
  let greater = false

  for (const key of allKeys) {
    const v1 = vc1[key] || 0
    const v2 = vc2[key] || 0
    if (v1 < v2) less = true
    if (v1 > v2) greater = true
  }

  if (less && greater) return 'concurrent'
  if (less) return 'before'
  if (greater) return 'after'
  return 'equal'
}

export function isDeviceStale(device: Device, maxAge: number = 60000): boolean {
  return Date.now() - device.lastSync > maxAge
}

// IncrementalSync Functions

export function createSyncOperation(
  type: SyncOperationType,
  entityType: string,
  entityId: string,
  deviceId: string,
  payload: unknown
): SyncOperation {
  return {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    entityType,
    entityId,
    payload,
    timestamp: Date.now(),
    deviceId,
    vectorClock: { [deviceId]: 1 },
    status: 'pending'
  }
}

export function incrementVectorClock(vc: VectorClock, deviceId: string): VectorClock {
  return { ...vc, [deviceId]: (vc[deviceId] || 0) + 1 }
}

export function canSync(operation: SyncOperation, targetDevice: Device): boolean {
  if (targetDevice.status === 'offline') return false
  const comparison = compareVectorClocks(operation.vectorClock, targetDevice.vectorClock)
  return comparison !== 'after'
}

export function mergeOperations(op1: SyncOperation, op2: SyncOperation): SyncOperation | null {
  if (op1.entityId !== op2.entityId) return null

  const comparison = compareVectorClocks(op1.vectorClock, op2.vectorClock)
  if (comparison === 'equal') {
    if (op1.timestamp >= op2.timestamp) return op1
    return op2
  }

  if (comparison === 'concurrent') {
    const merged: SyncOperation = {
      ...op1,
      id: `merged_${Date.now()}`,
      status: 'synced'
    }
    if (op1.timestamp > op2.timestamp) {
      merged.payload = op1.payload
    } else {
      merged.payload = op2.payload
    }
    return merged
  }

  return comparison === 'after' ? op1 : op2
}

// ConflictResolverV2 Functions

export function createConflictRecord(
  entityId: string,
  entityType: string,
  local: unknown,
  remote: unknown,
  base: unknown
): ConflictRecord {
  return {
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    entityId,
    entityType,
    localVersion: local,
    remoteVersion: remote,
    baseVersion: base,
    resolution: 'manual'
  }
}

export function autoResolveConflict(
  conflict: ConflictRecord,
  strategy: SyncStrategy
): ConflictRecord {
  if (strategy === 'manual') return conflict

  let resolution: ConflictResolution
  let resolvedPayload: unknown

  if (strategy === 'last-write-wins') {
    resolution = conflict.localVersion === conflict.remoteVersion ? 'merge' : 'remote'
  } else {
    resolution = 'merge'
    resolvedPayload = mergeValues(conflict.localVersion, conflict.remoteVersion)
  }

  return {
    ...conflict,
    resolution,
    resolvedAt: Date.now()
  }
}

function mergeValues(local: unknown, remote: unknown): unknown {
  if (typeof local !== 'object' || typeof remote !== 'object') {
    return remote
  }
  if (local === null || remote === null) return remote

  const result: Record<string, unknown> = {}
  const allKeys = Object.keys(local as object).concat(Object.keys(remote as object))
  for (const key of allKeys) {
    const lv = (local as Record<string, unknown>)[key]
    const rv = (remote as Record<string, unknown>)[key]
    result[key] = rv !== undefined ? rv : lv
  }
  return result
}

export function resolveConflictManually(
  conflict: ConflictRecord,
  resolution: ConflictResolution,
  resolvedValue: unknown
): ConflictRecord {
  return {
    ...conflict,
    resolution,
    resolvedAt: Date.now()
  }
}

export function detectConflict(
  local: SyncOperation,
  remote: SyncOperation,
  base: unknown
): boolean {
  if (local.entityId !== remote.entityId) return false
  if (local.type === 'delete' && remote.type === 'delete') return false
  // Deep comparison of payloads
  if (local.type === remote.type) {
    const localStr = JSON.stringify(local.payload)
    const remoteStr = JSON.stringify(remote.payload)
    if (localStr === remoteStr) return false
  }
  return true
}

// SyncQueueManager Functions

export function createSyncQueueItem(operation: SyncOperation, priority: number = 2): SyncQueueItem {
  return {
    id: `qitem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    priority,
    operation,
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now()
  }
}

export function getQueuePriority(item: SyncQueueItem): number {
  const age = Date.now() - item.createdAt
  const ageBoost = Math.min(Math.floor(age / 10000), 5)
  return item.priority + ageBoost
}

export function sortQueueByPriority(items: SyncQueueItem[]): SyncQueueItem[] {
  return [...items].sort((a, b) => {
    const pa = getQueuePriority(a)
    const pb = getQueuePriority(b)
    if (pb !== pa) return pb - pa
    return a.createdAt - b.createdAt
  })
}

export function shouldRetryQueueItem(item: SyncQueueItem): boolean {
  return item.retryCount < item.maxRetries
}

export function incrementRetryCount(item: SyncQueueItem): SyncQueueItem {
  const delay = Math.min(1000 * Math.pow(2, item.retryCount), 30000)
  return {
    ...item,
    retryCount: item.retryCount + 1,
    nextRetryAt: Date.now() + delay
  }
}

export function mergeQueueItems(items: SyncQueueItem[]): SyncQueueItem[] {
  const byEntity: Record<string, SyncQueueItem[]> = {}
  for (const item of items) {
    const key = `${item.operation.entityType}_${item.operation.entityId}`
    if (!byEntity[key]) byEntity[key] = []
    byEntity[key].push(item)
  }

  const merged: SyncQueueItem[] = []
  for (const group of Object.values(byEntity)) {
    const sorted = sortQueueByPriority(group)
    merged.push(sorted[0])
  }
  return merged
}

export function filterPendingItems(items: SyncQueueItem[]): SyncQueueItem[] {
  return items.filter(i => i.operation.status === 'pending' || i.operation.status === 'failed')
}

export function calculateSyncStats(operations: SyncOperation[]): SyncStats {
  const synced = operations.filter(o => o.status === 'synced')
  const pending = operations.filter(o => o.status === 'pending')
  const conflict = operations.filter(o => o.status === 'conflict')
  const failed = operations.filter(o => o.status === 'failed')

  return {
    totalOperations: operations.length,
    syncedOperations: synced.length,
    pendingOperations: pending.length,
    conflictOperations: conflict.length,
    failedOperations: failed.length,
    averageSyncTime: 0,
    lastSyncTime: synced.length > 0 ? Math.max(...synced.map(o => o.timestamp)) : 0
  }
}