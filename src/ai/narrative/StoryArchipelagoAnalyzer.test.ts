/**
 * StoryArchipelagoAnalyzer Tests - V86
 * Tests for Story Universe Interconnected Subplot Map
 */

import { describe, it, expect } from 'vitest'
import {
  createSubplotIsland,
  DEFAULT_ARCHIPELAGO_CONFIG,
  calculateComplexity,
  detectSeepageEffects,
  findOrphanedIslands,
  calculateIslandHealth,
  analyzeArchipelago,
  calculateSubplotContributions,
  formatArchipelagoSummary,
  type SubplotIsland,
  type ArchipelagoMap,
  type Bridge
} from './StoryArchipelagoAnalyzer'

// =============================================================================
// Helper Functions
// =============================================================================

function makeIsland(
  id: string,
  type: SubplotIsland['type'] = 'sub',
  connections: string[] = [],
  overrides: Partial<SubplotIsland> = {}
): SubplotIsland {
  return {
    id,
    name: `Subplot ${id}`,
    type,
    importance: 0.7,
    chapterRange: [1, 10],
    primaryCharacters: [],
    themes: [],
    tensionLevel: 0.5,
    resolutionLevel: 0.3,
    connections,
    bridges: [],
    ...overrides
  }
}

function makeMap(islands: SubplotIsland[], bridges: Bridge[] = []): ArchipelagoMap {
  return {
    islands,
    bridges,
    totalChapters: 50,
    mainPlotId: 'main',
    orphanedIslands: [],
    parallelSubplots: []
  }
}

// =============================================================================
// createSubplotIsland Tests
// =============================================================================

describe('createSubplotIsland', () => {
  it('should create main plot island with highest importance', () => {
    const island = createSubplotIsland('main', 'Main Plot', 'main', [1, 50])
    expect(island.importance).toBe(1.0)
    expect(island.type).toBe('main')
  })

  it('should create sub plot island with sub importance', () => {
    const island = createSubplotIsland('sub1', 'Sub Plot', 'sub', [5, 20])
    expect(island.importance).toBe(0.7)
  })

  it('should set chapter range', () => {
    const island = createSubplotIsland('sub1', 'Sub Plot', 'sub', [5, 20])
    expect(island.chapterRange).toEqual([5, 20])
  })

  it('should add primary characters', () => {
    const chars = ['Alice', 'Bob']
    const island = createSubplotIsland('sub1', 'Sub Plot', 'sub', [1, 10], chars)
    expect(island.primaryCharacters).toEqual(chars)
  })
})

// =============================================================================
// calculateComplexity Tests
// =============================================================================

describe('calculateComplexity', () => {
  it('should return low score for archipelago with one island', () => {
    const islands = [makeIsland('main', 'main', [])]
    const map = makeMap(islands)
    const complexity = calculateComplexity(map)
    // With 1 island and 0 bridges, baseComplexity = 5
    expect(complexity).toBeGreaterThanOrEqual(0)
    expect(complexity).toBeLessThan(30)
  })

  it('should increase with more islands', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('sub1', 'sub', []),
      makeIsland('sub2', 'sub', [])
    ]
    const map = makeMap(islands)
    expect(calculateComplexity(map)).toBeGreaterThan(0)
  })

  it('should increase with more bridges', () => {
    const islands = [makeIsland('main', 'main', ['sub1'])]
    const bridges: Bridge[] = [{
      type: 'character',
      targetIslandId: 'sub1',
      sharedElements: ['Alice'],
      strength: 0.5,
      description: 'Shared character',
      bidirectional: true
    }]
    const map = makeMap(islands, bridges)
    expect(calculateComplexity(map)).toBeGreaterThan(0)
  })
})

// =============================================================================
// findOrphanedIslands Tests
// =============================================================================

describe('findOrphanedIslands', () => {
  it('should find main plot island connected', () => {
    const islands = [makeIsland('main', 'main', ['sub1'])]
    const map = makeMap(islands)
    expect(findOrphanedIslands(map)).toEqual([])
  })

  it('should find orphaned subplot not connected to main', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('orphan', 'sub', [])
    ]
    const map = makeMap(islands)
    const orphaned = findOrphanedIslands(map)
    expect(orphaned).toContain('orphan')
  })

  it('should find all disconnected islands', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('orphan1', 'sub', []),
      makeIsland('orphan2', 'sub', [])
    ]
    const map = makeMap(islands)
    const orphaned = findOrphanedIslands(map)
    expect(orphaned).toContain('orphan1')
    expect(orphaned).toContain('orphan2')
  })
})

// =============================================================================
// calculateIslandHealth Tests
// =============================================================================

describe('calculateIslandHealth', () => {
  it('should return healthy score for balanced island', () => {
    const island = makeIsland('sub1', 'sub', ['main'])
    const health = calculateIslandHealth(island, DEFAULT_ARCHIPELAGO_CONFIG)
    expect(health.healthScore).toBeGreaterThan(50)
    expect(health.issues).toEqual([])
  })

  it('should flag high tension', () => {
    const island = makeIsland('sub1', 'sub', ['main'], { tensionLevel: 0.95 })
    const health = calculateIslandHealth(island, DEFAULT_ARCHIPELAGO_CONFIG)
    expect(health.issues.some(i => i.includes('High tension'))).toBe(true)
  })

  it('should flag over-connected island', () => {
    const connections = Array.from({ length: 10 }, (_, i) => `sub${i}`)
    const island = makeIsland('sub1', 'sub', connections)
    const health = calculateIslandHealth(island, DEFAULT_ARCHIPELAGO_CONFIG)
    expect(health.issues.some(i => i.includes('Too many connections'))).toBe(true)
  })

  it('should flag under-connected subplot', () => {
    const island = makeIsland('sub1', 'sub', [])
    const health = calculateIslandHealth(island, DEFAULT_ARCHIPELAGO_CONFIG)
    expect(health.issues.some(i => i.includes('Few connections'))).toBe(true)
  })

  it('should not flag under-connected main plot', () => {
    const island = makeIsland('main', 'main', [])
    const health = calculateIslandHealth(island, DEFAULT_ARCHIPELAGO_CONFIG)
    // Main plot is allowed to have no connections
    expect(health.issues.filter(i => i.includes('Few connections'))).toEqual([])
  })
})

// =============================================================================
// detectSeepageEffects Tests
// =============================================================================

describe('detectSeepageEffects', () => {
  it('should return empty for no bridges', () => {
    const map = makeMap([])
    expect(detectSeepageEffects(map)).toEqual([])
  })

  it('should detect event bridge tension ripple', () => {
    const bridges: Bridge[] = [{
      type: 'event',
      targetIslandId: 'sub1',
      sharedElements: ['Battle'],
      strength: 0.8,
      description: 'Major battle affects subplot',
      bidirectional: true
    }]
    const map = makeMap([], bridges)
    const effects = detectSeepageEffects(map)
    expect(effects.some(e => e.effectType === 'tension_ripple')).toBe(true)
  })

  it('should detect revelation bridge leak', () => {
    const bridges: Bridge[] = [{
      type: 'revelation',
      targetIslandId: 'sub1',
      sharedElements: ['Secret'],
      strength: 0.6,
      description: 'Revelation crosses subplots',
      bidirectional: false
    }]
    const map = makeMap([], bridges)
    const effects = detectSeepageEffects(map)
    expect(effects.some(e => e.effectType === 'revelation_leak')).toBe(true)
  })

  it('should not trigger weak bridges', () => {
    const bridges: Bridge[] = [{
      type: 'event',
      targetIslandId: 'sub1',
      sharedElements: ['Minor'],
      strength: 0.3,  // Below threshold
      description: 'Minor event',
      bidirectional: false
    }]
    const map = makeMap([], bridges)
    const effects = detectSeepageEffects(map)
    expect(effects).toEqual([])
  })
})

// =============================================================================
// analyzeArchipelago Tests
// =============================================================================

describe('analyzeArchipelago', () => {
  it('should return analysis object', () => {
    const islands = [makeIsland('main', 'main', [])]
    const map = makeMap(islands)
    const analysis = analyzeArchipelago(map)
    expect(analysis).toHaveProperty('complexityScore')
    expect(analysis).toHaveProperty('recommendations')
    expect(analysis).toHaveProperty('seepageEffects')
  })

  it('should flag orphaned islands in recommendations', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('orphan', 'sub', [])
    ]
    const map = makeMap(islands)
    const analysis = analyzeArchipelago(map)
    expect(analysis.recommendations.some(r => r.includes('disconnected'))).toBe(true)
  })

  it('should include parallel subplots', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('sub1', 'sub', [], { chapterRange: [1, 20] }),
      makeIsland('sub2', 'sub', [], { chapterRange: [1, 20] })
    ]
    const map = makeMap(islands)
    const analysis = analyzeArchipelago(map)
    expect(analysis.subplotDensity).toBeGreaterThan(0)
  })
})

// =============================================================================
// calculateSubplotContributions Tests
// =============================================================================

describe('calculateSubplotContributions', () => {
  it('should return empty for main plot only', () => {
    const islands = [makeIsland('main', 'main', [])]
    const map = makeMap(islands)
    const contributions = calculateSubplotContributions(map)
    expect(contributions).toEqual([])
  })

  it('should rank by contribution', () => {
    const islands = [
      makeIsland('main', 'main', ['sub1', 'sub2']),
      makeIsland('sub1', 'sub', ['main']),
      makeIsland('sub2', 'sub', [])
    ]
    const map = makeMap(islands)
    const contributions = calculateSubplotContributions(map)
    expect(contributions.length).toBe(2)
    // sub1 connected to main should rank higher
    const sub1 = contributions.find(c => c.islandId === 'sub1')
    const sub2 = contributions.find(c => c.islandId === 'sub2')
    expect(sub1!.contribution).toBeGreaterThanOrEqual(sub2!.contribution)
  })

  it('should calculate health score', () => {
    const islands = [
      makeIsland('main', 'main', ['sub1']),
      makeIsland('sub1', 'sub', ['main'], { importance: 0.9, resolutionLevel: 0.8 })
    ]
    const map = makeMap(islands)
    const contributions = calculateSubplotContributions(map)
    expect(contributions[0].healthScore).toBeGreaterThan(0)
  })
})

// =============================================================================
// formatArchipelagoSummary Tests
// =============================================================================

describe('formatArchipelagoSummary', () => {
  it('should format complexity and islands', () => {
    const islands = [makeIsland('main', 'main', [])]
    const map = makeMap(islands)
    const analysis = analyzeArchipelago(map)
    const formatted = formatArchipelagoSummary(analysis)
    expect(formatted).toContain('Complexity:')
    expect(formatted).toContain('Islands:')
    expect(formatted).toContain('Bridges:')
  })

  it('should include recommendations', () => {
    const islands = [
      makeIsland('main', 'main', []),
      makeIsland('orphan', 'sub', [])
    ]
    const map = makeMap(islands)
    const analysis = analyzeArchipelago(map)
    const formatted = formatArchipelagoSummary(analysis)
    expect(formatted).toContain('Recommendations')
  })
})
