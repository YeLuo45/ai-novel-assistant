/**
 * SkillGraph Types - V76
 * Skill Relationship Graph and Evolution Tracking
 * 
 * Tracks skills as nodes with relationships (depends_on, complements, competes_with)
 * Enables skill health scoring, gap detection, and evolution recommendations
 */

import type { SkillLevel } from '../evolution/SelfEvolutionTypes'

export type SkillRelationshipType = 'depends_on' | 'complements' | 'competes_with' | 'evolved_from' | 'variant_of'

export interface SkillNode {
  id: string
  skillId: string
  name: string
  description: string
  level: SkillLevel
  category: string  // e.g., 'writing', 'worldbuilding', 'character', 'plot', 'editing'
  tags: string[]
  quality: number  // 0-1, quality score based on successRate and usage
  vitality: number  // 0-1, how actively being used
  relationships: SkillRelationship[]
  activationCount: number
  successCount: number
  failureCount: number
  avgQualityScore: number
  createdAt: number
  lastActivatedAt: number
  lastUpdatedAt: number
  deprecatedAt?: number
  metadata: Record<string, unknown>
}

export interface SkillRelationship {
  id: string
  type: SkillRelationshipType
  targetSkillId: string
  strength: number  // 0-1
  bidirectional: boolean
  metadata?: Record<string, unknown>
}

export interface SkillGap {
  id: string
  category: string
  gapType: 'missing_prerequisite' | 'weak_category' | 'missing_complement' | 'deprecated_skill'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedSkillId?: string
  suggestedSkillName?: string
  affectedTasks: string[]
}

export interface SkillHealthScore {
  skillId: string
  overallScore: number  // 0-1
  qualityScore: number
  vitalityScore: number
  relationshipScore: number
  trend: 'improving' | 'stable' | 'declining'
  alerts: string[]
  recommendations: string[]
}

export interface EvolutionRecommendation {
  id: string
  type: 'promote' | 'demote' | 'deprecate' | 'consolidate' | 'split' | 'create'
  targetSkillId: string
  reason: string
  expectedImpact: string
  confidence: number  // 0-1
  priority: 'low' | 'medium' | 'high'
  createdAt: number
}

// Graph computation helpers

export function calculateSkillHealth(node: SkillNode): SkillHealthScore {
  const qualityScore = node.quality
  const vitalityScore = node.vitality
  
  // Relationship score: higher if has complementary relationships
  const relationshipScore = node.relationships.length > 0
    ? Math.min(0.9, 0.5 + node.relationships.length * 0.1)
    : 0.2

  const overallScore = qualityScore * 0.4 + vitalityScore * 0.3 + relationshipScore * 0.3

  // Determine trend based on activation count and recency
  const now = Date.now()
  const daysSinceActivation = (now - node.lastActivatedAt) / (24 * 60 * 60 * 1000)
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (daysSinceActivation < 1 && node.activationCount > 5) trend = 'improving'
  else if (daysSinceActivation > 7 && node.activationCount > 10) trend = 'declining'

  const alerts: string[] = []
  if (node.level === 'deprecated') alerts.push('Skill is deprecated')
  if (node.quality < 0.5) alerts.push('Low quality score')
  if (node.vitality < 0.3) alerts.push('Low usage vitality')
  if (node.failureCount > node.successCount * 2) alerts.push('High failure rate')

  const recommendations: string[] = []
  if (node.level === 'developing' && node.quality > 0.8) recommendations.push('Ready for promotion to stable')
  if (node.relationships.length === 0) recommendations.push('Add complementary skill relationships')
  if (node.vitality < 0.5) recommendations.push('Increase usage or deprecate')
  if (node.quality < 0.6) recommendations.push('Review and improve skill rules')

  return {
    skillId: node.skillId,
    overallScore,
    qualityScore,
    vitalityScore,
    relationshipScore,
    trend,
    alerts,
    recommendations
  }
}

export function detectSkillGaps(nodes: SkillNode[]): SkillGap[] {
  const gaps: SkillGap[] = []
  const categoryCount = new Map<string, number>()
  const nodeMap = new Map<string, SkillNode>()

  for (const node of nodes) {
    nodeMap.set(node.skillId, node)
    categoryCount.set(node.category, (categoryCount.get(node.category) || 0) + 1)
  }

  // Check for weak categories
  for (const [category, count] of Array.from(categoryCount.entries())) {
    if (count < 2) {
      gaps.push({
        id: `gap_weak_${category}`,
        category,
        gapType: 'weak_category',
        description: `Category '${category}' has only ${count} skill(s)`,
        severity: count === 0 ? 'critical' : 'medium',
        affectedTasks: []
      })
    }
  }

  // Check for missing prerequisites (depends_on not met)
  for (const node of nodes) {
    for (const rel of node.relationships) {
      if (rel.type === 'depends_on' && !nodeMap.has(rel.targetSkillId)) {
        gaps.push({
          id: `gap_missing_${node.skillId}_${rel.targetSkillId}`,
          category: node.category,
          gapType: 'missing_prerequisite',
          description: `Skill '${node.name}' depends on '${rel.targetSkillId}' which is missing`,
          severity: 'high',
          suggestedSkillId: rel.targetSkillId,
          affectedTasks: []
        })
      }
    }
  }

  // Check for deprecated skills still in use
  for (const node of nodes) {
    if (node.level === 'deprecated' && node.activationCount > 10) {
      gaps.push({
        id: `gap_deprecated_${node.skillId}`,
        category: node.category,
        gapType: 'deprecated_skill',
        description: `Deprecated skill '${node.name}' still being used ${node.activationCount} times`,
        severity: 'high',
        affectedTasks: []
      })
    }
  }

  return gaps
}

export function generateEvolutionRecommendations(
  nodes: SkillNode[],
  gaps: SkillGap[]
): EvolutionRecommendation[] {
  const recommendations: EvolutionRecommendation[] = []
  const nodeMap = new Map(nodes.map(n => [n.skillId, n]))

  // Promote well-performing developing skills
  for (const node of nodes) {
    if (node.level === 'developing' && node.quality > 0.85 && node.activationCount > 20) {
      recommendations.push({
        id: `rec_promote_${node.skillId}`,
        type: 'promote',
        targetSkillId: node.skillId,
        reason: `Quality ${(node.quality * 100).toFixed(0)}% with ${node.activationCount} activations - ready for stable`,
        expectedImpact: 'Higher confidence in skill application, faster execution',
        confidence: 0.85,
        priority: 'medium',
        createdAt: Date.now()
      })
    }
  }

  // Demote declining mastered skills
  for (const node of nodes) {
    if (node.level === 'mastered') {
      const health = calculateSkillHealth(node)
      if (health.trend === 'declining' && health.alerts.length > 1) {
        recommendations.push({
          id: `rec_demote_${node.skillId}`,
          type: 'demote',
          targetSkillId: node.skillId,
          reason: `Declining trend with ${health.alerts.length} alerts`,
          expectedImpact: 'Free up mastered slot for emerging skills',
          confidence: 0.7,
          priority: 'low',
          createdAt: Date.now()
        })
      }
    }
  }

  // Deprecate low-quality skills
  for (const node of nodes) {
    if (node.level !== 'deprecated' && node.quality < 0.3 && node.activationCount > 30) {
      recommendations.push({
        id: `rec_deprecate_${node.skillId}`,
        type: 'deprecate',
        targetSkillId: node.skillId,
        reason: `Quality ${(node.quality * 100).toFixed(0)}% after ${node.activationCount} activations - too many failures`,
        expectedImpact: 'Prevent negative transfer, improve overall skill base quality',
        confidence: 0.9,
        priority: 'high',
        createdAt: Date.now()
      })
    }
  }

  // Consolidate similar skills
  const categorySkills = new Map<string, SkillNode[]>()
  for (const node of nodes) {
    if (node.level === 'deprecated') continue
    const list = categorySkills.get(node.category) || []
    list.push(node)
    categorySkills.set(node.category, list)
  }

  for (const [category, skillList] of Array.from(categorySkills.entries())) {
    if (skillList.length > 5) {
      recommendations.push({
        id: `rec_consolidate_${category}`,
        type: 'consolidate',
        targetSkillId: skillList[0].skillId,
        reason: `${category} has ${skillList.length} skills - consider consolidating similar ones`,
        expectedImpact: 'Simplify skill selection, reduce cognitive load',
        confidence: 0.6,
        priority: 'medium',
        createdAt: Date.now()
      })
    }
  }

  // Address critical gaps with new skill recommendations
  for (const gap of gaps) {
    if (gap.severity === 'critical' && gap.suggestedSkillId) {
      recommendations.push({
        id: `rec_create_${gap.suggestedSkillId}`,
        type: 'create',
        targetSkillId: gap.suggestedSkillId,
        reason: `Critical gap in ${gap.category}: ${gap.description}`,
        expectedImpact: `Fill missing capability for ${gap.category} tasks`,
        confidence: 0.8,
        priority: 'high',
        createdAt: Date.now()
      })
    }
  }

  return recommendations
}

export function createSkillNodeId(skillId: string): string {
  return `skill_node_${skillId}`
}

export function sortNodesByHealth(nodes: SkillNode[]): SkillNode[] {
  return [...nodes].sort((a, b) => {
    const healthA = calculateSkillHealth(a)
    const healthB = calculateSkillHealth(b)
    return healthB.overallScore - healthA.overallScore
  })
}