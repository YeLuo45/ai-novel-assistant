/**
 * CharacterRelationshipAnalyzer — V359
 * Character relationship dynamics, conflict potential, emotional valence tracking.
 * Inspired by: chatdev (role analysis), generic-agent (relationship graphs)
 */

export type RelationshipType = 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'mentor' | 'rival'
export type InteractionTone = 'positive' | 'negative' | 'neutral' | 'complex'

export interface Relationship {
  charId1: string
  charId2: string
  type: RelationshipType
  strength: number  // -100 to +100
  history: Interaction[]
  lastInteraction?: number
}

export interface Interaction {
  id: string
  timestamp: number
  tone: InteractionTone
  description: string
  location?: string
}

export interface RelationshipState {
  relationships: Record<string, Relationship>
  currentTensions: Record<string, number>  // pairKey -> tension 0-100
  typeAlias: Record<string, unknown>
}

function makeKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('::')
}

export function createEmptyState(): RelationshipState {
  return { relationships: {}, currentTensions: {}, typeAlias: {} }
}

export function defineRelationship(
  state: RelationshipState,
  charId1: string,
  charId2: string,
  type: RelationshipType,
  strength: number = 0
): RelationshipState {
  const key = makeKey(charId1, charId2)
  const rel: Relationship = {
    charId1, charId2, type, strength,
    history: [],
  }
  return { ...state, relationships: { ...state.relationships, [key]: rel } }
}

export function recordInteraction(
  state: RelationshipState,
  charId1: string,
  charId2: string,
  tone: InteractionTone,
  description: string,
  location?: string
): RelationshipState {
  const key = makeKey(charId1, charId2)
  const rel = state.relationships[key]
  if (!rel) return state
  const interaction: Interaction = {
    id: `int_${Date.now()}`,
    timestamp: Date.now(),
    tone, description, location,
  }
  const history = [...rel.history, interaction]
  const lastInteraction = Date.now()
  const strengthDelta = tone === 'positive' ? 5 : tone === 'negative' ? -5 : 0
  const newStrength = Math.max(-100, Math.min(100, rel.strength + strengthDelta))
  const updated = { ...rel, history, lastInteraction, strength: newStrength }
  const relationships = { ...state.relationships, [key]: updated }
  // Update tension
  const tensionKey = key
  const baseTension = newStrength < 0 ? Math.abs(newStrength) : 0
  const currentTensions = { ...state.currentTensions, [tensionKey]: baseTension }
  return { ...state, relationships, currentTensions }
}

export function getRelationship(state: RelationshipState, charId1: string, charId2: string): Relationship | null {
  return state.relationships[makeKey(charId1, charId2)] || null
}

export function getTension(state: RelationshipState, charId1: string, charId2: string): number {
  return state.currentTensions[makeKey(charId1, charId2)] || 0
}

export function analyzeConflictPotential(state: RelationshipState, charId1: string, charId2: string): {
  potential: 'high' | 'medium' | 'low'
  reasons: string[]
} {
  const rel = getRelationship(state, charId1, charId2)
  const reasons: string[] = []
  if (!rel) return { potential: 'low', reasons: ['No relationship defined'] }
  if (rel.type === 'enemy' || rel.type === 'rival') reasons.push('Enemy/rival relationship type')
  if (rel.strength < -50) reasons.push('Strong negative bond')
  const tension = getTension(state, charId1, charId2)
  if (tension > 70) reasons.push('High current tension')
  const recentNegative = rel.history.slice(-5).filter(i => i.tone === 'negative').length
  if (recentNegative >= 3) reasons.push('Multiple recent negative interactions')
  const potential: 'high' | 'medium' | 'low' = reasons.length >= 2 ? 'high' : reasons.length === 1 ? 'medium' : 'low'
  return { potential, reasons }
}

export function getAlliedCharacters(state: RelationshipState, charId: string): string[] {
  return Object.values(state.relationships)
    .filter(r => (r.charId1 === charId || r.charId2 === charId) && (r.type === 'ally' || r.type === 'romantic'))
    .map(r => r.charId1 === charId ? r.charId2 : r.charId1)
}

export function getRivalCharacters(state: RelationshipState, charId: string): string[] {
  return Object.values(state.relationships)
    .filter(r => (r.charId1 === charId || r.charId2 === charId) && (r.type === 'rival' || r.type === 'enemy'))
    .map(r => r.charId1 === charId ? r.charId2 : r.charId1)
}

export function getRelationshipSummary(state: RelationshipState, charId: string) {
  const rels = Object.values(state.relationships).filter(r => r.charId1 === charId || r.charId2 === charId)
  return {
    totalRelationships: rels.length,
    allies: getAlliedCharacters(state, charId).length,
    rivals: getRivalCharacters(state, charId).length,
    strongestBond: rels.length > 0 ? Math.max(...rels.map(r => Math.abs(r.strength))) : 0,
    mostConflicted: rels.length > 0 ? rels.reduce((worst, r) => {
      const tension = getTension(state, r.charId1, r.charId2)
      return tension > getTension(state, worst.charId1, worst.charId2) ? r : worst
    }, rels[0]) : null,
  }
}
