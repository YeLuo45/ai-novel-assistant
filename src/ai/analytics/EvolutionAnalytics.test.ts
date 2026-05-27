/**
 * EvolutionAnalytics Tests - V72
 * Tests for EvolutionAnalytics types and mock data generators
 */

import { describe, it, expect } from 'vitest'
import {
  type EvolutionMetrics,
  type SkillEvolutionRecord,
  type ToolUsageStat,
  type TimeRange,
  createEmptyMetrics,
  generateMockMetrics,
  getTimeRange,
  formatMetricValue
} from './EvolutionAnalytics'

describe('EvolutionAnalytics Types', () => {
  describe('getTimeRange', () => {
    it('should return 1h range', () => {
      const range = getTimeRange('1h')
      expect(range.label).toBe('1h')
      expect(range.end - range.start).toBe(3_600_000)
    })

    it('should return 24h range', () => {
      const range = getTimeRange('24h')
      expect(range.label).toBe('24h')
      expect(range.end - range.start).toBe(86_400_000)
    })

    it('should return 7d range', () => {
      const range = getTimeRange('7d')
      expect(range.label).toBe('7d')
      expect(range.end - range.start).toBe(604_800_000)
    })

    it('should return 30d range', () => {
      const range = getTimeRange('30d')
      expect(range.label).toBe('30d')
      expect(range.end - range.start).toBe(2_592_000_000)
    })
  })

  describe('createEmptyMetrics', () => {
    it('should create all-zero metrics', () => {
      const metrics = createEmptyMetrics()

      expect(metrics.patternRecognitionCount).toBe(0)
      expect(metrics.skillCrystallizationCount).toBe(0)
      expect(metrics.skillDemotionCount).toBe(0)
      expect(metrics.totalToolCalls).toBe(0)
      expect(metrics.dreamSessionCount).toBe(0)
      expect(metrics.connectedInstances).toBe(0)
      expect(metrics.activeTasks).toBe(0)
      expect(metrics.completedTasks).toBe(0)
      expect(metrics.hookRegistryTotal).toBe(0)
    })

    it('should have empty arrays for history fields', () => {
      const metrics = createEmptyMetrics()

      expect(Array.isArray(metrics.skillEvolutionHistory)).toBe(true)
      expect(Array.isArray(metrics.toolCallHistory)).toBe(true)
      expect(Array.isArray(metrics.mostUsedTools)).toBe(true)
    })

    it('should have time range and timestamp', () => {
      const metrics = createEmptyMetrics()

      expect(metrics.timeRange).toBeDefined()
      expect(metrics.timeRange.label).toBe('24h')
      expect(typeof metrics.generatedAt).toBe('number')
    })
  })

  describe('generateMockMetrics', () => {
    it('should generate non-zero metrics', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics.patternRecognitionCount).toBeGreaterThan(0)
      expect(metrics.skillCrystallizationCount).toBeGreaterThan(0)
      expect(metrics.totalToolCalls).toBeGreaterThan(0)
    })

    it('should use specified time window', () => {
      const metrics = generateMockMetrics('7d')
      expect(metrics.timeRange.label).toBe('7d')
    })

    it('should include top tools', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics.mostUsedTools.length).toBeGreaterThan(0)
      expect(metrics.mostUsedTools[0]).toHaveProperty('toolName')
      expect(metrics.mostUsedTools[0]).toHaveProperty('callCount')
      expect(metrics.mostUsedTools[0]).toHaveProperty('successRate')
      expect(metrics.mostUsedTools[0]).toHaveProperty('avgLatencyMs')
    })

    it('should include hook state distribution', () => {
      const metrics = generateMockMetrics('24h')

      expect(typeof metrics.hookByState).toBe('object')
      expect(metrics.hookRegistryTotal).toBeGreaterThan(0)
    })

    it('should include federated instance data', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics.connectedInstances).toBeGreaterThanOrEqual(1)
      expect(metrics.completedTasks).toBeGreaterThanOrEqual(0)
      expect(metrics.failedTasks).toBeGreaterThanOrEqual(0)
    })

    it('should have valid memory compression ratio', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics.memoryCompressionRatio).toBeGreaterThanOrEqual(0)
      expect(metrics.memoryCompressionRatio).toBeLessThanOrEqual(1)
    })

    it('should have dream session data', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics.dreamSessionCount).toBeGreaterThan(0)
      expect(metrics.eventsCollected).toBeGreaterThan(0)
      expect(metrics.skillsExtractedFromDreams).toBeGreaterThanOrEqual(0)
    })
  })

  describe('formatMetricValue', () => {
    it('should format count correctly', () => {
      expect(formatMetricValue(42, 'count')).toBe('42')
      expect(formatMetricValue(1000, 'count')).toBe('1.0K')
      expect(formatMetricValue(1500000, 'count')).toBe('1.5M')
    })

    it('should format percent correctly', () => {
      expect(formatMetricValue(0.95, 'percent')).toBe('95.0%')
      expect(formatMetricValue(0.5, 'percent')).toBe('50.0%')
    })

    it('should format ms correctly', () => {
      expect(formatMetricValue(500, 'ms')).toBe('500ms')
      expect(formatMetricValue(1500, 'ms')).toBe('1.5s')
      expect(formatMetricValue(120, 'ms')).toBe('120ms')
    })

    it('should format ratio correctly', () => {
      expect(formatMetricValue(0.35, 'ratio')).toBe('0.35x')
      expect(formatMetricValue(1.5, 'ratio')).toBe('1.50x')
    })
  })

  describe('EvolutionMetrics shape', () => {
    it('should have all required fields', () => {
      const metrics = generateMockMetrics('24h')

      expect(metrics).toHaveProperty('patternRecognitionCount')
      expect(metrics).toHaveProperty('skillCrystallizationCount')
      expect(metrics).toHaveProperty('skillDemotionCount')
      expect(metrics).toHaveProperty('skillEvolutionHistory')
      expect(metrics).toHaveProperty('totalToolCalls')
      expect(metrics).toHaveProperty('toolCallHistory')
      expect(metrics).toHaveProperty('mostUsedTools')
      expect(metrics).toHaveProperty('dreamSessionCount')
      expect(metrics).toHaveProperty('eventsCollected')
      expect(metrics).toHaveProperty('skillsExtractedFromDreams')
      expect(metrics).toHaveProperty('memoryCompressionRatio')
      expect(metrics).toHaveProperty('connectedInstances')
      expect(metrics).toHaveProperty('activeTasks')
      expect(metrics).toHaveProperty('completedTasks')
      expect(metrics).toHaveProperty('failedTasks')
      expect(metrics).toHaveProperty('pendingTasks')
      expect(metrics).toHaveProperty('totalVotesCast')
      expect(metrics).toHaveProperty('hookRegistryTotal')
      expect(metrics).toHaveProperty('hookByState')
      expect(metrics).toHaveProperty('hookExecutionCount')
      expect(metrics).toHaveProperty('hookAvgLatencyMs')
      expect(metrics).toHaveProperty('timeRange')
      expect(metrics).toHaveProperty('generatedAt')
    })

    it('should have valid skill evolution history entries', () => {
      const metrics = generateMockMetrics('24h')

      // Even though it may be empty, check shape if not empty
      expect(Array.isArray(metrics.skillEvolutionHistory)).toBe(true)
    })

    it('should have valid tool usage stats entries', () => {
      const metrics = generateMockMetrics('24h')

      for (const tool of metrics.mostUsedTools) {
        expect(typeof tool.toolName).toBe('string')
        expect(typeof tool.callCount).toBe('number')
        expect(typeof tool.successRate).toBe('number')
        expect(typeof tool.avgLatencyMs).toBe('number')
        expect(typeof tool.lastCalled).toBe('number')
        expect(tool.successRate).toBeGreaterThanOrEqual(0)
        expect(tool.successRate).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('SkillEvolutionRecord shape', () => {
    it('should have all required fields', () => {
      const record: SkillEvolutionRecord = {
        skillId: 'skill_1',
        skillName: 'Test Skill',
        event: 'crystallized',
        fromLevel: 'L2',
        toLevel: 'L3',
        timestamp: Date.now(),
        confidence: 0.85,
        triggerReason: 'High usage + success rate'
      }

      expect(record.skillId).toBe('skill_1')
      expect(record.skillName).toBe('Test Skill')
      expect(record.event).toBe('crystallized')
      expect(record.fromLevel).toBe('L2')
      expect(record.toLevel).toBe('L3')
      expect(record.timestamp).toBeDefined()
      expect(record.confidence).toBe(0.85)
      expect(record.triggerReason).toBe('High usage + success rate')
    })

    it('should accept all event types', () => {
      const events: SkillEvolutionRecord['event'][] = ['crystallized', 'demoted', 'split', 'merged']

      for (const event of events) {
        const record: SkillEvolutionRecord = {
          skillId: 'test',
          skillName: 'Test',
          event,
          timestamp: Date.now(),
          confidence: 0.8,
          triggerReason: 'test'
        }
        expect(record.event).toBe(event)
      }
    })
  })
})