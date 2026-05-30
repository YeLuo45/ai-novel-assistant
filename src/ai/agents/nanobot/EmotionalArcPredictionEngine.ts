/**
 * EmotionalArcPredictionEngine — V518
 * Emotional arc mapping, prediction, and resonance scoring.
 * Inspired by: thunderbolt-design (pipeline/feedback loops) + emotional valence theory
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise'

export interface EmotionalPoint {
  pointId: string
  chapter: number
  scene: string
  emotions: Record<EmotionType, number>  // 0-100 for each emotion
  dominantEmotion: EmotionType
  valence: number  // -100 to 100, negative=negative, positive=positive
  arousal: number   // 0-100, intensity level
}

export interface EmotionalArc {
  arcId: string
  points: EmotionalPoint[]
  emotionSequence: EmotionType[]
  arcType: 'rising' | 'falling' | 'conflicted' | 'stable' | 'cyclical'
  emotionalRange: { min: number; max: number }
}

export interface ArcPrediction {
  predictedEmotion: EmotionType
  confidence: number  // 0-1
  predictedValence: number
  predictedArousal: number
  trend: 'intensifying' | 'fading' | 'stable' | 'shifting'
  reasoning: string
}

export interface ResonanceScore {
  score: number        // 0-100
  emotionalClarity: number   // 0-1, how clear the emotional message is
  intensityMatch: number     // 0-1, reader expectation vs content match
  arcCoherence: number       // 0-1, how coherent the emotional journey is
  peakResonance: number      // 0-1, effectiveness of emotional peaks
  breakdown: {
    clarityBreakdown: number
    intensityBreakdown: number
    coherenceBreakdown: number
  }
}

export interface EmotionalArcState {
  arcs: EmotionalArc[]
  currentChapter: number
  dominantArc: EmotionalArc | null
  resonanceHistory: ResonanceScore[]
  averageValence: number
  averageArousal: number
}

// ============================================================
// EMOTION KEYWORDS & MAPPERS
// ============================================================

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  joy: ['happy', 'joy', 'delight', 'pleased', 'glad', 'happy', 'laugh', 'smile', 'celebrate', 'love', 'wonderful', 'beautiful', 'excited', 'thrilled', 'elated', 'cheerful', 'content', 'satisfied', 'grateful', 'blessed'],
  sadness: ['sad', 'sorrow', 'grief', 'tears', 'cry', 'weep', 'lonely', 'alone', 'depressed', 'melancholy', 'heartbroken', 'mourn', 'grieve', 'despair', 'hopeless', 'lost', 'regret', 'disappointed', 'unhappy', 'miserable'],
  anger: ['angry', 'rage', 'fury', 'hate', 'hostile', 'furious', 'mad', 'irate', 'wrath', 'annoyed', 'frustrated', 'bitter', 'resentful', 'enraged', 'outraged', 'irritated', 'infuriated', 'provoked', 'aggravated', 'hostility'],
  fear: ['afraid', 'fear', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'dread', 'horror', 'panic', 'fright', 'terror', 'apprehensive', 'uneasy', 'tense', '惶恐', 'shiver', 'tremble', 'cower', 'timid'],
  surprise: ['surprise', 'shock', 'amaze', 'astonish', 'startled', 'unexpected', 'sudden', 'astounded', 'stunned', 'bewildered', 'astonished', 'staggered', 'flabbergasted', 'thunderstruck', 'jolted', 'caught off guard', 'revelation', 'discovered', 'revealed']
}

const EMOTION_VALENCE: Record<EmotionType, number> = {
  joy: 80,
  sadness: -70,
  anger: -40,
  fear: -60,
  surprise: 10  // neutral-ish, depends on context
}

const EMOTION_AROUSAL: Record<EmotionType, number> = {
  joy: 60,
  sadness: 40,
  anger: 80,
  fear: 75,
  surprise: 85
}

// ============================================================
// EMOTIONAL ARC MAPPER
// ============================================================

function createPointId(): string {
  return 'emo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectEmotionFromText(text: string): Record<EmotionType, number> {
  const lower = text.toLowerCase()
  const scores: Record<EmotionType, number> = {
    joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0
  }

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [EmotionType, string[]][]) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[emotion] += 15
      }
    }
  }

  // Normalize to 0-100
  for (const emotion of Object.keys(scores) as EmotionType[]) {
    scores[emotion] = Math.min(100, scores[emotion])
  }

  return scores
}

function getDominantEmotion(emotions: Record<EmotionType, number>): EmotionType {
  let maxEmotion: EmotionType = 'joy'
  let maxScore = 0

  for (const [emotion, score] of Object.entries(emotions) as [EmotionType, number][]) {
    if (score > maxScore) {
      maxScore = score
      maxEmotion = emotion
    }
  }

  return maxEmotion
}

function calculateValence(emotions: Record<EmotionType, number>): number {
  let total = 0
  for (const [emotion, intensity] of Object.entries(emotions) as [EmotionType, number][]) {
    total += (EMOTION_VALENCE[emotion] * intensity) / 100
  }
  return Math.max(-100, Math.min(100, Math.round(total)))
}

function calculateArousal(emotions: Record<EmotionType, number>): number {
  let total = 0
  for (const [emotion, intensity] of Object.entries(emotions) as [EmotionType, number][]) {
    total += (EMOTION_AROUSAL[emotion] * intensity) / 100
  }
  return Math.max(0, Math.min(100, Math.round(total)))
}

function detectArcType(points: EmotionalPoint[]): EmotionalArc['arcType'] {
  if (points.length < 3) return 'stable'

  const valences = points.map(p => p.valence)
  const first = valences[0]
  const last = valences[valences.length - 1]
  const mid = Math.floor(valences.length / 2)

  // Check for cyclical pattern
  const recent = valences.slice(-3)
  if (Math.abs(recent[0] - recent[2]) < 20) {
    return 'cyclical'
  }

  // Rising arc: last > first + 20
  if (last > first + 20) return 'rising'
  // Falling arc: last < first - 20
  if (last < first - 20) return 'falling'
  // Conflicted: mid differs significantly from both
  if (Math.abs(valences[mid] - first) > 30 && Math.abs(valences[mid] - last) > 30) {
    return 'conflicted'
  }

  return 'stable'
}

function calculateEmotionalRange(points: EmotionalPoint[]): { min: number; max: number } {
  if (points.length === 0) return { min: 0, max: 0 }
  const valences = points.map(p => p.valence)
  return { min: Math.min(...valences), max: Math.max(...valences) }
}

/**
 * Map a text segment to emotional values
 */
export function mapTextToEmotions(text: string): Record<EmotionType, number> {
  return detectEmotionFromText(text)
}

/**
 * Create an emotional point from chapter/scene/text
 */
export function createEmotionalPoint(
  chapter: number,
  scene: string,
  text: string
): EmotionalPoint {
  const emotions = detectEmotionFromText(text)
  const dominantEmotion = getDominantEmotion(emotions)
  const valence = calculateValence(emotions)
  const arousal = calculateArousal(emotions)

  return {
    pointId: createPointId(),
    chapter,
    scene,
    emotions,
    dominantEmotion,
    valence,
    arousal
  }
}

/**
 * Create an emotional arc from a series of points
 */
export function createEmotionalArc(points: EmotionalPoint[]): EmotionalArc {
  const emotionSequence = points.map(p => p.dominantEmotion)
  const arcType = detectArcType(points)
  const emotionalRange = calculateEmotionalRange(points)

  return {
    arcId: 'arc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    points,
    emotionSequence,
    arcType,
    emotionalRange
  }
}

// ============================================================
// ARC PREDICTOR
// ============================================================

function analyzeTrend(points: EmotionalPoint[]): 'intensifying' | 'fading' | 'stable' | 'shifting' {
  if (points.length < 3) return 'stable'

  const valences = points.map(p => p.valence)
  const recent = valences.slice(-3)
  const diff = recent[2] - recent[0]

  if (Math.abs(diff) < 15) return 'stable'
  if (diff > 0) return 'intensifying'
  if (diff < 0) return 'fading'

  return 'shifting'
}

function predictNextEmotion(points: EmotionalPoint[]): { emotion: EmotionType; confidence: number } {
  if (points.length === 0) {
    return { emotion: 'joy', confidence: 0 }
  }

  if (points.length < 3) {
    return { emotion: points[points.length - 1].dominantEmotion, confidence: 0.5 }
  }

  // Analyze emotion transitions
  const transitions: Record<string, number> = {}
  for (let i = 1; i < points.length; i++) {
    const key = `${points[i - 1].dominantEmotion}->${points[i].dominantEmotion}`
    transitions[key] = (transitions[key] || 0) + 1
  }

  const lastEmotion = points[points.length - 1].dominantEmotion
  let bestNext: EmotionType = lastEmotion
  let bestCount = 0

  for (const [key, count] of Object.entries(transitions)) {
    if (key.startsWith(lastEmotion + '->')) {
      const nextEmotion = key.split('->')[1] as EmotionType
      if (count > bestCount) {
        bestCount = count
        bestNext = nextEmotion
      }
    }
  }

  const confidence = points.length >= 5 ? 0.8 : 0.5 + (points.length * 0.06)

  return { emotion: bestNext, confidence: Math.min(0.9, confidence) }
}

/**
 * Predict the next emotional state based on arc history
 */
export function predictNextEmotionalState(arc: EmotionalArc): ArcPrediction {
  if (arc.points.length === 0) {
    return {
      predictedEmotion: 'joy',
      confidence: 0,
      predictedValence: 0,
      predictedArousal: 50,
      trend: 'stable',
      reasoning: 'No emotional history available'
    }
  }

  const trend = analyzeTrend(arc.points)
  const { emotion, confidence } = predictNextEmotion(arc.points)
  const lastPoint = arc.points[arc.points.length - 1]

  // Predict valence based on trend and current state
  let predictedValence = lastPoint.valence
  if (trend === 'intensifying') {
    predictedValence = lastPoint.valence > 0
      ? Math.min(100, lastPoint.valence + 15)
      : Math.min(0, lastPoint.valence + 25)
  } else if (trend === 'fading') {
    predictedValence = lastPoint.valence > 0
      ? Math.max(0, lastPoint.valence - 10)
      : Math.max(-100, lastPoint.valence - 15)
  }

  // Predict arousal
  const predictedArousal = lastPoint.arousal + (trend === 'intensifying' ? 5 : trend === 'fading' ? -5 : 0)

  let reasoning: string
  switch (trend) {
    case 'intensifying':
      reasoning = `Emotional intensity is building. Last dominant emotion: ${lastPoint.dominantEmotion}. Transition pattern suggests continued escalation.`
      break
    case 'fading':
      reasoning = `Emotional energy is dissipating. Current emotional state is moderating toward baseline.`
      break
    case 'shifting':
      reasoning = `Emotional shift detected. The narrative may be transitioning to a different emotional phase.`
      break
    default:
      reasoning = `Emotional state is stable. Maintaining current trajectory.`
  }

  return {
    predictedEmotion: emotion,
    confidence,
    predictedValence: Math.max(-100, Math.min(100, predictedValence)),
    predictedArousal: Math.max(0, Math.min(100, predictedArousal)),
    trend,
    reasoning
  }
}

/**
 * Predict emotional arc for upcoming chapters
 */
export function predictEmotionalArc(arc: EmotionalArc, aheadChapters: number = 3): ArcPrediction[] {
  const predictions: ArcPrediction[] = []

  let workingArc = { ...arc }

  for (let i = 0; i < aheadChapters; i++) {
    const prediction = predictNextEmotionalState(workingArc)
    predictions.push(prediction)

    // Add predicted point to arc for next iteration
    const newPoint: EmotionalPoint = {
      pointId: createPointId(),
      chapter: (workingArc.points[workingArc.points.length - 1]?.chapter || 0) + 1,
      scene: 'predicted',
      emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 },
      dominantEmotion: prediction.predictedEmotion,
      valence: prediction.predictedValence,
      arousal: prediction.predictedArousal
    }
    workingArc.points = [...workingArc.points, newPoint]
  }

  return predictions
}

// ============================================================
// EMOTIONAL RESONANCE SCORER
// ============================================================

function calculateEmotionalClarity(points: EmotionalPoint[]): number {
  if (points.length === 0) return 0

  // Count how many points share the dominant emotion
  const emotionCounts: Record<EmotionType, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 }
  for (const point of points) {
    if (point.emotions[point.dominantEmotion] > 50) {
      emotionCounts[point.dominantEmotion]++
    }
  }

  const maxCount = Math.max(...Object.values(emotionCounts))
  return maxCount / points.length
}

function calculateIntensityMatch(points: EmotionalPoint[]): number {
  if (points.length === 0) return 0

  // Reader expects peaks and valleys - check if emotional journey has variety
  const valences = points.map(p => p.valence)
  const variance = valences.reduce((sum, v, i, arr) => {
    if (i === 0) return sum
    return sum + Math.pow(v - arr[i - 1], 2)
  }, 0) / (valences.length - 1 || 1)

  // Good resonance has moderate variance (not too flat, not too chaotic)
  const normalizedVariance = Math.min(1, variance / 5000)
  return 0.5 + (normalizedVariance * 0.5)
}

function calculateArcCoherence(points: EmotionalPoint[]): number {
  if (points.length < 2) return 1

  // Check for logical emotion progressions
  let coherentTransitions = 0
  const emotionOrder: Record<EmotionType, number> = { joy: 3, surprise: 2, anger: 1, fear: 0, sadness: -1 }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const prevDom = prev.dominantEmotion
    const currDom = curr.dominantEmotion

    // Transitions are coherent if they don't jump wildly
    const orderDiff = Math.abs(emotionOrder[currDom] - emotionOrder[prevDom])
    if (orderDiff <= 2) {
      coherentTransitions++
    }
  }

  return coherentTransitions / (points.length - 1)
}

function calculatePeakResonance(points: EmotionalPoint[]): number {
  if (points.length < 3) return 0

  // Find emotional peaks (high arousal moments)
  const avgArousal = points.reduce((sum, p) => sum + p.arousal, 0) / points.length
  const peaks = points.filter(p => p.arousal > avgArousal + 20)

  // Good resonance means peaks have strong emotional clarity
  if (peaks.length === 0) return 0

  const peakClaritySum = peaks.reduce((sum, p) => {
    const maxEmotion = Math.max(...Object.values(p.emotions))
    return sum + (maxEmotion / 100)
  }, 0)

  return peakClaritySum / peaks.length
}

/**
 * Calculate emotional resonance score for an arc
 */
export function calculateResonanceScore(arc: EmotionalArc): ResonanceScore {
  if (arc.points.length === 0) {
    return {
      score: 0,
      emotionalClarity: 0,
      intensityMatch: 0,
      arcCoherence: 0,
      peakResonance: 0,
      breakdown: { clarityBreakdown: 0, intensityBreakdown: 0, coherenceBreakdown: 0 }
    }
  }

  const emotionalClarity = calculateEmotionalClarity(arc.points)
  const intensityMatch = calculateIntensityMatch(arc.points)
  const arcCoherence = calculateArcCoherence(arc.points)
  const peakResonance = calculatePeakResonance(arc.points)

  const clarityBreakdown = Math.round(emotionalClarity * 100)
  const intensityBreakdown = Math.round(intensityMatch * 100)
  const coherenceBreakdown = Math.round(arcCoherence * 100)

  const score = Math.round(
    emotionalClarity * 30 +
    intensityMatch * 25 +
    arcCoherence * 25 +
    peakResonance * 20
  )

  return {
    score,
    emotionalClarity,
    intensityMatch,
    arcCoherence,
    peakResonance,
    breakdown: {
      clarityBreakdown,
      intensityBreakdown,
      coherenceBreakdown
    }
  }
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function createEmptyEmotionalArcState(): EmotionalArcState {
  return {
    arcs: [],
    currentChapter: 0,
    dominantArc: null,
    resonanceHistory: [],
    averageValence: 0,
    averageArousal: 0
  }
}

export function addEmotionalPoint(
  state: EmotionalArcState,
  chapter: number,
  scene: string,
  text: string
): EmotionalArcState {
  const point = createEmotionalPoint(chapter, scene, text)

  // Create a new arc or add to existing
  let arc = state.dominantArc
  if (!arc) {
    arc = createEmotionalArc([point])
  } else {
    arc = { ...arc, points: [...arc.points, point] }
    // Recalculate arc properties
    arc.emotionSequence = arc.points.map(p => p.dominantEmotion)
    arc.arcType = detectArcType(arc.points)
    arc.emotionalRange = calculateEmotionalRange(arc.points)
  }

  // Update arcs list
  const existingIndex = state.arcs.findIndex(a => a.arcId === arc!.arcId)
  const newArcs = existingIndex >= 0
    ? state.arcs.map((a, i) => i === existingIndex ? arc! : a)
    : [...state.arcs, arc!]

  // Calculate new averages
  const allPoints = newArcs.flatMap(a => a.points)
  const averageValence = allPoints.length > 0
    ? Math.round(allPoints.reduce((sum, p) => sum + p.valence, 0) / allPoints.length)
    : 0
  const averageArousal = allPoints.length > 0
    ? Math.round(allPoints.reduce((sum, p) => sum + p.arousal, 0) / allPoints.length)
    : 0

  return {
    ...state,
    arcs: newArcs,
    currentChapter: Math.max(state.currentChapter, chapter),
    dominantArc: arc,
    averageValence,
    averageArousal
  }
}

export function addResonanceScore(
  state: EmotionalArcState,
  score: ResonanceScore
): EmotionalArcState {
  return {
    ...state,
    resonanceHistory: [...state.resonanceHistory, score]
  }
}

// ============================================================
// FORMATTING
// ============================================================

export function formatEmotionalSummary(state: EmotionalArcState): string {
  let s = "=== Emotional Arc Summary ===\n"
  s += "Current Chapter: " + state.currentChapter + "\n"
  s += "Total Arcs: " + state.arcs.length + "\n"
  s += "Average Valence: " + state.averageValence + "\n"
  s += "Average Arousal: " + state.averageArousal + "\n"

  if (state.dominantArc) {
    s += "\n--- Dominant Arc ---" + "\n"
    s += "Type: " + state.dominantArc.arcType + "\n"
    s += "Points: " + state.dominantArc.points.length + "\n"
    s += "Emotion Sequence: " + state.dominantArc.emotionSequence.join(" -> ") + "\n"
  }

  return s
}

export function formatEmotionalDashboard(state: EmotionalArcState): string {
  let s = "=== Emotional Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Valence: " + state.averageValence + " | Arousal: " + state.averageArousal + "\n"

  if (state.dominantArc && state.dominantArc.points.length > 0) {
    s += "\n--- Recent Emotional Points ---\n"
    const recent = state.dominantArc.points.slice(-5)
    for (const p of recent) {
      s += `  Ch ${p.chapter} [${p.dominantEmotion}] val=${p.valence} aro=${p.arousal}\n`
    }

    const prediction = predictNextEmotionalState(state.dominantArc)
    s += "\n--- Prediction ---\n"
    s += `  Next: ${prediction.predictedEmotion} (${(prediction.confidence * 100).toFixed(0)}% confidence)\n`
    s += `  Trend: ${prediction.trend}\n`
  }

  if (state.resonanceHistory.length > 0) {
    const latest = state.resonanceHistory[state.resonanceHistory.length - 1]
    s += "\n--- Resonance ---\n"
    s += `  Score: ${latest.score}/100\n`
  }

  return s
}

export function getEmotionalArcAtChapter(state: EmotionalArcState, chapter: number): EmotionalPoint | null {
  for (const arc of state.arcs) {
    const point = arc.points.find(p => p.chapter === chapter)
    if (point) return point
  }
  return null
}

export function getEmotionalTrend(state: EmotionalArcState, window: number = 5): 'rising' | 'falling' | 'stable' | 'conflicted' {
  const allPoints = state.arcs.flatMap(a => a.points)
  if (allPoints.length < 2) return 'stable'

  const recent = allPoints.slice(-window)
  if (recent.length < 2) return 'stable'

  const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
  const secondHalf = recent.slice(Math.floor(recent.length / 2))

  const firstAvg = firstHalf.reduce((sum, p) => sum + p.valence, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, p) => sum + p.valence, 0) / secondHalf.length

  const diff = secondAvg - firstAvg
  if (Math.abs(diff) < 15) return 'stable'
  if (diff > 20) return 'rising'
  if (diff < -20) return 'falling'
  return 'conflicted'
}
