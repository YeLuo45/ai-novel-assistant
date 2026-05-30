/**
 * NarrativeEnsembleTracker — V423
 * Ensemble cast management, multi-character balance, cast interaction matrix for large casts.
 * Inspired by: chatdev (multi-character coordination), nanobot (distributed mesh), generic-agent (optimization)
 */

export type CharacterRole = 'protagonist' | 'deuteragonist' | 'supporting' | 'minor' | 'cameo'

export interface CastMember {
  id: string
  name: string
  role: CharacterRole
  screenTime: number  // estimated pages/scenes
  arcStatus: 'complete' | 'developing' | 'static' | 'absent'
  importance: number  // 0-100 (narrative weight)
}

export interface CharacterInteraction {
  characterId1: string
  characterId2: string
  sceneCount: number
  relationshipType: 'alliance' | 'conflict' | 'neutral' | 'romantic' | 'familial'
  tensionLevel: number  // 0-100
  chemistryScore: number  // 0-100
}

export interface EnsembleReport {
  totalCast: number
  castBalance: number  // 0-100 (how balanced screen time is)
  mainCastSize: number
  interactionCount: number
  characterRoles: Record<CharacterRole, number>
  recommendations: string[]
}

export interface NarrativeEnsembleState {
  cast: CastMember[]
  interactions: CharacterInteraction[]
  report: EnsembleReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeEnsembleState {
  return { cast: [], interactions: [], report: null, typeAlias: {} }
}

export function addCastMember(
  state: NarrativeEnsembleState,
  name: string,
  role: CharacterRole,
  importance: number = 50
): NarrativeEnsembleState {
  const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const member: CastMember = { id, name, role, screenTime: 0, arcStatus: 'static', importance }
  return { ...state, cast: [...state.cast, member] }
}

export function registerInteraction(
  state: NarrativeEnsembleState,
  characterId1: string,
  characterId2: string,
  relationshipType: CharacterInteraction['relationshipType'],
  tensionLevel: number = 50
): NarrativeEnsembleState {
  const existing = state.interactions.find(
    i => (i.characterId1 === characterId1 && i.characterId2 === characterId2) ||
         (i.characterId1 === characterId2 && i.characterId2 === characterId1)
  )
  if (existing) {
    const interactions = state.interactions.map(i => {
      if ((i.characterId1 === characterId1 && i.characterId2 === characterId2) ||
          (i.characterId1 === characterId2 && i.characterId2 === characterId1)) {
        return { ...i, sceneCount: i.sceneCount + 1, tensionLevel: Math.round((i.tensionLevel + tensionLevel) / 2) }
      }
      return i
    })
    return { ...state, interactions }
  }
  
  const interaction: CharacterInteraction = { characterId1, characterId2, sceneCount: 1, relationshipType, tensionLevel, chemistryScore: 50 }
  return { ...state, interactions: [...state.interactions, interaction] }
}

export function updateScreenTime(state: NarrativeEnsembleState, characterId: string, pages: number): NarrativeEnsembleState {
  const cast = state.cast.map(c => c.id === characterId ? { ...c, screenTime: c.screenTime + pages } : c)
  return { ...state, cast }
}

export function generateEnsembleReport(state: NarrativeEnsembleState): EnsembleReport {
  if (state.cast.length === 0) {
    return { totalCast: 0, castBalance: 0, mainCastSize: 0, interactionCount: 0, characterRoles: { protagonist: 0, deuteragonist: 0, supporting: 0, minor: 0, cameo: 0 }, recommendations: [] }
  }
  
  const totalCast = state.cast.length
  const mainCastSize = state.cast.filter(c => c.role === 'protagonist' || c.role === 'deuteragonist').length
  
  // Cast balance: variance in screen time
  const screenTimes = state.cast.map(c => c.screenTime)
  const avgST = screenTimes.reduce((a, b) => a + b, 0) / totalCast
  const balanceScore = Math.max(0, 100 - (screenTimes.reduce((s, st) => s + Math.abs(st - avgST), 0) / totalCast))
  
  const characterRoles: Record<CharacterRole, number> = { protagonist: 0, deuteragonist: 0, supporting: 0, minor: 0, cameo: 0 }
  for (const c of state.cast) characterRoles[c.role]++
  
  const recommendations: string[] = []
  if (totalCast > 15) recommendations.push(`Large cast (${totalCast}) - ensure every character has purpose`)
  if (balanceScore < 50) recommendations.push('Unbalanced screen time - redistribute character presence')
  if (mainCastSize < 3 && totalCast > 10) recommendations.push('Too few main characters for large cast - elevate some')
  if (state.interactions.length < totalCast * 0.5) recommendations.push('Few character interactions - add relationship moments')
  if (state.cast.filter(c => c.arcStatus === 'static').length > totalCast * 0.6) {
    recommendations.push('Many static characters - give arcs to main cast')
  }
  if (balanceScore > 75) recommendations.push('Good cast balance - maintain even distribution')
  
  return {
    totalCast,
    castBalance: Math.round(balanceScore),
    mainCastSize,
    interactionCount: state.interactions.length,
    characterRoles,
    recommendations,
  }
}

export function getCharacterInteractions(state: NarrativeEnsembleState, characterId: string): CharacterInteraction[] {
  return state.interactions.filter(i => i.characterId1 === characterId || i.characterId2 === characterId)
}

export function getCharacterByRole(state: NarrativeEnsembleState, role: CharacterRole): CastMember[] {
  return state.cast.filter(c => c.role === role)
}
