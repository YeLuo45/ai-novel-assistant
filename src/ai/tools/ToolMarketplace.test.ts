/**
 * ToolMarketplace Test Suite
 * V52: Tests for search, review workflow, and marketplace operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toolMarketplace, type MarketplaceListing } from './ToolMarketplace'
import { toolRegistryV3, type ToolDefinition } from './ToolRegistryV3'
import { toolMarketplaceDb, clearToolMarketplaceData, type ToolCategoryV3 } from './toolMarketplaceDb'

describe('ToolMarketplace', () => {
  beforeEach(async () => {
    await clearToolMarketplaceData()
  })

  afterEach(async () => {
    await clearToolMarketplaceData()
  })

  // ========================================================================
  // Tool Submission Tests
  // ========================================================================

  describe('Tool Submission', () => {
    it('should submit a tool for review', async () => {
      const tool: ToolDefinition = {
        name: 'Submit Test Tool',
        version: '1.0.0',
        category: 'material',
        description: 'For testing submission',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)

      const listing = await toolMarketplace.getListing(toolId)
      expect(listing).toBeTruthy()
      expect(listing!.status).toBe('pending')
    })

    it('should reject submission of non-existent tool', async () => {
      await expect(toolMarketplace.submitForReview('fake-id'))
        .rejects.toThrow('not found')
    })

    it('should reject duplicate submission', async () => {
      const tool: ToolDefinition = {
        name: 'Duplicate Submit',
        version: '1.0.0',
        category: 'material',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)

      await expect(toolMarketplace.submitForReview(toolId))
        .rejects.toThrow('already submitted')
    })
  })

  // ========================================================================
  // Review Workflow Tests
  // ========================================================================

  describe('Review Workflow', () => {
    it('should approve a pending tool', async () => {
      const tool: ToolDefinition = {
        name: 'Approve Test',
        version: '1.0.0',
        category: 'character',
        description: 'For approval test',
        code: 'return 1',
        creditsPerCall: 10,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      const listing = await toolMarketplace.getListing(toolId)
      expect(listing!.status).toBe('approved')
      expect(listing!.approvedAt).toBeTruthy()
    })

    it('should reject a pending tool with reason', async () => {
      const tool: ToolDefinition = {
        name: 'Reject Test',
        version: '1.0.0',
        category: 'plot',
        description: 'For rejection test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.reject(toolId, 'Does not meet guidelines')

      const listing = await toolMarketplace.getListing(toolId)
      expect(listing!.status).toBe('rejected')
      expect(listing!.rejectReason).toBe('Does not meet guidelines')
    })

    it('should reject approval of non-pending tool', async () => {
      const tool: ToolDefinition = {
        name: 'Already Approved',
        version: '1.0.0',
        category: 'review',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      await expect(toolMarketplace.approve(toolId))
        .rejects.toThrow('not pending')
    })

    it('should only show approved tools in search', async () => {
      // Create approved tool
      const approvedTool: ToolDefinition = {
        name: 'Approved Tool',
        version: '1.0.0',
        category: 'material',
        description: 'Should appear in search',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }
      const approvedId = await toolRegistryV3.registerTool(approvedTool)
      await toolMarketplace.submitForReview(approvedId)
      await toolMarketplace.approve(approvedId)

      // Create pending tool
      const pendingTool: ToolDefinition = {
        name: 'Pending Tool',
        version: '1.0.0',
        category: 'material',
        description: 'Should NOT appear in search',
        code: 'return 2',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev2'
      }
      const pendingId = await toolRegistryV3.registerTool(pendingTool)
      await toolMarketplace.submitForReview(pendingId)
      // Not approved yet

      const results = await toolMarketplace.searchTools('')
      expect(results.some(r => r.name === 'Approved Tool')).toBe(true)
      expect(results.some(r => r.name === 'Pending Tool')).toBe(false)
    })
  })

  // ========================================================================
  // Search and Filter Tests
  // ========================================================================

  describe('Search and Filter', () => {
    it('should find tools by name', async () => {
      const tool: ToolDefinition = {
        name: 'Unique Name Searchable',
        version: '1.0.0',
        category: 'material',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      const results = await toolMarketplace.searchTools('Unique Name')
      expect(results.some(r => r.name === 'Unique Name Searchable')).toBe(true)
    })

    it('should find tools by description', async () => {
      const tool: ToolDefinition = {
        name: 'Regular Name',
        version: '1.0.0',
        category: 'character',
        description: 'This has a very special keyword',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      const results = await toolMarketplace.searchTools('special keyword')
      expect(results.some(r => r.name === 'Regular Name')).toBe(true)
    })

    it('should filter by category', async () => {
      const materialTool: ToolDefinition = {
        name: 'Material Category',
        version: '1.0.0',
        category: 'material',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }
      const materialId = await toolRegistryV3.registerTool(materialTool)
      await toolMarketplace.submitForReview(materialId)
      await toolMarketplace.approve(materialId)

      const characterTool: ToolDefinition = {
        name: 'Character Category',
        version: '1.0.0',
        category: 'character',
        description: 'Test',
        code: 'return 2',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev2'
      }
      const characterId = await toolRegistryV3.registerTool(characterTool)
      await toolMarketplace.submitForReview(characterId)
      await toolMarketplace.approve(characterId)

      const results = await toolMarketplace.searchTools('', 'material')
      expect(results.length).toBe(1)
      expect(results[0].category).toBe('material')
    })

    it('should combine search and category filter', async () => {
      const tool: ToolDefinition = {
        name: 'Combined Search',
        version: '1.0.0',
        category: 'plot',
        description: 'Testing combination',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      const results = await toolMarketplace.searchTools('Combined', 'plot')
      expect(results.some(r => r.name === 'Combined Search')).toBe(true)
    })

    it('should sort results by download count', async () => {
      const tool1: ToolDefinition = {
        name: 'Less Popular',
        version: '1.0.0',
        category: 'export',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }
      const id1 = await toolRegistryV3.registerTool(tool1)
      await toolMarketplace.submitForReview(id1)
      await toolMarketplace.approve(id1)
      await toolMarketplace.incrementDownload(id1)

      const tool2: ToolDefinition = {
        name: 'More Popular',
        version: '1.0.0',
        category: 'export',
        description: 'Test',
        code: 'return 2',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev2'
      }
      const id2 = await toolRegistryV3.registerTool(tool2)
      await toolMarketplace.submitForReview(id2)
      await toolMarketplace.approve(id2)
      await toolMarketplace.incrementDownload(id2)
      await toolMarketplace.incrementDownload(id2)

      const results = await toolMarketplace.searchTools('')
      expect(results[0].name).toBe('More Popular')
    })
  })

  // ========================================================================
  // Download Tracking Tests
  // ========================================================================

  describe('Download Tracking', () => {
    it('should increment download count', async () => {
      const tool: ToolDefinition = {
        name: 'Download Track',
        version: '1.0.0',
        category: 'custom',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      await toolMarketplace.incrementDownload(toolId)
      await toolMarketplace.incrementDownload(toolId)
      await toolMarketplace.incrementDownload(toolId)

      const listing = await toolMarketplace.getListing(toolId)
      expect(listing!.downloadCount).toBe(3)
    })

    it('should reject increment for non-marketplace tool', async () => {
      await expect(toolMarketplace.incrementDownload('fake-id'))
        .rejects.toThrow('not found')
    })
  })

  // ========================================================================
  // Marketplace Stats Tests
  // ========================================================================

  describe('Marketplace Stats', () => {
    it('should return marketplace statistics', async () => {
      const stats = await toolMarketplace.getMarketplaceStats()

      expect(stats).toHaveProperty('totalTools')
      expect(stats).toHaveProperty('pendingReview')
      expect(stats).toHaveProperty('approvedTools')
      expect(stats).toHaveProperty('totalDownloads')
      expect(stats).toHaveProperty('averageRating')
    })

    it('should calculate correct pending count', async () => {
      const tool1: ToolDefinition = {
        name: 'Pending 1',
        version: '1.0.0',
        category: 'material',
        description: 'Test',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'dev1'
      }
      await toolRegistryV3.registerTool(tool1)
      await toolMarketplace.submitForReview(await toolRegistryV3.registerTool(tool1))

      const stats = await toolMarketplace.getMarketplaceStats()
      expect(stats.pendingReview).toBeGreaterThanOrEqual(1)
    })
  })

  // ========================================================================
  // Developer Tools Tests
  // ========================================================================

  describe('Developer Tools', () => {
    it('should get tools by developer', async () => {
      const tool: ToolDefinition = {
        name: 'Developer Tool',
        version: '1.0.0',
        category: 'material',
        description: 'My tool',
        code: 'return 1',
        creditsPerCall: 5,
        sandboxed: true,
        developerId: 'unique-dev-123'
      }

      const toolId = await toolRegistryV3.registerTool(tool)
      await toolMarketplace.submitForReview(toolId)
      await toolMarketplace.approve(toolId)

      const tools = await toolMarketplace.getToolsByDeveloper('unique-dev-123')
      expect(tools.length).toBe(1)
      expect(tools[0].name).toBe('Developer Tool')
    })

    it('should return empty list for developer with no tools', async () => {
      const tools = await toolMarketplace.getToolsByDeveloper('non-existent-dev')
      expect(tools.length).toBe(0)
    })
  })
})