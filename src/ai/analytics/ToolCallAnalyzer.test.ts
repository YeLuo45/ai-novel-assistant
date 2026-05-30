/**
 * ToolCallAnalyzer Tests - V77
 * Tests for Tool Call Sequence Analysis
 */

import { describe, it, expect } from 'vitest'
import type { ToolCall } from '../agents/ToolExecutor'
import {
  type SequenceType,
  type ToolChain,
  type ToolSequence,
  type ToolSubstitution,
  type InefficiencyReport,
  type ToolCallPattern,
  callsToSequences,
  inferSequenceType,
  extractChains,
  analyzeSequences,
  findInefficiencies,
  findSubstitutions,
  analyzeToolCalls,
  predictNextTool,
  formatChain
} from './ToolCallAnalyzer'

// ===============================================================================
// Helper
// ===============================================================================

function createToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  const now = Date.now()
  return {
    id: 'call_' + Math.random().toString(36).slice(2),
    tool: 'TestTool',
    args: {},
    startTime: now,
    ...overrides
  }
}

function createSeq(calls: ToolCall[], gapMs = 1000): ToolSequence[] {
  return callsToSequences(calls, gapMs)
}

// ===============================================================================
// callsToSequences Tests
// ===============================================================================

describe('callsToSequences', () => {
  it('should return empty for empty calls', () => {
    expect(callsToSequences([])).toHaveLength(0)
  })

  it('should group calls within gap threshold', () => {
    const now = Date.now()
    const calls = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 100 }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 200, endTime: now + 300 }),
      createToolCall({ id: 'c', tool: 'toolC', startTime: now + 400, endTime: now + 500 })
    ]
    const seqs = createSeq(calls, 5000)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].toolIds).toEqual(['toolA', 'toolB', 'toolC'])
  })

  it('should split on large gap', () => {
    const now = Date.now()
    const calls = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 100 }),
      // Gap of 10 seconds
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 10000, endTime: now + 10100 })
    ]
    const seqs = createSeq(calls, 5000)
    expect(seqs).toHaveLength(2)
    expect(seqs[0].toolIds).toEqual(['toolA'])
    expect(seqs[1].toolIds).toEqual(['toolB'])
  })
})

// ===============================================================================
// inferSequenceType Tests
// ===============================================================================

describe('inferSequenceType', () => {
  it('should return standalone for single tool', () => {
    expect(inferSequenceType(['toolA'], [])).toBe('standalone')
  })

  it('should return sequential for 2 tools', () => {
    expect(inferSequenceType(['toolA', 'toolB'], [])).toBe('sequential')
  })

  it('should return parallel for 3+ distinct tools (no consecutive repeats)', () => {
    // With no consecutive duplicates and 3+ distinct tools → parallel
    expect(inferSequenceType(['toolA', 'toolB', 'toolC'], [])).toBe('parallel')
    expect(inferSequenceType(['toolA', 'toolB', 'toolC', 'toolD'], [])).toBe('parallel')
  })
})

// ===============================================================================
// extractChains Tests
// ===============================================================================

describe('extractChains', () => {
  it('should return empty for short sequences', () => {
    const seqs: ToolSequence[] = [
      { id: 's1', toolIds: ['toolA'], length: 1, durationMs: 100, success: true, timestamp: Date.now(), sequenceType: 'standalone' }
    ]
    expect(extractChains(seqs, 2)).toHaveLength(0)
  })

  it('should extract chain patterns', () => {
    const seqs: ToolSequence[] = [
      { id: 's1', toolIds: ['toolA', 'toolB'], length: 2, durationMs: 200, success: true, timestamp: Date.now(), sequenceType: 'sequential' },
      { id: 's2', toolIds: ['toolA', 'toolB'], length: 2, durationMs: 300, success: true, timestamp: Date.now(), sequenceType: 'sequential' }
    ]
    const chains = extractChains(seqs, 2)
    expect(chains).toHaveLength(1)
    expect(chains[0].totalOccurrences).toBe(2)
    expect(chains[0].pattern).toBe('toolA → toolB')
    expect(chains[0].avgDurationMs).toBe(250)
  })

  it('should handle multiple chains', () => {
    const seqs: ToolSequence[] = [
      { id: 's1', toolIds: ['toolA', 'toolB'], length: 2, durationMs: 200, success: true, timestamp: Date.now(), sequenceType: 'sequential' },
      { id: 's2', toolIds: ['toolA', 'toolB'], length: 2, durationMs: 200, success: false, timestamp: Date.now(), sequenceType: 'sequential' },
      { id: 's3', toolIds: ['toolB', 'toolC'], length: 2, durationMs: 100, success: true, timestamp: Date.now(), sequenceType: 'sequential' }
    ]
    const chains = extractChains(seqs, 2)
    expect(chains).toHaveLength(2)
    // toolA→toolB should be first (sorted by occurrences desc)
    expect(chains[0].pattern).toBe('toolA → toolB')
    expect(chains[0].totalOccurrences).toBe(2)
  })
})

// ===============================================================================
// analyzeSequences Tests
// ===============================================================================

describe('analyzeSequences', () => {
  it('should return correct counts', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 100 }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 200, endTime: now + 300 })
    ]
    const result = analyzeSequences(calls)
    expect(result.totalCalls).toBe(2)
    expect(result.totalSequences).toBe(1)
    expect(result.uniqueSequences).toBe(1)
  })

  it('should find most common sequence', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 100 }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 200, endTime: now + 300 }),
      // Second sequence (gap)
      createToolCall({ id: 'c', tool: 'toolA', startTime: now + 10000, endTime: now + 10100 }),
      createToolCall({ id: 'd', tool: 'toolB', startTime: now + 10200, endTime: now + 10300 })
    ]
    const result = analyzeSequences(calls)
    expect(result.mostCommonSequence).not.toBeNull()
    expect(result.mostCommonSequence?.pattern).toBe('toolA → toolB')
    expect(result.mostCommonSequence?.totalOccurrences).toBe(2)
  })
})

// ===============================================================================
// findInefficiencies Tests
// ===============================================================================

describe('findInefficiencies', () => {
  it('should detect redundant calls', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 50 }),
      createToolCall({ id: 'b', tool: 'toolA', startTime: now + 60, endTime: now + 110 }),
      createToolCall({ id: 'c', tool: 'toolA', startTime: now + 120, endTime: now + 170 })
    ]
    const inefficiencies = findInefficiencies(calls)
    expect(inefficiencies.some(i => i.type === 'redundant_call')).toBe(true)
  })

  it('should detect parallel candidates', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 50, success: true }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 3000, endTime: now + 3100, success: true })
    ]
    const inefficiencies = findInefficiencies(calls)
    expect(inefficiencies.some(i => i.type === 'parallel_candidates')).toBe(true)
  })

  it('should not flag non-consecutive duplicates', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 100 }),
      createToolCall({ id: 'c', tool: 'toolA', startTime: now + 200 })
    ]
    const inefficiencies = findInefficiencies(calls)
    expect(inefficiencies.some(i => i.type === 'redundant_call')).toBe(false)
  })
})

// ===============================================================================
// findSubstitutions Tests
// ===============================================================================

describe('findSubstitutions', () => {
  it('should return empty for low-frequency tools', () => {
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: Date.now(), endTime: Date.now() + 100 })
    ]
    const registry = new Map<string, { name: string; category: string; avgDuration?: number }>()
    registry.set('toolA', { name: 'Tool A', category: 'search', avgDuration: 2000 })
    const subs = findSubstitutions(calls, registry)
    expect(subs).toHaveLength(0)
  })

  it('should find substitution for high-frequency slow tools', () => {
    const now = Date.now()
    const calls: ToolCall[] = Array.from({ length: 15 }, (_, i) =>
      createToolCall({ id: String(i), tool: 'slowTool', startTime: now + i * 1000, endTime: now + i * 1000 + 2000 })
    )
    const registry = new Map<string, { name: string; category: string; avgDuration?: number }>()
    registry.set('slowTool', { name: 'Slow Tool', category: 'search', avgDuration: 2000 })
    const subs = findSubstitutions(calls, registry)
    expect(subs.length).toBeGreaterThan(0)
    expect(subs[0].originalToolId).toBe('slowTool')
    expect(subs[0].avgTimeSavedMs).toBeGreaterThan(0)
  })
})

// ===============================================================================
// analyzeToolCalls Tests
// ===============================================================================

describe('analyzeToolCalls', () => {
  it('should return complete analysis result', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 100, success: true }),
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 200, endTime: now + 300, success: true })
    ]
    const analysis = analyzeToolCalls(calls)
    expect(analysis).toHaveProperty('sequence')
    expect(analysis).toHaveProperty('efficiency')
    expect(analysis).toHaveProperty('substitutions')
    expect(analysis).toHaveProperty('recommendations')
    expect(Array.isArray(analysis.recommendations)).toBe(true)
  })

  it('should calculate total time lost', () => {
    const now = Date.now()
    // Create redundant calls
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now, endTime: now + 50 }),
      createToolCall({ id: 'b', tool: 'toolA', startTime: now + 60, endTime: now + 110 }),
      createToolCall({ id: 'c', tool: 'toolA', startTime: now + 120, endTime: now + 170 })
    ]
    const analysis = analyzeToolCalls(calls)
    expect(analysis.efficiency.totalTimeLostMs).toBeGreaterThanOrEqual(0)
  })
})

// ===============================================================================
// predictNextTool Tests
// ===============================================================================

describe('predictNextTool', () => {
  it('should return empty for no matching chains', () => {
    const chains: ToolChain[] = []
    const next = predictNextTool('toolA', {}, chains)
    expect(next).toHaveLength(0)
  })

  it('should predict next tool from chain', () => {
    const chains: ToolChain[] = [
      {
        id: 'chain_1',
        toolIds: ['toolA', 'toolB', 'toolC'],
        length: 3,
        avgDurationMs: 100,
        totalOccurrences: 5,
        avgSuccessRate: 0.9,
        pattern: 'toolA → toolB → toolC',
        type: 'sequential'
      }
    ]
    const next = predictNextTool('toolA', {}, chains)
    expect(next).toContain('toolB')
  })

  it('should return top 3 suggestions sorted by weight', () => {
    const chains: ToolChain[] = [
      { id: 'c1', toolIds: ['toolA', 'toolB'], length: 2, avgDurationMs: 100, totalOccurrences: 2, avgSuccessRate: 0.5, pattern: 'A→B', type: 'sequential' },
      { id: 'c2', toolIds: ['toolA', 'toolC'], length: 2, avgDurationMs: 100, totalOccurrences: 5, avgSuccessRate: 0.9, pattern: 'A→C', type: 'sequential' }
    ]
    const next = predictNextTool('toolA', {}, chains)
    expect(next[0]).toBe('toolC')  // Higher weight (5 * 0.9 = 4.5 vs 2 * 0.5 = 1)
    expect(next.length).toBeLessThanOrEqual(3)
  })
})

// ===============================================================================
// formatChain Tests
// ===============================================================================

describe('formatChain', () => {
  it('should format chain string', () => {
    const chain: ToolChain = {
      id: 'chain_1',
      toolIds: ['toolA', 'toolB'],
      length: 2,
      avgDurationMs: 150,
      totalOccurrences: 10,
      avgSuccessRate: 0.85,
      pattern: 'toolA → toolB',
      type: 'sequential'
    }
    const formatted = formatChain(chain)
    expect(formatted).toContain('toolA → toolB')
    expect(formatted).toContain('10x')
    expect(formatted).toContain('85%')
  })
})

// ===============================================================================
// Edge Cases
// ===============================================================================

describe('Edge Cases', () => {
  it('should handle calls with no endTime', () => {
    const now = Date.now()
    const calls: ToolCall[] = [
      createToolCall({ id: 'a', tool: 'toolA', startTime: now }),  // no endTime
      createToolCall({ id: 'b', tool: 'toolB', startTime: now + 100 })  // no endTime
    ]
    const seqs = createSeq(calls, 5000)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].durationMs).toBe(0)
  })

  it('should handle single call', () => {
    const calls = [createToolCall({ id: 'a', tool: 'toolA' })]
    const seqs = createSeq(calls, 5000)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].length).toBe(1)
  })

  it('should handle empty chains array', () => {
    const seqs: ToolSequence[] = []
    const chains = extractChains(seqs)
    expect(chains).toHaveLength(0)
  })
})