/**
 * Tool Registry V3 - Advanced Tool Registration and Management
 * V52: Version management, credits system, ratings aggregation
 */

import { toolMarketplaceDb, generateId, isValidVersion, type ToolV3, type ToolCategoryV3 } from './toolMarketplaceDb'

// ============================================================================
// Type Definitions
// ============================================================================

export interface ToolDefinition {
  id?: string // Optional - auto-generated if not provided
  name: string
  version: string
  category: ToolCategoryV3
  description: string
  code: string
  creditsPerCall: number
  changelog?: string
  sandboxed: boolean
  developerId: string
}

export interface ToolResult {
  success: boolean
  output: string
  metadata?: Record<string, unknown>
  error?: string
}

export interface ToolStats {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  totalCreditsEarned: number
  averageDuration: number
  averageRating: number
  totalRatings: number
}

// ============================================================================
// ToolRegistryV3 Class
// ============================================================================

export class ToolRegistryV3 {
  /**
   * Register a new tool (name + version must be unique)
   * @returns tool ID
   */
  async registerTool(tool: ToolDefinition): Promise<string> {
    const id = tool.id || generateId()

    // Validate version format
    if (!isValidVersion(tool.version)) {
      throw new Error(`Invalid version format: ${tool.version}. Expected semver (e.g., 1.0.0)`)
    }

    // Check for duplicate name + version
    const existing = await toolMarketplaceDb.tools_v3
      .where(['name', 'version'])
      .equals([tool.name, tool.version])
      .first()

    if (existing) {
      throw new Error(`Tool ${tool.name} v${tool.version} already exists`)
    }

    const now = Date.now()
    const toolV3: ToolV3 = {
      id,
      name: tool.name,
      version: tool.version,
      category: tool.category,
      description: tool.description,
      code: tool.code,
      creditsPerCall: tool.creditsPerCall,
      averageRating: 0,
      totalRatings: 0,
      changelog: tool.changelog,
      sandboxed: tool.sandboxed,
      developerId: tool.developerId,
      createdAt: now,
      updatedAt: now
    }

    await toolMarketplaceDb.tools_v3.add(toolV3)
    return id
  }

  /**
   * Get a tool by ID
   */
  async getTool(id: string): Promise<ToolV3 | undefined> {
    return toolMarketplaceDb.tools_v3.get(id)
  }

  /**
   * List tools, optionally filtered by category
   */
  async listTools(category?: ToolCategoryV3): Promise<ToolV3[]> {
    if (category) {
      return toolMarketplaceDb.tools_v3
        .where('category')
        .equals(category)
        .toArray()
    }
    return toolMarketplaceDb.tools_v3.toArray()
  }

  /**
   * Update a tool
   */
  async updateTool(id: string, updates: Partial<ToolDefinition>): Promise<void> {
    const existing = await toolMarketplaceDb.tools_v3.get(id)
    if (!existing) {
      throw new Error(`Tool ${id} not found`)
    }

    if (updates.version && !isValidVersion(updates.version)) {
      throw new Error(`Invalid version format: ${updates.version}`)
    }

    // Check for version conflict if updating name or version
    if (updates.name || updates.version) {
      const newName = updates.name || existing.name
      const newVersion = updates.version || existing.version

      const conflict = await toolMarketplaceDb.tools_v3
        .where(['name', 'version'])
        .equals([newName, newVersion])
        .first()

      if (conflict && conflict.id !== id) {
        throw new Error(`Tool ${newName} v${newVersion} already exists`)
      }
    }

    await toolMarketplaceDb.tools_v3.update(id, {
      ...updates,
      updatedAt: Date.now()
    })
  }

  /**
   * Call a tool and deduct credits
   */
  async callTool(id: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = await toolMarketplaceDb.tools_v3.get(id)
    if (!tool) {
      throw new Error(`Tool ${id} not found`)
    }

    const startTime = Date.now()
    let success = true
    let output = ''
    let error: string | undefined

    try {
      // Execute tool code in sandbox if sandboxed
      if (tool.sandboxed) {
        output = await this.executeInSandbox(tool.code, params)
      } else {
        // Direct execution (not recommended)
        output = await this.executeDirect(tool.code, params)
      }
    } catch (e) {
      success = false
      error = e instanceof Error ? e.message : String(e)
      output = `Error: ${error}`
    }

    const duration = Date.now() - startTime

    // Log the call
    await toolMarketplaceDb.tool_call_logs.add({
      id: generateId(),
      toolId: id,
      credits: tool.creditsPerCall,
      duration,
      success,
      createdAt: Date.now()
    })

    // Update developer stats
    if (success) {
      await this.updateDeveloperStats(tool.developerId, tool.creditsPerCall)
    }

    return {
      success,
      output,
      metadata: { duration, creditsCharged: tool.creditsPerCall },
      error
    }
  }

  /**
   * Rate a tool (1-5 stars)
   */
  async rateTool(id: string, userId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const tool = await toolMarketplaceDb.tools_v3.get(id)
    if (!tool) {
      throw new Error(`Tool ${id} not found`)
    }

    // Check for existing rating from this user
    const existingRating = await toolMarketplaceDb.tool_ratings
      .where(['toolId', 'userId'])
      .equals([id, userId])
      .first()

    if (existingRating) {
      // Update existing rating
      await toolMarketplaceDb.tool_ratings.update(existingRating.id, { rating })
    } else {
      // Add new rating
      await toolMarketplaceDb.tool_ratings.add({
        id: generateId(),
        toolId: id,
        userId,
        rating,
        createdAt: Date.now()
      })
    }

    // Recalculate average rating
    await this.recalculateAverageRating(id)
  }

  /**
   * Get average rating for a tool
   */
  async getAverageRating(toolId: string): Promise<{ avg: number; total: number }> {
    const tool = await toolMarketplaceDb.tools_v3.get(toolId)
    if (!tool) {
      return { avg: 0, total: 0 }
    }
    return { avg: tool.averageRating, total: tool.totalRatings }
  }

  /**
   * Get tool statistics
   */
  async getToolStats(toolId: string): Promise<ToolStats> {
    const tool = await toolMarketplaceDb.tools_v3.get(toolId)
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`)
    }

    const logs = await toolMarketplaceDb.tool_call_logs
      .where('toolId')
      .equals(toolId)
      .toArray()

    const successfulCalls = logs.filter(l => l.success).length
    const failedCalls = logs.filter(l => !l.success).length
    const totalCalls = logs.length
    const totalCreditsEarned = logs
      .filter(l => l.success)
      .reduce((sum, l) => sum + l.credits, 0)
    const averageDuration = totalCalls > 0
      ? logs.reduce((sum, l) => sum + l.duration, 0) / totalCalls
      : 0

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCreditsEarned,
      averageDuration,
      averageRating: tool.averageRating,
      totalRatings: tool.totalRatings
    }
  }

  /**
   * Delete a tool
   */
  async deleteTool(id: string): Promise<void> {
    await toolMarketplaceDb.tools_v3.delete(id)
    // Also delete related marketplace entry, ratings, and call logs
    await Promise.all([
      toolMarketplaceDb.tool_marketplace.where('toolId').equals(id).delete(),
      toolMarketplaceDb.tool_ratings.where('toolId').equals(id).delete(),
      toolMarketplaceDb.tool_call_logs.where('toolId').equals(id).delete()
    ])
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async executeInSandbox(code: string, params: Record<string, unknown>): Promise<string> {
    // Create a sandboxed iframe for execution
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.sandbox.add('allow-scripts')
      document.body.appendChild(iframe)

      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Sandbox execution timeout'))
      }, 30000)

      const cleanup = () => {
        clearTimeout(timeout)
        window.removeEventListener('message', messageHandler)
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return
        cleanup()
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }

      window.addEventListener('message', messageHandler)

      const sandboxCode = `
        <!DOCTYPE html>
        <html>
        <head><script>
        try {
          const params = ${JSON.stringify(params)};
          const result = (function() {
            ${code}
          })();
          parent.postMessage({ result: JSON.stringify(result) }, '*');
        } catch (e) {
          parent.postMessage({ error: e.message }, '*');
        }
        </script></head><body></body></html>
      `

      iframe.srcdoc = sandboxCode
    })
  }

  private async executeDirect(code: string, params: Record<string, unknown>): Promise<string> {
    // Direct execution using Function constructor (use with caution)
    const fn = new Function('params', `
      try {
        ${code}
      } catch (e) {
        throw e
      }
    `)
    const result = await fn(params)
    return typeof result === 'string' ? result : JSON.stringify(result)
  }

  private async recalculateAverageRating(toolId: string): Promise<void> {
    const ratings = await toolMarketplaceDb.tool_ratings
      .where('toolId')
      .equals(toolId)
      .toArray()

    if (ratings.length === 0) {
      await toolMarketplaceDb.tools_v3.update(toolId, {
        averageRating: 0,
        totalRatings: 0
      })
      return
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
    const avg = sum / ratings.length

    await toolMarketplaceDb.tools_v3.update(toolId, {
      averageRating: Math.round(avg * 100) / 100,
      totalRatings: ratings.length
    })
  }

  private async updateDeveloperStats(developerId: string, creditsEarned: number): Promise<void> {
    const existing = await toolMarketplaceDb.tool_developer_stats.get(developerId)
    
    if (existing) {
      await toolMarketplaceDb.tool_developer_stats.update(developerId, {
        totalEarnings: existing.totalEarnings + creditsEarned,
        totalCalls: existing.totalCalls + 1,
        updatedAt: Date.now()
      })
    } else {
      await toolMarketplaceDb.tool_developer_stats.add({
        developerId,
        totalEarnings: creditsEarned,
        totalCalls: 1,
        updatedAt: Date.now()
      })
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const toolRegistryV3 = new ToolRegistryV3()