/**
 * AuthorSkillGraph — V341
 * Author skill knowledge graph with node relationships, skill progression,
 * learning recommendations, and skill dependency analysis.
 * Inspired by: ruflo (hierarchical decomposition), nanobot (distributed mesh)
 */

export interface SkillNode {
  id: string
  name: string
  level: number        // 0-100
  connections: string[]  // IDs of connected skill nodes
  category: 'foundation' | 'intermediate' | 'advanced' | 'expert'
  lastPracticed: number
  practiceCount: number
}

export interface SkillEdge {
  from: string
  to: string
  weight: number      // dependency strength 0-1
  type: 'prerequisite' | 'enhances' | 'related'
}

export interface SkillGraphState {
  nodes: Record<string, SkillNode>
  edges: SkillEdge[]
  totalPracticeMinutes: number
  focusTime: Record<string, number>  // dimension -> minutes
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SkillGraphState {
  return {
    nodes: {},
    edges: [],
    totalPracticeMinutes: 0,
    focusTime: {},
    typeAlias: {},
  }
}

// Add or update a skill node
export function addSkillNode(state: SkillGraphState, id: string, name: string, level: number, category: SkillNode['category']): SkillGraphState {
  const node: SkillNode = {
    id,
    name,
    level,
    connections: [],
    category,
    lastPracticed: Date.now(),
    practiceCount: state.nodes[id]?.practiceCount ?? 0,
  }
  return { ...state, nodes: { ...state.nodes, [id]: node } }
}

// Connect two skill nodes
export function connectSkills(state: SkillGraphState, fromId: string, toId: string, weight: number, type: SkillEdge['type']): SkillGraphState {
  if (!state.nodes[fromId] || !state.nodes[toId]) return state
  if (state.nodes[fromId].connections.includes(toId)) return state
  const fromNode = { ...state.nodes[fromId], connections: [...state.nodes[fromId].connections, toId] }
  const newEdges = [...state.edges, { from: fromId, to: toId, weight, type }]
  return { ...state, nodes: { ...state.nodes, [fromId]: fromNode }, edges: newEdges }
}

// Practice a skill and update level
export function practiceSkill(state: SkillGraphState, skillId: string, minutes: number, improvement: number): SkillGraphState {
  if (!state.nodes[skillId]) return state
  const node = state.nodes[skillId]
  const newLevel = Math.min(100, node.level + improvement)
  const updatedNode: SkillNode = {
    ...node,
    level: newLevel,
    lastPracticed: Date.now(),
    practiceCount: node.practiceCount + 1,
  }
  const totalMinutes = state.totalPracticeMinutes + minutes
  const focusTime = { ...state.focusTime, [skillId]: (state.focusTime[skillId] || 0) + minutes }
  return { ...state, nodes: { ...state.nodes, [skillId]: updatedNode }, totalPracticeMinutes: totalMinutes, focusTime }
}

// Get skill prerequisites (skills that must be learned first)
export function getPrerequisites(state: SkillGraphState, skillId: string): SkillNode[] {
  const prereqs = state.edges.filter(e => e.to === skillId && e.type === 'prerequisite')
  return prereqs.map(e => state.nodes[e.from]).filter(Boolean)
}

// Get skill dependents (skills that depend on this skill)
export function getDependents(state: SkillGraphState, skillId: string): SkillNode[] {
  const dependents = state.edges.filter(e => e.from === skillId && e.type === 'prerequisite')
  return dependents.map(e => state.nodes[e.to]).filter(Boolean)
}

// Get skill learning path (ordered list of prerequisites)
export function getSkillLearningPath(state: SkillGraphState, targetSkillId: string): SkillNode[] {
  const path: SkillNode[] = []
  const visited = new Set<string>()
  function visit(skillId: string) {
    if (visited.has(skillId)) return
    visited.add(skillId)
    const prereqs = getPrerequisites(state, skillId)
    for (const p of prereqs) visit(p.id)
    const node = state.nodes[skillId]
    if (node) path.push(node)
  }
  visit(targetSkillId)
  return path
}

// Calculate overall skill level (average of all skills)
export function getOverallSkillLevel(state: SkillGraphState): number {
  const nodes = Object.values(state.nodes)
  if (nodes.length === 0) return 0
  return nodes.reduce((sum, n) => sum + n.level, 0) / nodes.length
}

// Get skills by category
export function getSkillsByCategory(state: SkillGraphState, category: SkillNode['category']): SkillNode[] {
  return Object.values(state.nodes).filter(n => n.category === category)
}

// Get weakest skills (below threshold)
export function getWeakestSkills(state: SkillGraphState, threshold: number = 60): SkillNode[] {
  return Object.values(state.nodes).filter(n => n.level < threshold).sort((a, b) => a.level - b.level)
}

// Get strongest skills
export function getStrongestSkills(state: SkillGraphState, count: number = 5): SkillNode[] {
  return Object.values(state.nodes).sort((a, b) => b.level - a.level).slice(0, count)
}

// Recommend next skill to learn
export function recommendNextSkill(state: SkillGraphState): SkillNode | null {
  const weakest = getWeakestSkills(state, 80)
  for (const skill of weakest) {
    const prereqs = getPrerequisites(state, skill.id)
    const allPrereqsMet = prereqs.every(p => p.level >= 60)
    if (allPrereqsMet || prereqs.length === 0) return skill
  }
  return weakest[0] || null
}

// Analyze skill clusters (connected groups of skills)
export function getSkillClusters(state: SkillGraphState): SkillNode[][] {
  const clusters: SkillNode[][] = []
  const visited = new Set<string>()
  for (const node of Object.values(state.nodes)) {
    if (visited.has(node.id)) continue
    const cluster: SkillNode[] = []
    function bfs(id: string) {
      if (visited.has(id)) return
      visited.add(id)
      const n = state.nodes[id]
      if (n) { cluster.push(n); for (const connId of n.connections) bfs(connId) }
    }
    bfs(node.id)
    clusters.push(cluster)
  }
  return clusters
}

// Get practice summary
export function getPracticeSummary(state: SkillGraphState) {
  const nodes = Object.values(state.nodes)
  const totalSkills = nodes.length
  const avgLevel = nodes.length > 0 ? nodes.reduce((s, n) => s + n.level, 0) / nodes.length : 0
  const strongest = getStrongestSkills(state, 3)
  const weakest = getWeakestSkills(state, 60)
  const mostPracticed = Object.entries(state.focusTime).sort((a, b) => b[1] - a[1])[0]
  return {
    totalSkills,
    avgLevel: Math.round(avgLevel * 10) / 10,
    strongest: strongest.map(n => ({ id: n.id, name: n.name, level: n.level })),
    weakestCount: weakest.length,
    mostPracticedSkill: mostPracticed ? state.nodes[mostPracticed[0]]?.name : null,
    mostPracticedMinutes: mostPracticed ? mostPracticed[1] : 0,
    totalPracticeMinutes: state.totalPracticeMinutes,
  }
}

// Check if skill is ready for advancement
export function isSkillReadyForAdvancement(state: SkillGraphState, skillId: string): boolean {
  const node = state.nodes[skillId]
  if (!node) return false
  const prereqs = getPrerequisites(state, skillId)
  return node.level >= 70 && prereqs.every(p => p.level >= 70)
}

// Get recommended focus based on time investment
export function getTimeInvestmentRecommendation(state: SkillGraphState): { skillId: string; reason: string }[] {
  const recommendations: { skillId: string; reason: string }[] = []
  // Find skills with low practice but high dependency
  for (const [skillId, minutes] of Object.entries(state.focusTime)) {
    if (minutes < 30) {
      const dependents = getDependents(state, skillId)
      if (dependents.length > 0) {
        recommendations.push({ skillId, reason: `Low practice (${minutes}m) but ${dependents.length} skills depend on it` })
      }
    }
  }
  // Sort by dependent count
  return recommendations.sort((a, b) => getDependents(state, a.skillId).length - getDependents(state, b.skillId).length)
}
