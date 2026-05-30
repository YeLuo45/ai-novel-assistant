/**
 * ConflictResolver - V56
 * Three-way merge algorithm for resolving sync conflicts
 */

import type { DraftRecord, ConflictResolution, ConflictRecord } from './offlineTypes'

export interface MergeResult {
  resolved: DraftRecord | null
  hasConflict: boolean
  strategy: ConflictResolution
}

/**
 * Three-way merge: compare local, remote, and base versions
 */
export function threeWayMerge(
  base: DraftRecord | null,
  local: DraftRecord,
  remote: DraftRecord
): MergeResult {
  // If base is null, this is a create conflict
  if (!base) {
    if (local.updatedAt > remote.updatedAt) {
      return { resolved: local, hasConflict: false, strategy: 'ours' }
    } else if (remote.updatedAt > local.updatedAt) {
      return { resolved: remote, hasConflict: false, strategy: 'theirs' }
    } else {
      // Same timestamp - pick ours as default
      return { resolved: local, hasConflict: false, strategy: 'ours' }
    }
  }

  // Check if any field changed from base in both versions
  const localChanged = local.title !== base.title || local.content !== base.content || local.summary !== base.summary
  const remoteChanged = remote.title !== base.title || remote.content !== base.content || remote.summary !== base.summary

  // No conflict - either one changed
  if (!localChanged) {
    return { resolved: remote, hasConflict: false, strategy: 'theirs' }
  }
  if (!remoteChanged) {
    return { resolved: local, hasConflict: false, strategy: 'ours' }
  }

  // Both changed same field - conflict
  if (local.title !== remote.title) {
    return { resolved: null, hasConflict: true, strategy: 'manual' }
  }
  if (local.summary !== remote.summary) {
    return { resolved: null, hasConflict: true, strategy: 'manual' }
  }

  // Content changed in both - try auto-merge (concatenate)
  if (local.content !== remote.content && local.content !== base.content && remote.content !== base.content) {
    // Auto-merge: combine both contents with separators
    const mergedContent = `<<<<<<< LOCAL\n${local.content}\n=======\n${remote.content}\n>>>>>>> REMOTE`
    return {
      resolved: {
        ...local,
        content: mergedContent,
        updatedAt: Date.now(),
        syncVersion: Math.max(local.syncVersion, remote.syncVersion) + 1
      },
      hasConflict: true,
      strategy: 'manual'
    }
  }

  // Default to local version
  return { resolved: local, hasConflict: false, strategy: 'ours' }
}

/**
 * Auto-resolve based on configured strategy
 */
export function autoResolve(
  local: DraftRecord,
  remote: DraftRecord,
  strategy: 'ours' | 'theirs'
): DraftRecord {
  if (strategy === 'theirs') {
    return {
      ...remote,
      syncVersion: Math.max(local.syncVersion, remote.syncVersion) + 1
    }
  }
  return {
    ...local,
    syncVersion: Math.max(local.syncVersion, remote.syncVersion) + 1
  }
}

/**
 * Detect if two versions have conflicts
 */
export function detectConflict(local: DraftRecord, remote: DraftRecord): boolean {
  if (local.syncVersion === remote.syncVersion) {
    return false // Already in sync
  }
  return local.title !== remote.title || local.content !== remote.content
}

/**
 * Apply conflict resolution
 */
export function applyResolution(
  conflict: ConflictRecord,
  local: DraftRecord,
  remote: DraftRecord,
  resolution: ConflictResolution
): DraftRecord | null {
  switch (resolution) {
    case 'ours':
      return autoResolve(local, remote, 'ours')
    case 'theirs':
      return autoResolve(local, remote, 'theirs')
    case 'base':
      // Revert to base (assuming base was stored in conflict)
      return conflict.baseVersion
    case 'manual':
    default:
      // For manual, caller must provide the merged result
      return null
  }
}