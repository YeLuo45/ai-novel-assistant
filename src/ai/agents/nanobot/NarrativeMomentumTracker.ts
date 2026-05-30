/**
 * NarrativeMomentumTracker — V343
 * Real-time narrative energy monitoring, pacing deviation detection,
 * tension curve visualization, and momentum optimization suggestions.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition)
 */

export interface TensionPoint {
  chapterId: string
  position: number        // 0-1 relative position in chapter
  tension: number         // 0-100 scale
  momentum: number        // -100 to +100 (negative = slowing, positive = building)
  timestamp: number
  label?: string
}

export interface MomentumState {
  tensionHistory: TensionPoint[]
  currentMomentum: number
  avgTension: number
  pacingDeviation: number  // deviation from author's typical pattern
  momentumTrend: 'rising' | 'falling' | 'stable' | 'oscillating'
  chaptersAnalyzed: number
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): MomentumState {
  return {
    tensionHistory: [],
    currentMomentum: 0,
    avgTension: 0,
    pacingDeviation: 0,
    momentumTrend: 'stable',
    chaptersAnalyzed: 0,
    typeAlias: {},
  }
}

// Record a tension point
export function recordTensionPoint(
  state: MomentumState,
  chapterId: string,
  position: number,
  tension: number,
  momentum: number,
  label?: string
): MomentumState {
  const point: TensionPoint = { chapterId, position, tension, momentum, timestamp: Date.now(), label }
  const tensionHistory = [...state.tensionHistory, point]
  // Update avgTension
  const allTensions = tensionHistory.map(p => p.tension)
  const avgTension = allTensions.reduce((a, b) => a + b, 0) / allTensions.length
  return { ...state, tensionHistory, chaptersAnalyzed: new Set(tensionHistory.map(p => p.chapterId)).size, avgTension }
}

// Analyze momentum trend
export function analyzeMomentumTrend(state: MomentumState): MomentumState {
  if (state.tensionHistory.length < 3) {
    return { ...state, momentumTrend: 'stable', currentMomentum: 0 }
  }
  const recent = state.tensionHistory.slice(-10)
  const deltas = recent.slice(1).map((p, i) => p.tension - recent[i].tension)
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const oscillating = deltas.some(d => d > 0) && deltas.some(d => d < 0)
  const momentumTrend = oscillating ? 'oscillating' : avgDelta > 2 ? 'rising' : avgDelta < -2 ? 'falling' : 'stable'
  const currentMomentum = Math.max(-100, Math.min(100, Math.round(avgDelta * 10)))
  return { ...state, momentumTrend, currentMomentum }
}

// Calculate average tension for a chapter
export function calculateChapterTension(state: MomentumState, chapterId: string): number | null {
  const chapterPoints = state.tensionHistory.filter(p => p.chapterId === chapterId)
  if (chapterPoints.length === 0) return null
  return chapterPoints.reduce((s, p) => s + p.tension, 0) / chapterPoints.length
}

// Detect pacing anomalies
export function detectPacingAnomaly(state: MomentumState, chapterId: string): { type: string; severity: number } | null {
  const chapterTension = calculateChapterTension(state, chapterId)
  if (chapterTension === null) return null
  const deviation = Math.abs(chapterTension - state.avgTension)
  if (deviation > 30) return { type: 'major_deviation', severity: Math.min(100, deviation) }
  if (deviation > 15) return { type: 'moderate_deviation', severity: deviation }
  return null
}

// Get tension spikes (sudden increases)
export function getTensionSpikes(state: MomentumState, threshold: number = 20): TensionPoint[] {
  if (state.tensionHistory.length < 2) return []
  const spikes: TensionPoint[] = []
  for (let i = 1; i < state.tensionHistory.length; i++) {
    const delta = state.tensionHistory[i].tension - state.tensionHistory[i - 1].tension
    if (delta >= threshold) spikes.push(state.tensionHistory[i])
  }
  return spikes
}

// Get tension drops (sudden decreases)
export function getTensionDrops(state: MomentumState, threshold: number = 20): TensionPoint[] {
  if (state.tensionHistory.length < 2) return []
  const drops: TensionPoint[] = []
  for (let i = 1; i < state.tensionHistory.length; i++) {
    const delta = state.tensionHistory[i - 1].tension - state.tensionHistory[i].tension
    if (delta >= threshold) drops.push(state.tensionHistory[i])
  }
  return drops
}

// Calculate pacing consistency score
export function getPacingConsistencyScore(state: MomentumState): number {
  if (state.tensionHistory.length < 3) return 100
  const tensions = state.tensionHistory.map(p => p.tension)
  const mean = tensions.reduce((a, b) => a + b, 0) / tensions.length
  const variance = tensions.reduce((s, t) => s + (t - mean) ** 2, 0) / tensions.length
  const stdDev = Math.sqrt(variance)
  // Lower std dev = higher consistency
  return Math.max(0, Math.round(100 - stdDev))
}

// Get momentum recommendations
export function getMomentumRecommendations(state: MomentumState): string[] {
  const recs: string[] = []
  if (state.momentumTrend === 'falling') recs.push('Consider adding a tension spike to re-engage readers')
  if (state.momentumTrend === 'rising' && state.currentMomentum > 50) recs.push('High momentum — good time for a climax or revelation')
  if (state.momentumTrend === 'oscillating') recs.push('Unstable momentum — consider stabilizing with consistent pacing')
  const spikes = getTensionSpikes(state)
  if (spikes.length > 5) recs.push('Many tension spikes detected — ensure each serves the narrative')
  const drops = getTensionDrops(state)
  if (drops.length > 3) recs.push('Frequent tension drops may be losing reader engagement')
  const consistency = getPacingConsistencyScore(state)
  if (consistency < 50) recs.push('Low pacing consistency — try to match your typical tension curve pattern')
  return recs
}

// Calculate overall engagement score
export function calculateEngagementScore(state: MomentumState): number {
  if (state.tensionHistory.length === 0) return 0
  const consistency = getPacingConsistencyScore(state)
  const momentumBonus = state.currentMomentum > 0 ? state.currentMomentum / 10 : 0
  const tensionRange = Math.max(...state.tensionHistory.map(p => p.tension)) - Math.min(...state.tensionHistory.map(p => p.tension))
  const rangeBonus = Math.min(20, tensionRange / 5)
  return Math.min(100, Math.round(consistency + momentumBonus + rangeBonus))
}

// Get optimal tension zones
export function getOptimalTensionZones(state: MomentumState): { start: number; end: number; avgTension: number }[] {
  if (state.tensionHistory.length < 5) return []
  const sorted = [...state.tensionHistory].sort((a, b) => a.position - b.position)
  const zones: { start: number; end: number; avgTension: number }[] = []
  let zoneStart = sorted[0].position
  let zoneTensions: number[] = [sorted[0].tension]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].position - sorted[i - 1].position < 0.1) {
      zoneTensions.push(sorted[i].tension)
    } else {
      zones.push({ start: zoneStart, end: sorted[i - 1].position, avgTension: zoneTensions.reduce((a, b) => a + b) / zoneTensions.length })
      zoneStart = sorted[i].position
      zoneTensions = [sorted[i].tension]
    }
  }
  if (zoneTensions.length > 0) {
    zones.push({ start: zoneStart, end: sorted[sorted.length - 1].position, avgTension: zoneTensions.reduce((a, b) => a + b) / zoneTensions.length })
  }
  return zones
}

// Smooth tension data (moving average)
export function smoothTensionData(state: MomentumState, windowSize: number = 3): MomentumState {
  if (state.tensionHistory.length < windowSize) return state
  const smoothed = state.tensionHistory.map((point, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(state.tensionHistory.length, i + Math.ceil(windowSize / 2))
    const window = state.tensionHistory.slice(start, end)
    const avgTension = window.reduce((s, p) => s + p.tension, 0) / window.length
    return { ...point, tension: Math.round(avgTension) }
  })
  return { ...state, tensionHistory: smoothed }
}

// Compare momentum with target pattern
export function compareWithTargetPattern(state: MomentumState, targetTensions: number[]): { deviation: number; suggestions: string[] } {
  if (state.tensionHistory.length === 0) return { deviation: 0, suggestions: ['Not enough data to compare'] }
  const sample = state.tensionHistory.slice(-targetTensions.length)
  let totalDeviation = 0
  for (let i = 0; i < sample.length; i++) {
    totalDeviation += Math.abs(sample[i].tension - targetTensions[i])
  }
  const deviation = totalDeviation / sample.length
  const suggestions: string[] = []
  if (deviation > 20) suggestions.push('Significant deviation from target pattern')
  if (deviation > 10 && deviation <= 20) suggestions.push('Minor deviation — consider adjusting pacing')
  return { deviation: Math.round(deviation), suggestions }
}
