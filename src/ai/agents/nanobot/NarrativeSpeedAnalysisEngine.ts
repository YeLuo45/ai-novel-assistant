/**
 * NarrativeSpeedAnalysisEngine — V514
 * Narrative speed calculation, anomaly detection, and trajectory tracking/prediction.
 * Inspired by: nanobot (mesh state) + AdaptiveChapterFlowEngine (flow analysis)
 */

export type SpeedLevel = 'slow' | 'moderate' | 'fast' | 'racing'

export interface SpeedMetrics {
  wordsPerMinute: number
  sentenceCount: number
  avgSentenceLength: number
  paragraphCount: number
  avgParagraphLength: number
  sceneSwitchCount: number
  sceneSwitchFrequency: number  // per 1000 words
  speedLevel: SpeedLevel
  chapterNumber: number
  wordCount: number
}

export interface SpeedAnomaly {
  id: string
  type: 'too_fast' | 'too_slow' | 'speed_spike' | 'speed_dip'
  severity: number  // 0-100
  chapterNumber: number
  currentSpeed: number
  expectedSpeed: number
  deviation: number  // percentage difference from expected
  timestamp: number
}

export interface SpeedTrajectoryPoint {
  chapterNumber: number
  speed: number  // words per minute
  timestamp: number
}

export interface SpeedPrediction {
  chapterNumber: number
  predictedSpeed: number
  confidence: number  // 0-100
  trend: 'accelerating' | 'decelerating' | 'stable'
  basedOnPoints: number
  predictionInterval: number  // chapters ahead
}

export interface NarrativeSpeedState {
  metrics: Record<string, SpeedMetrics>  // chapterId -> metrics
  anomalies: SpeedAnomaly[]
  trajectory: SpeedTrajectoryPoint[]
  predictions: Record<number, SpeedPrediction>  // chapterNumber -> prediction
  globalAvgSpeed: number
  globalStdDev: number
  readingSpeedBaseline: number  // typical wpm reading speed
}

// ─────────────────────────────────────────────────────────────
// State Factory
// ─────────────────────────────────────────────────────────────

export function createEmptyState(readingSpeedBaseline = 250): NarrativeSpeedState {
  return {
    metrics: {},
    anomalies: [],
    trajectory: [],
    predictions: {},
    globalAvgSpeed: readingSpeedBaseline,
    globalStdDev: 0,
    readingSpeedBaseline
  }
}

// ─────────────────────────────────────────────────────────────
// Speed Calculation
// ─────────────────────────────────────────────────────────────

function detectSceneSwitches(content: string): number {
  // Scene switches are marked by *** or blank line + scene marker
  const lines = content.split('\n')
  let count = 0
  let inBlankLine = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      inBlankLine = true
    } else if (inBlankLine && trimmed.length > 0) {
      // A non-blank line after a blank line could be a new scene
      // Heuristic: short line that looks like a scene opener
      if (trimmed.length < 60 && /^[A-Z".]/.test(trimmed)) {
        count++
      }
      inBlankLine = false
    }
  }
  // Alternative: count *** markers
  const markers = (content.match(/^\*{3,}$/gm) || []).length
  return Math.max(count, markers)
}

function calculateWordCount(content: string): number {
  return content.split(/\s+/).filter(w => w.length > 0).length
}

function calculateSentenceCount(content: string): number {
  // Split on sentence-ending punctuation
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  return Math.max(1, sentences.length)
}

function calculateParagraphCount(content: string): number {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  return Math.max(1, paragraphs.length)
}

function determineSpeedLevel(wpm: number, baseline: number): SpeedLevel {
  const ratio = wpm / baseline
  if (ratio < 0.6) return 'slow'
  if (ratio < 0.9) return 'moderate'
  if (ratio < 1.3) return 'fast'
  return 'racing'
}

export function calculateSpeed(
  content: string,
  readingTimeSeconds: number,
  chapterNumber: number,
  state: NarrativeSpeedState
): SpeedMetrics {
  const wordCount = calculateWordCount(content)
  const sentenceCount = calculateSentenceCount(content)
  const paragraphCount = calculateParagraphCount(content)
  const sceneSwitchCount = detectSceneSwitches(content)

  // Words per minute (estimated reading time)
  const wordsPerMinute = readingTimeSeconds > 0
    ? Math.round((wordCount / readingTimeSeconds) * 60)
    : Math.round(wordCount / 5) // fallback: assume 5 min reading

  const avgSentenceLength = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0
  const avgParagraphLength = paragraphCount > 0 ? Math.round(wordCount / paragraphCount) : 0
  const sceneSwitchFrequency = wordCount > 0
    ? Math.round((sceneSwitchCount / wordCount) * 1000)
    : 0

  return {
    wordsPerMinute,
    sentenceCount,
    avgSentenceLength,
    paragraphCount,
    avgParagraphLength,
    sceneSwitchCount,
    sceneSwitchFrequency,
    speedLevel: determineSpeedLevel(wordsPerMinute, state.readingSpeedBaseline),
    chapterNumber,
    wordCount
  }
}

export function recordSpeedMetrics(
  state: NarrativeSpeedState,
  chapterId: string,
  metrics: SpeedMetrics
): NarrativeSpeedState {
  return {
    ...state,
    metrics: { ...state.metrics, [chapterId]: metrics }
  }
}

// ─────────────────────────────────────────────────────────────
// Anomaly Detection
// ─────────────────────────────────────────────────────────────

const ANOMALY_THRESHOLD_FAST = 1.5  // speed > 1.5x baseline = too fast
const ANOMALY_THRESHOLD_SLOW = 0.4  // speed < 0.4x baseline = too slow
const ANOMALY_SEVERITY_SPIKE = 30   // sudden change > 30% from previous

export function detectSpeedAnomalies(
  state: NarrativeSpeedState,
  chapterId: string
): NarrativeSpeedState {
  const metrics = state.metrics[chapterId]
  if (!metrics) return state

  const chapter = metrics.chapterNumber
  const speed = metrics.wordsPerMinute
  const baseline = state.readingSpeedBaseline
  const anomalies: SpeedAnomaly[] = [...state.anomalies]

  // Find previous trajectory point
  const sortedTrajectory = [...state.trajectory].sort((a, b) => a.chapterNumber - b.chapterNumber)
  const prevPoint = sortedTrajectory.filter(p => p.chapterNumber < chapter).pop()
  const prevSpeed = prevPoint?.speed ?? state.globalAvgSpeed

  const deviation = Math.abs(speed - baseline) / baseline
  const changeRatio = prevSpeed > 0 ? speed / prevSpeed : 1

  // too_fast: speed > baseline * threshold
  if (speed > baseline * ANOMALY_THRESHOLD_FAST) {
    anomalies.push({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'too_fast',
      severity: Math.min(100, Math.round(deviation * 100)),
      chapterNumber: chapter,
      currentSpeed: speed,
      expectedSpeed: baseline,
      deviation: Math.round(deviation * 100),
      timestamp: Date.now()
    })
  }

  // too_slow: speed < baseline * threshold
  if (speed < baseline * ANOMALY_THRESHOLD_SLOW) {
    anomalies.push({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'too_slow',
      severity: Math.min(100, Math.round(deviation * 100)),
      chapterNumber: chapter,
      currentSpeed: speed,
      expectedSpeed: baseline,
      deviation: Math.round(deviation * 100),
      timestamp: Date.now()
    })
  }

  // speed_spike: >30% faster than previous chapter
  if (changeRatio > 1 + ANOMALY_SEVERITY_SPIKE / 100) {
    anomalies.push({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'speed_spike',
      severity: Math.min(100, Math.round((changeRatio - 1) * 100)),
      chapterNumber: chapter,
      currentSpeed: speed,
      expectedSpeed: prevSpeed,
      deviation: Math.round((changeRatio - 1) * 100),
      timestamp: Date.now()
    })
  }

  // speed_dip: >30% slower than previous chapter
  if (changeRatio < 1 - ANOMALY_SEVERITY_SPIKE / 100) {
    anomalies.push({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'speed_dip',
      severity: Math.min(100, Math.round((1 - changeRatio) * 100)),
      chapterNumber: chapter,
      currentSpeed: speed,
      expectedSpeed: prevSpeed,
      deviation: Math.round((1 - changeRatio) * 100),
      timestamp: Date.now()
    })
  }

  return { ...state, anomalies }
}

// ─────────────────────────────────────────────────────────────
// Trajectory Tracking
// ─────────────────────────────────────────────────────────────

export function addTrajectoryPoint(
  state: NarrativeSpeedState,
  chapterNumber: number,
  speed: number
): NarrativeSpeedState {
  const point: SpeedTrajectoryPoint = {
    chapterNumber,
    speed,
    timestamp: Date.now()
  }

  const trajectory = [...state.trajectory, point]

  // Recalculate global stats
  const speeds = trajectory.map(p => p.speed)
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
  const variance = speeds.reduce((a, b) => a + (b - avg) ** 2, 0) / speeds.length
  const stdDev = Math.sqrt(variance)

  return {
    ...state,
    trajectory,
    globalAvgSpeed: Math.round(avg),
    globalStdDev: Math.round(stdDev)
  }
}

export function getTrajectoryRange(
  state: NarrativeSpeedState,
  fromChapter: number,
  toChapter: number
): SpeedTrajectoryPoint[] {
  return state.trajectory
    .filter(p => p.chapterNumber >= fromChapter && p.chapterNumber <= toChapter)
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
}

// ─────────────────────────────────────────────────────────────
// Speed Prediction
// ─────────────────────────────────────────────────────────────

function linearRegression(points: SpeedTrajectoryPoint[]): { slope: number; intercept: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.speed ?? 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (const p of points) {
    sumX += p.chapterNumber
    sumY += p.speed
    sumXY += p.chapterNumber * p.speed
    sumXX += p.chapterNumber * p.chapterNumber
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? sumY / n : intercept }
}

export function predictNextSpeed(
  state: NarrativeSpeedState,
  targetChapter: number
): SpeedPrediction {
  const sorted = [...state.trajectory].sort((a, b) => a.chapterNumber - b.chapterNumber)
  const recent = sorted.slice(-10)  // use last 10 points max

  if (recent.length < 2) {
    return {
      chapterNumber: targetChapter,
      predictedSpeed: state.globalAvgSpeed,
      confidence: 20,
      trend: 'stable',
      basedOnPoints: recent.length,
      predictionInterval: targetChapter - (sorted[sorted.length - 1]?.chapterNumber ?? 0)
    }
  }

  const { slope, intercept } = linearRegression(recent)
  const predictedSpeed = Math.max(50, Math.round(intercept + slope * targetChapter))

  // Determine trend
  const first = recent[0].speed
  const last = recent[recent.length - 1].speed
  const trend: SpeedPrediction['trend'] =
    slope > 5 ? 'accelerating' : slope < -5 ? 'decelerating' : 'stable'

  // Confidence based on how many points and how consistent the trajectory is
  const speedVariance = recent.reduce((a, p) => a + (p.speed - first) ** 2, 0) / recent.length
  const variancePenalty = Math.min(40, Math.round(speedVariance / 1000))
  const pointsBonus = Math.min(30, recent.length * 3)
  const confidence = Math.max(10, Math.min(95, 50 + pointsBonus - variancePenalty))

  return {
    chapterNumber: targetChapter,
    predictedSpeed,
    confidence,
    trend,
    basedOnPoints: recent.length,
    predictionInterval: targetChapter - recent[recent.length - 1].chapterNumber
  }
}

export function recordPrediction(
  state: NarrativeSpeedState,
  prediction: SpeedPrediction
): NarrativeSpeedState {
  return {
    ...state,
    predictions: { ...state.predictions, [prediction.chapterNumber]: prediction }
  }
}

// ─────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────

export function getSpeedMetrics(state: NarrativeSpeedState, chapterId: string): SpeedMetrics | null {
  return state.metrics[chapterId] ?? null
}

export function getChapterMetricsByNumber(state: NarrativeSpeedState, chapterNumber: number): SpeedMetrics | null {
  for (const m of Object.values(state.metrics)) {
    if (m.chapterNumber === chapterNumber) return m
  }
  return null
}

export function getAnomalies(state: NarrativeSpeedState, chapterNumber?: number): SpeedAnomaly[] {
  if (chapterNumber === undefined) return [...state.anomalies]
  return state.anomalies.filter(a => a.chapterNumber === chapterNumber)
}

export function getAnomalyCount(state: NarrativeSpeedState, chapterNumber?: number): number {
  return getAnomalies(state, chapterNumber).length
}

export function getRecentAnomalies(state: NarrativeSpeedState, count = 5): SpeedAnomaly[] {
  return [...state.anomalies]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, count)
}

export function getTrajectorySummary(state: NarrativeSpeedState): {
  totalPoints: number
  avgSpeed: number
  stdDev: number
  latestChapter: number
} {
  return {
    totalPoints: state.trajectory.length,
    avgSpeed: state.globalAvgSpeed,
    stdDev: state.globalStdDev,
    latestChapter: state.trajectory.length > 0
      ? Math.max(...state.trajectory.map(p => p.chapterNumber))
      : 0
  }
}

export function getSpeedPrediction(state: NarrativeSpeedState, chapterNumber: number): SpeedPrediction | null {
  return state.predictions[chapterNumber] ?? null
}

export function clearPredictions(state: NarrativeSpeedState): NarrativeSpeedState {
  return { ...state, predictions: {} }
}

export function resetState(state: NarrativeSpeedState): NarrativeSpeedState {
  return createEmptyState(state.readingSpeedBaseline)
}