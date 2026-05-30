/**
 * CharacterMotivationEngine — V409
 * Character motivation analysis, goal consistency, desire tracking across narrative arc.
 * Inspired by: chatdev (character analysis), generic-agent (goal tracking), ruflo (hierarchical decomposition)
 */

export type MotivationType = 'survival' | 'power' | 'love' | 'revenge' | 'justice' | 'curiosity' | 'belonging' | 'freedom' | 'identity' | 'redemption'

export interface Motivation {
  id: string
  type: MotivationType
  description: string
  strength: number  // 0-100
  clarity: number  // 0-100 (how well-defined)
  consistency: number  // 0-100 (alignment with character)
}

export interface Goal {
  id: string
  characterId: string
  motivationId: string | null
  description: string
  urgency: number  // 0-100
  feasibility: number  // 0-100
  achieved: boolean
  chapterAchieved: number | null
}

export interface MotivationAnalysis {
  totalMotivations: number
  dominantMotivation: MotivationType | null
  inconsistentCharacters: string[]
  unalignedGoals: string[]
  recommendations: string[]
}

export interface CharacterMotivationState {
  motivations: Motivation[]
  goals: Goal[]
  analysis: MotivationAnalysis | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): CharacterMotivationState {
  return { motivations: [], goals: [], analysis: null, typeAlias: {} }
}

export function registerMotivation(
  state: CharacterMotivationState,
  characterId: string,
  type: MotivationType,
  description: string,
  strength: number = 60,
  clarity: number = 50
): CharacterMotivationState {
  const id = `motivation_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const motivation: Motivation = { id, type, description, strength, clarity, consistency: 70 }
  return { ...state, motivations: [...state.motivations, motivation] }
}

export function registerGoal(
  state: CharacterMotivationState,
  characterId: string,
  description: string,
  motivationId: string | null,
  urgency: number = 50,
  feasibility: number = 50
): CharacterMotivationState {
  const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const goal: Goal = { id, characterId, motivationId, description, urgency, feasibility, achieved: false, chapterAchieved: null }
  return { ...state, goals: [...state.goals, goal] }
}

export function updateMotivationStrength(state: CharacterMotivationState, motivationId: string, newStrength: number): CharacterMotivationState {
  const motivations = state.motivations.map(m => m.id === motivationId ? { ...m, strength: Math.max(0, Math.min(100, newStrength)) } : m)
  return { ...state, motivations }
}

export function achieveGoal(state: CharacterMotivationState, goalId: string, chapter: number): CharacterMotivationState {
  const goals = state.goals.map(g => g.id === goalId ? { ...g, achieved: true, chapterAchieved: chapter } : g)
  return { ...state, goals }
}

export function generateAnalysis(state: CharacterMotivationState): MotivationAnalysis {
  if (state.motivations.length === 0) {
    return { totalMotivations: 0, dominantMotivation: null, inconsistentCharacters: [], unalignedGoals: [], recommendations: [] }
  }
  
  const totalMotivations = state.motivations.length
  const typeCounts: Record<MotivationType, number> = { survival: 0, power: 0, love: 0, revenge: 0, justice: 0, curiosity: 0, belonging: 0, freedom: 0, identity: 0, redemption: 0 }
  for (const m of state.motivations) typeCounts[m.type]++
  const dominantMotivation = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as MotivationType) || null
  
  const inconsistentCharacters: string[] = []
  const unalignedGoals: string[] = []
  
  // Check motivation clarity
  for (const m of state.motivations) {
    if (m.clarity < 40) inconsistentCharacters.push(`low_clarity_${m.id.slice(0, 8)}`)
  }
  
  // Check goal-feasibility alignment
  for (const g of state.goals) {
    if (g.urgency > 70 && g.feasibility < 30) unalignedGoals.push(g.description.slice(0, 30))
  }
  
  const recommendations: string[] = []
  if (state.motivations.filter(m => m.clarity < 50).length > totalMotivations * 0.4) {
    recommendations.push('Many unclear motivations - define goals more precisely')
  }
  if (state.goals.filter(g => !g.achieved).length > 10) recommendations.push('Too many unresolved goals - achieve or abandon some')
  if (dominantMotivation) recommendations.push(`${dominantMotivation} is the dominant motivation - ensure it drives the climax`)
  if (unalignedGoals.length > 2) recommendations.push('Some goals have high urgency but low feasibility - adjust balance')
  if (state.goals.filter(g => g.achieved).length > state.goals.length * 0.6) recommendations.push('Good goal completion rate - maintain momentum')
  
  return { totalMotivations, dominantMotivation, inconsistentCharacters, unalignedGoals, recommendations }
}

export function getCharacterGoals(state: CharacterMotivationState, characterId: string): Goal[] {
  return state.goals.filter(g => g.characterId === characterId)
}

export function compareMotivation(state: CharacterMotivationState, motivationId1: string, motivationId2: string): {
  stronger: string
  strengthDiff: number
} {
  const m1 = state.motivations.find(m => m.id === motivationId1)
  const m2 = state.motivations.find(m => m.id === motivationId2)
  if (!m1 || !m2) return { stronger: motivationId1, strengthDiff: 0 }
  return { stronger: m1.strength > m2.strength ? motivationId1 : motivationId2, strengthDiff: Math.abs(m1.strength - m2.strength) }
}
