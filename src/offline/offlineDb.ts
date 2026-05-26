/**
 * OfflineDatabase - V56
 * IndexedDB storage via Dexie for offline-first data persistence
 */

import Dexie, { type Table } from 'dexie'
import type {
  DraftRecord,
  SyncQueueItem,
  ConflictRecord,
  DeviceInfo
} from './offlineTypes'
import { OFFLINE_DB_NAME, OFFLINE_DB_VERSION } from './offlineTypes'

export class OfflineDatabase extends Dexie {
  drafts!: Table<DraftRecord, string>
  syncQueue!: Table<SyncQueueItem, string>
  conflicts!: Table<ConflictRecord, string>
  devices!: Table<DeviceInfo, string>

  constructor() {
    super(OFFLINE_DB_NAME)
    this.version(OFFLINE_DB_VERSION).stores({
      drafts: 'id, updatedAt, deviceId, syncVersion, isDeleted, chapterNumber',
      syncQueue: 'id, status, entityType, entityId, timestamp',
      conflicts: 'id, entityType, entityId, detectedAt, resolvedAt',
      devices: 'deviceId, lastSeen'
    })
  }
}

export const offlineDb = new OfflineDatabase()

/**
 * Generate a unique device ID
 */
export function generateDeviceId(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('device_id') : null
  if (stored) return stored
  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('device_id', id)
  }
  return id
}

/**
 * Get current device ID
 */
export function getCurrentDeviceId(): string {
  return generateDeviceId()
}

/**
 * Save or update a draft locally
 */
export async function saveDraftLocally(draft: Omit<DraftRecord, 'id' | 'updatedAt' | 'deviceId' | 'syncVersion' | 'isDeleted'> & { id?: string }): Promise<DraftRecord> {
  const now = Date.now()
  const deviceId = getCurrentDeviceId()

  if (draft.id) {
    // Update existing
    const existing = await offlineDb.drafts.get(draft.id)
    const updated: DraftRecord = {
      id: draft.id,
      title: draft.title,
      content: draft.content,
      author: draft.author,
      summary: draft.summary,
      wordCount: draft.wordCount,
      chapterNumber: draft.chapterNumber,
      updatedAt: now,
      deviceId,
      syncVersion: (existing?.syncVersion || 0) + 1,
      isDeleted: false
    }
    await offlineDb.drafts.put(updated)
    return updated
  } else {
    // Create new
    const newDraft: DraftRecord = {
      id: `draft_${now}_${Math.random().toString(36).slice(2, 11)}`,
      title: draft.title,
      content: draft.content,
      author: draft.author,
      summary: draft.summary,
      wordCount: draft.wordCount,
      chapterNumber: draft.chapterNumber,
      updatedAt: now,
      deviceId,
      syncVersion: 1,
      isDeleted: false
    }
    await offlineDb.drafts.add(newDraft)
    return newDraft
  }
}

/**
 * Get all non-deleted drafts
 */
export async function getAllDrafts(): Promise<DraftRecord[]> {
  return offlineDb.drafts.where('isDeleted').equals(0).toArray()
}

/**
 * Get a single draft by ID
 */
export async function getDraftById(id: string): Promise<DraftRecord | undefined> {
  return offlineDb.drafts.get(id)
}

/**
 * Soft delete a draft
 */
export async function deleteDraftLocally(id: string): Promise<void> {
  const draft = await offlineDb.drafts.get(id)
  if (draft) {
    draft.isDeleted = true
    draft.updatedAt = Date.now()
    draft.syncVersion += 1
    await offlineDb.drafts.put(draft)
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount'>): Promise<void> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    status: 'pending',
    retryCount: 0
  }
  await offlineDb.syncQueue.add(queueItem)
}

/**
 * Get pending sync queue items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return offlineDb.syncQueue.where('status').equals('pending').toArray()
}

/**
 * Update sync queue item status
 */
export async function updateSyncQueueStatus(id: string, status: SyncQueueItem['status'], errorMessage?: string): Promise<void> {
  const item = await offlineDb.syncQueue.get(id)
  if (item) {
    item.status = status
    if (errorMessage) item.errorMessage = errorMessage
    if (status === 'failed') item.retryCount += 1
    await offlineDb.syncQueue.put(item)
  }
}

/**
 * Record a conflict
 */
export async function recordConflict(conflict: Omit<ConflictRecord, 'id' | 'detectedAt'>): Promise<void> {
  const conflictRecord: ConflictRecord = {
    ...conflict,
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    detectedAt: Date.now()
  }
  await offlineDb.conflicts.add(conflictRecord)
}

/**
 * Get unresolved conflicts
 */
export async function getUnresolvedConflicts(): Promise<ConflictRecord[]> {
  return offlineDb.conflicts.filter(c => c.resolvedAt === undefined).toArray()
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(id: string, resolution: ConflictRecord['resolution']): Promise<void> {
  const conflict = await offlineDb.conflicts.get(id)
  if (conflict) {
    conflict.resolution = resolution
    conflict.resolvedAt = Date.now()
    await offlineDb.conflicts.put(conflict)
  }
}

/**
 * Get sync state summary
 */
export async function getSyncState(): Promise<{
  totalDrafts: number
  pendingSync: number
  unresolvedConflicts: number
  lastSyncTime: number | null
}> {
  const totalDrafts = await offlineDb.drafts.count()
  const pendingSync = await offlineDb.syncQueue.where('status').equals('pending').count()
  const unresolvedConflicts = await getUnresolvedConflicts().then(c => c.length)
  const lastSyncItem = await offlineDb.syncQueue.orderBy('timestamp').last()

  return {
    totalDrafts,
    pendingSync,
    unresolvedConflicts,
    lastSyncTime: lastSyncItem?.timestamp || null
  }
}

/**
 * Clear all local data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  await offlineDb.drafts.clear()
  await offlineDb.syncQueue.clear()
  await offlineDb.conflicts.clear()
  await offlineDb.devices.clear()
}