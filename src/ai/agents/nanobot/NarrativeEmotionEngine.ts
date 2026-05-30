/**
 * NarrativeEmotionEngine — V485
 * Emotional arc mapping, mood tracking across narrative, affective density and feeling flow analysis.
 * Inspired by: chatdev (emotional synthesis), thunderbolt (feedback), ruflo (layered analysis)
 */

export type EmotionalValence = 'positive' | 'negative' | 'neutral' | 'ambivalent'

export interface EmotionMarker {
  id: string
  chapter: number
  valence: EmotionalValence
  intensity: number  // 0-100
  primaryEmotion: string
  secondaryEmotion: string | null
  arcPosition: 'rising' | 'falling' | 'plateau' | 'peak' | 'valley'
}

export interface EmotionReport {
  totalMarkers: number
  avgIntensity: number
  dominantValence: EmotionalValence | null
  recommendations: string[]
}

export interface NarrativeEmotionState {
  markers: EmotionMarker[]
  report: EmotionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeEmotionState {
  return { markers: [], report: null, typeAlias: {} }
}

export function trackEmotion(
  state: NarrativeEmotionState,
  chapter: number,
  valence: EmotionalValence,
  intensity: number,
  primaryEmotion: string,
  secondaryEmotion: string | null = null
): NarrativeEmotionState {
  const id = `emot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const prev = state.markers.filter(m => m.chapter < chapter)
  let arcPosition: EmotionMarker['arcPosition'] = 'plateau'
  if (prev.length > 0) {
    const last = prev[prev.length - 1]
    if (intensity > last.intensity + 10) arcPosition = 'rising'
    else if (intensity < last.intensity - 10) arcPosition = 'falling'
    else if (intensity >= 90) arcPosition = 'peak'
    else if (intensity <= 20) arcPosition = 'valley'
    else arcPosition = 'plateau'
  }
  const marker: EmotionMarker = { id, chapter, valence, intensity: Math.max(0, Math.min(100, intensity)), primaryEmotion, secondaryEmotion, arcPosition }
  const markers = [...state.markers, marker].sort((a, b) => a.chapter - b.chapter)
  return { ...state, markers }
}

export function generateEmotionReport(state: NarrativeEmotionState): EmotionReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgIntensity: 0, dominantValence: null, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgIntensity = Math.round(state.markers.reduce((s, m) => s + m.intensity, 0) / totalMarkers)
  const valenceCounts: Record<string, number> = { positive: 0, negative: 0, neutral: 0, ambivalent: 0 }
  for (const m of state.markers) valenceCounts[m.valence]++
  const dominantValence = Object.entries(valenceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionalValence || null
  const recommendations: string[] = []
  if (avgIntensity < 40) recommendations.push('Low emotional intensity - consider deepening feeling scenes')
  if (valenceCounts['neutral'] > totalMarkers * 0.6) recommendations.push('Too many neutral scenes - balance with stronger emotions')
  if (state.markers.filter(m => m.arcPosition === 'peak').length === 0 && totalMarkers > 5) {
    recommendations.push('No emotional peaks - create moments of high intensity for impact')
  }
  if (state.markers.filter(m => m.arcPosition === 'valley').length > totalMarkers * 0.4) {
    recommendations.push('Many emotional valleys - ensure mood recovery for reader engagement')
  }
  return { totalMarkers, avgIntensity, dominantValence, recommendations }
}

export function getChapterEmotions(state: NarrativeEmotionState, chapter: number): EmotionMarker[] {
  return state.markers.filter(m => m.chapter === chapter)
}
