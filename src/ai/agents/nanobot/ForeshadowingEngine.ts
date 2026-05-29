/**
 * ForeshadowingEngine — V379
 * Foreshadowing detection, planting and payoff tracking, narrative setup verification.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops), generic-agent (goal tracking)
 */

export type ForeshadowingType = 'subtle' | 'explicit' | 'symbolic' | 'dialogue' | 'action' | 'description'

export interface ForeshadowingInstance {
  id: string
  type: ForeshadowingType
  chapterId: string
  position: number  // 0-100
  text: string
  plantedHint: string
  payoffChapterId?: string
  payoffText?: string
  strength: number  // 0-100 (how obvious was the hint)
  payoffStrength?: number  // 0-100 (how satisfying was the payoff)
}

export interface ForeshadowingAnalysis {
  totalPlanted: number
  totalPayoff: number
  coverageRatio: number  // payoff / planted
  strongestForeshadowing: string | null
  danglingPlantings: ForeshadowingInstance[]
  recommendations: string[]
}

export interface ForeshadowingState {
  plantings: ForeshadowingInstance[]
  payoffs: ForeshadowingInstance[]
  analyses: ForeshadowingAnalysis | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ForeshadowingState {
  return { plantings: [], payoffs: [], analyses: null, typeAlias: {} }
}

function classifyForeshadowing(text: string): ForeshadowingType {
  const lower = text.toLowerCase()
  if (lower.includes('"') || lower.includes('"')) return 'dialogue'
  if (/^\w+(ed)\s/.test(text)) return 'action'  // past tense action
  if (lower.startsWith('the') || lower.startsWith('a') || lower.startsWith('an')) return 'description'
  if (['storm', 'shadow', 'echo', 'mirror', 'fire', 'water'].some(s => lower.includes(s))) return 'symbolic'
  if (text.split(/\s+/).length < 15) return 'subtle'
  return 'explicit'
}

export function plantForeshadowing(
  state: ForeshadowingState,
  type: ForeshadowingType,
  chapterId: string,
  position: number,
  text: string,
  plantedHint: string,
  strength: number = 50
): ForeshadowingState {
  const id = `fs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const instance: ForeshadowingInstance = { id, type, chapterId, position, text, plantedHint, strength }
  return { ...state, plantings: [...state.plantings, instance] }
}

export function registerPayoff(
  state: ForeshadowingState,
  chapterId: string,
  position: number,
  text: string,
  payoffText: string,
  payoffStrength: number = 70
): ForeshadowingState {
  // Match to the oldest unpaired planting
  const unpaired = state.plantings.filter(p => !p.payoffChapterId)
  if (unpaired.length === 0) return state
  const matched = unpaired[0]
  
  const updatedPlanting: ForeshadowingInstance = {
    ...matched,
    payoffChapterId: chapterId,
    payoffText,
    payoffStrength,
  }
  
  const updatedPlantings = state.plantings.map(p => p.id === matched.id ? updatedPlanting : p)
  const payoffInstance: ForeshadowingInstance = {
    id: `payoff_${Date.now()}`,
    type: matched.type,
    chapterId,
    position,
    text,
    plantedHint: matched.plantedHint,
    payoffChapterId: chapterId,
    payoffText,
    strength: matched.strength,
    payoffStrength,
  }
  
  return { ...state, plantings: updatedPlantings, payoffs: [...state.payoffs, payoffInstance] }
}

export function analyzeForeshadowing(state: ForeshadowingState): ForeshadowingAnalysis {
  const totalPlanted = state.plantings.length
  const totalPayoff = state.payoffs.length
  const coverageRatio = totalPlanted > 0 ? totalPayoff / totalPlanted : 0
  const danglingPlantings = state.plantings.filter(p => !p.payoffChapterId)
  
  const strongestForeshadowing = state.plantings.length > 0
    ? state.plantings.sort((a, b) => b.strength - a.strength)[0].plantedHint
    : null
  
  const recommendations: string[] = []
  if (coverageRatio < 0.5) recommendations.push('Too many unfulfilled foreshadowing plantings - deliver payoffs soon')
  if (coverageRatio > 0.9) recommendations.push('Good balance of planting and payoff')
  if (danglingPlantings.length > 5) recommendations.push(`Resolve ${danglingPlantings.length} dangling foreshadowings`)
  if (state.plantings.filter(p => p.type === 'subtle').length > state.plantings.length * 0.5) {
    recommendations.push('Consider making some foreshadowing more explicit for clarity')
  }
  
  return { totalPlanted, totalPayoff, coverageRatio, strongestForeshadowing, danglingPlantings, recommendations }
}

export function getForeshadowingForChapter(state: ForeshadowingState, chapterId: string): {
  plantings: ForeshadowingInstance[]
  payoffs: ForeshadowingInstance[]
} {
  return {
    plantings: state.plantings.filter(p => p.chapterId === chapterId),
    payoffs: state.payoffs.filter(p => p.chapterId === chapterId),
  }
}

export function compareForeshadowingStrength(state: ForeshadowingState, ch1: string, ch2: string): {
  moreEffective: string
  avgStrengthDiff: number
  payoffRateDiff: number
} {
  const c1Plantings = state.plantings.filter(p => p.chapterId === ch1)
  const c2Plantings = state.plantings.filter(p => p.chapterId === ch2)
  const c1Payoffs = state.payoffs.filter(p => p.chapterId === ch1)
  const c2Payoffs = state.payoffs.filter(p => p.chapterId === ch2)
  
  const c1AvgStrength = c1Plantings.length > 0 ? c1Plantings.reduce((s, p) => s + p.strength, 0) / c1Plantings.length : 0
  const c2AvgStrength = c2Plantings.length > 0 ? c2Plantings.reduce((s, p) => s + p.strength, 0) / c2Plantings.length : 0
  const c1PayoffRate = c1Plantings.length > 0 ? c1Payoffs.length / c1Plantings.length : 0
  const c2PayoffRate = c2Plantings.length > 0 ? c2Payoffs.length / c2Plantings.length : 0
  
  return {
    moreEffective: c1AvgStrength + c1PayoffRate * 50 > c2AvgStrength + c2PayoffRate * 50 ? ch1 : ch2,
    avgStrengthDiff: Math.abs(c1AvgStrength - c2AvgStrength),
    payoffRateDiff: Math.abs(c1PayoffRate - c2PayoffRate),
  }
}
