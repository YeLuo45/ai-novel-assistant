/**
 * SceneTransitionOptimizer — V331
 * Smooth scene transitions, temporal smoothing, character continuity preservation.
 * Inspired by: thunderbolt (pipeline smoothing), ruflo (hierarchical continuity)
 */

export interface TransitionEdge {
  fromScene: string
  toScene: string
  transitionType: 'cut' | 'fade' | 'dissolve' | 'match_cut' | 'emporal_jump'
  smoothness: number     // 0-100 how smooth the transition feels
  continuityScore: number // 0-100 character/plot continuity maintained
  recommended: boolean
}

export interface SceneConnection {
  sceneId: string
  incomingEdges: TransitionEdge[]
  outgoingEdges: TransitionEdge[]
  strength: number        // overall connection strength
  sharedCharacters: string[]
  sharedLocations: string[]
  temporalGap: number     // days between scenes (-1 if unknown)
}

export interface TransitionConstraint {
  type: 'no_direct_cut' | 'require_fade' | 'min_gap' | 'character_must_appear'
  scenes: string[]
  params?: Record<string, unknown>
}

export interface SceneTransitionState {
  sceneConnections: Map<string, SceneConnection>
  transitionHistory: TransitionEdge[]
  constraints: TransitionConstraint[]
  recommendedOrder: string[]  // suggested scene order
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SceneTransitionState {
  return {
    sceneConnections: new Map(),
    transitionHistory: [],
    constraints: [],
    recommendedOrder: [],
    typeAlias: {},
  }
}

// Register a scene connection
export function registerSceneConnection(
  state: SceneTransitionState,
  fromScene: string,
  toScene: string,
  sharedCharacters: string[] = [],
  sharedLocations: string[] = [],
  temporalGap: number = -1
): SceneTransitionState {
  const connection: SceneConnection = {
    sceneId: toScene,
    incomingEdges: [],
    outgoingEdges: [],
    strength: 0,
    sharedCharacters,
    sharedLocations,
    temporalGap,
  }

  const newConnections = new Map(state.sceneConnections)
  newConnections.set(`${fromScene}->${toScene}`, connection)

  return { ...state, sceneConnections: newConnections }
}

// Calculate transition smoothness
export function calculateSmoothness(
  transition: TransitionEdge,
  sharedCharacters: string[],
  sharedLocations: string[],
  temporalGap: number
): number {
  let score = 50

  // Character continuity bonus
  if (sharedCharacters.length > 0) {
    score += Math.min(sharedCharacters.length * 10, 25)
  }

  // Location continuity bonus
  if (sharedLocations.length > 0) {
    score += Math.min(sharedLocations.length * 8, 20)
  }

  // Temporal proximity bonus
  if (temporalGap >= 0) {
    if (temporalGap === 0) score += 10
    else if (temporalGap <= 1) score += 5
    else if (temporalGap > 30) score -= 15  // large gap penalty
  }

  // Transition type adjustment
  switch (transition.transitionType) {
    case 'match_cut': score += 10; break
    case 'dissolve': score += 5; break
    case 'cut': score -= 10; break
    case 'emporal_jump': score -= 15; break
  }

  return Math.max(0, Math.min(100, score))
}

// Analyze transition options between scenes
export function analyzeTransition(
  state: SceneTransitionState,
  fromScene: string,
  toScene: string,
  sharedCharacters: string[] = [],
  sharedLocations: string[] = [],
  temporalGap: number = -1
): TransitionEdge[] {
  const transitionTypes: TransitionEdge['transitionType'][] = ['cut', 'fade', 'dissolve', 'match_cut', 'emporal_jump']
  const edges: TransitionEdge[] = []

  for (const ttype of transitionTypes) {
    const edge: TransitionEdge = {
      fromScene,
      toScene,
      transitionType: ttype,
      smoothness: 0,
      continuityScore: 0,
      recommended: false,
    }

    edge.smoothness = calculateSmoothness(edge, sharedCharacters, sharedLocations, temporalGap)
    edge.continuityScore = (sharedCharacters.length > 0 ? 80 : 40) + (sharedLocations.length > 0 ? 15 : 0)
    edges.push(edge)
  }

  // Mark best transition as recommended
  edges.sort((a, b) => b.smoothness - a.smoothness)
  if (edges.length > 0) edges[0].recommended = true

  return edges
}

// Find best scene ordering to minimize transition costs
export function findOptimalSceneOrder(
  state: SceneTransitionState,
  sceneIds: string[],
  sharedCharacterMap: Map<string, string[]> = new Map(),
  sharedLocationMap: Map<string, string[]> = new Map()
): { orderedScenes: string[]; totalSmoothness: number; transitions: TransitionEdge[] } {
  if (sceneIds.length === 0) return { orderedScenes: [], totalSmoothness: 0, transitions: [] }
  if (sceneIds.length === 1) return { orderedScenes: sceneIds, totalSmoothness: 100, transitions: [] }

  // Greedy approach: always pick the most similar next scene
  const ordered: string[] = []
  const remaining = new Set(sceneIds)
  let current = sceneIds[0]
  ordered.push(current)
  remaining.delete(current)

  let totalSmoothness = 100

  while (remaining.size > 0) {
    let bestNext: string | null = null
    let bestSmoothness = -1

    for (const next of remaining) {
      const chars = sharedCharacterMap.get(`${current}->${next}`) || []
      const locs = sharedLocationMap.get(`${current}->${next}`) || []
      const candidates = analyzeTransition(state, current, next, chars, locs)
      const best = candidates.find(c => c.recommended) || candidates[0]

      if (best.smoothness > bestSmoothness) {
        bestSmoothness = best.smoothness
        bestNext = next
      }
    }

    if (bestNext) {
      const chars = sharedCharacterMap.get(`${current}->${bestNext}`) || []
      const locs = sharedLocationMap.get(`${current}->${bestNext}`) || []
      const candidates = analyzeTransition(state, current, bestNext, chars, locs)
      const best = candidates.find(c => c.recommended) || candidates[0]
      totalSmoothness += best.smoothness
      ordered.push(bestNext)
      remaining.delete(bestNext)
      current = bestNext
    } else {
      // No more connections, just append remaining
      const next = Array.from(remaining)[0]
      ordered.push(next)
      remaining.delete(next)
      current = next
    }
  }

  // Generate transition list
  const transitions: TransitionEdge[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const chars = sharedCharacterMap.get(`${ordered[i]}->${ordered[i+1]}`) || []
    const locs = sharedLocationMap.get(`${ordered[i]}->${ordered[i+1]}`) || []
    const candidates = analyzeTransition(state, ordered[i], ordered[i+1], chars, locs)
    transitions.push(candidates.find(c => c.recommended) || candidates[0])
  }

  return { orderedScenes: ordered, totalSmoothness: totalSmoothness / ordered.length, transitions }
}

// Validate transition against constraints
export function validateTransition(
  state: SceneTransitionState,
  edge: TransitionEdge
): { valid: boolean; violations: string[] } {
  const violations: string[] = []

  for (const constraint of state.constraints) {
    switch (constraint.type) {
      case 'no_direct_cut':
        if (constraint.scenes.includes(edge.fromScene) && constraint.scenes.includes(edge.toScene)) {
          if (edge.transitionType === 'cut') {
            violations.push(`Direct cut forbidden between scenes ${edge.fromScene} and ${edge.toScene}`)
          }
        }
        break

      case 'require_fade':
        if (constraint.scenes.includes(edge.fromScene) && constraint.scenes.includes(edge.toScene)) {
          if (edge.transitionType !== 'fade' && edge.transitionType !== 'dissolve') {
            violations.push(`Fade/dissolve required between scenes ${edge.fromScene} and ${edge.toScene}`)
          }
        }
        break

      case 'min_gap':
        if (constraint.scenes.includes(edge.fromScene) && constraint.scenes.includes(edge.toScene)) {
          const gap = (constraint.params?.gap as number) || 1
          const fromConn = state.sceneConnections.get(constraint.scenes[0])
          if (fromConn && fromConn.temporalGap < gap) {
            violations.push(`Minimum gap of ${gap} required between scenes`)
          }
        }
        break
    }
  }

  return { valid: violations.length === 0, violations }
}

// Add transition constraint
export function addConstraint(
  state: SceneTransitionState,
  constraint: TransitionConstraint
): SceneTransitionState {
  return { ...state, constraints: [...state.constraints, constraint] }
}

// Get transition summary for a scene sequence
export function getTransitionSummary(
  transitions: TransitionEdge[]
): {
  avgSmoothness: number
  recommendedCount: number
  problematicTransitions: string[]
  overallQuality: string
} {
  if (transitions.length === 0) {
    return { avgSmoothness: 100, recommendedCount: 0, problematicTransitions: [], overallQuality: 'excellent' }
  }

  const avgSmoothness = transitions.reduce((s, t) => s + t.smoothness, 0) / transitions.length
  const recommendedCount = transitions.filter(t => t.recommended).length
  const problematicTransitions = transitions
    .filter(t => t.smoothness < 40)
    .map(t => `${t.fromScene} -> ${t.toScene}`)

  let overallQuality: string
  if (avgSmoothness >= 80) overallQuality = 'excellent'
  else if (avgSmoothness >= 60) overallQuality = 'good'
  else if (avgSmoothness >= 40) overallQuality = 'fair'
  else overallQuality = 'needs_improvement'

  return { avgSmoothness: Math.round(avgSmoothness), recommendedCount, problematicTransitions, overallQuality }
}

// Suggest best transition type for given scenes
export function suggestTransitionType(
  sharedCharacters: string[],
  sharedLocations: string[],
  temporalGap: number
): { type: TransitionEdge['transitionType']; reason: string } {
  if (sharedCharacters.length > 2 && temporalGap <= 1) {
    return { type: 'match_cut', reason: 'Strong character/location continuity warrants match cut' }
  }
  if (sharedCharacters.length > 0 && temporalGap <= 7) {
    return { type: 'dissolve', reason: 'Some continuity with time gap suggests dissolve' }
  }
  if (sharedLocations.length > 0 && temporalGap > 7) {
    return { type: 'fade', reason: 'Same location after significant time gap - fade recommended' }
  }
  if (temporalGap > 30 || sharedCharacters.length === 0) {
    return { type: 'emporal_jump', reason: 'Large time gap or no shared elements - temporal jump needed' }
  }
  return { type: 'cut', reason: 'Standard cut appropriate for disconnected scenes' }
}
