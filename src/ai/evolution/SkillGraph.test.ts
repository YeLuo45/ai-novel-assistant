/**
 * SkillGraph Tests - V76
 * Tests for Skill Relationship Graph and Evolution Tracking
 */

import { describe, it, expect } from 'vitest'
import type { SkillNode, SkillGap, SkillHealthScore, EvolutionRecommendation } from './SkillGraph'
import {
  calculateSkillHealth,
  detectSkillGaps,
  generateEvolutionRecommendations,
  createSkillNodeId,
  sortNodesByHealth
} from './SkillGraph'

// ===============================================================================
// Helper
// ===============================================================================

function createMockSkillNode(overrides: Partial<SkillNode> = {}): SkillNode {
  const now = Date.now()
  return {
    id: 'test_node',
    skillId: 'skill_test',
    name: 'Test Skill',
    description: 'A test skill',
    level: 'stable',
    category: 'writing',
    tags: ['genre', 'fantasy'],
    quality: 0.8,
    vitality: 0.7,
    relationships: [],
    activationCount: 50,
    successCount: 45,
    failureCount: 5,
    avgQualityScore: 0.85,
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    lastActivatedAt: now - 1 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: now,
    metadata: {},
    ...overrides
  }
}

// ===============================================================================
// calculateSkillHealth Tests
// ===============================================================================

describe('calculateSkillHealth', () => {
  it('should return scores between 0 and 1', () => {
    const node = createMockSkillNode()
    const health = calculateSkillHealth(node)
    
    expect(health.overallScore).toBeGreaterThanOrEqual(0)
    expect(health.overallScore).toBeLessThanOrEqual(1)
    expect(health.qualityScore).toBeGreaterThanOrEqual(0)
    expect(health.vitalityScore).toBeGreaterThanOrEqual(0)
    expect(health.relationshipScore).toBeGreaterThanOrEqual(0)
  })

  it('should contribute quality 40% of overall', () => {
    const node = createMockSkillNode({ quality: 1.0, vitality: 0, relationships: [] })
    const health = calculateSkillHealth(node)
    // quality=1.0*0.4 + vitality=0*0.3 + relationship=0.2*0.3 = 0.4 + 0 + 0.06 = 0.46
    expect(health.overallScore).toBeCloseTo(0.46, 1)
  })

  it('should contribute vitality 30% of overall', () => {
    const node = createMockSkillNode({ quality: 0, vitality: 1.0, relationships: [] })
    const health = calculateSkillHealth(node)
    // quality=0*0.4 + vitality=1.0*0.3 + relationship=0.2*0.3 = 0 + 0.3 + 0.06 = 0.36
    expect(health.overallScore).toBeCloseTo(0.36, 1)
  })

  it('should add relationship bonus', () => {
    const node = createMockSkillNode({
      quality: 0,
      vitality: 0,
      relationships: [{ id: 'r1', type: 'complements', targetSkillId: 's2', strength: 0.8, bidirectional: false }]
    })
    const health = calculateSkillHealth(node)
    expect(health.relationshipScore).toBeGreaterThan(0.5)
  })

  it('should detect improving trend for recent active skills', () => {
    const node = createMockSkillNode({ activationCount: 10, lastActivatedAt: Date.now() - 1000 })
    const health = calculateSkillHealth(node)
    expect(health.trend).toBe('improving')
  })

  it('should detect declining trend for stale high-usage skills', () => {
    const node = createMockSkillNode({ activationCount: 15, lastActivatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000 })
    const health = calculateSkillHealth(node)
    expect(health.trend).toBe('declining')
  })

  it('should flag deprecated level', () => {
    const node = createMockSkillNode({ level: 'deprecated' })
    const health = calculateSkillHealth(node)
    expect(health.alerts).toContain('Skill is deprecated')
  })

  it('should flag low quality', () => {
    const node = createMockSkillNode({ quality: 0.3 })
    const health = calculateSkillHealth(node)
    expect(health.alerts).toContain('Low quality score')
  })

  it('should flag high failure rate', () => {
    const node = createMockSkillNode({ successCount: 5, failureCount: 20 })
    const health = calculateSkillHealth(node)
    expect(health.alerts).toContain('High failure rate')
  })

  it('should recommend promotion when developing skill is ready', () => {
    const node = createMockSkillNode({ level: 'developing', quality: 0.9, activationCount: 25 })
    const health = calculateSkillHealth(node)
    expect(health.recommendations.some((r: string) => r.toLowerCase().includes('promotion'))).toBe(true)
  })

  it('should recommend deprecation for low quality with many activations', () => {
    const node = createMockSkillNode({ quality: 0.2, activationCount: 40 })
    const health = calculateSkillHealth(node)
    expect(health.alerts.some((a: string) => a.toLowerCase().includes('quality'))).toBe(true)
  })
})

// ===============================================================================
// detectSkillGaps Tests
// ===============================================================================

describe('detectSkillGaps', () => {
  it('should return empty array for balanced skill set', () => {
    // Each category has 2+ skills, so no weak_category gaps
    const nodes = [
      createMockSkillNode({ skillId: 's1', category: 'writing', level: 'stable' }),
      createMockSkillNode({ skillId: 's2', category: 'writing', level: 'stable' }),
      createMockSkillNode({ skillId: 's3', category: 'worldbuilding', level: 'stable' }),
      createMockSkillNode({ skillId: 's4', category: 'worldbuilding', level: 'stable' }),
      createMockSkillNode({ skillId: 's5', category: 'character', level: 'stable' }),
      createMockSkillNode({ skillId: 's6', category: 'character', level: 'stable' })
    ]
    const gaps = detectSkillGaps(nodes)
    expect(gaps.filter(g => g.gapType === 'weak_category')).toHaveLength(0)
  })

  it('should detect weak category with only 1 skill', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', category: 'writing' })
    ]
    const gaps = detectSkillGaps(nodes)
    const weakCategory = gaps.find(g => g.gapType === 'weak_category')
    expect(weakCategory).toBeDefined()
    expect(weakCategory?.severity).toBe('medium')
  })

  it('should detect missing prerequisite', () => {
    const nodes = [
      createMockSkillNode({
        skillId: 's1',
        relationships: [{ id: 'r1', type: 'depends_on', targetSkillId: 'missing_skill', strength: 0.9, bidirectional: false }]
      })
    ]
    const gaps = detectSkillGaps(nodes)
    const missingPre = gaps.find(g => g.gapType === 'missing_prerequisite')
    expect(missingPre).toBeDefined()
    expect(missingPre?.suggestedSkillId).toBe('missing_skill')
  })

  it('should flag deprecated skill still in use', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'deprecated', activationCount: 15 })
    ]
    const gaps = detectSkillGaps(nodes)
    const deprecatedGap = gaps.find(g => g.gapType === 'deprecated_skill')
    expect(deprecatedGap).toBeDefined()
    expect(deprecatedGap?.severity).toBe('high')
  })

  it('should not flag deprecated skill with low usage', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'deprecated', activationCount: 5 })
    ]
    const gaps = detectSkillGaps(nodes)
    expect(gaps.find(g => g.gapType === 'deprecated_skill')).toBeUndefined()
  })
})

// ===============================================================================
// generateEvolutionRecommendations Tests
// ===============================================================================

describe('generateEvolutionRecommendations', () => {
  it('should recommend promotion for developing skill with high quality', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'developing', quality: 0.9, activationCount: 25 })
    ]
    const gaps: SkillGap[] = []
    const recs = generateEvolutionRecommendations(nodes, gaps)
    const promoteRec = recs.find(r => r.type === 'promote')
    expect(promoteRec).toBeDefined()
    expect(promoteRec?.priority).toBe('medium')
  })

  it('should recommend demotion for declining mastered skill', () => {
    const nodes = [
      createMockSkillNode({
        skillId: 's1',
        level: 'mastered',
        quality: 0.3,
        vitality: 0.2,
        relationships: [{ id: 'r1', type: 'depends_on', targetSkillId: 's2', strength: 0.5, bidirectional: false }],
        activationCount: 50,
        lastActivatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000
      })
    ]
    const gaps: SkillGap[] = []
    const recs = generateEvolutionRecommendations(nodes, gaps)
    const demoteRec = recs.find(r => r.type === 'demote')
    expect(demoteRec).toBeDefined()
  })

  it('should recommend deprecation for low quality with many activations', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'stable', quality: 0.2, activationCount: 50 })
    ]
    const gaps: SkillGap[] = []
    const recs = generateEvolutionRecommendations(nodes, gaps)
    const deprecateRec = recs.find(r => r.type === 'deprecate')
    expect(deprecateRec).toBeDefined()
    expect(deprecateRec?.priority).toBe('high')
    expect(deprecateRec?.confidence).toBeGreaterThan(0.8)
  })

  it('should recommend consolidation for overpopulated category', () => {
    const nodes = Array.from({ length: 7 }, (_, i) =>
      createMockSkillNode({ skillId: `s${i}`, category: 'writing', level: 'stable' })
    )
    const gaps: SkillGap[] = []
    const recs = generateEvolutionRecommendations(nodes, gaps)
    const consolidateRec = recs.find(r => r.type === 'consolidate')
    expect(consolidateRec).toBeDefined()
    expect(consolidateRec?.priority).toBe('medium')
  })

  it('should create recommendation for critical gap', () => {
    const nodes: SkillNode[] = []
    const gaps: SkillGap[] = [{
      id: 'gap1',
      category: 'character',
      gapType: 'missing_prerequisite',
      description: 'Missing character motivation skill',
      severity: 'critical',
      suggestedSkillId: 'char_motivation',
      suggestedSkillName: 'Character Motivation',
      affectedTasks: ['character-development']
    }]
    const recs = generateEvolutionRecommendations(nodes, gaps)
    const createRec = recs.find(r => r.type === 'create' && r.targetSkillId === 'char_motivation')
    expect(createRec).toBeDefined()
    expect(createRec?.priority).toBe('high')
  })

  it('should not recommend deprecated skills for deprecation', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'deprecated', quality: 0.1, activationCount: 100 })
    ]
    const gaps: SkillGap[] = []
    const recs = generateEvolutionRecommendations(nodes, gaps)
    expect(recs.find(r => r.type === 'deprecate' && r.targetSkillId === 's1')).toBeUndefined()
  })
})

// ===============================================================================
// createSkillNodeId Tests
// ===============================================================================

describe('createSkillNodeId', () => {
  it('should prefix with skill_node_', () => {
    expect(createSkillNodeId('test_skill')).toBe('skill_node_test_skill')
  })

  it('should be consistent for same input', () => {
    expect(createSkillNodeId('abc')).toBe(createSkillNodeId('abc'))
  })
})

// ===============================================================================
// sortNodesByHealth Tests
// ===============================================================================

describe('sortNodesByHealth', () => {
  it('should sort by overall score descending', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', quality: 0.3, vitality: 0.3, relationships: [] }),
      createMockSkillNode({ skillId: 's2', quality: 0.9, vitality: 0.9, relationships: [] }),
      createMockSkillNode({ skillId: 's3', quality: 0.6, vitality: 0.6, relationships: [] })
    ]
    const sorted = sortNodesByHealth(nodes)
    expect(sorted[0].skillId).toBe('s2')
    expect(sorted[1].skillId).toBe('s3')
    expect(sorted[2].skillId).toBe('s1')
  })

  it('should not mutate original array', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', quality: 0.5, vitality: 0.5, relationships: [] }),
      createMockSkillNode({ skillId: 's2', quality: 0.9, vitality: 0.9, relationships: [] })
    ]
    const sorted = sortNodesByHealth(nodes)
    expect(sorted).not.toBe(nodes)
    expect(nodes[0].skillId).toBe('s1')
  })
})

// ===============================================================================
// SkillHealthScore Structure Tests
// ===============================================================================

describe('SkillHealthScore', () => {
  it('should have all required fields', () => {
    const node = createMockSkillNode()
    const health = calculateSkillHealth(node)
    
    expect(health).toHaveProperty('skillId')
    expect(health).toHaveProperty('overallScore')
    expect(health).toHaveProperty('qualityScore')
    expect(health).toHaveProperty('vitalityScore')
    expect(health).toHaveProperty('relationshipScore')
    expect(health).toHaveProperty('trend')
    expect(health).toHaveProperty('alerts')
    expect(health).toHaveProperty('recommendations')
    expect(Array.isArray(health.alerts)).toBe(true)
    expect(Array.isArray(health.recommendations)).toBe(true)
  })

  it('should have valid trend values', () => {
    const node = createMockSkillNode()
    const health = calculateSkillHealth(node)
    expect(['improving', 'stable', 'declining']).toContain(health.trend)
  })
})

// ===============================================================================
// EvolutionRecommendation Structure Tests
// ===============================================================================

describe('EvolutionRecommendation', () => {
  it('should have valid type values', () => {
    const nodes = [createMockSkillNode({ skillId: 's1', level: 'developing', quality: 0.95, activationCount: 30 })]
    const recs = generateEvolutionRecommendations(nodes, [])
    
    for (const rec of recs) {
      expect(['promote', 'demote', 'deprecate', 'consolidate', 'split', 'create']).toContain(rec.type)
    }
  })

  it('should have valid priority values', () => {
    const nodes = [createMockSkillNode({ skillId: 's1', level: 'deprecated', quality: 0.2, activationCount: 100 })]
    const recs = generateEvolutionRecommendations(nodes, [])
    
    for (const rec of recs) {
      expect(['low', 'medium', 'high']).toContain(rec.priority)
    }
  })

  it('should have confidence between 0 and 1', () => {
    const nodes = [
      createMockSkillNode({ skillId: 's1', level: 'developing', quality: 0.9, activationCount: 30 }),
      createMockSkillNode({ skillId: 's2', level: 'deprecated', quality: 0.1, activationCount: 100 })
    ]
    const recs = generateEvolutionRecommendations(nodes, [])
    
    for (const rec of recs) {
      expect(rec.confidence).toBeGreaterThanOrEqual(0)
      expect(rec.confidence).toBeLessThanOrEqual(1)
    }
  })
})