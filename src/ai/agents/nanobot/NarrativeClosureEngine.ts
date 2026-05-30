/**
 * NarrativeClosureEngine — V493
 * Narrative closure analysis, ending satisfaction metrics, loose end tracking and completeness scoring.
 * Inspired by: generic-agent (completion), thunderbolt (feedback), chatdev (synthesis)
 */

export type ClosureType = 'complete' | 'partial' | 'open' | 'ambiguous'
export type LooseEndStatus = 'resolved' | 'intentional' | 'unresolved'

export interface ClosureMarker {
  id: string
  chapter: number
  closureType: ClosureType
  resolutionQuality: number  // 0-100
  emotionalSatisfaction: number  // 0-100
  characterEndstates: number  // 0-100
}

export interface LooseEnd {
  id: string
  element: string  // character, plot thread, theme
  description: string
  status: LooseEndStatus
  chapterIntroduced: number
  chapterResolved: number | null
}

export interface ClosureReport {
  totalMarkers: number
  avgResolutionQuality: number
  avgSatisfaction: number
  unresolvedCount: number
  recommendations: string[]
}

export interface NarrativeClosureState {
  markers: ClosureMarker[]
  looseEnds: LooseEnd[]
  report: ClosureReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeClosureState {
  return { markers: [], looseEnds: [], report: null, typeAlias: {} }
}

export function recordClosure(
  state: NarrativeClosureState,
  chapter: number,
  closureType: ClosureType,
  resolutionQuality: number,
  emotionalSatisfaction: number,
  characterEndstates: number
): NarrativeClosureState {
  const id = `clos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const marker: ClosureMarker = { id, chapter, closureType, resolutionQuality: Math.max(0, Math.min(100, resolutionQuality)), emotionalSatisfaction: Math.max(0, Math.min(100, emotionalSatisfaction)), characterEndstates: Math.max(0, Math.min(100, characterEndstates)) }
  const markers = [...state.markers, marker]
  return { ...state, markers }
}

export function trackLooseEnd(
  state: NarrativeClosureState,
  element: string,
  description: string,
  chapterIntroduced: number
): NarrativeClosureState {
  const id = `end_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const looseEnd: LooseEnd = { id, element, description, status: 'unresolved', chapterIntroduced, chapterResolved: null }
  return { ...state, looseEnds: [...state.looseEnds, looseEnd] }
}

export function resolveLooseEnd(state: NarrativeClosureState, element: string, chapterResolved: number, intentional: boolean = false): NarrativeClosureState {
  const looseEnds = state.looseEnds.map(le => le.element === element ? { ...le, status: intentional ? 'intentional' : 'resolved' as LooseEndStatus, chapterResolved } : le)
  return { ...state, looseEnds }
}

export function generateClosureReport(state: NarrativeClosureState): ClosureReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgResolutionQuality: 0, avgSatisfaction: 0, unresolvedCount: state.looseEnds.length, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgResolutionQuality = Math.round(state.markers.reduce((s, m) => s + m.resolutionQuality, 0) / totalMarkers)
  const avgSatisfaction = Math.round(state.markers.reduce((s, m) => s + m.emotionalSatisfaction, 0) / totalMarkers)
  const unresolvedCount = state.looseEnds.filter(le => le.status === 'unresolved').length
  const recommendations: string[] = []
  if (avgSatisfaction < 60) recommendations.push('Low ending satisfaction - strengthen closure scenes')
  if (unresolvedCount > 3) recommendations.push(`Many unresolved loose ends (${unresolvedCount}) - resolve or acknowledge`)
  if (state.markers.some(m => m.closureType === 'open')) recommendations.push('Open endings present - ensure intentionality')
  if (avgResolutionQuality > 85) recommendations.push('Excellent resolution quality - satisfying narrative wrap-up')
  return { totalMarkers, avgResolutionQuality, avgSatisfaction, unresolvedCount, recommendations }
}
