/**
 * NarrativeArcConsolidator — V459
 * Arc consolidation, story arc completion tracking, resolution completeness and payoff delivery analysis.
 * Inspired by: generic-agent (validation), chatdev (completeness), thunderbolt (feedback loops)
 */

export type ArcType = 'main' | 'romantic' | 'thematic' | 'character' | 'subplot'
export type ArcStatus = 'active' | 'wound_up' | 'resolved' | 'abandoned' | 'broken'

export interface StoryArc {
  id: string
  arcType: ArcType
  name: string
  chaptersActive: number[]
  setupWeight: number  // 0-100 (how well setup was done)
  payoffWeight: number  // 0-100 (how satisfying the payoff)
  emotionalResonance: number  // 0-100
  status: ArcStatus
  completenessScore: number  // 0-100
}

export interface ArcReport {
  totalArcs: number
  resolvedArcs: number
  avgCompleteness: number
  abandonedArcs: number
  recommendations: string[]
}

export interface NarrativeArcConsolidatorState {
  arcs: StoryArc[]
  report: ArcReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeArcConsolidatorState {
  return { arcs: [], report: null, typeAlias: {} }
}

export function createArc(
  state: NarrativeArcConsolidatorState,
  arcType: ArcType,
  name: string,
  chaptersActive: number[]
): NarrativeArcConsolidatorState {
  const id = `arc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const arc: StoryArc = { id, arcType, name, chaptersActive, setupWeight: 50, payoffWeight: 50, emotionalResonance: 50, status: 'active', completenessScore: 50 }
  return { ...state, arcs: [...state.arcs, arc] }
}

export function windUpArc(state: NarrativeArcConsolidatorState, arcId: string, payoffQuality: number): NarrativeArcConsolidatorState {
  const arcs = state.arcs.map(a => {
    if (a.id !== arcId) return a
    const completeness = Math.round((a.setupWeight * 0.4 + payoffQuality * 0.4 + a.emotionalResonance * 0.2))
    return { ...a, status: 'wound_up', payoffWeight: payoffQuality, completenessScore: completeness }
  })
  return { ...state, arcs }
}

export function resolveArc(state: NarrativeArcConsolidatorState, arcId: string, emotionalResonance: number): NarrativeArcConsolidatorState {
  const arcs = state.arcs.map(a => {
    if (a.id !== arcId) return a
    const completeness = Math.round((a.setupWeight * 0.4 + a.payoffWeight * 0.4 + emotionalResonance * 0.2))
    return { ...a, status: 'resolved', emotionalResonance, completenessScore: completeness }
  })
  return { ...state, arcs }
}

export function abandonArc(state: NarrativeArcConsolidatorState, arcId: string): NarrativeArcConsolidatorState {
  const arcs = state.arcs.map(a => a.id === arcId ? { ...a, status: 'abandoned' as ArcStatus } : a)
  return { ...state, arcs }
}

export function generateArcReport(state: NarrativeArcConsolidatorState): ArcReport {
  if (state.arcs.length === 0) {
    return { totalArcs: 0, resolvedArcs: 0, avgCompleteness: 0, abandonedArcs: 0, recommendations: [] }
  }
  
  const totalArcs = state.arcs.length
  const resolvedArcs = state.arcs.filter(a => a.status === 'resolved').length
  const abandonedArcs = state.arcs.filter(a => a.status === 'abandoned').length
  const avgCompleteness = Math.round(state.arcs.reduce((s, a) => s + a.completenessScore, 0) / totalArcs)
  
  const recommendations: string[] = []
  if (abandonedArcs > totalArcs * 0.3) {
    recommendations.push(`${abandonedArcs} abandoned arcs - resolve or cut loose threads`)
  }
  if (resolvedArcs < totalArcs * 0.5) {
    recommendations.push('Many unresolved arcs - prioritize main arc resolution')
  }
  if (avgCompleteness < 50) {
    recommendations.push('Low arc completeness - strengthen setups and payoffs')
  }
  if (state.arcs.filter(a => a.arcType === 'main').some(a => a.status !== 'resolved')) {
    recommendations.push('Main arc not resolved - deliver final payoff before ending')
  }
  if (resolvedArcs === totalArcs) {
    recommendations.push('All arcs resolved - excellent narrative completeness')
  }
  
  return { totalArcs, resolvedArcs, avgCompleteness, abandonedArcs, recommendations }
}

export function getArcsByType(state: NarrativeArcConsolidatorState, arcType: ArcType): StoryArc[] {
  return state.arcs.filter(a => a.arcType === arcType)
}

export function getUnresolvedArcs(state: NarrativeArcConsolidatorState): StoryArc[] {
  return state.arcs.filter(a => a.status === 'active' || a.status === 'wound_up')
}
