// ConflictDramaticEngine - V274: Conflict & Dramatic Engine - tracks conflicts, stakes, dramatic tension arcs
// Inspired by: thunderbolt (feedback loops) + nanobot (mesh analysis)

export type PrimaryEmotion = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'disgust' | 'anger' | 'anticipation'

export interface EmotionDataPoint {
  chapter: number
  primary: PrimaryEmotion
  intensity: number  // 0-100
  secondary: PrimaryEmotion | null
}

export interface EmotionWheelState {
  emotionPoints: EmotionDataPoint[]
  emotionHistogram: Map<PrimaryEmotion, number>
  dominantEmotion: PrimaryEmotion | null
  emotionalRange: number  // difference between highest and lowest intensity
}

export function createEmptyEmotionWheelState(): EmotionWheelState {
  return {
    emotionPoints: [],
    emotionHistogram: new Map(),
    dominantEmotion: null,
    emotionalRange: 0,
  }
}

export function addEmotionPoint(
  state: EmotionWheelState,
  chapter: number,
  primary: PrimaryEmotion,
  intensity: number,
  secondary: PrimaryEmotion | null = null
): EmotionWheelState {
  const point: EmotionDataPoint = { chapter, primary, intensity, secondary }
  const newPoints = [...state.emotionPoints, point]
  const hist = new Map(state.emotionHistogram)
  hist.set(primary, (hist.get(primary) || 0) + 1)
  const intensities = newPoints.map(p => p.intensity)
  const range = intensities.length > 1 ? Math.max(...intensities) - Math.min(...intensities) : 0
  let dominant = state.dominantEmotion
  if (!dominant || intensity > newPoints.find(p => p.primary === dominant)!.intensity) {
    dominant = primary
  }
  return { emotionPoints: newPoints, emotionHistogram: hist, dominantEmotion: dominant, emotionalRange: range }
}

export function getEmotionsByChapter(state: EmotionWheelState, chapter: number): EmotionDataPoint[] {
  return state.emotionPoints.filter(p => p.chapter === chapter)
}

export function getDominantEmotion(state: EmotionWheelState): PrimaryEmotion | null {
  return state.dominantEmotion
}

export function getEmotionFrequency(state: EmotionWheelState, emotion: PrimaryEmotion): number {
  return state.emotionHistogram.get(emotion) || 0
}

export function formatEmotionWheelSummary(state: EmotionWheelState): string {
  let s = "=== Emotion Wheel Summary ===\n"
  s += "Emotion Points: " + state.emotionPoints.length + " | Range: " + state.emotionalRange + "\n"
  s += "Dominant: " + (state.dominantEmotion || 'none') + "\n"
  return s
}

export function formatEmotionWheelDashboard(state: EmotionWheelState): string {
  let s = "=== Emotion Wheel Dashboard ===\n"
  s += "Points: " + state.emotionPoints.length + " | Dominant: " + (state.dominantEmotion || 'none') + "\n"
  s += "Range: " + state.emotionalRange + "\n"
  return s
}
