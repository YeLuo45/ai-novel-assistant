/**
 * SubplotWeaver — V451
 * Subplot interconnection analysis, B-story integration, narrative threading across story layers.
 * Inspired by: chatdev (multi-thread coordination), ruflo (hierarchical decomposition), generic-agent (optimization)
 */

export type SubplotType = 'romantic' | 'revenge' | 'redemption' | 'mystery' | 'coming_of_age' | 'political' | 'buddy' | 'family'

export interface SubplotThread {
  id: string
  name: string
  subplotType: SubplotType
  chaptersActive: number[]
  connectionStrength: number  // 0-100 (how connected to main plot)
  emotionalWeight: number  // 0-100
  resolutionQuality: number  // 0-100 (how well it concluded)
  isIntegrated: boolean  // has clear connection to main arc
  parentPlotId: string | null  // ID of plot this subplot serves
}

export interface SubplotConnection {
  id: string
  subplotId1: string
  subplotId2: string
  connectionType: 'parallel' | 'intersecting' | 'causal' | 'thematic'
  strength: number  // 0-100
  meetingChapter: number | null  // chapter where they intersect
}

export interface SubplotReport {
  totalSubplots: number
  activeSubplots: number
  integratedSubplots: number
  avgConnectionStrength: number
  recommendations: string[]
}

export interface SubplotWeaverState {
  threads: SubplotThread[]
  connections: SubplotConnection[]
  report: SubplotReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SubplotWeaverState {
  return { threads: [], connections: [], report: null, typeAlias: {} }
}

export function addSubplot(
  state: SubplotWeaverState,
  name: string,
  subplotType: SubplotType,
  chaptersActive: number[],
  connectionStrength: number = 50,
  emotionalWeight: number = 50,
  parentPlotId: string | null = null
): SubplotWeaverState {
  const id = `subplot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const thread: SubplotThread = {
    id, name, subplotType, chaptersActive, connectionStrength: Math.max(0, Math.min(100, connectionStrength)),
    emotionalWeight: Math.max(0, Math.min(100, emotionalWeight)), resolutionQuality: 0,
    isIntegrated: connectionStrength > 60, parentPlotId,
  }
  return { ...state, threads: [...state.threads, thread] }
}

export function connectSubplots(
  state: SubplotWeaverState,
  subplotId1: string,
  subplotId2: string,
  connectionType: SubplotConnection['connectionType'],
  strength: number = 60
): SubplotWeaverState {
  const id = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const connection: SubplotConnection = { id, subplotId1, subplotId2, connectionType, strength: Math.max(0, Math.min(100, strength)), meetingChapter: null }
  return { ...state, connections: [...state.connections, connection] }
}

export function resolveSubplot(state: SubplotWeaverState, subplotId: string, resolutionQuality: number): SubplotWeaverState {
  const threads = state.threads.map(t => t.id === subplotId ? { ...t, resolutionQuality: Math.max(0, Math.min(100, resolutionQuality)) } : t)
  return { ...state, threads }
}

export function integrateSubplot(state: SubplotWeaverState, subplotId: string): SubplotWeaverState {
  const threads = state.threads.map(t => t.id === subplotId ? { ...t, isIntegrated: true } : t)
  return { ...state, threads }
}

export function generateSubplotReport(state: SubplotWeaverState): SubplotReport {
  if (state.threads.length === 0) {
    return { totalSubplots: 0, activeSubplots: 0, integratedSubplots: 0, avgConnectionStrength: 0, recommendations: [] }
  }
  
  const totalSubplots = state.threads.length
  const activeSubplots = state.threads.filter(t => t.resolutionQuality === 0).length
  const integratedSubplots = state.threads.filter(t => t.isIntegrated).length
  const avgConnectionStrength = Math.round(state.threads.reduce((s, t) => s + t.connectionStrength, 0) / totalSubplots)
  
  const recommendations: string[] = []
  if (activeSubplots > totalSubplots * 0.7) {
    recommendations.push(`${activeSubplots} unresolved subplots - resolve some before end`)
  }
  if (integratedSubplots < totalSubplots * 0.3) {
    recommendations.push('Few integrated subplots - connect more subplots to main arc')
  }
  if (avgConnectionStrength < 50) {
    recommendations.push('Subplots weakly connected to main plot - strengthen ties')
  }
  if (state.connections.length < totalSubplots - 1) {
    recommendations.push('Few subplot connections - add parallel or intersecting threads')
  }
  if (state.threads.some(t => t.emotionalWeight > 80 && t.connectionStrength < 40)) {
    recommendations.push('High-emotion subplots weakly connected - integrate emotionally significant threads')
  }
  if (integratedSubplots > totalSubplots * 0.6) {
    recommendations.push('Strong subplot integration - good narrative threading')
  }
  
  return { totalSubplots, activeSubplots, integratedSubplots, avgConnectionStrength, recommendations }
}

export function getSubplotByType(state: SubplotWeaverState, subplotType: SubplotType): SubplotThread[] {
  return state.threads.filter(t => t.subplotType === subplotType)
}

export function getSubplotConnections(state: SubplotWeaverState, subplotId: string): SubplotConnection[] {
  return state.connections.filter(c => c.subplotId1 === subplotId || c.subplotId2 === subplotId)
}

export function compareSubplotIntegration(state: SubplotWeaverState, id1: string, id2: string): {
  moreIntegrated: string
  strength1: number
  strength2: number
} {
  const t1 = state.threads.find(t => t.id === id1)
  const t2 = state.threads.find(t => t.id === id2)
  if (!t1 || !t2) return { moreIntegrated: id1, strength1: 0, strength2: 0 }
  return { moreIntegrated: t1.connectionStrength > t2.connectionStrength ? id1 : id2, strength1: t1.connectionStrength, strength2: t2.connectionStrength }
}
