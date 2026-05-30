/**
 * EmotionalAnchorTracker — V389
 * Emotional anchor tracking, reader investment markers, sentiment peaks and valleys.
 * Inspired by: thunderbolt (feedback loops), chatdev (engagement), generic-agent (pattern recognition)
 */

export interface EmotionalAnchor {
  id: string
  chapterId: string
  position: number  // 0-100 within chapter
  anchorType: AnchorType
  intensity: number  // 0-100
  text: string
  emotionTag: string
  payoffPotential: number  // 0-100
  payoffRegistered: boolean
}

export type AnchorType = 'character_moment' | 'revelation' | 'conflict' | 'tender_moment' | 'humor' | 'tension_peak' | 'resolution' | 'mystery' | 'symbolic'

export interface EmotionalArc {
  chapterId: string
  anchors: EmotionalAnchor[]
  peakIntensity: number
  valleyIntensity: number
  emotionalRange: number
  investmentScore: number  // 0-100
  dominantEmotion: string
}

export interface InvestmentReport {
  totalAnchors: number
  activeAnchors: number  // not yet paid off
  investmentScore: number
  highValueAnchors: number  // payoffPotential > 70
  recommendations: string[]
}

export interface EmotionalAnchorState {
  anchors: EmotionalAnchor[]
  arcs: EmotionalArc[]
  investmentReport: InvestmentReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): EmotionalAnchorState {
  return { anchors: [], arcs: [], investmentReport: null, typeAlias: {} }
}

export function registerAnchor(
  state: EmotionalAnchorState,
  chapterId: string,
  position: number,
  anchorType: AnchorType,
  intensity: number,
  text: string,
  emotionTag: string,
  payoffPotential: number = 50
): EmotionalAnchorState {
  const id = `anchor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const anchor: EmotionalAnchor = { id, chapterId, position, anchorType, intensity, text, emotionTag, payoffPotential, payoffRegistered: false }
  
  // Update or create arc for chapter
  let arc = state.arcs.find(a => a.chapterId === chapterId)
  let arcs = state.arcs
  
  if (!arc) {
    arc = { chapterId, anchors: [], peakIntensity: 0, valleyIntensity: 100, emotionalRange: 0, investmentScore: 50, dominantEmotion: emotionTag }
    arcs = [...arcs, arc]
  }
  
  const chapterAnchors = [...(arcs.find(a => a.chapterId === chapterId)?.anchors || []), anchor]
  const updatedArc = buildArc(chapterId, chapterAnchors, state.arcs.find(a => a.chapterId === chapterId)?.dominantEmotion || emotionTag)
  
  arcs = arcs.map(a => a.chapterId === chapterId ? updatedArc : a)
  
  return { ...state, anchors: [...state.anchors, anchor], arcs }
}

function buildArc(chapterId: string, chapterAnchors: EmotionalAnchor[], dominantEmotion: string): EmotionalArc {
  if (chapterAnchors.length === 0) {
    return { chapterId, anchors: [], peakIntensity: 0, valleyIntensity: 0, emotionalRange: 0, investmentScore: 50, dominantEmotion }
  }
  
  const intensities = chapterAnchors.map(a => a.intensity)
  const peakIntensity = Math.max(...intensities)
  const valleyIntensity = Math.min(...intensities)
  const emotionalRange = peakIntensity - valleyIntensity
  
  const investmentScore = Math.round(
    chapterAnchors.reduce((s, a) => s + a.intensity * 0.3 + a.payoffPotential * 0.5, 0) / chapterAnchors.length
  )
  
  return { chapterId, anchors: chapterAnchors, peakIntensity, valleyIntensity, emotionalRange, investmentScore, dominantEmotion }
}

export function registerPayoff(
  state: EmotionalAnchorState,
  anchorId: string
): EmotionalAnchorState {
  const anchor = state.anchors.find(a => a.id === anchorId)
  if (!anchor) return state
  
  const updatedAnchor = { ...anchor, payoffRegistered: true }
  const anchors = state.anchors.map(a => a.id === anchorId ? updatedAnchor : a)
  
  // Rebuild chapter arc
  const chapterAnchors = anchors.filter(a => a.chapterId === anchor.chapterId)
  let arcs = state.arcs
  const dominantEmotion = state.arcs.find(a => a.chapterId === anchor.chapterId)?.dominantEmotion || anchor.emotionTag
  const updatedArc = buildArc(anchor.chapterId, chapterAnchors, dominantEmotion)
  arcs = arcs.map(a => a.chapterId === anchor.chapterId ? updatedArc : a)
  
  return { ...state, anchors, arcs }
}

export function generateInvestmentReport(state: EmotionalAnchorState): InvestmentReport {
  const totalAnchors = state.anchors.length
  const activeAnchors = state.anchors.filter(a => !a.payoffRegistered).length
  const highValueAnchors = state.anchors.filter(a => a.payoffPotential > 70).length
  
  const investmentScore = totalAnchors > 0
    ? Math.round(state.anchors.reduce((s, a) => s + (a.payoffRegistered ? a.intensity : a.intensity * 0.5 + a.payoffPotential * 0.3), 0) / totalAnchors)
    : 0
  
  const recommendations: string[] = []
  if (activeAnchors > totalAnchors * 0.7) recommendations.push('Too many active anchors - deliver some payoffs to maintain trust')
  if (highValueAnchors > 5) recommendations.push(`High-value anchors building up: deliver ${highValueAnchors} payoffs`)
  if (investmentScore > 70) recommendations.push('Strong reader investment - maintain momentum')
  if (investmentScore < 40) recommendations.push('Increase emotional anchors to build reader investment')
  if (totalAnchors < 3) recommendations.push('Add more emotional anchors throughout the story')
  
  const report: InvestmentReport = { totalAnchors, activeAnchors, investmentScore, highValueAnchors, recommendations }
  return { ...state, investmentReport: report }, report
}

export function getChapterInvestment(state: EmotionalAnchorState, chapterId: string): number {
  const arc = state.arcs.find(a => a.chapterId === chapterId)
  return arc?.investmentScore || 0
}

export function compareChapterInvestment(state: EmotionalAnchorState, ch1: string, ch2: string): {
  moreInvested: string
  investmentDiff: number
} {
  const i1 = getChapterInvestment(state, ch1)
  const i2 = getChapterInvestment(state, ch2)
  return { moreInvested: i1 > i2 ? ch1 : ch2, investmentDiff: Math.abs(i1 - i2) }
}
