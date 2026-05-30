/**
 * NarrativeForeshadowingWeaver — V437
 * Foreshadowing density analysis, subtle hint tracking, payoff timing optimization.
 * Inspired by: generic-agent (optimization), ruflo (hierarchical decomposition), chatdev (pattern recognition)
 */

export type ForeshadowType = 'literal' | 'symbolic' | 'dialogue' | 'behavioral' | 'environmental'

export interface ForeshadowInstance {
  id: string
  hint: string
  foreshadowType: ForeshadowType
  chapterPlanted: number
  chapterPayoff: number | null
  subtlety: number  // 0-100 (how subtle - higher = more subtle)
  effectiveness: number  // 0-100 (how effective when noticed)
  isPaidOff: boolean
  plantCharacter: string  // who planted it
}

export interface ForeshadowReport {
  totalForeshadows: number
  paidOffForeshadows: number
  pendingForeshadows: number
  avgSubtlety: number
  denseRegions: number[]  // chapters with too much foreshadowing
  recommendations: string[]
}

export interface NarrativeForeshadowState {
  instances: ForeshadowInstance[]
  report: ForeshadowReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeForeshadowState {
  return { instances: [], report: null, typeAlias: {} }
}

export function plantForeshadow(
  state: NarrativeForeshadowState,
  hint: string,
  foreshadowType: ForeshadowType,
  chapter: number,
  subtlety: number,
  plantCharacter: string
): NarrativeForeshadowState {
  const id = `foreshadow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const instance: ForeshadowInstance = { id, hint, foreshadowType, chapterPlanted: chapter, chapterPayoff: null, subtlety: Math.max(0, Math.min(100, subtlety)), effectiveness: 50, isPaidOff: false, plantCharacter }
  return { ...state, instances: [...state.instances, instance] }
}

export function payOffForeshadow(state: NarrativeForeshadowState, foreshadowId: string, payoffChapter: number, effectiveness: number): NarrativeForeshadowState {
  const instances = state.instances.map(f => f.id === foreshadowId
    ? { ...f, chapterPayoff: payoffChapter, effectiveness: Math.max(0, Math.min(100, effectiveness)), isPaidOff: true }
    : f
  )
  return { ...state, instances }
}

export function generateForeshadowReport(state: NarrativeForeshadowState): ForeshadowReport {
  if (state.instances.length === 0) {
    return { totalForeshadows: 0, paidOffForeshadows: 0, pendingForeshadows: 0, avgSubtlety: 50, denseRegions: [], recommendations: [] }
  }
  
  const totalForeshadows = state.instances.length
  const paidOffForeshadows = state.instances.filter(f => f.isPaidOff).length
  const pendingForeshadows = state.instances.filter(f => !f.isPaidOff).length
  const avgSubtlety = Math.round(state.instances.reduce((s, f) => s + f.subtlety, 0) / totalForeshadows)
  
  // Find dense regions (chapters with >3 foreshadows)
  const chapterCounts: Record<number, number> = {}
  for (const f of state.instances) chapterCounts[f.chapterPlanted] = (chapterCounts[f.chapterPlanted] || 0) + 1
  const denseRegions = Object.entries(chapterCounts).filter(([, count]) => count > 3).map(([ch]) => Number(ch)).sort((a, b) => a - b)
  
  const recommendations: string[] = []
  if (pendingForeshadows > totalForeshadows * 0.6) {
    recommendations.push(`${pendingForeshadows} foreshadows not paid off - deliver some`)
  }
  if (avgSubtlety < 30) recommendations.push('Foreshadowing too obvious - add more subtle hints')
  if (denseRegions.length > 5) {
    recommendations.push(`${denseRegions.length} chapters have dense foreshadowing - spread out hints`)
  }
  if (state.instances.filter(f => f.subtlety > 80).length === 0 && totalForeshadows > 10) {
    recommendations.push('No highly subtle foreshadowing - add cryptic hints for engaged readers')
  }
  if (paidOffForeshadows > 0 && state.instances.filter(f => f.isPaidOff && f.effectiveness > 80).length === 0) {
    recommendations.push('Foreshadowing payoffs not effective - make hints clearer')
  }
  if (avgSubtlety > 70) recommendations.push('Good subtlety level - readers will feel rewarded when noticing')
  
  return { totalForeshadows, paidOffForeshadows, pendingForeshadows, avgSubtlety, denseRegions, recommendations }
}

export function getPendingForeshadows(state: NarrativeForeshadowState): ForeshadowInstance[] {
  return state.instances.filter(f => !f.isPaidOff)
}

export function getForeshadowByType(state: NarrativeForeshadowState, foreshadowType: ForeshadowType): ForeshadowInstance[] {
  return state.instances.filter(f => f.foreshadowType === foreshadowType)
}

export function getPayoffTiming(state: NarrativeForeshadowState, foreshadowId: string): number | null {
  const f = state.instances.find(inst => inst.id === foreshadowId)
  if (!f || !f.chapterPayoff) return null
  return f.chapterPayoff - f.chapterPlanted
}
