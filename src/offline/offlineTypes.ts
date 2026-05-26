/**
 * Offline Storage Types - V56
 * Types for IndexedDB offline storage and sync
 */

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncEntityType = 'draft' | 'character' | 'world' | 'outline' | 'chapter'
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error'
export type ConflictResolution = 'ours' | 'theirs' | 'base' | 'manual'

export interface BaseRecord {
  id: string
  updatedAt: number
  deviceId: string
  syncVersion: number
}

export interface DraftRecord extends BaseRecord {
  title: string
  content: string
  author: string
  summary?: string
  wordCount: number
  isDeleted: boolean
  chapterNumber?: number
}

export interface SyncQueueItem {
  id: string
  operation: SyncOperation
  entityType: SyncEntityType
  entityId: string
  timestamp: number
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
  payload: unknown
  errorMessage?: string
}

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  lastSeen: number
  isCurrent: boolean
}

export interface ConflictRecord {
  id: string
  entityType: SyncEntityType
  entityId: string
  localVersion: DraftRecord | null
  remoteVersion: DraftRecord | null
  baseVersion: DraftRecord | null
  detectedAt: number
  resolvedAt?: number
  resolution?: ConflictResolution
}

export interface SyncState {
  status: SyncStatus
  lastSyncTime: number | null
  pendingCount: number
  conflictCount: number
  errorMessage?: string
}

export const OFFLINE_DB_NAME = 'ai-novel-assistant-offline'
export const OFFLINE_DB_VERSION = 1

export const SYNC_CONFLICT_THRESHOLD = 3
export const SYNC_RETRY_MAX = 3
export const SYNC_RETRY_DELAY_MS = 1000