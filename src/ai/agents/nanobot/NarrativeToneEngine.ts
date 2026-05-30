/**
 * NarrativeToneEngine — V489
 * Tone analysis, narrative voice consistency measurement, mood stability and atmosphere tracking.
 * Inspired by: thunderbolt (feedback), chatdev (synthesis), generic-agent (optimization)
 */

export type ToneQuality = 'warm' | 'cold' | 'ironic' | 'nostalgic' | 'suspenseful' | 'melancholic' | 'humorous' | 'grave'

export interface ToneMarker {
  id: string
  chapter: number
  primaryTone: ToneQuality
  temperature: number  // -100 (cold) to 100 (warm)
  stabilityScore: number  // 0-100 (how consistent)
  voiceConsistency: number  // 0-100
}

export interface ToneReport {
  totalMarkers: number
  avgTemperature: number
  avgStability: number
  dominantTone: ToneQuality | null
  recommendations: string[]
}

export interface NarrativeToneState {
  markers: ToneMarker[]
  report: ToneReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeToneState {
  return { markers: [], report: null, typeAlias: {} }
}

export function recordTone(
  state: NarrativeToneState,
  chapter: number,
  primaryTone: ToneQuality,
  temperature: number
): NarrativeToneState {
  const id = `tone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const prev = state.markers.filter(m => m.chapter < chapter)
  let stabilityScore = 85
  if (prev.length > 0) {
    const lastTemp = prev[prev.length - 1].temperature
    stabilityScore = Math.max(20, 100 - Math.abs(temperature - lastTemp))
  }
  const voiceConsistency = Math.max(30, Math.min(95, stabilityScore + (primaryTone === 'humorous' ? 5 : 0)))
  const marker: ToneMarker = { id, chapter, primaryTone, temperature: Math.max(-100, Math.min(100, temperature)), stabilityScore, voiceConsistency }
  const markers = [...state.markers, marker].sort((a, b) => a.chapter - b.chapter)
  return { ...state, markers }
}

export function generateToneReport(state: NarrativeToneState): ToneReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgTemperature: 0, avgStability: 100, dominantTone: null, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgTemperature = Math.round(state.markers.reduce((s, m) => s + m.temperature, 0) / totalMarkers)
  const avgStability = Math.round(state.markers.reduce((s, m) => s + m.stabilityScore, 0) / totalMarkers)
  const toneCounts: Record<string, number> = {}
  for (const m of state.markers) toneCounts[m.primaryTone] = (toneCounts[m.primaryTone] || 0) + 1
  const dominantTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ToneQuality || null
  const recommendations: string[] = []
  if (avgStability < 60) recommendations.push('Low tone stability - maintain consistent narrative voice')
  if (state.markers.filter(m => m.voiceConsistency < 50).length > totalMarkers * 0.3) {
    recommendations.push('Some chapters have inconsistent voice - review tone shifts')
  }
  if (avgTemperature < -50) recommendations.push('Very cold tone throughout - ensure reader engagement')
  if (state.markers.some(m => m.primaryTone === 'suspenseful' && m.stabilityScore > 80)) {
    recommendations.push('Consistently suspenseful tone - effective atmosphere building')
  }
  return { totalMarkers, avgTemperature, avgStability, dominantTone, recommendations }
}

export function getChapterTone(state: NarrativeToneState, chapter: number): ToneMarker | null {
  return state.markers.find(m => m.chapter === chapter) || null
}
