/**
 * ConflictLayeringEngine — V403
 * Multiple conflict types, conflict escalation tracking, tension stacking analysis across narrative layers.
 * Inspired by: thunderbolt (feedback loops), chatdev (multi-perspective), generic-agent (optimization)
 */

export type ConflictType = 'internal' | 'interpersonal' | 'societal' | 'environmental' | 'cosmic' | 'ideological'

export interface Conflict {
  id: string
  type: ConflictType
  parties: string[]  // character IDs or 'protagonist', 'world', etc.
  intensity: number  // 0-100
  chapterStart: number
  chapterEnd: number | null
  escalationCount: number  // times this conflict intensified
  resolutionApproach: string | null
}

export interface LayeringAnalysis {
  totalConflicts: number
  activeConflicts: number
  layeredConflicts: number  // conflicts with multiple types
  avgIntensity: number
  dominantConflictType: ConflictType | null
  recommendations: string[]
}

export interface ConflictLayeringState {
  conflicts: Conflict[]
  layeringAnalysis: LayeringAnalysis | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ConflictLayeringState {
  return { conflicts: [], layeringAnalysis: null, typeAlias: {} }
}

export function introduceConflict(
  state: ConflictLayeringState,
  type: ConflictType,
  parties: string[],
  chapterStart: number,
  intensity: number = 30
): ConflictLayeringState {
  const id = `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const conflict: Conflict = { id, type, parties, intensity, chapterStart, chapterEnd: null, escalationCount: 0, resolutionApproach: null }
  return { ...state, conflicts: [...state.conflicts, conflict] }
}

export function escalateConflict(
  state: ConflictLayeringState,
  conflictId: string,
  intensityBoost: number
): ConflictLayeringState {
  const conflicts = state.conflicts.map(c => {
    if (c.id !== conflictId) return c
    const newIntensity = Math.min(100, c.intensity + intensityBoost)
    return { ...c, intensity: newIntensity, escalationCount: c.escalationCount + 1 }
  })
  return { ...state, conflicts }
}

export function layerConflict(
  state: ConflictLayeringState,
  conflictId: string,
  additionalType: ConflictType,
  additionalParty: string
): ConflictLayeringState {
  const conflict = state.conflicts.find(c => c.id === conflictId)
  if (!conflict) return state
  
  // For layering, we create a new linked conflict with the additional type
  const linkedConflict: Conflict = {
    id: `${conflictId}_layer_${additionalType}`,
    type: additionalType,
    parties: [...new Set([...conflict.parties, additionalParty])],
    intensity: conflict.intensity * 0.8,
    chapterStart: conflict.chapterStart,
    chapterEnd: null,
    escalationCount: 0,
    resolutionApproach: null,
  }
  
  return { ...state, conflicts: [...state.conflicts, linkedConflict] }
}

export function resolveConflict(
  state: ConflictLayeringState,
  conflictId: string,
  chapterEnd: number,
  resolutionApproach: string
): ConflictLayeringState {
  const conflicts = state.conflicts.map(c => c.id === conflictId ? { ...c, chapterEnd, resolutionApproach } : c)
  return { ...state, conflicts }
}

export function generateLayeringAnalysis(state: ConflictLayeringState): LayeringAnalysis {
  if (state.conflicts.length === 0) {
    return { totalConflicts: 0, activeConflicts: 0, layeredConflicts: 0, avgIntensity: 0, dominantConflictType: null, recommendations: [] }
  }
  
  const totalConflicts = state.conflicts.length
  const activeConflicts = state.conflicts.filter(c => !c.chapterEnd).length
  const layeredConflicts = state.conflicts.filter(c => c.id.includes('_layer_')).length
  
  const avgIntensity = Math.round(state.conflicts.reduce((s, c) => s + c.intensity, 0) / totalConflicts)
  
  // Find dominant type (most common among active conflicts)
  const activeOnes = state.conflicts.filter(c => !c.chapterEnd)
  const typeCounts: Record<ConflictType, number> = { internal: 0, interpersonal: 0, societal: 0, environmental: 0, cosmic: 0, ideological: 0 }
  for (const c of activeOnes) typeCounts[c.type]++
  const dominantConflictType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ConflictType) || null
  
  const recommendations: string[] = []
  if (activeConflicts > 4) recommendations.push('Too many active conflicts - readers may lose track')
  if (avgIntensity > 75) recommendations.push('Very high conflict intensity - consider moments of relief')
  if (layeredConflicts < totalConflicts * 0.2 && totalConflicts > 2) recommendations.push('Layer conflicts for richer narrative texture')
  if (activeOnes.filter(c => c.type === 'internal').length > activeOnes.length * 0.6) {
    recommendations.push('Heavy internal focus - balance with external conflicts for pacing')
  }
  if (avgIntensity < 40) recommendations.push('Conflict intensity is low - escalate some threads')
  
  return { totalConflicts, activeConflicts, layeredConflicts, avgIntensity, dominantConflictType, recommendations }
}

export function getConflictStack(state: ConflictLayeringState, chapterId: number): Conflict[] {
  return state.conflicts.filter(c => c.chapterStart <= chapterId && (!c.chapterEnd || c.chapterEnd >= chapterId))
}

export function compareConflictIntensity(state: ConflictLayeringState, conflictId1: string, conflictId2: string): number {
  const c1 = state.conflicts.find(c => c.id === conflictId1)
  const c2 = state.conflicts.find(c => c.id === conflictId2)
  if (!c1 || !c2) return 0
  return c1.intensity - c2.intensity
}
