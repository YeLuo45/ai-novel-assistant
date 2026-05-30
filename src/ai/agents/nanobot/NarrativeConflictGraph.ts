/**
 * NarrativeConflictGraph — V425
 * Conflict relationship mapping, character opposition matrix, tension web visualization for complex narratives.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops), chatdev (multi-character coordination)
 */

export type ConflictType = 'ideological' | 'physical' | 'emotional' | 'internal' | 'societal' | 'resource'

export interface ConflictEdge {
  id: string
  sourceId: string
  targetId: string
  conflictType: ConflictType
  intensity: number  // 0-100
  escalationLevel: number  // 0-5 (how escalated)
  resolutionStatus: 'unresolved' | 'partial' | 'resolved'
  chapters: number[]
}

export interface ConflictNode {
  characterId: string
  conflictsInvolved: number
  totalIntensity: number
  conflictTypes: ConflictType[]
  isCentralFigure: boolean  // involved in most conflicts
}

export interface ConflictGraphReport {
  totalConflicts: number
  centralFigures: string[]
  unresolvedTensions: string[]
  escalationHotspots: string[]
  recommendations: string[]
}

export interface NarrativeConflictState {
  edges: ConflictEdge[]
  nodes: ConflictNode[]
  report: ConflictGraphReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeConflictState {
  return { edges: [], nodes: [], report: null, typeAlias: {} }
}

export function registerConflict(
  state: NarrativeConflictState,
  sourceId: string,
  targetId: string,
  conflictType: ConflictType,
  intensity: number,
  chapter: number
): NarrativeConflictState {
  const existing = state.edges.find(
    e => (e.sourceId === sourceId && e.targetId === targetId) ||
         (e.sourceId === targetId && e.targetId === sourceId)
  )
  if (existing) {
    const chapters = existing.chapters.includes(chapter) ? existing.chapters : [...existing.chapters, chapter].sort((a, b) => a - b)
    const edges = state.edges.map(e => {
      if ((e.sourceId === sourceId && e.targetId === targetId) ||
          (e.sourceId === targetId && e.targetId === sourceId)) {
        return { ...e, intensity: Math.max(e.intensity, intensity), escalationLevel: Math.min(5, e.escalationLevel + 1), chapters }
      }
      return e
    })
    return { ...state, edges }
  }
  
  const id = `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const edge: ConflictEdge = { id, sourceId, targetId, conflictType, intensity, escalationLevel: 1, resolutionStatus: 'unresolved', chapters: [chapter] }
  return { ...state, edges: [...state.edges, edge] }
}

export function resolveConflict(state: NarrativeConflictState, edgeId: string, status: 'partial' | 'resolved'): NarrativeConflictState {
  const edges = state.edges.map(e => e.id === edgeId ? { ...e, resolutionStatus: status } : e)
  return { ...state, edges }
}

export function escalateConflict(state: NarrativeConflictState, edgeId: string): NarrativeConflictState {
  const edges = state.edges.map(e => e.id === edgeId && e.escalationLevel < 5 ? { ...e, escalationLevel: e.escalationLevel + 1 } : e)
  return { ...state, edges }
}

function computeNodes(state: NarrativeConflictState): ConflictNode[] {
  const characterIds = [...new Set(state.edges.flatMap(e => [e.sourceId, e.targetId]))]
  return characterIds.map(charId => {
    const charEdges = state.edges.filter(e => e.sourceId === charId || e.targetId === charId)
    const conflictsInvolved = charEdges.length
    const totalIntensity = charEdges.reduce((s, e) => s + e.intensity, 0)
    const conflictTypes = [...new Set(charEdges.map(e => e.conflictType))]
    const isCentralFigure = conflictsInvolved >= 3
    return { characterId: charId, conflictsInvolved, totalIntensity, conflictTypes, isCentralFigure }
  })
}

export function generateConflictReport(state: NarrativeConflictState): ConflictGraphReport {
  if (state.edges.length === 0) {
    return { totalConflicts: 0, centralFigures: [], unresolvedTensions: [], escalationHotspots: [], recommendations: [] }
  }
  
  const nodes = computeNodes(state)
  const totalConflicts = state.edges.length
  const centralFigures = nodes.filter(n => n.isCentralFigure).map(n => n.characterId)
  const unresolvedTensions = state.edges.filter(e => e.resolutionStatus === 'unresolved').map(e => e.id)
  const escalationHotspots = state.edges.filter(e => e.escalationLevel >= 4).map(e => e.id)
  
  const recommendations: string[] = []
  if (centralFigures.length === 0 && nodes.length > 3) recommendations.push('No clear central conflict figures - establish a main opposition')
  if (unresolvedTensions.length > totalConflicts * 0.7) {
    recommendations.push(`${unresolvedTensions.length} unresolved conflicts - resolve some for narrative closure`)
  }
  if (escalationHotspots.length > totalConflicts * 0.3) {
    recommendations.push(`${escalationHotspots.length} highly escalated conflicts - may need de-escalation`)
  }
  if (nodes.length > 10 && centralFigures.length < 2) {
    recommendations.push('Large cast with few central conflict figures - balance cast involvement')
  }
  if (state.edges.filter(e => e.conflictType === 'internal').length === 0) {
    recommendations.push('No internal conflicts - add character internal struggle for depth')
  }
  if (centralFigures.length > 0) {
    recommendations.push(`${centralFigures.length} central conflict figures - ensure their arcs are satisfying`)
  }
  
  return { totalConflicts, centralFigures, unresolvedTensions, escalationHotspots, recommendations }
}

export function getCharacterConflicts(state: NarrativeConflictState, characterId: string): ConflictEdge[] {
  return state.edges.filter(e => e.sourceId === characterId || e.targetId === characterId)
}

export function compareConflictIntensity(state: NarrativeConflictState, edgeId1: string, edgeId2: string): {
  moreIntense: string
  intensity1: number
  intensity2: number
} {
  const e1 = state.edges.find(e => e.id === edgeId1)
  const e2 = state.edges.find(e => e.id === edgeId2)
  if (!e1 || !e2) return { moreIntense: edgeId1, intensity1: 0, intensity2: 0 }
  return { moreIntense: e1.intensity > e2.intensity ? edgeId1 : edgeId2, intensity1: e1.intensity, intensity2: e2.intensity }
}
