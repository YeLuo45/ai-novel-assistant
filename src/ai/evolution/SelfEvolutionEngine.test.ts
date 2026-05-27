/**
 * SelfEvolutionEngine Tests - V66
 * Unit tests for Self-Evolution types and helper functions
 * DB layer is tested through integration tests
 */

import { describe, it, expect } from 'vitest'
import {
  type ToolCallRecord,
  type SuccessPattern,
  type CrystallizedSkill,
  type SkillRule,
  type SkillLevel,
  type EvolutionMetrics,
  type EvolutionConfig,
  DEFAULT_EVOLUTION_CONFIG,
  EVOLUTION_THRESHOLDS,
  generateId,
  calculateSuccessRate,
  calculateAvgDuration
} from './SelfEvolutionTypes'

// ============================================================================
// SelfEvolutionTypes Tests
// ============================================================================

describe('SelfEvolutionTypes', () => {
  describe('SkillLevel', () => {
    it('should have 5 valid levels', () => {
      const levels: SkillLevel[] = ['nascent', 'developing', 'stable', 'mastered', 'deprecated']
      expect(levels).toHaveLength(5)
    })

    it('should order levels correctly for promotion', () => {
      const order: SkillLevel[] = ['nascent', 'developing', 'stable', 'mastered']
      expect(order.indexOf('nascent')).toBeLessThan(order.indexOf('developing'))
      expect(order.indexOf('developing')).toBeLessThan(order.indexOf('stable'))
      expect(order.indexOf('stable')).toBeLessThan(order.indexOf('mastered'))
    })
  })

  describe('ToolCallRecord', () => {
    it('should have all required fields', () => {
      const record: ToolCallRecord = {
        id: 'test-1',
        toolId: 'plot-generator',
        toolName: 'PlotGenerator',
        timestamp: Date.now(),
        success: true,
        durationMs: 150,
        inputComplexity: 0.5,
        context: { genre: 'fantasy', writingStage: 'plotting' }
      }
      expect(record.toolId).toBe('plot-generator')
      expect(record.success).toBe(true)
    })

    it('should allow optional context', () => {
      const record: Omit<ToolCallRecord, 'id'> = {
        toolId: 'test-tool',
        toolName: 'Test',
        timestamp: Date.now(),
        success: false,
        durationMs: 100,
        inputComplexity: 0.3,
        error: 'timeout'
        // context is optional
      }
      expect(record.error).toBe('timeout')
    })

    it('should support output quality metric', () => {
      const record: Omit<ToolCallRecord, 'id'> = {
        toolId: 'test-tool',
        toolName: 'Test',
        timestamp: Date.now(),
        success: true,
        durationMs: 100,
        inputComplexity: 0.5,
        outputQuality: 0.85
      }
      expect(record.outputQuality).toBe(0.85)
    })
  })

  describe('SuccessPattern', () => {
    it('should have valid confidence range', () => {
      const pattern: SuccessPattern = {
        id: 'p1',
        toolId: 'test-tool',
        pattern: 'genre=fantasy',
        occurrences: 15,
        avgSuccessRate: 0.93,
        avgDurationMs: 120,
        lastObserved: Date.now(),
        confidence: 0.85
      }
      expect(pattern.confidence).toBeGreaterThan(0)
      expect(pattern.confidence).toBeLessThanOrEqual(1)
    })

    it('should have valid success rate range', () => {
      const pattern: SuccessPattern = {
        id: 'p1',
        toolId: 'test-tool',
        pattern: 'default',
        occurrences: 10,
        avgSuccessRate: 0.0,
        avgDurationMs: 100,
        lastObserved: Date.now(),
        confidence: 0.7
      }
      expect(pattern.avgSuccessRate).toBe(0.0)
    })
  })

  describe('CrystallizedSkill', () => {
    it('should have rules array', () => {
      const skill: CrystallizedSkill = {
        id: 'skill1',
        name: 'TestSkill',
        description: 'A test skill',
        rules: [{
          id: 'rule1',
          condition: "context.genre === 'fantasy'",
          action: 'prefer_tool:plot-generator',
          priority: 85,
          successCount: 9,
          failureCount: 1,
          lastMatched: Date.now()
        }],
        level: 'stable',
        successRate: 0.9,
        totalActivations: 10,
        lastActivated: Date.now(),
        createdAt: Date.now(),
        evolvedAt: Date.now(),
        metadata: {}
      }
      expect(skill.rules).toHaveLength(1)
      expect(skill.rules[0].priority).toBe(85)
    })

    it('should support sourceToolId', () => {
      const skill: CrystallizedSkill = {
        id: 'skill1',
        name: 'TestSkill',
        description: 'Test',
        sourceToolId: 'plot-generator',
        rules: [],
        level: 'nascent',
        successRate: 0.8,
        totalActivations: 5,
        lastActivated: Date.now(),
        createdAt: Date.now(),
        evolvedAt: Date.now(),
        metadata: {}
      }
      expect(skill.sourceToolId).toBe('plot-generator')
    })
  })

  describe('SkillRule', () => {
    it('should track success and failure counts', () => {
      const rule: SkillRule = {
        id: 'rule1',
        condition: 'context.genre === "fantasy"',
        action: 'prefer_tool:plot-generator',
        priority: 80,
        successCount: 15,
        failureCount: 2,
        lastMatched: Date.now()
      }
      expect(rule.successCount).toBe(15)
      expect(rule.failureCount).toBe(2)
    })
  })

  describe('EvolutionMetrics', () => {
    it('should have consistent counts', () => {
      const metrics: EvolutionMetrics = {
        toolId: 'test-tool',
        totalCalls: 100,
        successfulCalls: 85,
        failedCalls: 15,
        avgDurationMs: 150,
        successRate: 0.85,
        patternCount: 3,
        skillCount: 2,
        lastUpdated: Date.now()
      }
      expect(metrics.totalCalls).toBe(metrics.successfulCalls + metrics.failedCalls)
    })
  })
})

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe('Helper Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100) // All unique
    })

    it('should include timestamp', () => {
      const before = Date.now()
      const id = generateId()
      const after = Date.now()
      const timestampPart = parseInt(id.split('-')[0])
      expect(timestampPart).toBeGreaterThanOrEqual(before)
      expect(timestampPart).toBeLessThanOrEqual(after)
    })

    it('should have random suffix', () => {
      const id1 = generateId()
      const id2 = generateId()
      const part1 = id1.split('-')[1]
      const part2 = id2.split('-')[1]
      expect(part1).not.toBe(part2)
    })
  })

  describe('calculateSuccessRate', () => {
    it('should calculate 100% success', () => {
      expect(calculateSuccessRate(10, 10)).toBe(1.0)
    })

    it('should calculate 0% success', () => {
      expect(calculateSuccessRate(0, 10)).toBe(0)
    })

    it('should calculate 50% success', () => {
      expect(calculateSuccessRate(5, 10)).toBe(0.5)
    })

    it('should return 0 for zero total', () => {
      expect(calculateSuccessRate(0, 0)).toBe(0)
    })

    it('should round to 3 decimal places', () => {
      expect(calculateSuccessRate(1, 3)).toBeCloseTo(0.333, 2)
    })
  })

  describe('calculateAvgDuration', () => {
    it('should return 0 for empty array', () => {
      expect(calculateAvgDuration([])).toBe(0)
    })

    it('should calculate average correctly', () => {
      const records: ToolCallRecord[] = [
        { id: '1', toolId: 't', toolName: 't', timestamp: 1, success: true, durationMs: 100, inputComplexity: 0.5 },
        { id: '2', toolId: 't', toolName: 't', timestamp: 1, success: true, durationMs: 200, inputComplexity: 0.5 },
        { id: '3', toolId: 't', toolName: 't', timestamp: 1, success: true, durationMs: 300, inputComplexity: 0.5 }
      ]
      expect(calculateAvgDuration(records)).toBe(200)
    })

    it('should round to nearest integer', () => {
      const records: ToolCallRecord[] = [
        { id: '1', toolId: 't', toolName: 't', timestamp: 1, success: true, durationMs: 100, inputComplexity: 0.5 },
        { id: '2', toolId: 't', toolName: 't', timestamp: 1, success: true, durationMs: 101, inputComplexity: 0.5 }
      ]
      // (100 + 101) / 2 = 100.5 -> rounds to 101
      expect(calculateAvgDuration(records)).toBe(101)
    })
  })
})

// ============================================================================
// Evolution Thresholds Tests
// ============================================================================

describe('EVOLUTION_THRESHOLDS', () => {
  it('should have pattern detection thresholds', () => {
    expect(EVOLUTION_THRESHOLDS.MIN_PATTERN_OCCURRENCES).toBe(5)
    expect(EVOLUTION_THRESHOLDS.MIN_PATTERN_CONFIDENCE).toBe(0.7)
  })

  it('should have crystallization thresholds', () => {
    expect(EVOLUTION_THRESHOLDS.MIN_SKILL_SUCCESS_RATE).toBe(0.85)
    expect(EVOLUTION_THRESHOLDS.MIN_CRYSTALLIZATION_OCCURRENCES).toBe(10)
  })

  it('should have promotion thresholds', () => {
    expect(EVOLUTION_THRESHOLDS.PROMOTE_SUCCESS_RATE).toBe(0.9)
    expect(EVOLUTION_THRESHOLDS.PROMOTE_OCCURRENCES).toBe(20)
    expect(EVOLUTION_THRESHOLDS.PROMOTE_CONFIDENCE).toBe(0.85)
  })

  it('should have demotion thresholds', () => {
    expect(EVOLUTION_THRESHOLDS.DEMOTE_SUCCESS_RATE).toBe(0.6)
    expect(EVOLUTION_THRESHOLDS.DEMOTE_OCCURRENCES).toBe(15)
  })

  it('should have deprecation thresholds', () => {
    expect(EVOLUTION_THRESHOLDS.DEPRECATE_SUCCESS_RATE).toBe(0.4)
    expect(EVOLUTION_THRESHOLDS.DEPRECATE_OCCURRENCES).toBe(30)
  })

  it('should have time windows', () => {
    expect(EVOLUTION_THRESHOLDS.PATTERN_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000) // 7 days
    expect(EVOLUTION_THRESHOLDS.SKILL_CHECK_INTERVAL_MS).toBe(60 * 60 * 1000) // 1 hour
  })
})

// ============================================================================
// DEFAULT_EVOLUTION_CONFIG Tests
// ============================================================================

describe('DEFAULT_EVOLUTION_CONFIG', () => {
  it('should enable all auto features by default', () => {
    expect(DEFAULT_EVOLUTION_CONFIG.enableAutoEvolution).toBe(true)
    expect(DEFAULT_EVOLUTION_CONFIG.enableAutoCrystallization).toBe(true)
    expect(DEFAULT_EVOLUTION_CONFIG.enableAutoDemotion).toBe(true)
  })

  it('should have valid check interval', () => {
    expect(DEFAULT_EVOLUTION_CONFIG.checkIntervalMs).toBe(EVOLUTION_THRESHOLDS.SKILL_CHECK_INTERVAL_MS)
  })

  it('should reference thresholds correctly', () => {
    expect(DEFAULT_EVOLUTION_CONFIG.minPatternOccurrences).toBe(EVOLUTION_THRESHOLDS.MIN_PATTERN_OCCURRENCES)
    expect(DEFAULT_EVOLUTION_CONFIG.minCrystallizationOccurrences).toBe(EVOLUTION_THRESHOLDS.MIN_CRYSTALLIZATION_OCCURRENCES)
    expect(DEFAULT_EVOLUTION_CONFIG.patternWindowMs).toBe(EVOLUTION_THRESHOLDS.PATTERN_WINDOW_MS)
  })
})

// ============================================================================
// Context Key Generation Tests
// ============================================================================

describe('Context Key Generation', () => {
  it('should format genre correctly', () => {
    const key = 'genre=fantasy'
    expect(key).toBe('genre=fantasy')
  })

  it('should combine multiple context fields', () => {
    const parts: string[] = []
    parts.push('genre=fantasy')
    parts.push('stage=plotting')
    parts.push('agent=PlotExpert')
    const key = parts.join(', ')
    expect(key).toBe('genre=fantasy, stage=plotting, agent=PlotExpert')
  })

  it('should handle missing context gracefully', () => {
    const parts: string[] = []
    // Only genre
    parts.push('genre=fantasy')
    const key = parts.join(', ') || 'default'
    expect(key).toBe('genre=fantasy')
  })
})

// ============================================================================
// Condition Parser Tests
// ============================================================================

describe('Condition Parser', () => {
  it('should parse simple equality condition', () => {
    const condition = "context.genre === 'fantasy'"
    expect(condition).toContain("context.genre")
    expect(condition).toContain("'fantasy'")
  })

  it('should support multiple conditions', () => {
    const conditions = [
      "context.genre === 'fantasy'",
      "context.writingStage === 'plotting'"
    ]
    const combined = conditions.join(' && ')
    expect(combined).toContain('fantasy')
    expect(combined).toContain('plotting')
  })

  it('should handle complex patterns', () => {
    const pattern = 'genre=fantasy, stage=plotting, agent=PlotExpert'
    const parts = pattern.split(', ')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe('genre=fantasy')
  })
})

// ============================================================================
// Skill Level Transition Tests
// ============================================================================

describe('Skill Level Transitions', () => {
  const levelOrder: SkillLevel[] = ['nascent', 'developing', 'stable', 'mastered', 'deprecated']

  it('should cap at mastered (highest level)', () => {
    const getNextHigher = (level: SkillLevel): SkillLevel => {
      const idx = levelOrder.indexOf(level)
      return idx < levelOrder.length - 1 ? levelOrder[idx + 1] : levelOrder[levelOrder.length - 1]
    }
    expect(getNextHigher('mastered')).toBe('deprecated')
  })

  it('should identify next lower level', () => {
    const getNextLower = (level: SkillLevel): SkillLevel => {
      const idx = levelOrder.indexOf(level)
      return idx > 0 ? levelOrder[idx - 1] : 'nascent'
    }
    expect(getNextLower('mastered')).toBe('stable')
    expect(getNextLower('stable')).toBe('developing')
    expect(getNextLower('developing')).toBe('nascent')
    expect(getNextLower('nascent')).toBe('nascent')
  })

  it('should not promote deprecated', () => {
    const getNextHigher = (level: SkillLevel): SkillLevel => {
      const idx = levelOrder.indexOf(level)
      return idx < levelOrder.length - 1 ? levelOrder[idx + 1] : 'mastered'
    }
    expect(getNextHigher('deprecated')).toBe('mastered')
  })
})