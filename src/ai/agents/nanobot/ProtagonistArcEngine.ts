/**
 * ProtagonistArcEngine — V395
 * Protagonist development tracking, internal journey, character growth measurement across story arc.
 * Inspired by: ruflo (hierarchical decomposition), chatdev (character analysis), generic-agent (goal tracking)
 */

export interface Belief {
  id: string
  description: string
  polarity: 'positive' | 'negative' | 'neutral'
  strength: number  // 0-100
}

export interface Want {
  id: string
  description: string
  urgency: number  // 0-100
  obstacleLevel: number  // 0-100
}

export interface ProtagonistState {
  name: string
  beliefs: Belief[]
  wants: Want[]
  flaw: string
  growthStage: GrowthStage
  arcProgress: number  // 0-100
}

export type GrowthStage = 'ordinary_world' | 'call_to_adventure' | 'refusal' | 'acceptance' | 'trials' | 'revelation' | 'return'

export interface ArcPhase {
  stage: GrowthStage
  startProgress: number
  endProgress: number
  keyChange: string
  conflict: string
}

export interface GrowthReport {
  totalBeliefs: number
  totalWants: number
  growthAchieved: number
  currentStage: GrowthStage
  nextMilestone: string | null
  recommendations: string[]
}

export interface ProtagonistArcState {
  protagonist: ProtagonistState | null
  arcPhases: ArcPhase[]
  growthReport: GrowthReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ProtagonistArcState {
  return { protagonist: null, arcPhases: [], growthReport: null, typeAlias: {} }
}

export function initProtagonist(
  state: ProtagonistArcState,
  name: string,
  initialBeliefs: Array<{ description: string; polarity: Belief['polarity']; strength: number }>,
  initialWants: Array<{ description: string; urgency: number; obstacleLevel: number }>,
  flaw: string
): ProtagonistArcState {
  const beliefs: Belief[] = initialBeliefs.map((b, i) => ({ id: `belief_${i}`, ...b }))
  const wants: Want[] = initialWants.map((w, i) => ({ id: `want_${i}`, ...w }))
  
  const protagonist: ProtagonistState = {
    name,
    beliefs,
    wants,
    flaw,
    growthStage: 'ordinary_world',
    arcProgress: 0,
  }
  
  return { ...state, protagonist }
}

export function updateBelief(
  state: ProtagonistArcState,
  beliefId: string,
  newStrength: number
): ProtagonistArcState {
  if (!state.protagonist) return state
  const beliefs = state.protagonist.beliefs.map(b => b.id === beliefId ? { ...b, strength: newStrength } : b)
  return { ...state, protagonist: { ...state.protagonist, beliefs } }
}

export function addWant(state: ProtagonistArcState, description: string, urgency: number, obstacleLevel: number): ProtagonistArcState {
  if (!state.protagonist) return state
  const newWant: Want = { id: `want_${Date.now()}`, description, urgency, obstacleLevel }
  return { ...state, protagonist: { ...state.protagonist, wants: [...state.protagonist.wants, newWant] } }
}

export function advanceGrowthStage(state: ProtagonistArcState, newStage: GrowthStage, arcProgress: number): ProtagonistArcState {
  if (!state.protagonist) return state
  return { ...state, protagonist: { ...state.protagonist, growthStage: newStage, arcProgress } }
}

export function addArcPhase(
  state: ProtagonistArcState,
  stage: GrowthStage,
  startProgress: number,
  endProgress: number,
  keyChange: string,
  conflict: string
): ProtagonistArcState {
  const arcPhase: ArcPhase = { stage, startProgress, endProgress, keyChange, conflict }
  return { ...state, arcPhases: [...state.arcPhases, arcPhase] }
}

export function generateGrowthReport(state: ProtagonistArcState): GrowthReport {
  if (!state.protagonist) {
    return { totalBeliefs: 0, totalWants: 0, growthAchieved: 0, currentStage: 'ordinary_world' as GrowthStage, nextMilestone: null, recommendations: [] }
  }
  
  const { protagonist } = state
  const totalBeliefs = protagonist.beliefs.length
  const totalWants = protagonist.wants.length
  const growthAchieved = protagonist.arcProgress
  
  const stageOrder: GrowthStage[] = ['ordinary_world', 'call_to_adventure', 'refusal', 'acceptance', 'trials', 'revelation', 'return']
  const currentStageIdx = stageOrder.indexOf(protagonist.growthStage)
  const nextMilestone = currentStageIdx < stageOrder.length - 1 ? stageOrder[currentStageIdx + 1] : null
  
  const recommendations: string[] = []
  if (growthAchieved < 20) recommendations.push('Protagonist is still in early stages - focus on building the call')
  if (growthAchieved > 80 && currentStageIdx < 5) recommendations.push('Almost at climax - ensure protagonist is ready for final challenge')
  if (protagonist.beliefs.filter(b => b.polarity === 'negative').length > totalBeliefs * 0.5) {
    recommendations.push('Many negative beliefs - protagonist needs positive growth to balance arc')
  }
  if (protagonist.wants.length < 2) recommendations.push('Add more character wants to enrich the arc')
  if (growthAchieved > 50 && state.arcPhases.length < 3) recommendations.push('Midpoint reached - add more arc phases for structure')
  
  return {
    totalBeliefs,
    totalWants,
    growthAchieved,
    currentStage: protagonist.growthStage,
    nextMilestone,
    recommendations,
  }
}

export function measureBeliefShift(state: ProtagonistArcState, beliefId: string): 'strengthened' | 'weakened' | 'unchanged' | 'flipped' {
  if (!state.protagonist) return 'unchanged'
  const belief = state.protagonist.beliefs.find(b => b.id === beliefId)
  if (!belief) return 'unchanged'
  const initialStrength = belief.strength
  const arcPhases = state.arcPhases
  
  // Find latest phase that might affect belief
  const latestPhase = arcPhases.sort((a, b) => b.endProgress - a.endProgress)[0]
  if (!latestPhase) return 'unchanged'
  
  // Simple logic: if arc is in later stages, beliefs shift
  if (latestPhase.endProgress > 60) {
    if (belief.polarity === 'negative') return 'weakened'
    return 'strengthened'
  }
  return 'unchanged'
}
