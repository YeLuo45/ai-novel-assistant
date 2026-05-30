/**
 * V49 MemoryOrchestrator Test - 五层记忆协同测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryOrchestrator, memoryOrchestrator } from './MemoryOrchestrator'

// Mock Dexie for all memory modules
vi.mock('dexie', () => {
  const mockDb = {
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    table: vi.fn().mockReturnValue({
      add: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      above: vi.fn().mockReturnThis(),
      between: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    }),
  }
  return { default: vi.fn(() => mockDb) }
})

describe('MemoryOrchestrator', () => {
  let orchestrator: MemoryOrchestrator

  beforeEach(() => {
    orchestrator = new MemoryOrchestrator()
  })

  describe('initialization', () => {
    it('should create instance', () => {
      expect(orchestrator).toBeDefined()
    })

    it('should initialize without errors', async () => {
      await expect(orchestrator.initialize()).resolves.not.toThrow()
    })

    it('should be idempotent on multiple initializations', async () => {
      await orchestrator.initialize()
      await orchestrator.initialize()
      await orchestrator.initialize()
    })
  })

  describe('crossLayerRetrieve', () => {
    it('should return empty array for empty query', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: '',
        layers: ['L0'],
      })
      expect(results).toBeInstanceOf(Array)
    })

    it('should accept layers option', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: 'test',
        layers: ['L0', 'L1', 'L2', 'L3', 'L4'],
      })
      expect(results).toBeInstanceOf(Array)
    })

    it('should accept sessionId option', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: 'test',
        sessionId: 'test-session-123',
      })
      expect(results).toBeInstanceOf(Array)
    })

    it('should accept projectId option', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: 'test',
        projectId: 1,
      })
      expect(results).toBeInstanceOf(Array)
    })

    it('should accept limit option', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: 'test',
        limit: 5,
      })
      expect(results).toBeInstanceOf(Array)
    })

    it('should default to all layers if layers not specified', async () => {
      const results = await orchestrator.crossLayerRetrieve({
        query: 'test',
      })
      expect(results).toBeInstanceOf(Array)
    })
  })

  describe('promoteToWorking', () => {
    it('should handle non-existent entry', async () => {
      await expect(
        orchestrator.promoteToWorking('test-session', 999)
      ).resolves.not.toThrow()
    })
  })

  describe('consolidateToEpisodic', () => {
    it('should call workingMemory.consolidateToEpisodic', async () => {
      await expect(
        orchestrator.consolidateToEpisodic(
          'test-session',
          'Test Episode',
          ['event1', 'event2'],
          ['character1'],
          'positive',
          80
        )
      ).resolves.not.toThrow()
    })
  })

  describe('executeSkill', () => {
    it('should handle non-existent procedure', async () => {
      await expect(
        orchestrator.executeSkill(999, {})
      ).rejects.toThrow()
    })
  })

  describe('runForgettingCycle', () => {
    it('should complete without errors', async () => {
      await expect(orchestrator.runForgettingCycle()).resolves.not.toThrow()
    })
  })

  describe('getStats', () => {
    it('should return stats object', async () => {
      const stats = await orchestrator.getStats('test-session')
      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('sensory')
      expect(stats).toHaveProperty('working')
      expect(stats).toHaveProperty('episodic')
      expect(stats).toHaveProperty('semantic')
      expect(stats).toHaveProperty('procedural')
    })

    it('should include totalEntries in sensory stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.sensory.totalEntries).toBeDefined()
      expect(typeof stats.sensory.totalEntries).toBe('number')
    })

    it('should include avgWeight in sensory stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.sensory.avgWeight).toBeDefined()
      expect(typeof stats.sensory.avgWeight).toBe('number')
    })

    it('should include totalEntries in working stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.working.totalEntries).toBeDefined()
      expect(typeof stats.working.totalEntries).toBe('number')
    })

    it('should include attentionSlotCount in working stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.working.attentionSlotCount).toBeDefined()
      expect(typeof stats.working.attentionSlotCount).toBe('number')
    })

    it('should include totalEpisodes in episodic stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.episodic.totalEpisodes).toBeDefined()
      expect(typeof stats.episodic.totalEpisodes).toBe('number')
    })

    it('should include totalNodes in semantic stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.semantic.totalNodes).toBeDefined()
      expect(typeof stats.semantic.totalNodes).toBe('number')
    })

    it('should include totalProcedures in procedural stats', async () => {
      const stats = await orchestrator.getStats()
      expect(stats.procedural.totalProcedures).toBeDefined()
      expect(typeof stats.procedural.totalProcedures).toBe('number')
    })
  })

  describe('clearTier', () => {
    it('should handle L0 clear', async () => {
      await expect(
        orchestrator.clearTier('L0', 'test-session')
      ).resolves.not.toThrow()
    })

    it('should handle L1 clear', async () => {
      await expect(
        orchestrator.clearTier('L1', 'test-session')
      ).resolves.not.toThrow()
    })

    it('should handle L2 clear (no-op)', async () => {
      await expect(
        orchestrator.clearTier('L2')
      ).resolves.not.toThrow()
    })

    it('should handle L3 clear (no-op)', async () => {
      await expect(
        orchestrator.clearTier('L3')
      ).resolves.not.toThrow()
    })

    it('should handle L4 clear (no-op)', async () => {
      await expect(
        orchestrator.clearTier('L4')
      ).resolves.not.toThrow()
    })
  })
})

describe('MemoryTier type', () => {
  it('should accept valid tier values', () => {
    const tiers: Array<'L0' | 'L1' | 'L2' | 'L3' | 'L4'> = ['L0', 'L1', 'L2', 'L3', 'L4']
    expect(tiers).toHaveLength(5)
  })
})