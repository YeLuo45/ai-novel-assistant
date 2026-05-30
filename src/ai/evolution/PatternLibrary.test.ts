/**
 * PatternLibrary Tests - V75
 * Tests for PatternLibrary Types + Library
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type PatternSearchQuery,
  type PatternCatalogEntry,
  type PatternMatch,
  // Functions
  PATTERN_CATEGORIES,
  inferPatternCategory,
  parsePatternString,
  formatPatternForDisplay,
  createPatternId,
  matchPatternAgainstContext,
  calculateMatchScore
} from './PatternLibraryTypes'

import {
  PatternLibraryDB,
  patternLibrary,
  persistPatterns,
  searchPatterns,
  findMatchingPatterns,
  getPatternStats,
  getTopPatterns,
  prunePatterns,
  clearPatternLibrary
} from './PatternLibrary'

// ===============================================================================
// PatternLibraryTypes Tests
// ===============================================================================

describe('PatternLibraryTypes', () => {
  describe('PATTERN_CATEGORIES', () => {
    it('should have all category constants', () => {
      expect(PATTERN_CATEGORIES.GENRE_SPECIFIC).toBe('genre-specific')
      expect(PATTERN_CATEGORIES.STAGE_SPECIFIC).toBe('stage-specific')
      expect(PATTERN_CATEGORIES.COMPLEXITY_BASED).toBe('complexity-based')
      expect(PATTERN_CATEGORIES.AGENT_SPECIFIC).toBe('agent-specific')
      expect(PATTERN_CATEGORIES.TEMPORAL).toBe('temporal')
      expect(PATTERN_CATEGORIES.CONTEXTUAL).toBe('contextual')
    })
  })

  describe('inferPatternCategory', () => {
    it('should detect genre-specific patterns', () => {
      expect(inferPatternCategory('genre=fantasy, stage=plotting')).toBe('genre-specific')
    })

    it('should detect stage-specific patterns', () => {
      expect(inferPatternCategory('stage=plotting, complexity>0.5')).toBe('stage-specific')
      expect(inferPatternCategory('writingStage=outline')).toBe('stage-specific')
    })

    it('should detect complexity-based patterns', () => {
      expect(inferPatternCategory('inputComplexity>0.7')).toBe('complexity-based')
      expect(inferPatternCategory('complexity>=0.8')).toBe('complexity-based')
    })

    it('should detect agent-specific patterns', () => {
      expect(inferPatternCategory('agentType=writer')).toBe('agent-specific')
    })

    it('should default to contextual', () => {
      expect(inferPatternCategory('unknown')).toBe('contextual')
    })
  })

  describe('parsePatternString', () => {
    it('should parse key=value pairs', () => {
      const parsed = parsePatternString('genre=fantasy, stage=plotting')
      expect(parsed.genre).toBe('fantasy')
      expect(parsed.stage).toBe('plotting')
    })

    it('should parse comparison operators', () => {
      const parsed = parsePatternString('complexity>0.7')
      expect(parsed.complexity).toBe('>0.7')
    })

    it('should handle empty pattern', () => {
      const parsed = parsePatternString('')
      expect(Object.keys(parsed)).toHaveLength(0)
    })
  })

  describe('formatPatternForDisplay', () => {
    it('should format genre and stage', () => {
      const display = formatPatternForDisplay('genre=fantasy, stage=plotting')
      expect(display).toContain('Genre')
      expect(display).toContain('fantasy')
      expect(display).toContain('Stage')
      expect(display).toContain('plotting')
    })

    it('should use × separator', () => {
      const display = formatPatternForDisplay('genre=scifi, stage=writing')
      expect(display).toContain(' × ')
    })

    it('should fall back to original pattern', () => {
      const display = formatPatternForDisplay('unknown')
      expect(display).toBe('unknown')
    })
  })

  describe('createPatternId', () => {
    it('should create consistent IDs', () => {
      const id1 = createPatternId('tool1', 'genre=fantasy')
      const id2 = createPatternId('tool1', 'genre=fantasy')
      expect(id1).toBe(id2)
    })

    it('should create different IDs for different patterns', () => {
      const id1 = createPatternId('tool1', 'genre=fantasy')
      const id2 = createPatternId('tool1', 'genre=scifi')
      expect(id1).not.toBe(id2)
    })

    it('should start with pattern_ prefix', () => {
      const id = createPatternId('tool1', 'genre=fantasy')
      expect(id).toMatch(/^pattern_tool1_/)
    })
  })

  describe('matchPatternAgainstContext', () => {
    it('should match genre field', () => {
      const result = matchPatternAgainstContext('genre=fantasy', { genre: 'fantasy' })
      expect(result.matches).toBe(true)
      expect(result.matchedFields).toContain('genre')
    })

    it('should not match different genre', () => {
      const result = matchPatternAgainstContext('genre=fantasy', { genre: 'scifi' })
      expect(result.matches).toBe(false)
      expect(result.matchedFields).toHaveLength(0)
    })

    it('should match stage field', () => {
      const result = matchPatternAgainstContext('stage=plotting', { writingStage: 'plotting' })
      expect(result.matches).toBe(true)
      expect(result.matchedFields).toContain('writingStage')
    })

    it('should match complexity comparison', () => {
      const result = matchPatternAgainstContext('complexity>0.7', { complexity: 0.8 })
      expect(result.matches).toBe(true)
      expect(result.matchedFields).toContain('complexity')
    })

    it('should not match complexity below threshold', () => {
      const result = matchPatternAgainstContext('complexity>0.7', { complexity: 0.5 })
      expect(result.matches).toBe(false)
    })

    it('should return false for unknown context key', () => {
      const result = matchPatternAgainstContext('genre=fantasy', {})
      expect(result.matches).toBe(false)
    })
  })

  describe('calculateMatchScore', () => {
    const mockEntry: PatternCatalogEntry = {
      id: 'test',
      toolId: 'tool1',
      toolName: 'Test Tool',
      pattern: 'genre=fantasy, stage=plotting',
      displayPattern: 'Genre: fantasy × Stage: plotting',
      category: 'genre-specific',
      occurrences: 10,
      avgSuccessRate: 0.85,
      avgDurationMs: 500,
      confidence: 0.8,
      lastObserved: Date.now(),
      tags: ['genre', 'writingStage'],
      usageCount: 5,
      createdAt: Date.now()
    }

    it('should return score based on matched fields and confidence', () => {
      const score = calculateMatchScore(mockEntry, { genre: 'fantasy', writingStage: 'plotting' })
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should increase with higher confidence', () => {
      const lowConf = calculateMatchScore({ ...mockEntry, confidence: 0.5 }, { genre: 'fantasy', writingStage: 'plotting' })
      const highConf = calculateMatchScore({ ...mockEntry, confidence: 0.9 }, { genre: 'fantasy', writingStage: 'plotting' })
      expect(highConf).toBeGreaterThan(lowConf)
    })
  })
})

// ===============================================================================
// PatternLibraryDB Tests (requires real IndexedDB - skip in CI/jsdom)
// ===============================================================================

describe.skip('PatternLibraryDB (IndexedDB)', () => {
  let db: PatternLibraryDB

  beforeEach(async () => {
    db = new PatternLibraryDB()
    await db.open()
    await db.patternCatalog.clear()
  })

  it('should be empty initially', async () => {
    const count = await db.patternCatalog.count()
    expect(count).toBe(0)
  })

  it('should add and retrieve catalog entry', async () => {
    await db.patternCatalog.add({
      id: 'test_pattern_1',
      toolId: 'tool1',
      toolName: 'Test Tool',
      pattern: 'genre=fantasy',
      displayPattern: 'Genre: fantasy',
      category: 'genre-specific',
      occurrences: 5,
      avgSuccessRate: 0.9,
      avgDurationMs: 300,
      confidence: 0.85,
      lastObserved: Date.now(),
      tags: ['genre'],
      usageCount: 2,
      createdAt: Date.now()
    })

    const entry = await db.patternCatalog.get('test_pattern_1')
    expect(entry).not.toBeNull()
    expect(entry?.toolId).toBe('tool1')
    expect(entry?.pattern).toBe('genre=fantasy')
  })

  it('should filter by toolId', async () => {
    await db.patternCatalog.bulkAdd([
      { id: 'p1', toolId: 'tool1', toolName: 'T1', pattern: 'g=f', displayPattern: '', category: 'g', occurrences: 1, avgSuccessRate: 0.9, avgDurationMs: 100, confidence: 0.8, lastObserved: Date.now(), tags: [], usageCount: 0, createdAt: Date.now() },
      { id: 'p2', toolId: 'tool2', toolName: 'T2', pattern: 'g=s', displayPattern: '', category: 'g', occurrences: 2, avgSuccessRate: 0.8, avgDurationMs: 200, confidence: 0.7, lastObserved: Date.now(), tags: [], usageCount: 0, createdAt: Date.now() }
    ])

    const results = await db.patternCatalog.where('toolId').equals('tool1').toArray()
    expect(results).toHaveLength(1)
    expect(results[0].toolId).toBe('tool1')
  })
})

// ===============================================================================
// PatternLibrary Functions Tests (Dexie/IndexedDB - skip in jsdom)
// ===============================================================================

describe.skip('PatternLibrary Functions (IndexedDB)', () => {
  beforeEach(async () => {
    await clearPatternLibrary()
  })

  describe('persistPatterns', () => {
    it('should persist patterns to catalog', async () => {
      const patterns = [
        {
          id: 'sp_1',
          toolId: 'tool1',
          pattern: 'genre=fantasy',
          occurrences: 10,
          avgSuccessRate: 0.85,
          avgDurationMs: 500,
          lastObserved: Date.now(),
          confidence: 0.9
        }
      ]

      const count = await persistPatterns(patterns, 'Fantasy Tool')
      expect(count).toBe(1)

      const results = await searchPatterns({})
      expect(results).toHaveLength(1)
      expect(results[0].toolId).toBe('tool1')
      expect(results[0].pattern).toBe('genre=fantasy')
    })

    it('should overwrite existing pattern', async () => {
      const patterns = [{
        id: 'sp_1',
        toolId: 'tool1',
        pattern: 'genre=fantasy',
        occurrences: 5,
        avgSuccessRate: 0.8,
        avgDurationMs: 300,
        lastObserved: Date.now(),
        confidence: 0.7
      }]

      await persistPatterns(patterns, 'Tool')
      
      // Persist again with more occurrences
      patterns[0].occurrences = 15
      await persistPatterns(patterns, 'Tool')

      const results = await searchPatterns({})
      expect(results).toHaveLength(1)
      expect(results[0].occurrences).toBe(15)
    })
  })

  describe('searchPatterns', () => {
    beforeEach(async () => {
      const patterns = [
        { id: 'sp_1', toolId: 'tool1', pattern: 'genre=fantasy', occurrences: 10, avgSuccessRate: 0.9, avgDurationMs: 500, lastObserved: Date.now(), confidence: 0.9 },
        { id: 'sp_2', toolId: 'tool1', pattern: 'genre=scifi', occurrences: 5, avgSuccessRate: 0.8, avgDurationMs: 300, lastObserved: Date.now(), confidence: 0.7 },
        { id: 'sp_3', toolId: 'tool2', pattern: 'stage=plotting', occurrences: 8, avgSuccessRate: 0.85, avgDurationMs: 400, lastObserved: Date.now(), confidence: 0.8 }
      ]
      await persistPatterns(patterns, 'Test Tool')
    })

    it('should return all patterns with no query', async () => {
      const results = await searchPatterns({})
      expect(results.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter by toolId', async () => {
      const results = await searchPatterns({ toolId: 'tool1' })
      expect(results.every(r => r.toolId === 'tool1')).toBe(true)
    })

    it('should filter by minConfidence', async () => {
      const results = await searchPatterns({ minConfidence: 0.85 })
      expect(results.every(r => r.confidence >= 0.85)).toBe(true)
    })

    it('should filter by minOccurrences', async () => {
      const results = await searchPatterns({ minOccurrences: 8 })
      expect(results.every(r => r.occurrences >= 8)).toBe(true)
    })

    it('should filter by age', async () => {
      const results = await searchPatterns({ ageDays: 0 })
      expect(results.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('findMatchingPatterns', () => {
    beforeEach(async () => {
      const patterns = [
        { id: 'sp_1', toolId: 'tool1', pattern: 'genre=fantasy', occurrences: 10, avgSuccessRate: 0.9, avgDurationMs: 500, lastObserved: Date.now(), confidence: 0.9 },
        { id: 'sp_2', toolId: 'tool2', pattern: 'genre=scifi', occurrences: 5, avgSuccessRate: 0.8, avgDurationMs: 300, lastObserved: Date.now(), confidence: 0.7 }
      ]
      await persistPatterns(patterns, 'Test Tool')
    })

    it('should find matching patterns for context', async () => {
      const matches = await findMatchingPatterns({ genre: 'fantasy' })
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0].entry.pattern).toContain('fantasy')
    })

    it('should sort by match score', async () => {
      const matches = await findMatchingPatterns({ genre: 'fantasy' })
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore)
      }
    })

    it('should respect maxResults', async () => {
      const matches = await findMatchingPatterns({ genre: 'fantasy' }, { maxResults: 2 })
      expect(matches.length).toBeLessThanOrEqual(2)
    })

    it('should respect minScore', async () => {
      const matches = await findMatchingPatterns({ genre: 'fantasy' }, { minScore: 0.9 })
      for (const m of matches) {
        expect(m.matchScore).toBeGreaterThanOrEqual(0.9)
      }
    })
  })

  describe('getPatternStats', () => {
    it('should return empty stats for empty library', async () => {
      const stats = await getPatternStats()
      expect(stats.totalPatterns).toBe(0)
      expect(stats.avgConfidence).toBe(0)
    })

    it('should calculate correct stats', async () => {
      const patterns = [
        { id: 'sp_1', toolId: 'tool1', pattern: 'genre=fantasy', occurrences: 10, avgSuccessRate: 0.9, avgDurationMs: 500, lastObserved: Date.now(), confidence: 0.9 },
        { id: 'sp_2', toolId: 'tool1', pattern: 'genre=scifi', occurrences: 5, avgSuccessRate: 0.8, avgDurationMs: 300, lastObserved: Date.now(), confidence: 0.7 }
      ]
      await persistPatterns(patterns, 'Test Tool')

      const stats = await getPatternStats()
      expect(stats.totalPatterns).toBe(2)
      expect(stats.avgConfidence).toBeCloseTo(0.8, 1)
    })
  })

  describe('prunePatterns', () => {
    it('should prune old unused patterns', async () => {
      // Add old pattern
      const oldPatterns = [{
        id: 'sp_old',
        toolId: 'tool1',
        pattern: 'genre=old',
        occurrences: 2,
        avgSuccessRate: 0.5,
        avgDurationMs: 100,
        lastObserved: Date.now() - 35 * 24 * 60 * 60 * 1000,
        confidence: 0.3
      }]
      await persistPatterns(oldPatterns, 'Old Tool')

      const pruned = await prunePatterns(30)
      expect(pruned).toBe(1)

      const results = await searchPatterns({})
      expect(results.find(r => r.pattern.includes('old'))).toBeUndefined()
    })

    it('should not prune recently used patterns', async () => {
      const recentPatterns = [{
        id: 'sp_recent',
        toolId: 'tool1',
        pattern: 'genre=recent',
        occurrences: 10,
        avgSuccessRate: 0.9,
        avgDurationMs: 500,
        lastObserved: Date.now() - 35 * 24 * 60 * 60 * 1000,
        confidence: 0.8
      }]
      await persistPatterns(recentPatterns, 'Recent Tool')

      const pruned = await prunePatterns(30)
      expect(pruned).toBe(0)
    })
  })
})