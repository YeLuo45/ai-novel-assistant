/**
 * NarrativeMomentumTracker — V323
 * Real-time narrative energy monitoring, pacing deviation detection, tension curves.
 * Inspired by: thunderbolt (feedback pipelines), generic-agent (autonomous monitoring)
 */

export interface MomentumMetrics {
  energyLevel: number      // 0-100 current narrative energy
  tensionScore: number     // 0-100 current tension level
  pacingIndex: number      // <1 slow, >1 fast relative to baseline
  climaxProximity: number  // 0-1 how close to expected climax
  momentumTrend: 'rising' | 'stable' | 'falling'
}

export interface TensionCurve {
  chapterId: string
  segments: { position: number; tension: number; type: 'setup' | 'rising' | 'peak' | 'release' }[]
  expectedClimaxPosition: number
  actualClimaxPosition?: number
}

export interface PacingBaseline {
  avgSceneLength: number
  avgChapterLength: number
  dialogueRatio: number
  actionDensity: number
  tensionDistribution: { low: number; medium: number; high: number }
}

export interface NarrativeMomentumState {
  currentMetrics: MomentumMetrics
  tensionCurves: Map<string, TensionCurve>
  baseline: PacingBaseline
  recentEnergyHistory: { timestamp: number; energy: number }[]
  climaxAlerts: { timestamp: number; chapterId: string; alertType: string }[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeMomentumState {
  return {
    currentMetrics: {
      energyLevel: 50,
      tensionScore: 30,
      pacingIndex: 1.0,
      climaxProximity: 0,
      momentumTrend: 'stable',
    },
    tensionCurves: new Map(),
    baseline: {
      avgSceneLength: 500,
      avgChapterLength: 3000,
      dialogueRatio: 0.3,
      actionDensity: 5,
      tensionDistribution: { low: 0.3, medium: 0.5, high: 0.2 },
    },
    recentEnergyHistory: [],
    climaxAlerts: [],
    typeAlias: {},
  }
}

// Update metrics based on recent content analysis
export function updateMomentumMetrics(
  state: NarrativeMomentumState,
  currentEnergy: number,
  currentTension: number,
  sceneLength: number,
  dialogueCount: number,
  actionEventCount: number
): NarrativeMomentumState {
  // Calculate pacing index relative to baseline
  const pacingIndex = sceneLength > 0
    ? state.baseline.avgSceneLength / sceneLength
    : 1.0

  // Determine momentum trend from recent history
  const recentHistory = state.recentEnergyHistory.slice(-5)
  let momentumTrend: MomentumMetrics['momentumTrend'] = 'stable'
  
  if (recentHistory.length >= 2) {
    const oldest = recentHistory[0].energy
    const newest = recentHistory[recentHistory.length - 1].energy
    const diff = newest - oldest
    if (diff > 10) momentumTrend = 'rising'
    else if (diff < -10) momentumTrend = 'falling'
  }

  // Update energy history
  const updatedHistory = [
    ...state.recentEnergyHistory.slice(-9),
    { timestamp: Date.now(), energy: currentEnergy },
  ]

  return {
    ...state,
    currentMetrics: {
      energyLevel: currentEnergy,
      tensionScore: currentTension,
      pacingIndex,
      climaxProximity: state.currentMetrics.climaxProximity,
      momentumTrend,
    },
    recentEnergyHistory: updatedHistory,
  }
}

// Record tension for a chapter segment
export function recordTensionSegment(
  state: NarrativeMomentumState,
  chapterId: string,
  position: number,
  tension: number,
  segmentType: TensionCurve['segments'][0]['type']
): NarrativeMomentumState {
  const existingCurve = state.tensionCurves.get(chapterId) || {
    chapterId,
    segments: [],
    expectedClimaxPosition: 0.75,
  }

  const newSegments = [...existingCurve.segments, { position, tension, type: segmentType }]
    .sort((a, b) => a.position - b.position)

  const updatedCurves = new Map(state.tensionCurves)
  updatedCurves.set(chapterId, {
    ...existingCurve,
    segments: newSegments,
  })

  return { ...state, tensionCurves: updatedCurves }
}

// Detect pacing deviation from baseline
export function detectPacingDeviation(
  state: NarrativeMomentumState,
  sceneLength: number,
  chapterLength: number,
  dialogueRatio: number
): {
  deviation: number   // percent from baseline
  severity: 'normal' | 'warning' | 'critical'
  recommendation: string
} {
  const sceneDev = state.baseline.avgSceneLength > 0
    ? Math.abs(sceneLength - state.baseline.avgSceneLength) / state.baseline.avgSceneLength
    : 0
  const chapterDev = state.baseline.avgChapterLength > 0
    ? Math.abs(chapterLength - state.baseline.avgChapterLength) / state.baseline.avgChapterLength
    : 0
  const dialogueDev = state.baseline.dialogueRatio > 0
    ? Math.abs(dialogueRatio - state.baseline.dialogueRatio) / state.baseline.dialogueRatio
    : 0

  const avgDev = (sceneDev + chapterDev + dialogueDev) / 3

  let severity: 'normal' | 'warning' | 'critical'
  let recommendation: string

  if (avgDev > 0.5) {
    severity = 'critical'
    recommendation = 'Pacing severely off baseline. Consider restructuring scenes or adjusting dialogue ratio.'
  } else if (avgDev > 0.25) {
    severity = 'warning'
    recommendation = 'Moderate pacing deviation detected. Review scene length or chapter structure.'
  } else {
    severity = 'normal'
    recommendation = 'Pacing within normal range.'
  }

  return {
    deviation: Math.round(avgDev * 100),
    severity,
    recommendation,
  }
}

// Detect climax position and compare to expectation
export function detectClimaxPosition(
  state: NarrativeMomentumState,
  chapterId: string
): { detected: boolean; position: number; deviation: number } {
  const curve = state.tensionCurves.get(chapterId)
  if (!curve || curve.segments.length === 0) {
    return { detected: false, position: 0, deviation: 0 }
  }

  // Find peak tension
  let peakSeg = curve.segments[0]
  for (const seg of curve.segments) {
    if (seg.tension > peakSeg.tension) {
      peakSeg = seg
    }
  }

  const detected = peakSeg.type === 'peak' || peakSeg.tension > 75
  const deviation = Math.abs(peakSeg.position - curve.expectedClimaxPosition)

  return { detected, position: peakSeg.position, deviation }
}

// Update baseline from completed chapters
export function updateBaseline(
  state: NarrativeMomentumState,
  avgSceneLength: number,
  avgChapterLength: number,
  dialogueRatio: number,
  actionDensity: number
): NarrativeMomentumState {
  const weight = 0.2  // new data weight
  const baseline = state.baseline
  
  const newBaseline: PacingBaseline = {
    avgSceneLength: baseline.avgSceneLength * (1 - weight) + avgSceneLength * weight,
    avgChapterLength: baseline.avgChapterLength * (1 - weight) + avgChapterLength * weight,
    dialogueRatio: baseline.dialogueRatio * (1 - weight) + dialogueRatio * weight,
    actionDensity: baseline.actionDensity * (1 - weight) + actionDensity * weight,
    tensionDistribution: baseline.tensionDistribution,  // keep for now
  }

  return { ...state, baseline: newBaseline }
}

// Generate momentum alert
export function generateMomentumAlert(
  state: NarrativeMomentumState,
  alertType: 'climax_too_early' | 'climax_too_late' | 'energy_collapse' | 'tension_flatline' | 'pacing_spike',
  chapterId: string
): NarrativeMomentumState {
  const alerts = [...state.climaxAlerts, { timestamp: Date.now(), chapterId, alertType }]
  return { ...state, climaxAlerts: alerts.slice(-20) }
}

// Get current momentum summary
export function getMomentumSummary(
  state: NarrativeMomentumState
): {
  energy: number
  tension: number
  pacing: string
  trend: string
  alerts: number
  recommendation: string
} {
  let recommendation: string
  const metrics = state.currentMetrics

  if (metrics.momentumTrend === 'falling' && metrics.energyLevel < 40) {
    recommendation = 'Narrative energy low and falling. Consider introducing a complication or subplot to re-energize.'
  } else if (metrics.momentumTrend === 'rising' && metrics.tensionScore > 80) {
    recommendation = 'High tension building. Prepare for climax or use strategic release.'
  } else if (metrics.pacingIndex < 0.7) {
    recommendation = 'Pacing is slow. Consider tightening dialogue or increasing action beats.'
  } else if (metrics.pacingIndex > 1.5) {
    recommendation = 'Pacing is very fast. Slow down for character development or reader breathing room.'
  } else if (metrics.energyLevel > 75) {
    recommendation = 'Strong narrative energy. Good time for high-stakes scenes.'
  } else {
    recommendation = 'Momentum stable. Continue current trajectory.'
  }

  return {
    energy: metrics.energyLevel,
    tension: metrics.tensionScore,
    pacing: metrics.pacingIndex < 0.8 ? 'slow' : metrics.pacingIndex > 1.2 ? 'fast' : 'normal',
    trend: metrics.momentumTrend,
    alerts: state.climaxAlerts.length,
    recommendation,
  }
}

// Predict if current trajectory will reach climax
export function predictClimaxReach(
  state: NarrativeMomentumState,
  targetTension: number = 85,
  currentChapterProgress: number = 0  // 0-1 within chapter
): {
  willReach: boolean
  estimatedPosition: number
  gapAnalysis: string
} {
  const metrics = state.currentMetrics
  const tensionRate = metrics.momentumTrend === 'rising' ? 2 : metrics.momentumTrend === 'falling' ? -1 : 0

  const projectedTension = Math.min(100, metrics.tensionScore + tensionRate * (1 - currentChapterProgress) * 20)
  
  let willReach = projectedTension >= targetTension
  let gapAnalysis: string

  if (!willReach) {
    const gap = targetTension - projectedTension
    gapAnalysis = `Tension gap of ${Math.round(gap)} points. Need stronger conflict or stakes to reach climax.`
  } else {
    gapAnalysis = 'On track to reach target tension.'
  }

  return {
    willReach,
    estimatedPosition: currentChapterProgress + (1 - currentChapterProgress) * (projectedTension / targetTension),
    gapAnalysis,
  }
}

// Analyze tension curve shape
export function analyzeTensionCurveShape(
  state: NarrativeMomentumState,
  chapterId: string
): {
  shape: 'linear' | 'exponential' | 'plateau' | 'sawtooth' | 'inverted'
  health: 'good' | 'needs_review' | 'problematic'
  details: string
} {
  const curve = state.tensionCurves.get(chapterId)
  if (!curve || curve.segments.length < 3) {
    return { shape: 'linear', health: 'needs_review', details: 'Insufficient data for curve analysis' }
  }

  const segs = curve.segments
  const tensions = segs.map(s => s.tension)

  // Simple shape detection
  const firstHalf = tensions.slice(0, Math.floor(tensions.length / 2))
  const secondHalf = tensions.slice(Math.floor(tensions.length / 2))
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length

  let shape: 'linear' | 'exponential' | 'plateau' | 'sawtooth' | 'inverted'
  let health: 'good' | 'needs_review' | 'problematic'
  let details: string

  if (secondAvg > firstAvg + 15) {
    shape = 'exponential'
    health = 'good'
    details = 'Tension building well - exponential rise toward climax.'
  } else if (secondAvg > firstAvg + 5) {
    shape = 'linear'
    health = 'good'
    details = 'Steady tension rise - healthy narrative progression.'
  } else if (Math.abs(secondAvg - firstAvg) <= 5) {
    shape = 'plateau'
    health = 'needs_review'
    details = 'Tension plateau detected - may indicate flatline or setup phase.'
  } else if (secondAvg < firstAvg - 5) {
    shape = 'inverted'
    health = 'problematic'
    details = 'Tension decreasing - unusual for chapter progression. Check for structural issues.'
  } else {
    shape = 'linear'
    health = 'needs_review'
    details = 'Unclear tension pattern - review chapter structure.'
  }

  // Check for sawtooth (rapid oscillation)
  let oscillations = 0
  for (let i = 1; i < tensions.length; i++) {
    if ((tensions[i] > tensions[i - 1]) !== (tensions[i - 1] > tensions[i - 2])) {
      oscillations++
    }
  }
  if (oscillations > tensions.length / 3) {
    shape = 'sawtooth'
    health = 'needs_review'
    details = 'Sawtooth pattern detected - erratic tension may confuse readers.'
  }

  return { shape, health, details }
}
