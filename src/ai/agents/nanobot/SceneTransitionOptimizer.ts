/**
 * SceneTransitionOptimizer — V351
 * Smooth scene transition detection, temporal smoothing, character continuity,
 * and transition quality scoring.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition)
 */

export interface SceneConnection {
  fromSceneId: string
  toSceneId: string
  transitionQuality: number  // 0-100
  transitionType: TransitionType
  sharedCharacters: string[]
  temporalJump: number         // seconds between scenes
  smoothnessScore: number     // 0-100
}

export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'match_cut' | 'cross_cut' | 'flashback' | 'dream_sequence'

export interface SceneOptimizerState {
  connections: SceneConnection[]
  sceneQualityScores: Record<string, number>
  transitionHistory: TransitionType[]
  avgTransitionQuality: number
  smoothnessTrend: 'improving' | 'stable' | 'declining'
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SceneOptimizerState {
  return {
    connections: [],
    sceneQualityScores: {},
    transitionHistory: [],
    avgTransitionQuality: 0,
    smoothnessTrend: 'stable',
    typeAlias: {},
  }
}

export function registerSceneConnection(
  state: SceneOptimizerState,
  fromSceneId: string,
  toSceneId: string,
  transitionType: TransitionType,
  sharedCharacters: string[],
  temporalJump: number
): SceneOptimizerState {
  const quality = calculateTransitionQuality(transitionType, sharedCharacters, temporalJump, state)
  const connection: SceneConnection = {
    fromSceneId,
    toSceneId,
    transitionQuality: quality,
    transitionType,
    sharedCharacters,
    temporalJump,
    smoothnessScore: quality,
  }
  const connections = [...state.connections, connection]
  const avgTransitionQuality = connections.reduce((s, c) => s + c.transitionQuality, 0) / connections.length
  const transitionHistory = [...state.transitionHistory, transitionType].slice(-50)
  const smoothnessTrend = calculateTrend(connections)
  return { ...state, connections, avgTransitionQuality, transitionHistory, smoothnessTrend }
}

export function calculateTransitionQuality(
  type: TransitionType,
  sharedCharacters: string[],
  temporalJump: number,
  state: SceneOptimizerState
): number {
  let score = 50  // base
  // Type bonuses
  if (type === 'match_cut') score += 20
  else if (type === 'dissolve') score += 10
  else if (type === 'cut') score -= 5
  else if (type === 'flashback' || type === 'dream_sequence') score -= 10
  // Character continuity bonus
  if (sharedCharacters.length > 0) score += sharedCharacters.length * 5
  // Temporal jump penalty
  if (temporalJump > 86400 * 30) score -= 30  // > 1 month
  else if (temporalJump > 86400 * 7) score -= 15  // > 1 week
  else if (temporalJump > 86400) score -= 5  // > 1 day
  else if (temporalJump < 60) score += 5    // < 1 minute (immediate)
  return Math.max(0, Math.min(100, score))
}

export function calculateTrend(connections: SceneConnection[]): 'improving' | 'stable' | 'declining' {
  if (connections.length < 4) return 'stable'
  const half = Math.floor(connections.length / 2)
  const first = connections.slice(0, half)
  const last = connections.slice(half)
  const firstAvg = first.reduce((s, c) => s + c.smoothnessScore, 0) / first.length
  const lastAvg = last.reduce((s, c) => s + c.smoothnessScore, 0) / last.length
  const diff = lastAvg - firstAvg
  if (diff > 3) return 'improving'
  if (diff < -3) return 'declining'
  return 'stable'
}

export function getRecommendedTransitionType(
  state: SceneOptimizerState,
  sharedCharacters: string[],
  temporalJump: number
): TransitionType {
  if (sharedCharacters.length > 2) return 'match_cut'
  if (temporalJump > 86400 * 30) return 'fade'
  if (temporalJump > 86400) return 'dissolve'
  if (temporalJump < 60) return 'cut'
  return 'dissolve'
}

export function getTransitionSuggestions(state: SceneOptimizerState): string[] {
  const suggestions: string[] = []
  if (state.smoothnessTrend === 'declining') {
    suggestions.push('Transition quality declining - consider using match cuts more often')
  }
  const recent = state.transitionHistory.slice(-10)
  const cutCount = recent.filter(t => t === 'cut').length
  if (cutCount > 6) suggestions.push('Too many hard cuts - try dissolves or match cuts')
  const flashbackCount = recent.filter(t => t === 'flashback').length
  if (flashbackCount > 3) suggestions.push('Multiple flashbacks may confuse readers')
  if (state.avgTransitionQuality < 50) {
    suggestions.push('Low average transition quality - review scene connections')
  }
  return suggestions
}

export function smoothTemporalGaps(state: SceneOptimizerState, maxGap: number = 86400): SceneConnection[] {
  return state.connections.filter(c => c.temporalJump <= maxGap)
}

export function getCharacterContinuityScore(state: SceneOptimizerState, characterId: string): number {
  const relevant = state.connections.filter(c => c.sharedCharacters.includes(characterId))
  if (relevant.length === 0) return 0
  return relevant.reduce((s, c) => s + c.transitionQuality, 0) / relevant.length
}

export function getTransitionStatistics(state: SceneOptimizerState) {
  const typeCounts: Record<TransitionType, number> = {
    cut: 0, fade: 0, dissolve: 0, match_cut: 0,
    cross_cut: 0, flashback: 0, dream_sequence: 0,
  }
  for (const t of state.transitionHistory) typeCounts[t]++
  return {
    totalTransitions: state.connections.length,
    avgQuality: state.avgTransitionQuality,
    trend: state.smoothnessTrend,
    typeDistribution: typeCounts,
    bestTransition: state.connections.length > 0
      ? state.connections.reduce((best, c) => c.transitionQuality > best.transitionQuality ? c : best)
      : null,
    worstTransition: state.connections.length > 0
      ? state.connections.reduce((worst, c) => c.transitionQuality < worst.transitionQuality ? c : worst)
      : null,
  }
}

export function optimizeTransitionOrder(state: SceneOptimizerState): string[] {
  const ordered: string[] = []
  const remaining = new Set(state.connections.map(c => c.fromSceneId))
  for (const conn of state.connections) {
    if (ordered.length === 0 || !ordered.includes(conn.fromSceneId)) {
      if (remaining.has(conn.fromSceneId)) {
        ordered.push(conn.fromSceneId)
        remaining.delete(conn.fromSceneId)
      }
    }
    if (remaining.has(conn.toSceneId)) {
      ordered.push(conn.toSceneId)
      remaining.delete(conn.toSceneId)
    }
  }
  return ordered
}
