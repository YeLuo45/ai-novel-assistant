/**
 * AuthorSkillGraph — V321
 * Author skill taxonomy, strengths/weaknesses mapping, growth tracking.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops)
 */

export interface SkillNode {
  skillId: string
  name: string
  category: 'plot' | 'dialogue' | 'character' | 'worldbuilding' | 'style' | 'pacing' | 'research' | 'revision'
  level: number        // 0-100
  parentSkillId?: string
  childSkillIds: string[]
  dependencies: string[]
  masteryScore: number  // 0-1 how well this skill is internalized
  lastPracticed: number
  practiceCount: number
}

export interface SkillEdge {
  from: string
  to: string
  relationship: 'prereq' | 'enhances' | 'conflicts'
  strength: number // 0-1
}

export interface AuthorSkillGraphState {
  nodes: Map<string, SkillNode>
  edges: SkillEdge[]
  strengths: string[]     // skill IDs
  weaknesses: string[]    // skill IDs
  growthHistory: { timestamp: number; skills: Map<string, number> }[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): AuthorSkillGraphState {
  return {
    nodes: new Map(),
    edges: [],
    strengths: [],
    weaknesses: [],
    growthHistory: [],
    typeAlias: {},
  }
}

// Register a skill in the graph
export function registerSkill(
  state: AuthorSkillGraphState,
  skillId: string,
  name: string,
  category: SkillNode['category'],
  parentSkillId?: string,
  dependencies: string[] = []
): AuthorSkillGraphState {
  const newNodes = new Map(state.nodes)
  newNodes.set(skillId, {
    skillId,
    name,
    category,
    level: 0,
    parentSkillId,
    childSkillIds: [],
    dependencies,
    masteryScore: 0,
    lastPracticed: 0,
    practiceCount: 0,
  })

  // Update parent's childSkillIds
  if (parentSkillId) {
    const parent = newNodes.get(parentSkillId)
    if (parent) {
      newNodes.set(parentSkillId, {
        ...parent,
        childSkillIds: [...parent.childSkillIds, skillId],
      })
    }
  }

  return { ...state, nodes: newNodes }
}

// Update skill level after practice
export function updateSkillLevel(
  state: AuthorSkillGraphState,
  skillId: string,
  newLevel: number,
  masteryGain: number = 0.05
): AuthorSkillGraphState {
  const node = state.nodes.get(skillId)
  if (!node) return state

  const newNodes = new Map(state.nodes)
  const updatedNode: SkillNode = {
    ...node,
    level: Math.min(100, newLevel),
    masteryScore: Math.min(1, node.masteryScore + masteryGain),
    lastPracticed: Date.now(),
    practiceCount: node.practiceCount + 1,
  }
  newNodes.set(skillId, updatedNode)

  // Update growth history
  const latestEntry = state.growthHistory[state.growthHistory.length - 1]
  const now = Date.now()
  const updatedHistory = [...state.growthHistory]
  
  if (!latestEntry || now - latestEntry.timestamp > 24 * 60 * 60 * 1000) {
    // New day entry
    const skillLevels = new Map<string, number>()
    for (const [id, n] of newNodes.entries()) {
      skillLevels.set(id, n.level)
    }
    updatedHistory.push({ timestamp: now, skills: skillLevels })
  } else {
    // Update today's entry
    const skills = new Map(latestEntry.skills)
    skills.set(skillId, newLevel)
    updatedHistory[updatedHistory.length - 1] = { ...latestEntry, skills }
  }

  return { ...state, nodes: newNodes, growthHistory: updatedHistory }
}

// Add edge between skills
export function addSkillEdge(
  state: AuthorSkillGraphState,
  from: string,
  to: string,
  relationship: SkillEdge['relationship'],
  strength: number = 0.5
): AuthorSkillGraphState {
  const edge: SkillEdge = { from, to, relationship, strength }
  return { ...state, edges: [...state.edges, edge] }
}

// Compute strengths (top skills by level)
export function computeStrengths(
  state: AuthorSkillGraphState,
  topK: number = 3
): string[] {
  return Array.from(state.nodes.values())
    .sort((a, b) => b.level - a.level)
    .slice(0, topK)
    .map(n => n.skillId)
}

// Compute weaknesses (lowest skills that have been practiced)
export function computeWeaknesses(
  state: AuthorSkillGraphState,
  bottomK: number = 3
): string[] {
  return Array.from(state.nodes.values())
    .filter(n => n.practiceCount > 0)
    .sort((a, b) => a.level - b.level)
    .slice(0, bottomK)
    .map(n => n.skillId)
}

// Get skill subtree (all descendants)
export function getSkillSubtree(
  state: AuthorSkillGraphState,
  skillId: string
): string[] {
  const node = state.nodes.get(skillId)
  if (!node) return []
  
  const result: string[] = [skillId]
  for (const childId of node.childSkillIds) {
    result.push(...getSkillSubtree(state, childId))
  }
  return result
}

// Get skill ancestors (all prerequisites path to root)
export function getSkillAncestors(
  state: AuthorSkillGraphState,
  skillId: string
): string[] {
  const result: string[] = []
  let current = state.nodes.get(skillId)
  
  while (current?.parentSkillId) {
    result.push(current.parentSkillId)
    current = state.nodes.get(current.parentSkillId)
  }
  
  return result
}

// Calculate skill gap (what needs to be learned before target skill)
export function calculateSkillGap(
  state: AuthorSkillGraphState,
  targetSkillId: string,
  currentSkillId: string
): { missing: string[]; weak: string[] } {
  const ancestors = getSkillAncestors(state, targetSkillId)
  const targetAncestors = new Set(ancestors)
  
  const missing: string[] = []
  const weak: string[] = []
  
  for (const ancId of targetAncestors) {
    if (ancId === targetSkillId || ancId === currentSkillId) continue
    const node = state.nodes.get(ancId)
    if (!node) {
      missing.push(ancId)
    } else if (node.level < 50) {
      weak.push(ancId)
    }
  }
  
  return { missing, weak }
}

// Get growth rate for a skill
export function getSkillGrowthRate(
  state: AuthorSkillGraphState,
  skillId: string,
  days: number = 7
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const relevantHistory = state.growthHistory.filter(h => h.timestamp >= cutoff)
  
  if (relevantHistory.length < 2) return 0
  
  const first = relevantHistory[0].skills.get(skillId) || 0
  const last = relevantHistory[relevantHistory.length - 1].skills.get(skillId) || 0
  
  return (last - first) / days
}

// Get skill radar data for visualization
export function getSkillRadarData(
  state: AuthorSkillGraphState
): { category: string; level: number; categoryAvg: number }[] {
  const categories: SkillNode['category'][] = ['plot', 'dialogue', 'character', 'worldbuilding', 'style', 'pacing']
  const result: { category: string; level: number; categoryAvg: number }[] = []
  
  for (const cat of categories) {
    const catNodes = Array.from(state.nodes.values()).filter(n => n.category === cat)
    if (catNodes.length > 0) {
      const avg = catNodes.reduce((s, n) => s + n.level, 0) / catNodes.length
      result.push({ category: cat, level: Math.round(avg), categoryAvg: avg })
    }
  }
  
  return result
}

// Find skill transfer opportunities (high-level skills that can apply to weak areas)
export function findTransferOpportunities(
  state: AuthorSkillGraphState
): { from: string; to: string; reason: string }[] {
  const opportunities: { from: string; to: string; reason: string }[] = []
  
  for (const strengthId of state.strengths) {
    const strengthNode = state.nodes.get(strengthId)
    if (!strengthNode) continue
    
    for (const weaknessId of state.weaknesses) {
      const weaknessNode = state.nodes.get(weaknessId)
      if (!weaknessNode) continue
      
      // Check if skills are related (same category or share a parent)
      const strengthAncestors = new Set(getSkillAncestors(state, strengthId))
      const weaknessAncestors = new Set(getSkillAncestors(state, weaknessId))
      
      if (strengthNode.category === weaknessNode.category) {
        opportunities.push({
          from: strengthId,
          to: weaknessId,
          reason: `${strengthNode.name} techniques can help improve ${weaknessNode.name}`,
        })
      } else if (strengthAncestors.has(weaknessId) || weaknessAncestors.has(strengthId)) {
        opportunities.push({
          from: strengthId,
          to: weaknessId,
          reason: `Foundational skill overlap between ${strengthNode.name} and ${weaknessNode.name}`,
        })
      }
    }
  }
  
  return opportunities.slice(0, 5)
}

// Get overall skill health score
export function getSkillHealthScore(state: AuthorSkillGraphState): number {
  const nodes = Array.from(state.nodes.values()).filter(n => n.practiceCount > 0)
  if (nodes.length === 0) return 0
  
  const avgLevel = nodes.reduce((s, n) => s + n.level, 0) / nodes.length
  const avgMastery = nodes.reduce((s, n) => s + n.masteryScore, 0) / nodes.length
  
  return Math.round((avgLevel * 0.6 + avgMastery * 100 * 0.4))
}
