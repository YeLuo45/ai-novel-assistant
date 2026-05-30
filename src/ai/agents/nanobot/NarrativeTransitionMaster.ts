/**
 * NarrativeTransitionMaster — V453
 * Scene transition types, transition quality analysis, chapter flow optimization for seamless reading.
 * Inspired by: ruflo (hierarchical flow), thunderbolt (feedback loops), chatdev (continuity)
 */

export type TransitionType = 'time_jump' | 'scene_cut' | 'parallel' | 'montage' | 'cliffhanger' | 'mirror' | 'sensory'
export type TransitionQuality = 'abrupt' | 'functional' | 'smooth' | 'exemplary'

export interface TransitionLink {
  id: string
  fromChapter: number
  toChapter: number
  transitionType: TransitionType
  quality: TransitionQuality
  smoothnessScore: number  // 0-100
  paragraphCount: number  // transition paragraph length
  callback: string | null  // echo to earlier scene
}

export interface TransitionReport {
  totalLinks: number
  qualityDistribution: Record<TransitionQuality, number>
  avgSmoothness: number
  problemTransitions: number
  recommendations: string[]
}

export interface NarrativeTransitionState {
  links: TransitionLink[]
  report: TransitionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeTransitionState {
  return { links: [], report: null, typeAlias: {} }
}

function assessQuality(smoothness: number): TransitionQuality {
  if (smoothness < 40) return 'abrupt'
  if (smoothness < 65) return 'functional'
  if (smoothness < 85) return 'smooth'
  return 'exemplary'
}

export function addTransitionLink(
  state: NarrativeTransitionState,
  fromChapter: number,
  toChapter: number,
  transitionType: TransitionType,
  paragraphCount: number,
  callback: string | null = null
): NarrativeTransitionState {
  const id = `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  // Calculate smoothness: longer transitions are smoother, time jumps and cliffhangers are harder
  let smoothness = 60
  if (transitionType === 'parallel') smoothness = 85
  else if (transitionType === 'sensory') smoothness = 80
  else if (transitionType === 'mirror') smoothness = 75
  else if (transitionType === 'montage') smoothness = 70
  else if (transitionType === 'scene_cut') smoothness = 65
  else if (transitionType === 'time_jump') smoothness = 50
  else if (transitionType === 'cliffhanger') smoothness = 45
  
  smoothness += Math.min(15, paragraphCount * 3)  // longer = smoother
  if (callback) smoothness += 10
  smoothness = Math.max(0, Math.min(100, smoothness))
  
  const link: TransitionLink = { id, fromChapter, toChapter, transitionType, quality: assessQuality(smoothness), smoothnessScore: smoothness, paragraphCount, callback }
  
  const links = state.links.filter(l => !(l.fromChapter === fromChapter && l.toChapter === toChapter))
  links.push(link)
  links.sort((a, b) => a.fromChapter - b.fromChapter)
  
  return { ...state, links }
}

export function generateTransitionReport(state: NarrativeTransitionState): TransitionReport {
  if (state.links.length === 0) {
    return { totalLinks: 0, qualityDistribution: { abrupt: 0, functional: 0, smooth: 0, exemplary: 0 }, avgSmoothness: 0, problemTransitions: 0, recommendations: [] }
  }
  
  const qualityDistribution: Record<TransitionQuality, number> = { abrupt: 0, functional: 0, smooth: 0, exemplary: 0 }
  let totalSmoothness = 0
  let problemTransitions = 0
  
  for (const link of state.links) {
    qualityDistribution[link.quality]++
    totalSmoothness += link.smoothnessScore
    if (link.quality === 'abrupt') problemTransitions++
  }
  
  const avgSmoothness = Math.round(totalSmoothness / state.links.length)
  
  const recommendations: string[] = []
  if (problemTransitions > state.links.length * 0.2) {
    recommendations.push(`${problemTransitions} abrupt transitions - smooth them out`)
  }
  if (avgSmoothness < 60) recommendations.push('Overall transition quality low - aim for smooth/exemplary')
  if (qualityDistribution['exemplary'] === 0 && state.links.length > 5) {
    recommendations.push('No exemplary transitions - create memorable scene changes')
  }
  if (state.links.some(l => l.transitionType === 'cliffhanger' && l.quality === 'abrupt')) {
    recommendations.push('Cliffhangers are abrupt by nature - ensure next chapter opens with impact')
  }
  if (state.links.filter(l => l.transitionType === 'time_jump').length > state.links.length * 0.4) {
    recommendations.push('Many time jumps - use transitional scenes instead')
  }
  if (avgSmoothness > 80) recommendations.push('Excellent transition quality - seamless reading flow')
  
  return { totalLinks: state.links.length, qualityDistribution, avgSmoothness, problemTransitions, recommendations }
}

export function getTransitionBetween(state: NarrativeTransitionState, fromChapter: number, toChapter: number): TransitionLink | null {
  return state.links.find(l => l.fromChapter === fromChapter && l.toChapter === toChapter) || null
}

export function getChapterTransitions(state: NarrativeTransitionState, chapter: number): TransitionLink[] {
  return state.links.filter(l => l.fromChapter === chapter || l.toChapter === chapter)
}

export function compareTransitionQuality(state: NarrativeTransitionState, from1: number, to1: number, from2: number, to2: number): {
  smoother: string
  score1: number
  score2: number
} {
  const t1 = state.links.find(l => l.fromChapter === from1 && l.toChapter === to1)
  const t2 = state.links.find(l => l.fromChapter === from2 && l.toChapter === to2)
  if (!t1 || !t2) return { smoother: `${from1}-${to1}`, score1: 0, score2: 0 }
  return { smoother: t1.smoothnessScore > t2.smoothnessScore ? `${from1}-${to1}` : `${from2}-${to2}`, score1: t1.smoothnessScore, score2: t2.smoothnessScore }
}
