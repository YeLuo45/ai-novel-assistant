/**
 * NarrativeToneMapper — V367
 * Emotional tone mapping, mood tracking, narrative atmosphere analysis.
 * Inspired by: chatdev (emotional analysis), thunderbolt (feedback loops)
 */

export type ToneCategory = 'joy' | 'sorrow' | 'anger' | 'fear' | 'surprise' | 'anticipation' | 'trust' | 'disgust' | 'love' | 'hope' | 'melancholy' | 'tension'

export interface ToneMarker {
  chapterId: string
  position: number  // 0-100
  category: ToneCategory
  intensity: number  // 0-100
  text?: string
}

export interface ToneArc {
  chapterId: string
  dominantTone: ToneCategory
  toneDistribution: Record<ToneCategory, number>
  avgIntensity: number
  emotionalRange: number
}

export interface NarrativeToneState {
  markers: ToneMarker[]
  arcs: Record<string, ToneArc>
  currentTone: ToneCategory
  toneHistory: ToneCategory[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeToneState {
  return {
    markers: [],
    arcs: {},
    currentTone: 'anticipation',
    toneHistory: [],
    typeAlias: {},
  }
}

function calculateDistribution(markers: ToneMarker[]): Record<ToneCategory, number> {
  const dist: Record<ToneCategory, number> = { joy: 0, sorrow: 0, anger: 0, fear: 0, surprise: 0, anticipation: 0, trust: 0, disgust: 0, love: 0, hope: 0, melancholy: 0, tension: 0 }
  for (const m of markers) {
    dist[m.category] += m.intensity
  }
  return dist
}

export function addToneMarker(
  state: NarrativeToneState,
  chapterId: string,
  position: number,
  category: ToneCategory,
  intensity: number,
  text?: string
): NarrativeToneState {
  const marker: ToneMarker = { chapterId, position, category, intensity, text }
  const markers = [...state.markers, marker].slice(-200)
  const currentTone = category
  const toneHistory = [...state.toneHistory, category].slice(-50)
  return { ...state, markers, currentTone, toneHistory }
}

export function buildToneArc(state: NarrativeToneState, chapterId: string): NarrativeToneState {
  const chapterMarkers = state.markers.filter(m => m.chapterId === chapterId)
  if (chapterMarkers.length === 0) return state
  const dist = calculateDistribution(chapterMarkers)
  const dominantTone = Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0] as ToneCategory
  const avgIntensity = chapterMarkers.reduce((s, m) => s + m.intensity, 0) / chapterMarkers.length
  const intensities = chapterMarkers.map(m => m.intensity)
  const emotionalRange = intensities.length > 1 ? Math.max(...intensities) - Math.min(...intensities) : 0
  const arc: ToneArc = { chapterId, dominantTone, toneDistribution: dist, avgIntensity, emotionalRange }
  return { ...state, arcs: { ...state.arcs, [chapterId]: arc } }
}

export function getToneArc(state: NarrativeToneState, chapterId: string): ToneArc | null {
  return state.arcs[chapterId] || null
}

export function detectToneShift(state: NarrativeToneState, chapterId: string): {
  hasShift: boolean
  shiftType?: 'gradual' | 'sudden'
  fromTone?: ToneCategory
  toTone?: ToneCategory
} {
  const chapterMarkers = state.markers.filter(m => m.chapterId === chapterId).sort((a, b) => a.position - b.position)
  if (chapterMarkers.length < 2) return { hasShift: false }
  const firstHalf = chapterMarkers.slice(0, Math.floor(chapterMarkers.length / 2))
  const secondHalf = chapterMarkers.slice(Math.floor(chapterMarkers.length / 2))
  const firstDist = calculateDistribution(firstHalf)
  const secondDist = calculateDistribution(secondHalf)
  const firstDominant = Object.entries(firstDist).sort((a, b) => b[1] - a[1])[0][0] as ToneCategory
  const secondDominant = Object.entries(secondDist).sort((a, b) => b[1] - a[1])[0][0] as ToneCategory
  if (firstDominant !== secondDominant) {
    return { hasShift: true, shiftType: 'sudden', fromTone: firstDominant, toTone: secondDominant }
  }
  // Check for gradual shift (intensity change)
  const firstAvg = firstHalf.reduce((s, m) => s + m.intensity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, m) => s + m.intensity, 0) / secondHalf.length
  if (Math.abs(firstAvg - secondAvg) > 30) {
    return { hasShift: true, shiftType: 'gradual', fromTone: firstDominant, toTone: firstDominant }
  }
  return { hasShift: false }
}

export function compareToneArcs(state: NarrativeToneState, ch1: string, ch2: string) {
  const arc1 = state.arcs[ch1]
  const arc2 = state.arcs[ch2]
  if (!arc1 || !arc2) return null
  return {
    moreIntense: arc1.avgIntensity > arc2.avgIntensity ? ch1 : ch2,
    intensityDiff: Math.abs(arc1.avgIntensity - arc2.avgIntensity),
    sharedTones: Object.keys(arc1.toneDistribution).filter(k => arc2.toneDistribution[k as ToneCategory] > 0),
  }
}

export function getNarrativeMood(state: NarrativeToneState) {
  const recent = state.toneHistory.slice(-20)
  if (recent.length === 0) return 'neutral'
  const freq: Record<string, number> = {}
  for (const t of recent) freq[t] = (freq[t] || 0) + 1
  const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0] as ToneCategory
  return dominant
}
