/**
 * Offline Module Tests - V56
 * Tests for OfflineDatabase, SyncEngine, and ConflictResolver
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DraftRecord, SyncQueueItem, ConflictRecord, ConflictResolution } from './offlineTypes'
import {
  threeWayMerge,
  detectConflict,
  autoResolve,
  applyResolution,
  type MergeResult
} from './ConflictResolver'

// Mock Dexie
vi.mock('dexie', () => {
  return {
    __esModule: true,
    default: class MockDexie {
      version = vi.fn().mockReturnThis()
      stores = vi.fn().mockReturnThis()
      drafts = { add: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn(), where: vi.fn(), toArray: vi.fn(), count: vi.fn(), clear: vi.fn() }
      syncQueue = { add: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn(), where: vi.fn(), toArray: vi.fn(), orderBy: vi.fn(), clear: vi.fn() }
      conflicts = { add: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn(), toArray: vi.fn(), filter: vi.fn(), clear: vi.fn() }
      devices = { add: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn(), toArray: vi.fn(), clear: vi.fn() }
    }
  }
})

const createDraft = (overrides: Partial<DraftRecord> = {}): DraftRecord => ({
  id: 'draft_1',
  title: 'Test Title',
  content: 'Test content',
  author: 'Test Author',
  summary: 'Test summary',
  wordCount: 100,
  updatedAt: 1000,
  deviceId: 'device_1',
  syncVersion: 1,
  isDeleted: false,
  ...overrides
})

const createQueueItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  id: 'sync_1',
  operation: 'update',
  entityType: 'draft',
  entityId: 'draft_1',
  timestamp: 1000,
  status: 'pending',
  retryCount: 0,
  payload: {},
  ...overrides
})

const createConflict = (overrides: Partial<ConflictRecord> = {}): ConflictRecord => ({
  id: 'conflict_1',
  entityType: 'draft',
  entityId: 'draft_1',
  localVersion: createDraft({ title: 'Local Title' }),
  remoteVersion: createDraft({ title: 'Remote Title' }),
  baseVersion: null,
  detectedAt: 1000,
  ...overrides
})

describe('OfflineTypes', () => {
  it('should have valid sync operation types', () => {
    const ops: ('create' | 'update' | 'delete')[] = ['create', 'update', 'delete']
    ops.forEach(op => expect(op).toBeDefined())
  })

  it('should have valid sync entity types', () => {
    const types: ('draft' | 'character' | 'world' | 'outline' | 'chapter')[] = ['draft', 'character', 'world', 'outline', 'chapter']
    types.forEach(t => expect(t).toBeDefined())
  })

  it('should have valid sync status types', () => {
    const statuses: ('synced' | 'syncing' | 'offline' | 'conflict' | 'error')[] = ['synced', 'syncing', 'offline', 'conflict', 'error']
    statuses.forEach(s => expect(s).toBeDefined())
  })
})

describe('ConflictResolver', () => {
  describe('threeWayMerge', () => {
    it('should return local when base is null and local is newer', () => {
      const local = createDraft({ updatedAt: 2000 })
      const remote = createDraft({ updatedAt: 1000 })

      const result = threeWayMerge(null, local, remote)

      expect(result.resolved?.id).toBe(local.id)
      expect(result.strategy).toBe('ours')
      expect(result.hasConflict).toBe(false)
    })

    it('should return remote when base is null and remote is newer', () => {
      const local = createDraft({ updatedAt: 1000 })
      const remote = createDraft({ updatedAt: 2000 })

      const result = threeWayMerge(null, local, remote)

      expect(result.resolved?.id).toBe(remote.id)
      expect(result.strategy).toBe('theirs')
    })

    it('should return remote when local has not changed', () => {
      const base = createDraft({ content: 'original' })
      const local = createDraft({ content: 'original', syncVersion: 2 })
      const remote = createDraft({ content: 'changed', syncVersion: 2 })

      const result = threeWayMerge(base, local, remote)

      expect(result.resolved?.id).toBe(remote.id)
      expect(result.strategy).toBe('theirs')
    })

    it('should return local when remote has not changed', () => {
      const base = createDraft({ content: 'original' })
      const local = createDraft({ content: 'changed', syncVersion: 2 })
      const remote = createDraft({ content: 'original', syncVersion: 2 })

      const result = threeWayMerge(base, local, remote)

      expect(result.resolved?.id).toBe(local.id)
      expect(result.strategy).toBe('ours')
    })

    it('should detect conflict when both changed title', () => {
      const base = createDraft({ title: 'Base' })
      const local = createDraft({ title: 'Local Title' })
      const remote = createDraft({ title: 'Remote Title' })

      const result = threeWayMerge(base, local, remote)

      expect(result.hasConflict).toBe(true)
      expect(result.resolved).toBeNull()
    })

    it('should detect conflict when both changed summary', () => {
      const base = createDraft({ summary: 'Base Summary' })
      const local = createDraft({ summary: 'Local Summary', title: 'Same' })
      const remote = createDraft({ summary: 'Remote Summary', title: 'Same' })

      const result = threeWayMerge(base, local, remote)

      expect(result.hasConflict).toBe(true)
    })
  })

  describe('autoResolve', () => {
    it('should return local version with updated syncVersion', () => {
      const local = createDraft({ syncVersion: 3 })
      const remote = createDraft({ syncVersion: 5 })

      const result = autoResolve(local, remote, 'ours')

      expect(result.syncVersion).toBe(6)
      expect(result.id).toBe(local.id)
    })

    it('should return remote version when strategy is theirs', () => {
      const local = createDraft({ syncVersion: 3 })
      const remote = createDraft({ syncVersion: 5 })

      const result = autoResolve(local, remote, 'theirs')

      expect(result.id).toBe(remote.id)
      expect(result.syncVersion).toBe(6)
    })
  })

  describe('detectConflict', () => {
    it('should return false when sync versions match', () => {
      const local = createDraft({ syncVersion: 5 })
      const remote = createDraft({ syncVersion: 5 })

      expect(detectConflict(local, remote)).toBe(false)
    })

    it('should return true when titles differ', () => {
      const local = createDraft({ title: 'Local', syncVersion: 5 })
      const remote = createDraft({ title: 'Remote', syncVersion: 6 })

      expect(detectConflict(local, remote)).toBe(true)
    })

    it('should return true when content differs', () => {
      const local = createDraft({ content: 'Local content', syncVersion: 5 })
      const remote = createDraft({ content: 'Remote content', syncVersion: 6 })

      expect(detectConflict(local, remote)).toBe(true)
    })
  })

  describe('applyResolution', () => {
    it('should apply ours resolution', () => {
      const local = createDraft({ title: 'Local', content: 'Local content', syncVersion: 3 })
      const remote = createDraft({ title: 'Remote', content: 'Remote content', syncVersion: 5 })
      const conflict = createConflict({ localVersion: local, remoteVersion: remote })

      const result = applyResolution(conflict, local, remote, 'ours')

      expect(result?.id).toBe(local.id)
      expect(result?.syncVersion).toBe(6)
    })

    it('should apply theirs resolution', () => {
      const local = createDraft({ title: 'Local', syncVersion: 3 })
      const remote = createDraft({ title: 'Remote', syncVersion: 5 })
      const conflict = createConflict({ localVersion: local, remoteVersion: remote })

      const result = applyResolution(conflict, local, remote, 'theirs')

      expect(result?.id).toBe(remote.id)
    })

    it('should return null for manual resolution', () => {
      const local = createDraft()
      const remote = createDraft()
      const conflict = createConflict({ localVersion: local, remoteVersion: remote })

      const result = applyResolution(conflict, local, remote, 'manual')

      expect(result).toBeNull()
    })
  })
})

describe('DraftRecord', () => {
  it('should create a valid draft record', () => {
    const draft = createDraft()

    expect(draft.id).toBe('draft_1')
    expect(draft.title).toBe('Test Title')
    expect(draft.content).toBe('Test content')
    expect(draft.isDeleted).toBe(false)
    expect(draft.syncVersion).toBe(1)
  })

  it('should allow setting chapter number', () => {
    const draft = createDraft({ chapterNumber: 5 })

    expect(draft.chapterNumber).toBe(5)
  })
})

describe('SyncQueueItem', () => {
  it('should create a valid queue item', () => {
    const item = createQueueItem()

    expect(item.id).toBe('sync_1')
    expect(item.status).toBe('pending')
    expect(item.retryCount).toBe(0)
  })

  it('should track retry count', () => {
    const item = createQueueItem({ retryCount: 2 })

    expect(item.retryCount).toBe(2)
  })

  it('should support all operation types', () => {
    const create = createQueueItem({ operation: 'create' })
    const update = createQueueItem({ operation: 'update' })
    const del = createQueueItem({ operation: 'delete' })

    expect(create.operation).toBe('create')
    expect(update.operation).toBe('update')
    expect(del.operation).toBe('delete')
  })
})

describe('ConflictRecord', () => {
  it('should create a valid conflict record', () => {
    const conflict = createConflict()

    expect(conflict.entityType).toBe('draft')
    expect(conflict.detectedAt).toBe(1000)
    expect(conflict.resolvedAt).toBeUndefined()
  })

  it('should track local and remote versions', () => {
    const local = createDraft({ title: 'Local' })
    const remote = createDraft({ title: 'Remote' })
    const conflict = createConflict({ localVersion: local, remoteVersion: remote })

    expect(conflict.localVersion?.title).toBe('Local')
    expect(conflict.remoteVersion?.title).toBe('Remote')
  })
})

describe('SyncState', () => {
  it('should define all status values', () => {
    const statuses = ['synced', 'syncing', 'offline', 'conflict', 'error'] as const
    statuses.forEach(s => expect(s).toBeDefined())
  })
})

describe('MergeResult', () => {
  it('should track hasConflict flag', () => {
    const result: MergeResult = {
      resolved: createDraft(),
      hasConflict: false,
      strategy: 'ours'
    }

    expect(result.hasConflict).toBe(false)
  })

  it('should track strategy', () => {
    const strategies: ConflictResolution[] = ['ours', 'theirs', 'base', 'manual']
    strategies.forEach(s => {
      const result: MergeResult = { resolved: null, hasConflict: true, strategy: s }
      expect(result.strategy).toBe(s)
    })
  })
})

describe('Sync Metrics', () => {
  it('should calculate merged syncVersion correctly', () => {
    const local = createDraft({ syncVersion: 3 })
    const remote = createDraft({ syncVersion: 5 })

    const result = autoResolve(local, remote, 'ours')
    expect(result.syncVersion).toBe(Math.max(3, 5) + 1)
  })
})