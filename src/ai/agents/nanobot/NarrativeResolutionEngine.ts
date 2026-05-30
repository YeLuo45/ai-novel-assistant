/**
 * NarrativeResolutionEngine — V419
 * Resolution quality analysis, ending satisfaction scoring, payoff delivery tracking.
 * Inspired by: thunderbolt (feedback loops), generic-agent (validation), ruflo (hierarchical decomposition)
 */

export type PayoffType = 'plot' | 'character' | 'thematic' | 'emotional' | 'mystery'

export interface PayoffInstance {
  id: string
  type: PayoffType
  plantedChapter: number  // where set up
  payoffChapter: number | null  // where delivered
  description: string
  satisfactionScore: number  // 0-100
  importance: number  // 0-100
  delivered: boolean
}

export interface ResolutionMetrics {
  totalPayoffs: number
  deliveredPayoffs: number
  avgSatisfaction: number
  unresolvedCount: number
  rushedCount: number
  recommendations: string[]
}

export interface NarrativeResolutionState {
  payoffs: PayoffInstance[]
  resolutionMetrics: ResolutionMetrics | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeResolutionState {
  return { payoffs: [], resolutionMetrics: null, typeAlias: {} }
}

export function registerPayoff(
  state: NarrativeResolutionState,
  type: PayoffType,
  plantedChapter: number,
  description: string,
  importance: number = 50
): NarrativeResolutionState {
  const id = `payoff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const payoff: PayoffInstance = { id, type, plantedChapter, payoffChapter: null, description, satisfactionScore: 0, importance, delivered: false }
  return { ...state, payoffs: [...state.payoffs, payoff] }
}

export function deliverPayoff(
  state: NarrativeResolutionState,
  payoffId: string,
  payoffChapter: number,
  satisfactionScore: number
): NarrativeResolutionState {
  const payoffs = state.payoffs.map(p => p.id === payoffId
    ? { ...p, payoffChapter, satisfactionScore: Math.max(0, Math.min(100, satisfactionScore)), delivered: true }
    : p
  )
  return { ...state, payoffs }
}

export function markRushedPayoff(state: NarrativeResolutionState, payoffId: string): NarrativeResolutionState {
  // Rushed payoffs have lower satisfaction
  const payoffs = state.payoffs.map(p => p.id === payoffId ? { ...p, satisfactionScore: Math.max(0, p.satisfactionScore - 30) } : p)
  return { ...state, payoffs }
}

export function generateResolutionMetrics(state: NarrativeResolutionState): ResolutionMetrics {
  if (state.payoffs.length === 0) {
    return { totalPayoffs: 0, deliveredPayoffs: 0, avgSatisfaction: 0, unresolvedCount: 0, rushedCount: 0, recommendations: [] }
  }
  
  const totalPayoffs = state.payoffs.length
  const deliveredPayoffs = state.payoffs.filter(p => p.delivered).length
  const unresolvedCount = state.payoffs.filter(p => !p.delivered).length
  const avgSatisfaction = deliveredPayoffs > 0
    ? Math.round(state.payoffs.filter(p => p.delivered).reduce((s, p) => s + p.satisfactionScore, 0) / deliveredPayoffs)
    : 0
  
  // Rushed = delivered but with low satisfaction relative to importance
  const rushedCount = state.payoffs.filter(p => p.delivered && p.satisfactionScore < p.importance * 0.5).length
  
  const recommendations: string[] = []
  if (unresolvedCount > totalPayoffs * 0.2) {
    recommendations.push(`${unresolvedCount} unresolved payoffs - deliver or cut`)
  }
  if (avgSatisfaction < 60) recommendations.push('Low resolution satisfaction - strengthen payoff delivery')
  if (rushedCount > deliveredPayoffs * 0.3) recommendations.push('Many rushed resolutions - give payoffs more space')
  if (deliveredPayoffs < totalPayoffs * 0.5) recommendations.push('Less than half payoffs delivered - prioritize for climax')
  if (avgSatisfaction > 80) recommendations.push('Strong resolution quality - maintain this for ending')
  if (state.payoffs.filter(p => p.type === 'character').length > totalPayoffs * 0.4) {
    recommendations.push('Heavy character payoff focus - balance with plot resolution')
  }
  
  return { totalPayoffs, deliveredPayoffs, avgSatisfaction, unresolvedCount, rushedCount, recommendations }
}

export function getPayoffStatus(state: NarrativeResolutionState): {
  pending: PayoffInstance[]
  delivered: PayoffInstance[]
  byType: Record<PayoffType, number>
} {
  const pending = state.payoffs.filter(p => !p.delivered)
  const delivered = state.payoffs.filter(p => p.delivered)
  const byType: Record<PayoffType, number> = { plot: 0, character: 0, thematic: 0, emotional: 0, mystery: 0 }
  for (const p of state.payoffs) byType[p.type]++
  return { pending, delivered, byType }
}

export function comparePayoffSatisfaction(state: NarrativeResolutionState, payoffId1: string, payoffId2: string): {
  moreSatisfying: string
  scoreDiff: number
} {
  const p1 = state.payoffs.find(p => p.id === payoffId1)
  const p2 = state.payoffs.find(p => p.id === payoffId2)
  if (!p1 || !p2) return { moreSatisfying: payoffId1, scoreDiff: 0 }
  return { moreSatisfying: p1.satisfactionScore > p2.satisfactionScore ? payoffId1 : payoffId2, scoreDiff: Math.abs(p1.satisfactionScore - p2.satisfactionScore) }
}
