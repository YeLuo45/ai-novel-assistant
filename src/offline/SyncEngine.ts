/**
 * SyncEngine - V56
 * Handles background sync between local IndexedDB and remote server
 */

import type { DraftRecord, SyncQueueItem, SyncState, SyncStatus } from './offlineTypes'
import {
  offlineDb,
  getCurrentDeviceId,
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncQueueStatus,
  recordConflict
} from './offlineDb'
import {
  threeWayMerge,
  detectConflict,
  type MergeResult
} from './ConflictResolver'

export interface SyncEngineOptions {
  syncEndpoint: string
  syncIntervalMs: number
  maxRetries: number
  autoResolve?: boolean
}

const DEFAULT_OPTIONS: SyncEngineOptions = {
  syncEndpoint: '/api/sync',
  syncIntervalMs: 30000, // 30 seconds
  maxRetries: 3,
  autoResolve: true
}

export class SyncEngine {
  private options: SyncEngineOptions
  private isRunning = false
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<(state: SyncState) => void> = new Set()

  constructor(options: Partial<SyncEngineOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Start the sync engine
   */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduleSync()
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    this.isRunning = false
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current sync state
   */
  async getState(): Promise<SyncState> {
    const pending = await getPendingSyncItems()
    const conflictCount = await offlineDb.conflicts.filter(c => c.resolvedAt === undefined).count()
    const lastSyncItem = await offlineDb.syncQueue.orderBy('timestamp').last()

    let status: SyncStatus = 'synced'
    if (!navigator.onLine) {
      status = 'offline'
    } else if (pending.length > 0) {
      status = 'syncing'
    } else if (conflictCount > 0) {
      status = 'conflict'
    }

    return {
      status,
      lastSyncTime: lastSyncItem?.timestamp || null,
      pendingCount: pending.length,
      conflictCount
    }
  }

  /**
   * Trigger an immediate sync
   */
  async syncNow(): Promise<{ success: boolean; synced: number; conflicts: number; errors: number }> {
    if (!navigator.onLine) {
      return { success: false, synced: 0, conflicts: 0, errors: 0 }
    }

    const pending = await getPendingSyncItems()
    let synced = 0
    let conflicts = 0
    let errors = 0

    for (const item of pending) {
      try {
        await updateSyncQueueStatus(item.id, 'syncing')

        const result = await this.processSyncItem(item)

        if (result.success) {
          await this.removeSyncQueueItem(item.id)
          synced++
        } else if (result.conflict) {
          conflicts++
        } else {
          errors++
          if (item.retryCount >= this.options.maxRetries) {
            await updateSyncQueueStatus(item.id, 'failed', result.error)
          } else {
            await updateSyncQueueStatus(item.id, 'pending', result.error)
          }
        }
      } catch (err) {
        errors++
        await updateSyncQueueStatus(item.id, 'failed', String(err))
      }
    }

    this.notifyListeners()
    return { success: errors === 0, synced, conflicts, errors }
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<{ success: boolean; conflict?: boolean; error?: string }> {
    if (item.entityType !== 'draft') {
      // For now, only handle draft sync
      return { success: true }
    }

    const local = await offlineDb.drafts.get(item.entityId)

    if (item.operation === 'delete') {
      // Hard delete on server, soft delete is already done locally
      return { success: true }
    }

    if (item.operation === 'create' || item.operation === 'update') {
      // Fetch remote version
      const remote = await this.fetchRemoteDraft(item.entityId)

      if (!remote) {
        // No remote version - just push local
        return await this.pushLocalDraft(local!)
      }

      // Check for conflicts
      if (detectConflict(local!, remote)) {
        // Conflict detected - record and optionally auto-resolve
        await recordConflict({
          entityType: item.entityType,
          entityId: item.entityId,
          localVersion: local!,
          remoteVersion: remote,
          baseVersion: null // Would need to fetch from server
        })

        if (this.options.autoResolve) {
          const merge = threeWayMerge(null, local!, remote)
          if (!merge.hasConflict) {
            // Auto-resolved
            await offlineDb.drafts.put({
              ...merge.resolved!,
              syncVersion: Math.max(local!.syncVersion, remote.syncVersion) + 1
            })
            return { success: true }
          }
        }

        return { success: false, conflict: true }
      }

      // No conflict - push local
      return await this.pushLocalDraft(local!)
    }

    return { success: true }
  }

  /**
   * Fetch a draft from remote server
   */
  private async fetchRemoteDraft(id: string): Promise<DraftRecord | null> {
    try {
      const response = await fetch(`${this.options.syncEndpoint}/drafts/${id}`, {
        method: 'GET',
        headers: { 'X-API-Key': this.options.syncEndpoint }
      })
      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }

  /**
   * Push a local draft to the remote server
   */
  private async pushLocalDraft(draft: DraftRecord): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.options.syncEndpoint}/drafts/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      })
      return { success: response.ok }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  /**
   * Remove item from sync queue
   */
  private async removeSyncQueueItem(id: string): Promise<void> {
    await offlineDb.syncQueue.delete(id)
  }

  /**
   * Schedule the next sync
   */
  private scheduleSync(): void {
    if (!this.isRunning) return
    this.syncTimer = setTimeout(async () => {
      await this.syncNow()
      this.scheduleSync()
    }, this.options.syncIntervalMs)
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.getState().then(state => {
      Array.from(this.listeners).forEach(listener => listener(state))
    })
  }
}

// Singleton instance
let syncEngineInstance: SyncEngine | null = null

export function getSyncEngine(options?: Partial<SyncEngineOptions>): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = new SyncEngine(options)
  }
  return syncEngineInstance
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}