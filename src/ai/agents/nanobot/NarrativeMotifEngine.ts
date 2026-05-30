/**
 * NarrativeMotifEngine — V487
 * Motif tracking, recurring pattern detection, cultural archetype and narrative signature analysis.
 * Inspired by: generic-agent (optimization), ruflo (layered analysis), chatdev (synthesis)
 */

export interface MotifInstance {
  id: string
  chapter: number
  form: string  // specific manifestation
  intensity: number  // 0-100
  culturalContext: string | null
}

export interface MotifTracker {
  motifName: string
  instances: MotifInstance[]
  frequencyScore: number  // 0-100
  evolution: string  // how motif transforms across story
  culturalArchetype: string | null
}

export interface MotifReport {
  totalMotifs: number
  avgFrequency: number
  mostRecurring: string | null
  recommendations: string[]
}

export interface NarrativeMotifEngineState {
  motifs: MotifTracker[]
  report: MotifReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeMotifEngineState {
  return { motifs: [], report: null, typeAlias: {} }
}

export function addMotifInstance(
  state: NarrativeMotifEngineState,
  motifName: string,
  chapter: number,
  form: string,
  intensity: number,
  culturalContext: string | null = null
): NarrativeMotifEngineState {
  const existing = state.motifs.find(m => m.motifName === motifName)
  if (existing) {
    const instance: MotifInstance = { id: `mot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, chapter, form, intensity: Math.max(0, Math.min(100, intensity)), culturalContext }
    const motifs = state.motifs.map(m => {
      if (m.motifName !== motifName) return m
      const instances = [...m.instances, instance]
      const frequencyScore = Math.min(100, instances.length * 10)
      return { ...m, instances, frequencyScore }
    })
    return { ...state, motifs }
  }
  const instance: MotifInstance = { id: `mot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, chapter, form, intensity: Math.max(0, Math.min(100, intensity)), culturalContext }
  const tracker: MotifTracker = { motifName, instances: [instance], frequencyScore: 10, evolution: 'static', culturalArchetype: null }
  return { ...state, motifs: [...state.motifs, tracker] }
}

export function setArchetype(state: NarrativeMotifEngineState, motifName: string, archetype: string): NarrativeMotifEngineState {
  const motifs = state.motifs.map(m => m.motifName === motifName ? { ...m, culturalArchetype: archetype } : m)
  return { ...state, motifs }
}

export function generateMotifReport(state: NarrativeMotifEngineState): MotifReport {
  if (state.motifs.length === 0) {
    return { totalMotifs: 0, avgFrequency: 0, mostRecurring: null, recommendations: [] }
  }
  const totalMotifs = state.motifs.length
  const avgFrequency = Math.round(state.motifs.reduce((s, m) => s + m.frequencyScore, 0) / totalMotifs)
  const mostRecurring = state.motifs.sort((a, b) => b.frequencyScore - a.frequencyScore)[0]?.motifName || null
  const recommendations: string[] = []
  if (avgFrequency < 25) recommendations.push('Low motif frequency - consider recurring patterns for coherence')
  if (state.motifs.filter(m => m.culturalArchetype === null).length > totalMotifs * 0.6) {
    recommendations.push('Many motifs lack cultural context - add archetypal layers')
  }
  if (mostRecurring && state.motifs.find(m => m.motifName === mostRecurring)?.frequencyScore > 80) {
    recommendations.push(`Strong recurring motif '${mostRecurring}' - well-developed narrative signature`)
  }
  return { totalMotifs, avgFrequency, mostRecurring, recommendations }
}

export function getMotifByName(state: NarrativeMotifEngineState, motifName: string): MotifTracker | null {
  return state.motifs.find(m => m.motifName === motifName) || null
}
