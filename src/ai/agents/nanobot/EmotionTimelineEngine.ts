/**
 * EmotionTimelineEngine — V503
 * Tracks emotional arcs across scenes/chapters, detects mood shifts, predicts emotional impact.
 * Inspired by: thunderbolt (feedback loops) + nanobot (distributed mesh state)
 */

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'anticipation' | 'trust' | 'disgust' | 'love' | 'nostalgia' | 'tension' | 'relief' | 'wonder' | 'melancholy'
export type TrendDirection = 'rising' | 'falling' | 'stable' | 'volatile'

export interface EmotionEntry {
  id: string
  chapterNumber: number
  sceneId: string
  emotion: EmotionType
  intensity: number  // 0-100
  trigger: string  // event or element that triggered this emotion
  duration: number  // estimated scenes
  timestamp: number
}

export interface EmotionArc {
  characterId: string
  entries: EmotionEntry[]
  dominantEmotion: EmotionType | null
  trend: TrendDirection
  avgIntensity: number
  peakIntensity: number
  peakEmotion: EmotionType | null
  volatility: number  // 0-100, how much emotion fluctuates
}

export interface MoodShift {
  id: string
  fromEmotion: EmotionType
  toEmotion: EmotionType
  chapterNumber: number
  sceneId: string
  transitionType: 'gradual' | 'sudden' | 'delayed'
  cause: string
}

export interface EmotionalImpactScore {
  sceneId: string
  emotionalWeight: number  // cumulative emotional intensity
  positivityRatio: number  // positive vs negative emotion ratio (0-1)
  surpriseFactor: number  // how surprising the emotional journey is
  resolutionQuality: number  // how well emotions are resolved
}

export interface EmotionTimelineState {
  arcs: Record<string, EmotionArc>  // characterId -> arc
  moodShifts: MoodShift[]
  impactScores: Record<string, EmotionalImpactScore>  // sceneId -> score
  timelineStart: number
  timelineEnd: number
  overallStoryMood: EmotionType | null
}

export function createEmptyState(): EmotionTimelineState {
  const now = Date.now()
  return {
    arcs: {},
    moodShifts: [],
    impactScores: {},
    timelineStart: now,
    timelineEnd: now,
    overallStoryMood: null
  }
}

export function addEmotionEntry(
  state: EmotionTimelineState,
  characterId: string,
  chapterNumber: number,
  sceneId: string,
  emotion: EmotionType,
  intensity: number,
  trigger: string,
  duration: number = 1
): EmotionTimelineState {
  const id = `emo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const entry: EmotionEntry = {
    id,
    chapterNumber,
    sceneId,
    emotion,
    intensity: Math.max(0, Math.min(100, intensity)),
    trigger,
    duration,
    timestamp: Date.now()
  }

  let arc = state.arcs[characterId]
  if (!arc) {
    arc = {
      characterId,
      entries: [],
      dominantEmotion: null,
      trend: 'stable',
      avgIntensity: 0,
      peakIntensity: 0,
      peakEmotion: null,
      volatility: 0
    }
  }

  const updatedArc = recomputeArc({ ...arc, entries: [...arc.entries, entry] })
  const updatedArcs = { ...state.arcs, [characterId]: updatedArc }

  // Update timeline bounds
  const allEntries = Object.values(updatedArcs).flatMap(a => a.entries)
  const timelineStart = allEntries.length > 0 ? Math.min(...allEntries.map(e => e.timestamp)) : state.timelineStart
  const timelineEnd = allEntries.length > 0 ? Math.max(...allEntries.map(e => e.timestamp)) : state.timelineEnd

  return {
    ...state,
    arcs: updatedArcs,
    timelineStart,
    timelineEnd
  }
}

export function recomputeArc(arc: EmotionArc): EmotionArc {
  if (arc.entries.length === 0) return arc

  const intensities = arc.entries.map(e => e.intensity)
  const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length
  const peakEntry = arc.entries.reduce((prev, curr) => curr.intensity > prev.intensity ? curr : prev)
  const peakIntensity = peakEntry.intensity
  const peakEmotion = peakEntry.emotion

  // Dominant emotion: most frequent high-intensity emotion
  const emotionFrequency: Record<string, number> = {}
  for (const entry of arc.entries) {
    if (entry.intensity > 50) {
      emotionFrequency[entry.emotion] = (emotionFrequency[entry.emotion] || 0) + entry.intensity
    }
  }
  const dominantEmotion = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionType || null

  // Trend: compare first half avg vs second half avg
  const sorted = [...arc.entries].sort((a, b) => a.timestamp - b.timestamp)
  const halfLen = Math.ceil(sorted.length / 2)
  const firstHalf = sorted.slice(0, halfLen)
  const secondHalf = sorted.slice(halfLen)
  const firstAvg = firstHalf.reduce((s, e) => s + e.intensity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, e) => s + e.intensity, 0) / (secondHalf.length || 1)

  let trend: TrendDirection = 'stable'
  if (secondAvg > firstAvg * 1.2) trend = 'rising'
  else if (secondAvg < firstAvg * 0.8) trend = 'falling'
  else if (secondHalf.some(e => Math.abs(e.intensity - avgIntensity) > 30)) trend = 'volatile'

  // Volatility: standard deviation of intensity
  const variance = intensities.reduce((s, i) => s + Math.pow(i - avgIntensity, 2), 0) / intensities.length
  const volatility = Math.round(Math.sqrt(variance))

  return { ...arc, dominantEmotion, trend, avgIntensity: Math.round(avgIntensity), peakIntensity, peakEmotion, volatility }
}

export function detectMoodShift(
  state: EmotionTimelineState,
  characterId: string,
  sceneId: string
): EmotionTimelineState {
  const arc = state.arcs[characterId]
  if (!arc || arc.entries.length < 2) return state

  const sorted = [...arc.entries].sort((a, b) => b.timestamp - a.timestamp)
  const latest = sorted[0]
  const previous = sorted[1]

  if (latest.emotion !== previous.emotion) {
    // Determine transition type based on time gap and intensity change
    const timeGap = latest.timestamp - previous.timestamp
    const intensityDelta = Math.abs(latest.intensity - previous.intensity)
    let transitionType: 'gradual' | 'sudden' | 'delayed' = 'gradual'

    if (timeGap < 60000 && intensityDelta > 40) transitionType = 'sudden'
    else if (timeGap > 300000 && intensityDelta < 20) transitionType = 'delayed'

    const shift: MoodShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromEmotion: previous.emotion,
      toEmotion: latest.emotion,
      chapterNumber: latest.chapterNumber,
      sceneId,
      transitionType,
      cause: latest.trigger
    }

    return { ...state, moodShifts: [...state.moodShifts, shift] }
  }

  return state
}

export function calculateImpactScore(state: EmotionTimelineState, sceneId: string): EmotionTimelineState {
  // Collect all emotion entries for this scene
  const sceneEntries = Object.values(state.arcs)
    .flatMap(arc => arc.entries)
    .filter(e => e.sceneId === sceneId)

  if (sceneEntries.length === 0) return state

  const emotionalWeight = sceneEntries.reduce((s, e) => s + e.intensity, 0)
  const positiveEmotions: EmotionType[] = ['joy', 'trust', 'love', 'anticipation', 'relief', 'wonder']
  const positiveCount = sceneEntries.filter(e => positiveEmotions.includes(e.emotion)).length
  const positivityRatio = positiveCount / sceneEntries.length

  // Surprise factor: high variance in emotion types within the scene
  const emotionTypes = Array.from(new Set(sceneEntries.map(e => e.emotion)))
  const surpriseFactor = Math.min(100, emotionTypes.length * 15)

  // Resolution quality: emotion returns to baseline after peak
  const sorted = [...sceneEntries].sort((a, b) => a.timestamp - b.timestamp)
  const peak = sorted.reduce((prev, curr) => curr.intensity > prev.intensity ? curr : prev)
  const afterPeak = sorted.filter(e => e.timestamp > peak.timestamp)
  const resolutionQuality = afterPeak.length > 0
    ? Math.round((1 - (afterPeak[0].intensity / peak.intensity)) * 100)
    : 50

  const impactScore: EmotionalImpactScore = {
    sceneId,
    emotionalWeight: Math.round(emotionalWeight),
    positivityRatio: Math.round(positivityRatio * 100) / 100,
    surpriseFactor: Math.round(surpriseFactor),
    resolutionQuality: Math.max(0, resolutionQuality)
  }

  return {
    ...state,
    impactScores: { ...state.impactScores, [sceneId]: impactScore }
  }
}

export function predictEmotionalImpact(
  state: EmotionTimelineState,
  characterId: string,
  upcomingEvents: string[]
): Record<string, number> {
  const arc = state.arcs[characterId]
  if (!arc) return {}

  const predictions: Record<string, number> = {}
  const currentTrend = arc.trend
  const currentEmotion = arc.entries[arc.entries.length - 1]?.emotion || 'neutral'
  const currentIntensity = arc.entries[arc.entries.length - 1]?.intensity || 50

  for (const event of upcomingEvents) {
    // Simple heuristic: events with certain keywords predict specific emotions
    let predictedIntensity = currentIntensity

    if (event.includes('win') || event.includes('success')) predictedIntensity = Math.min(100, currentIntensity + 20)
    else if (event.includes('lose') || event.includes('fail')) predictedIntensity = Math.max(0, currentIntensity - 25)
    else if (event.includes('meet') || event.includes('love')) predictedIntensity = Math.min(100, currentIntensity + 15)
    else if (event.includes('danger') || event.includes('threat')) predictedIntensity = Math.min(100, currentIntensity + 30)
    else if (currentTrend === 'rising') predictedIntensity = Math.min(100, currentIntensity + 5)
    else if (currentTrend === 'falling') predictedIntensity = Math.max(0, currentIntensity - 5)

    predictions[event] = predictedIntensity
  }

  return predictions
}

export function getCharacterEmotionAtScene(state: EmotionTimelineState, characterId: string, sceneId: string): EmotionType | null {
  const arc = state.arcs[characterId]
  if (!arc) return null

  const sceneEntries = arc.entries.filter(e => e.sceneId === sceneId)
  if (sceneEntries.length === 0) return null

  return sceneEntries[sceneEntries.length - 1].emotion
}

export function getOverallStoryMood(state: EmotionTimelineState): EmotionType | null {
  if (state.overallStoryMood) return state.overallStoryMood

  const allEntries = Object.values(state.arcs).flatMap(a => a.entries)
  if (allEntries.length === 0) return null

  const emotionTotals: Record<string, number> = {}
  for (const entry of allEntries) {
    emotionTotals[entry.emotion] = (emotionTotals[entry.emotion] || 0) + entry.intensity
  }

  const dominant = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0]
  return dominant ? dominant[0] as EmotionType : null
}

export function getEmotionTimeline(state: EmotionTimelineState, characterId: string): EmotionEntry[] {
  return state.arcs[characterId]?.entries.sort((a, b) => a.timestamp - b.timestamp) || []
}

export function getMoodShiftSummary(state: EmotionTimelineState): { total: number, sudden: number, gradual: number, delayed: number } {
  return {
    total: state.moodShifts.length,
    sudden: state.moodShifts.filter(s => s.transitionType === 'sudden').length,
    gradual: state.moodShifts.filter(s => s.transitionType === 'gradual').length,
    delayed: state.moodShifts.filter(s => s.transitionType === 'delayed').length
  }
}

export function compareEmotionArcs(state: EmotionTimelineState, id1: string, id2: string): { similarity: number, differences: string[] } {
  const arc1 = state.arcs[id1]
  const arc2 = state.arcs[id2]
  if (!arc1 || !arc2) return { similarity: 0, differences: [] }

  const differences: string[] = []

  if (arc1.trend !== arc2.trend) differences.push(`Trend differs: ${arc1.trend} vs ${arc2.trend}`)
  if (arc1.dominantEmotion !== arc2.dominantEmotion) differences.push(`Dominant emotion differs: ${arc1.dominantEmotion} vs ${arc2.dominantEmotion}`)
  if (Math.abs(arc1.avgIntensity - arc2.avgIntensity) > 20) differences.push(`Avg intensity differs by ${Math.abs(arc1.avgIntensity - arc2.avgIntensity)}`)
  if (Math.abs(arc1.volatility - arc2.volatility) > 30) differences.push(`Volatility differs by ${Math.abs(arc1.volatility - arc2.volatility)}`)

  // Similarity based on emotion overlap
  const emotions1 = new Set(arc1.entries.map(e => e.emotion))
  const emotions2 = new Set(arc2.entries.map(e => e.emotion))
  const overlap = Array.from(emotions1).filter(e => emotions2.has(e)).length
  const similarity = Math.round((overlap / Math.max(emotions1.size, emotions2.size)) * 100)

  return { similarity, differences }
}
