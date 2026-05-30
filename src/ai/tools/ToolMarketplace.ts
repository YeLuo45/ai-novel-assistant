/**
 * Tool Marketplace - Tool discovery, review, and distribution
 * V52: Marketplace with review workflow, search, and download tracking
 */

import { 
  toolMarketplaceDb, 
  generateId, 
  type ToolV3, 
  type ToolMarketplace as ToolMarketplaceEntry,
  type ToolCategoryV3 
} from './toolMarketplaceDb'

// ============================================================================
// Type Definitions
// ============================================================================

export interface MarketplaceListing {
  id: string
  toolId: string
  name: string
  version: string
  category: ToolCategoryV3
  description: string
  creditsPerCall: number
  status: 'pending' | 'approved' | 'rejected'
  downloadCount: number
  averageRating: number
  totalRatings: number
  rejectReason?: string
  submittedAt: number
  approvedAt?: number
}

export interface MarketStats {
  totalTools: number
  pendingReview: number
  approvedTools: number
  totalDownloads: number
  averageRating: number
  topCategory: ToolCategoryV3 | null
}

// ============================================================================
// ToolMarketplace Class
// ============================================================================

export class ToolMarketplace {
  /**
   * Submit a tool for review (sets status to pending)
   */
  async submitForReview(toolId: string): Promise<void> {
    const tool = await toolMarketplaceDb.tools_v3.get(toolId)
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`)
    }

    // Check if already in marketplace
    const existing = await toolMarketplaceDb.tool_marketplace
      .where('toolId')
      .equals(toolId)
      .first()

    if (existing) {
      throw new Error(`Tool ${toolId} already submitted`)
    }

    await toolMarketplaceDb.tool_marketplace.add({
      id: generateId(),
      toolId,
      status: 'pending',
      downloadCount: 0,
      averageRating: 0,
      totalRatings: 0,
      submittedAt: Date.now()
    })
  }

  /**
   * Approve a tool (sets status to approved)
   */
  async approve(toolId: string): Promise<void> {
    const marketplaceEntry = await toolMarketplaceDb.tool_marketplace
      .where('toolId')
      .equals(toolId)
      .first()

    if (!marketplaceEntry) {
      throw new Error(`Tool ${toolId} not found in marketplace`)
    }

    if (marketplaceEntry.status !== 'pending') {
      throw new Error(`Tool ${toolId} is not pending review`)
    }

    await toolMarketplaceDb.tool_marketplace.update(marketplaceEntry.id, {
      status: 'approved',
      approvedAt: Date.now()
    })
  }

  /**
   * Reject a tool with reason
   */
  async reject(toolId: string, reason: string): Promise<void> {
    const marketplaceEntry = await toolMarketplaceDb.tool_marketplace
      .where('toolId')
      .equals(toolId)
      .first()

    if (!marketplaceEntry) {
      throw new Error(`Tool ${toolId} not found in marketplace`)
    }

    if (marketplaceEntry.status !== 'pending') {
      throw new Error(`Tool ${toolId} is not pending review`)
    }

    await toolMarketplaceDb.tool_marketplace.update(marketplaceEntry.id, {
      status: 'rejected',
      rejectReason: reason,
      rejectedAt: Date.now()
    })
  }

  /**
   * Search tools by query and optional category
   */
  async searchTools(query: string, category?: ToolCategoryV3): Promise<MarketplaceListing[]> {
    // Get all approved tools with their tool data
    const marketplaceEntries = await toolMarketplaceDb.tool_marketplace
      .where('status')
      .equals('approved')
      .toArray()

    const toolIds = marketplaceEntries.map(e => e.toolId)
    const tools = await Promise.all(
      toolIds.map(id => toolMarketplaceDb.tools_v3.get(id))
    )

    const toolMap = new Map<string, ToolV3>()
    tools.forEach(t => {
      if (t) toolMap.set(t.id, t)
    })

    const queryLower = query.toLowerCase()
    const results: MarketplaceListing[] = []

    for (const entry of marketplaceEntries) {
      const tool = toolMap.get(entry.toolId)
      if (!tool) continue

      // Apply category filter
      if (category && tool.category !== category) continue

      // Apply search query
      if (query) {
        const matchesName = tool.name.toLowerCase().includes(queryLower)
        const matchesDesc = tool.description.toLowerCase().includes(queryLower)
        if (!matchesName && !matchesDesc) continue
      }

      results.push({
        id: entry.id,
        toolId: entry.toolId,
        name: tool.name,
        version: tool.version,
        category: tool.category,
        description: tool.description,
        creditsPerCall: tool.creditsPerCall,
        status: entry.status,
        downloadCount: entry.downloadCount,
        averageRating: entry.averageRating,
        totalRatings: entry.totalRatings,
        submittedAt: entry.submittedAt,
        approvedAt: entry.approvedAt
      })
    }

    return results.sort((a, b) => b.downloadCount - a.downloadCount)
  }

  /**
   * Get a single marketplace listing
   */
  async getListing(toolId: string): Promise<MarketplaceListing | undefined> {
    const entry = await toolMarketplaceDb.tool_marketplace
      .where('toolId')
      .equals(toolId)
      .first()

    if (!entry) return undefined

    const tool = await toolMarketplaceDb.tools_v3.get(toolId)
    if (!tool) return undefined

    return {
      id: entry.id,
      toolId: entry.toolId,
      name: tool.name,
      version: tool.version,
      category: tool.category,
      description: tool.description,
      creditsPerCall: tool.creditsPerCall,
      status: entry.status,
      downloadCount: entry.downloadCount,
      averageRating: entry.averageRating,
      totalRatings: entry.totalRatings,
      rejectReason: entry.rejectReason,
      submittedAt: entry.submittedAt,
      approvedAt: entry.approvedAt
    }
  }

  /**
   * Get all pending review tools
   */
  async getPendingTools(): Promise<MarketplaceListing[]> {
    const pending = await toolMarketplaceDb.tool_marketplace
      .where('status')
      .equals('pending')
      .toArray()

    return Promise.all(pending.map(async (entry) => {
      const tool = await toolMarketplaceDb.tools_v3.get(entry.toolId)
      if (!tool) {
        return {
          id: entry.id,
          toolId: entry.toolId,
          name: 'Unknown',
          version: '0.0.0',
          category: 'custom' as ToolCategoryV3,
          description: '',
          creditsPerCall: 0,
          status: entry.status,
          downloadCount: entry.downloadCount,
          averageRating: entry.averageRating,
          totalRatings: entry.totalRatings,
          submittedAt: entry.submittedAt
        }
      }
      return {
        id: entry.id,
        toolId: entry.toolId,
        name: tool.name,
        version: tool.version,
        category: tool.category,
        description: tool.description,
        creditsPerCall: tool.creditsPerCall,
        status: entry.status,
        downloadCount: entry.downloadCount,
        averageRating: entry.averageRating,
        totalRatings: entry.totalRatings,
        submittedAt: entry.submittedAt
      }
    }))
  }

  /**
   * Increment download count for a tool
   */
  async incrementDownload(toolId: string): Promise<void> {
    const entry = await toolMarketplaceDb.tool_marketplace
      .where('toolId')
      .equals(toolId)
      .first()

    if (!entry) {
      throw new Error(`Tool ${toolId} not found in marketplace`)
    }

    await toolMarketplaceDb.tool_marketplace.update(entry.id, {
      downloadCount: entry.downloadCount + 1
    })
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketStats> {
    const marketplaceEntries = await toolMarketplaceDb.tool_marketplace.toArray()

    const pendingCount = marketplaceEntries.filter(e => e.status === 'pending').length
    const approvedEntries = marketplaceEntries.filter(e => e.status === 'approved')
    const approvedCount = approvedEntries.length
    const totalDownloads = approvedEntries.reduce((sum, e) => sum + e.downloadCount, 0)

    // Calculate average rating
    let totalRating = 0
    let totalRatingCount = 0
    approvedEntries.forEach(e => {
      if (e.totalRatings > 0) {
        totalRating += e.averageRating * e.totalRatings
        totalRatingCount += e.totalRatings
      }
    })
    const averageRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0

    // Find top category
    const categoryCounts = new Map<ToolCategoryV3, number>()
    for (const entry of approvedEntries) {
      const tool = await toolMarketplaceDb.tools_v3.get(entry.toolId)
      if (tool) {
        const count = categoryCounts.get(tool.category) || 0
        categoryCounts.set(tool.category, count + 1)
      }
    }
    let topCategory: ToolCategoryV3 | null = null
    let maxCount = 0
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count
        topCategory = category
      }
    })

    return {
      totalTools: marketplaceEntries.length,
      pendingReview: pendingCount,
      approvedTools: approvedCount,
      totalDownloads,
      averageRating: Math.round(averageRating * 100) / 100,
      topCategory
    }
  }

  /**
   * Get tools by developer
   */
  async getToolsByDeveloper(developerId: string): Promise<MarketplaceListing[]> {
    const tools = await toolMarketplaceDb.tools_v3
      .where('developerId')
      .equals(developerId)
      .toArray()

    return Promise.all(tools.map(async (tool) => {
      const entry = await toolMarketplaceDb.tool_marketplace
        .where('toolId')
        .equals(tool.id)
        .first()

      return {
        id: entry?.id || '',
        toolId: tool.id,
        name: tool.name,
        version: tool.version,
        category: tool.category,
        description: tool.description,
        creditsPerCall: tool.creditsPerCall,
        status: entry?.status || 'pending',
        downloadCount: entry?.downloadCount || 0,
        averageRating: tool.averageRating,
        totalRatings: tool.totalRatings,
        submittedAt: entry?.submittedAt,
        approvedAt: entry?.approvedAt
      }
    }))
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const toolMarketplace = new ToolMarketplace()