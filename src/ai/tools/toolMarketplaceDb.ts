/**
 * Tool Marketplace Database Schema V52
 * Dexie schema for tool marketplace, ratings, call logs, and developer stats
 */

import Dexie, { type Table } from 'dexie'

// ============================================================================
// Type Definitions
// ============================================================================

export interface ToolV3 {
  id: string
  name: string
  version: string
  category: ToolCategoryV3
  description: string
  code: string
  creditsPerCall: number
  averageRating: number
  totalRatings: number
  changelog?: string
  sandboxed: boolean
  developerId: string
  createdAt: number
  updatedAt: number
}

export type ToolCategoryV3 = 'material' | 'character' | 'plot' | 'review' | 'export' | 'custom'

export interface ToolMarketplace {
  id: string
  toolId: string
  status: 'pending' | 'approved' | 'rejected'
  downloadCount: number
  averageRating: number
  totalRatings: number
  rejectReason?: string
  submittedAt: number
  approvedAt?: number
  rejectedAt?: number
}

export interface ToolRating {
  id: string
  toolId: string
  userId: string
  rating: number // 1-5
  createdAt: number
}

export interface ToolCallLog {
  id: string
  toolId: string
  userId?: string
  credits: number
  duration: number
  success: boolean
  createdAt: number
}

export interface ToolDeveloperStats {
  developerId: string
  totalEarnings: number
  totalCalls: number
  updatedAt: number
}

// ============================================================================
// Database Class
// ============================================================================

export class ToolMarketplaceDB extends Dexie {
  tools_v3!: Table<ToolV3>
  tool_marketplace!: Table<ToolMarketplace>
  tool_ratings!: Table<ToolRating>
  tool_call_logs!: Table<ToolCallLog>
  tool_developer_stats!: Table<ToolDeveloperStats>

  constructor() {
    super('ToolMarketplaceDB')

    this.version(1).stores({
      tools_v3: 'id, name, version, category, creditsPerCall, createdAt, developerId',
      tool_marketplace: 'id, toolId, status, downloadCount, averageRating',
      tool_ratings: 'id, toolId, userId, rating, createdAt',
      tool_call_logs: 'id, toolId, credits, duration, success, createdAt',
      tool_developer_stats: 'developerId, totalEarnings, totalCalls, updatedAt'
    })
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const toolMarketplaceDb = new ToolMarketplaceDB()

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Clear all tool marketplace data (for testing)
 */
export async function clearToolMarketplaceData(): Promise<void> {
  await Promise.all([
    toolMarketplaceDb.tools_v3.clear(),
    toolMarketplaceDb.tool_marketplace.clear(),
    toolMarketplaceDb.tool_ratings.clear(),
    toolMarketplaceDb.tool_call_logs.clear(),
    toolMarketplaceDb.tool_developer_stats.clear()
  ])
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Validate semver version string
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version)
}

/**
 * Compare semver versions
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  
  for (let i = 0; i < 3; i++) {
    if (partsA[i] !== partsB[i]) {
      return partsA[i] - partsB[i]
    }
  }
  return 0
}