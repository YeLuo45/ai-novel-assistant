/**
 * SubplotInterweavingEngine — V401
 * Subplot tracking, plot interweaving analysis, multi-thread narrative management across chapters.
 * Inspired by: ruflo (hierarchical decomposition), chatdev (multi-perspective), generic-agent (goal tracking)
 */

export type SubplotStatus = 'setup' | 'rising' | 'climax' | 'resolution' | 'abandoned'

export interface Subplot {
  id: string
  name: string
  status: SubplotStatus
  chapterStart: number
  chapterEnd: number | null
  importanceLevel: number  // 0-100
  characters: string[]
  tensionScore: number  // 0-100
  payoffDelivered: boolean
}

export interface InterweavingAnalysis {
  totalSubplots: number
  activeSubplots: number
  completedSubplots: number
  interweavingScore: number  // 0-100 (how well subplots are balanced)
  dominantSubplot: string | null
  recommendations: string[]
}

export interface SubplotInterweavingState {
  subplots: Subplot[]
  interweavingAnalysis: InterweavingAnalysis | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SubplotInterweavingState {
  return { subplots: [], interweavingAnalysis: null, typeAlias: {} }
}

export function registerSubplot(
  state: SubplotInterweavingState,
  name: string,
  chapterStart: number,
  characters: string[],
  importanceLevel: number = 50
): SubplotInterweavingState {
  const id = `subplot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const subplot: Subplot = { id, name, status: 'setup', chapterStart, chapterEnd: null, importanceLevel, characters, tensionScore: 20, payoffDelivered: false }
  return { ...state, subplots: [...state.subplots, subplot] }
}

export function advanceSubplotStatus(
  state: SubplotInterweavingState,
  subplotId: string,
  newStatus: SubplotStatus
): SubplotInterweavingState {
  const subplots = state.subplots.map(s => s.id === subplotId ? { ...s, status: newStatus } : s)
  return { ...state, subplots }
}

export function updateSubplotTension(
  state: SubplotInterweavingState,
  subplotId: string,
  tensionScore: number
): SubplotInterweavingState {
  const subplots = state.subplots.map(s => s.id === subplotId ? { ...s, tensionScore: Math.max(0, Math.min(100, tensionScore)) } : s)
  return { ...state, subplots }
}

export function deliverSubplotPayoff(
  state: SubplotInterweavingState,
  subplotId: string,
  chapterEnd: number
): SubplotInterweavingState {
  const subplots = state.subplots.map(s => s.id === subplotId ? { ...s, payoffDelivered: true, status: 'resolution' as SubplotStatus, chapterEnd } : s)
  return { ...state, subplots }
}

export function generateInterweavingAnalysis(state: SubplotInterweavingState): InterweavingAnalysis {
  if (state.subplots.length === 0) {
    return { totalSubplots: 0, activeSubplots: 0, completedSubplots: 0, interweavingScore: 0, dominantSubplot: null, recommendations: [] }
  }
  
  const totalSubplots = state.subplots.length
  const activeSubplots = state.subplots.filter(s => s.status !== 'resolution' && s.status !== 'abandoned').length
  const completedSubplots = state.subplots.filter(s => s.payoffDelivered).length
  
  // Find dominant subplot (highest importance)
  const sorted = [...state.subplots].sort((a, b) => b.importanceLevel - a.importanceLevel)
  const dominantSubplot = sorted[0]?.name || null
  
  // Calculate interweaving score based on distribution
  const statusCounts: Record<SubplotStatus, number> = { setup: 0, rising: 0, climax: 0, resolution: 0, abandoned: 0 }
  for (const s of state.subplots) statusCounts[s.status]++
  
  const activeCount = activeSubplots
  const interweavingScore = activeCount > 3 ? Math.max(30, 100 - (activeCount - 3) * 15) : 100
  
  const recommendations: string[] = []
  if (activeSubplots > 5) recommendations.push('Too many active subplots - resolve some to focus main narrative')
  if (completedSubplots < totalSubplots * 0.3 && totalSubplots > 3) recommendations.push('Few subplots resolved - balance resolution timing')
  if (dominantSubplot) recommendations.push(`${dominantSubplot} is dominant - ensure it doesn't overshadow the main plot`)
  if (state.subplots.filter(s => s.importanceLevel < 30).length > totalSubplots * 0.5) {
    recommendations.push('Many low-importance subplots - consider cutting or merging')
  }
  if (interweavingScore < 50) recommendations.push('Subplot overload - consolidate narrative threads')
  if (completedSubplots > activeSubplots) recommendations.push('Good resolution pace - maintain this balance')
  
  return { totalSubplots, activeSubplots, completedSubplots, interweavingScore, dominantSubplot, recommendations }
}

export function getSubplotProgress(state: SubplotInterweavingState, subplotId: string): number {
  const subplot = state.subplots.find(s => s.id === subplotId)
  if (!subplot) return 0
  if (subplot.payoffDelivered) return 100
  
  const statusProgress: Record<SubplotStatus, number> = { setup: 20, rising: 50, climax: 80, resolution: 100, abandoned: 0 }
  return statusProgress[subplot.status]
}

export function compareSubplotInterweaving(state: SubplotInterweavingState, ch1: string, ch2: string): {
  moreComplex: string
  subplotDiff: number
  tensionDiff: number
} {
  const subplots1 = state.subplots.filter(s => s.characters.some(c => c.includes(ch1)))
  const subplots2 = state.subplots.filter(s => s.characters.some(c => c.includes(ch2)))
  
  const avgTension1 = subplots1.length > 0 ? subplots1.reduce((s, sp) => s + sp.tensionScore, 0) / subplots1.length : 0
  const avgTension2 = subplots2.length > 0 ? subplots2.reduce((s, sp) => s + sp.tensionScore, 0) / subplots2.length : 0
  
  return {
    moreComplex: subplots1.length > subplots2.length ? ch1 : ch2,
    subplotDiff: Math.abs(subplots1.length - subplots2.length),
    tensionDiff: Math.abs(avgTension1 - avgTension2),
  }
}
