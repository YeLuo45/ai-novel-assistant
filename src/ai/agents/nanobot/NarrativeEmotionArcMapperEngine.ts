// NarrativeEmotionArcMapperEngine - V297: Maps emotional arcs across the narrative
// Inspired by: thunderbolt (waveform tracking) + nanobot (mesh analysis)

export type EmotionArcPhase = 'introduction' | 'build_up' | 'climax' | 'release' | 'resolution'
export type EmotionalTrajectory = 'ascending' | 'descending' | 'fluctuating' | 'stable' | 'complex'

export interface EmotionArcPoint {
  chapter: number
  primaryEmotion: string
  intensity: number  // 0-100
  secondaryEmotion: string | null
  polarity: number   // -1 negative to +1 positive
}

export interface EmotionArcState {
  arcPoints: EmotionArcPoint[]
  currentArc: EmotionalTrajectory
  peakChapter: number | null
  lowChapter: number | null
  arcLength: number
}

export function createEmptyEmotionArcState(): EmotionArcState {
  return { arcPoints: [], currentArc: 'stable', peakChapter: null, lowChapter: null, arcLength: 0 }
}

function computePolarity(emotion: string): number {
  const positiveEmotions = ['joy', 'trust', 'anticipation']
  const negativeEmotions = ['fear', 'sadness', 'disgust', 'anger']
  const lower = emotion.toLowerCase()
  if (positiveEmotions.some(e => lower.includes(e))) return 1
  if (negativeEmotions.some(e => lower.includes(e))) return -1
  return 0
}

function detectTrajectory(points: EmotionArcPoint[]): EmotionalTrajectory {
  if (points.length < 3) return 'stable'
  const intensities = points.map(p => p.intensity)
  const first = intensities[0]
  const last = intensities[intensities.length - 1]
  const mid = intensities[Math.floor(intensities.length / 2)]
  const variance = intensities.reduce((s, i) => s + Math.abs(i - mid), 0) / intensities.length
  
  if (variance < 5) return 'stable'
  if (last > first + 15) return 'ascending'
  if (last < first - 15) return 'descending'
  if (variance > 15) return 'fluctuating'
  return 'complex'
}

export function addEmotionArcPoint(
  state: EmotionArcState,
  chapter: number,
  primaryEmotion: string,
  intensity: number,
  secondaryEmotion: string | null = null
): EmotionArcState {
  const polarity = computePolarity(primaryEmotion)
  
  const point: EmotionArcPoint = {
    chapter,
    primaryEmotion,
    intensity,
    secondaryEmotion,
    polarity,
  }

  const newPoints = [...state.arcPoints, point]
  
  let peakChapter = state.peakChapter
  let lowChapter = state.lowChapter
  if (peakChapter === null || intensity > (newPoints.find(p => p.chapter === peakChapter)?.intensity || 0)) {
    peakChapter = chapter
  }
  if (lowChapter === null || intensity < (newPoints.find(p => p.chapter === lowChapter)?.intensity || 100)) {
    lowChapter = chapter
  }

  const currentArc = detectTrajectory(newPoints)

  return {
    arcPoints: newPoints,
    currentArc,
    peakChapter,
    lowChapter,
    arcLength: newPoints.length,
  }
}

export function getEmotionArcPhase(state: EmotionArcState, chapter: number): EmotionArcPhase | null {
  if (state.arcPoints.length < 2) return null
  const sorted = [...state.arcPoints].sort((a, b) => a.chapter - b.chapter)
  const idx = sorted.findIndex(p => p.chapter >= chapter)
  if (idx === -1 || idx === 0) return 'introduction'
  if (idx === sorted.length - 1) return 'resolution'
  
  const prev = sorted[idx - 1]
  const curr = sorted[idx]
  const next = sorted[idx + 1]
  
  if (curr.intensity > prev.intensity && curr.intensity > (next?.intensity || 0)) return 'climax'
  if (curr.intensity > prev.intensity) return 'build_up'
  if (curr.intensity < prev.intensity) return 'release'
  return 'introduction'
}

export function getEmotionAtChapter(state: EmotionArcState, chapter: number): EmotionArcPoint | null {
  return state.arcPoints.find(p => p.chapter === chapter) || null
}

export function getArcRange(state: EmotionArcState): number {
  if (state.arcPoints.length < 2) return 0
  const sorted = [...state.arcPoints].sort((a, b) => a.chapter - b.chapter)
  return sorted[sorted.length - 1].chapter - sorted[0].chapter
}

export function getArcVolatility(state: EmotionArcState): number {
  if (state.arcPoints.length < 2) return 0
  const intensities = state.arcPoints.map(p => p.intensity)
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length
  const variance = intensities.reduce((s, i) => s + Math.pow(i - mean, 2), 0) / intensities.length
  return Math.round(Math.sqrt(variance))
}

export function formatEmotionArcSummary(state: EmotionArcState): string {
  let s = "=== Narrative Emotion Arc Summary ===\n"
  s += "Arc Points: " + state.arcPoints.length + "\n"
  s += "Trajectory: " + state.currentArc + "\n"
  s += "Peak: Ch" + (state.peakChapter || 'N/A') + " | Low: Ch" + (state.lowChapter || 'N/A') + "\n"
  return s
}

export function formatEmotionArcDashboard(state: EmotionArcState): string {
  let s = "=== Narrative Emotion Arc Dashboard ===\n"
  s += "Total Points: " + state.arcPoints.length + "\n"
  s += "Trajectory: " + state.currentArc + " | Volatility: " + getArcVolatility(state) + "\n"
  s += "Peak: Ch" + (state.peakChapter || 'N/A') + " | Low: Ch" + (state.lowChapter || 'N/A') + "\n"

  if (state.arcPoints.length > 0) {
    s += "\n--- Arc Overview ---\n"
    const sorted = [...state.arcPoints].sort((a, b) => a.chapter - b.chapter).slice(-5)
    for (const p of sorted) {
      s += "  Ch" + p.chapter + ": " + p.primaryEmotion + " (" + p.intensity + ") " + (p.polarity > 0 ? '+' : p.polarity < 0 ? '-' : '~') + "\n"
    }
  }
  return s
}