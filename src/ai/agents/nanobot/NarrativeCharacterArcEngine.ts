/**
 * NarrativeCharacterArcEngine — V471
 * Character arc tracking, transformation analysis, character growth mapping across story.
 * Inspired by: chatdev (character synthesis), generic-agent (optimization), thunderbolt (feedback)
 */

export type ArcPhase = 'setup' | 'challenge' | 'breakdown' | 'transformation' | 'integration'

export interface CharacterArc {
  id: string
  characterId: string
  startChapter: number
  currentPhase: ArcPhase
  phases: { phase: ArcPhase; chapter: number }[]
  transformationScore: number  // 0-100
  consistencyScore: number  // 0-100
}

export interface CharacterArcReport {
  totalArcs: number
  avgTransformation: number
  fullyDeveloped: number
  recommendations: string[]
}

export interface NarrativeCharacterArcState {
  arcs: CharacterArc[]
  report: CharacterArcReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeCharacterArcState {
  return { arcs: [], report: null, typeAlias: {} }
}

export function startCharacterArc(state: NarrativeCharacterArcState, characterId: string, chapter: number): NarrativeCharacterArcState {
  const id = `arc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const arc: CharacterArc = { id, characterId, startChapter: chapter, currentPhase: 'setup', phases: [{ phase: 'setup', chapter }], transformationScore: 30, consistencyScore: 80 }
  return { ...state, arcs: [...state.arcs, arc] }
}

export function advancePhase(state: NarrativeCharacterArcState, characterId: string, newPhase: ArcPhase, chapter: number): NarrativeCharacterArcState {
  const arcs = state.arcs.map(a => {
    if (a.characterId !== characterId) return a
    const phases = [...a.phases, { phase: newPhase, chapter }]
    let transformationScore = a.transformationScore
    if (newPhase === 'challenge') transformationScore += 15
    else if (newPhase === 'breakdown') transformationScore += 20
    else if (newPhase === 'transformation') transformationScore += 25
    else if (newPhase === 'integration') transformationScore += 10
    transformationScore = Math.min(100, transformationScore)
    return { ...a, currentPhase: newPhase, phases, transformationScore }
  })
  return { ...state, arcs }
}

export function generateCharacterArcReport(state: NarrativeCharacterArcState): CharacterArcReport {
  if (state.arcs.length === 0) {
    return { totalArcs: 0, avgTransformation: 0, fullyDeveloped: 0, recommendations: [] }
  }
  const totalArcs = state.arcs.length
  const avgTransformation = Math.round(state.arcs.reduce((s, a) => s + a.transformationScore, 0) / totalArcs)
  const fullyDeveloped = state.arcs.filter(a => a.currentPhase === 'integration').length
  const recommendations: string[] = []
  if (avgTransformation < 50) recommendations.push('Low character transformation - deepen character arcs')
  if (state.arcs.some(a => a.phases.length === 1)) recommendations.push('Some characters have no arc development')
  if (fullyDeveloped < totalArcs * 0.3) recommendations.push('Few characters reach integration - develop more arcs fully')
  if (state.arcs.some(a => a.consistencyScore < 50)) recommendations.push('Some character inconsistencies - review behavior patterns')
  return { totalArcs, avgTransformation, fullyDeveloped, recommendations }
}

export function getCharacterArc(state: NarrativeCharacterArcState, characterId: string): CharacterArc | null {
  return state.arcs.find(a => a.characterId === characterId) || null
}
