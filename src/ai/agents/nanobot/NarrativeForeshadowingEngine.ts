/**
 * NarrativeForeshadowingEngine — V479
 * Foreshadowing detection, clue placement analysis, dramatic irony and hint management.
 * Inspired by: thunderbolt (feedback loops), chatdev (emotional synthesis), generic-agent (optimization)
 */

export type ForeshadowType = 'subtle' | 'direct' | 'symbolic' | 'dialogue' | 'action'

export interface ForeshadowBeat {
  id: string
  chapterNumber: number
  foreshadowType: ForeshadowType
  targetChapter: number | null  // null if payoff not yet placed
  intensity: number  // 0-100 (how obvious)
  payoffFulfilled: boolean
}

export interface ForeshadowReport {
  totalForeshadows: number
  fulfilledCount: number
  fulfillmentRate: number  // 0-100
  recommendations: string[]
}

export interface NarrativeForeshadowingState {
  beats: ForeshadowBeat[]
  report: ForeshadowReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeForeshadowingState {
  return { beats: [], report: null, typeAlias: {} }
}

export function plantForeshadow(
  state: NarrativeForeshadowingState,
  chapter: number,
  foreshadowType: ForeshadowType,
  intensity: number
): NarrativeForeshadowingState {
  const id = `fore_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: ForeshadowBeat = { id, chapterNumber: chapter, foreshadowType, targetChapter: null, intensity: Math.max(0, Math.min(100, intensity)), payoffFulfilled: false }
  const beats = [...state.beats, beat]
  return { ...state, beats }
}

export function linkPayoff(state: NarrativeForeshadowingState, foreshadowId: string, payoffChapter: number): NarrativeForeshadowingState {
  const beats = state.beats.map(b => b.id === foreshadowId ? { ...b, targetChapter: payoffChapter } : b)
  return { ...state, beats }
}

export function markPayoffFulfilled(state: NarrativeForeshadowingState, chapter: number): NarrativeForeshadowingState {
  const beats = state.beats.map(b => {
    if (b.targetChapter === chapter) return { ...b, payoffFulfilled: true }
    return b
  })
  return { ...state, beats }
}

export function generateForeshadowReport(state: NarrativeForeshadowingState): ForeshadowReport {
  if (state.beats.length === 0) {
    return { totalForeshadows: 0, fulfilledCount: 0, fulfillmentRate: 0, recommendations: [] }
  }
  const totalForeshadows = state.beats.length
  const fulfilledCount = state.beats.filter(b => b.payoffFulfilled).length
  const fulfillmentRate = totalForeshadows > 0 ? Math.round((fulfilledCount / totalForeshadows) * 100) : 0
  const recommendations: string[] = []
  if (fulfillmentRate < 50) recommendations.push('Many foreshadowed elements never fulfilled - add payoffs')
  if (state.beats.filter(b => b.intensity > 70 && !b.payoffFulfilled).length > totalForeshadows * 0.3) {
    recommendations.push('High-intensity foreshadowing without payoff - resolve or remove')
  }
  if (state.beats.filter(b => b.targetChapter === null).length > totalForeshadows * 0.5) {
    recommendations.push('Many foreshadows lack payoff links - connect hints to resolutions')
  }
  if (state.beats.filter(b => b.foreshadowType === 'subtle').length > totalForeshadows * 0.6) {
    recommendations.push('Too many subtle foreshadows - balance with direct hints')
  }
  return { totalForeshadows, fulfilledCount, fulfillmentRate, recommendations }
}

export function getForeshadowsForChapter(state: NarrativeForeshadowingState, chapter: number): ForeshadowBeat[] {
  return state.beats.filter(b => b.chapterNumber === chapter)
}
