/**
 * NarrativeResolutionArchitect — V477
 * Resolution architecture, ending structure analysis, final impression and denouement management.
 * Inspired by: generic-agent (completion), thunderbolt (feedback), chatdev (emotional synthesis)
 */

export type EndingType = 'closed' | 'open' | 'bittersweet' | 'tragic' | 'triumphant' | 'ambiguous'

export interface ResolutionBeat {
  id: string
  chapterNumber: number
  beatType: 'denouement' | 'final_image' | 'last_dialogue' | 'closure' | 'hook'
  emotionalImpact: number  // 0-100
  resolutionCompleteness: number  // 0-100
  readerSatisfaction: number  // 0-100
}

export interface ResolutionReport {
  totalBeats: number
  endingType: EndingType | null
  avgSatisfaction: number
  recommendations: string[]
}

export interface NarrativeResolutionArchitectState {
  beats: ResolutionBeat[]
  report: ResolutionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeResolutionArchitectState {
  return { beats: [], report: null, typeAlias: {} }
}

export function addResolutionBeat(
  state: NarrativeResolutionArchitectState,
  chapter: number,
  beatType: ResolutionBeat['beatType'],
  emotionalImpact: number,
  resolutionCompleteness: number
): NarrativeResolutionArchitectState {
  const id = `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const readerSatisfaction = Math.round((emotionalImpact * 0.4 + resolutionCompleteness * 0.6))
  const beat: ResolutionBeat = { id, chapterNumber: chapter, beatType, emotionalImpact: Math.max(0, Math.min(100, emotionalImpact)), resolutionCompleteness: Math.max(0, Math.min(100, resolutionCompleteness)), readerSatisfaction }
  const beats = [...state.beats, beat].sort((a, b) => a.chapterNumber - b.chapterNumber)
  return { ...state, beats }
}

export function setEndingType(state: NarrativeResolutionArchitectState, endingType: EndingType): NarrativeResolutionArchitectState {
  return { ...state, typeAlias: { ...state.typeAlias, endingType } }
}

export function generateResolutionReport(state: NarrativeResolutionArchitectState): ResolutionReport {
  if (state.beats.length === 0) {
    return { totalBeats: 0, endingType: null, avgSatisfaction: 0, recommendations: [] }
  }
  const totalBeats = state.beats.length
  const endingType = (state.typeAlias['endingType'] as EndingType) || null
  const avgSatisfaction = Math.round(state.beats.reduce((s, b) => s + b.readerSatisfaction, 0) / totalBeats)
  const recommendations: string[] = []
  if (avgSatisfaction < 50) recommendations.push('Low reader satisfaction - strengthen resolution beats')
  if (!endingType) recommendations.push('No ending type set - define the narrative conclusion')
  if (state.beats.filter(b => b.beatType === 'hook').length === 0 && totalBeats > 3) {
    recommendations.push('No final hook - consider leaving reader with something memorable')
  }
  if (state.beats.filter(b => b.beatType === 'denouement').length > totalBeats * 0.6) {
    recommendations.push('Too much denouement - trim for tighter ending')
  }
  if (avgSatisfaction > 80) recommendations.push('Excellent resolution - satisfying narrative conclusion')
  return { totalBeats, endingType, avgSatisfaction, recommendations }
}

export function getFinalImpression(state: NarrativeResolutionArchitectState): number {
  if (state.beats.length === 0) return 0
  const lastBeats = state.beats.slice(-3)
  return Math.round(lastBeats.reduce((s, b) => s + b.readerSatisfaction, 0) / lastBeats.length)
}
