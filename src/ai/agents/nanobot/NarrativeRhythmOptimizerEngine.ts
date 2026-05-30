/**
 * NarrativeRhythmOptimizerEngine — V501
 * Story rhythm auto-adjustment, climax node optimization, and tension curve smoothing.
 * Inspired by: ruflo (hierarchical decomposition) + chatdev (rhythm review) + thunderbolt (feedback loops)
 */

export type RhythmPattern = 'increasing' | 'decreasing' | 'wave' | 'plateau' | 'zigzag'
export type TensionPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'
export type BeatType = 'action' | 'dialogue' | 'description' | 'reflection' | 'transition'

export interface NarrativeBeat {
  id: string
  chapterNumber: number
  position: number  // 0-100 within chapter
  beatType: BeatType
  tension: number  // 0-100
  emotionalIntensity: number  // 0-100
  content: string
}

export interface TensionCurve {
  beats: NarrativeBeat[]
  phase: TensionPhase
  overallTension: number  // 0-100
  rhythmPattern: RhythmPattern
}

export interface ClimaxNode {
  id: string
  chapter: number
  position: number  // 0-100
  intensity: number  // 0-100
  setupBeats: string[]  // beat ids that build to this climax
  payoffBeatIds: string[]  // beats that resolve this climax
  isResolved: boolean
}

export interface RhythmOptimizationResult {
  recommendedAdjustments: string[]
  smoothedCurve: TensionCurve
  addedBeats: NarrativeBeat[]
  removedBeats: string[]
  newClimaxNodes: ClimaxNode[]
}

export interface NarrativeRhythmState {
  tensionCurves: Record<string, TensionCurve>  // chapterId -> curve
  climaxNodes: ClimaxNode[]
  beatLibrary: Record<string, NarrativeBeat>
  rhythmAnalysis: {
    avgTension: number
    tensionVariance: number
    rhythmPattern: RhythmPattern
    weakSections: string[]  // chapterIds with low tension
  } | null
}

export function createEmptyState(): NarrativeRhythmState {
  return {
    tensionCurves: {},
    climaxNodes: [],
    beatLibrary: {},
    rhythmAnalysis: null
  }
}

export function addBeat(
  state: NarrativeRhythmState,
  chapterId: string,
  position: number,
  beatType: BeatType,
  tension: number,
  emotionalIntensity: number,
  content: string,
  chapterNumber: number
): NarrativeRhythmState {
  const id = `beat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: NarrativeBeat = {
    id,
    chapterNumber,
    position: Math.max(0, Math.min(100, position)),
    beatType,
    tension: Math.max(0, Math.min(100, tension)),
    emotionalIntensity: Math.max(0, Math.min(100, emotionalIntensity)),
    content
  }

  const chapterCurve = state.tensionCurves[chapterId] || {
    beats: [],
    phase: 'setup' as TensionPhase,
    overallTension: 0,
    rhythmPattern: 'increasing' as RhythmPattern
  }

  return {
    ...state,
    beatLibrary: { ...state.beatLibrary, [id]: beat },
    tensionCurves: {
      ...state.tensionCurves,
      [chapterId]: {
        ...chapterCurve,
        beats: [...chapterCurve.beats, beat].sort((a, b) => a.position - b.position)
      }
    }
  }
}

export function detectRhythmPattern(beats: NarrativeBeat[]): RhythmPattern {
  if (beats.length < 3) return 'plateau'

  const tensions = beats.map(b => b.tension)
  const deltas = tensions.slice(1).map((t, i) => t - tensions[i])

  const increases = deltas.filter(d => d > 0).length
  const decreases = deltas.filter(d => d < 0).length

  if (increases > decreases * 1.5) return 'increasing'
  if (decreases > increases * 1.5) return 'decreasing'
  if (Math.abs(increases - decreases) <= 1) return 'wave'

  // Check for zigzag
  let zigzag = true
  for (let i = 0; i < deltas.length - 1; i++) {
    if ((deltas[i] > 0 && deltas[i + 1] > 0) || (deltas[i] < 0 && deltas[i + 1] < 0)) {
      zigzag = false
      break
    }
  }
  if (zigzag) return 'zigzag'

  return 'plateau'
}

export function detectTensionPhase(beats: NarrativeBeat[]): TensionPhase {
  if (beats.length === 0) return 'setup'

  const tensions = beats.map(b => b.tension)
  const firstHalf = tensions.slice(0, Math.ceil(tensions.length / 2))
  const secondHalf = tensions.slice(Math.floor(tensions.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const lastTension = tensions[tensions.length - 1]

  if (lastTension < 30) return 'resolution'
  if (lastTension > 70 && secondAvg > firstAvg) return 'climax'
  if (secondAvg > firstAvg * 1.3) return 'rising'
  if (secondAvg < firstAvg * 0.8) return 'falling'
  return 'setup'
}

export function analyzeRhythm(state: NarrativeRhythmState): NarrativeRhythmState {
  const allBeats = Object.values(state.beatLibrary)
  if (allBeats.length === 0) return state

  const tensions = allBeats.map(b => b.tension)
  const avgTension = tensions.reduce((a, b) => a + b, 0) / tensions.length
  const variance = tensions.reduce((s, t) => s + Math.pow(t - avgTension, 2), 0) / tensions.length

  // Find weak sections (chapters with avg tension < 40)
  const chapterTensions: Record<string, number[]> = {}
  for (const beat of allBeats) {
    const ch = `ch${beat.chapterNumber}`
    if (!chapterTensions[ch]) chapterTensions[ch] = []
    chapterTensions[ch].push(beat.tension)
  }

  const weakSections = Object.entries(chapterTensions)
    .filter(([_, tensions]) => tensions.reduce((a, b) => a + b, 0) / tensions.length < 40)
    .map(([ch]) => ch)

  const allChapterCurves = Object.values(state.tensionCurves)
  const patterns = allChapterCurves.map(c => c.rhythmPattern)
  const patternCounts: Record<string, number> = {}
  for (const p of patterns) {
    patternCounts[p] = (patternCounts[p] || 0) + 1
  }
  const dominantPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as RhythmPattern || 'plateau'

  return {
    ...state,
    rhythmAnalysis: {
      avgTension: Math.round(avgTension * 10) / 10,
      tensionVariance: Math.round(Math.sqrt(variance) * 10) / 10,
      rhythmPattern: dominantPattern,
      weakSections
    }
  }
}

export function identifyClimaxNodes(state: NarrativeRhythmState, chapterId: string): NarrativeRhythmState {
  const curve = state.tensionCurves[chapterId]
  if (!curve || curve.beats.length < 3) return state

  const newClimaxNodes: ClimaxNode[] = []
  const beats = curve.beats

  // Find peaks (local maxima that are significantly higher than neighbors)
  for (let i = 1; i < beats.length - 1; i++) {
    const prev = beats[i - 1].tension
    const curr = beats[i].tension
    const next = beats[i + 1].tension

    if (curr > prev && curr > next && curr - prev > 15 && curr - next > 15) {
      const setupEnd = Math.max(0, i - 3)
      const payoffStart = Math.min(beats.length - 1, i + 1)

      const node: ClimaxNode = {
        id: `climax_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chapter: beats[i].chapterNumber,
        position: beats[i].position,
        intensity: curr,
        setupBeats: beats.slice(setupEnd, i).map(b => b.id),
        payoffBeatIds: beats.slice(payoffStart, Math.min(beats.length, payoffStart + 3)).map(b => b.id),
        isResolved: false
      }
      newClimaxNodes.push(node)
    }
  }

  return {
    ...state,
    climaxNodes: [...state.climaxNodes, ...newClimaxNodes]
  }
}

export function smoothTensionCurve(beats: NarrativeBeat[], windowSize: number = 3): NarrativeBeat[] {
  if (beats.length < windowSize) return beats

  const smoothed = [...beats]
  for (let i = 0; i < beats.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(beats.length, i + Math.ceil(windowSize / 2))
    const window = beats.slice(start, end)
    const avgTension = window.reduce((s, b) => s + b.tension, 0) / window.length
    const avgEmotion = window.reduce((s, b) => s + b.emotionalIntensity, 0) / window.length
    smoothed[i] = { ...smoothed[i], tension: Math.round(avgTension), emotionalIntensity: Math.round(avgEmotion) }
  }
  return smoothed
}

export function findWeakSections(state: NarrativeRhythmState, threshold: number = 30): string[] {
  if (!state.rhythmAnalysis) {
    state = analyzeRhythm(state)
  }
  return state.rhythmAnalysis?.weakSections || []
}

export function suggestTensionBoost(state: NarrativeRhythmState, chapterId: string): string[] {
  const curve = state.tensionCurves[chapterId]
  if (!curve) return []

  const recommendations: string[] = []
  const avgTension = curve.beats.reduce((s, b) => s + b.tension, 0) / curve.beats.length

  if (avgTension < 40) {
    recommendations.push('Add a sudden conflict or revelation beat to raise tension')
  }

  // Check for monotone sections
  const tensions = curve.beats.map(b => b.tension)
  let inMonotone = false
  let monotoneStart = 0
  for (let i = 1; i < tensions.length; i++) {
    if (Math.abs(tensions[i] - tensions[i - 1]) < 5) {
      if (!inMonotone) {
        inMonotone = true
        monotoneStart = i - 1
      }
    } else {
      if (inMonotone && i - monotoneStart > 3) {
        recommendations.push(`Monotone tension at positions ${curve.beats[monotoneStart].position}-${curve.beats[i - 1].position}: add variation`)
      }
      inMonotone = false
    }
  }

  // Check climax proximity
  const climaxNodes = state.climaxNodes.filter(c => c.chapter === curve.beats[0]?.chapterNumber)
  if (climaxNodes.length === 0) {
    recommendations.push('No climax detected in this chapter - consider adding a climactic moment')
  }

  return recommendations
}

export function optimizeRhythm(state: NarrativeRhythmState, chapterId: string): RhythmOptimizationResult {
  const curve = state.tensionCurves[chapterId]
  if (!curve) {
    return {
      recommendedAdjustments: [],
      smoothedCurve: curve || { beats: [], phase: 'setup', overallTension: 0, rhythmPattern: 'plateau' },
      addedBeats: [],
      removedBeats: [],
      newClimaxNodes: []
    }
  }

  const recommendations = suggestTensionBoost(state, chapterId)
  const smoothedBeats = smoothTensionCurve(curve.beats)

  // Mark unresolved climaxes
  const updatedClimaxNodes = state.climaxNodes.map(c => {
    if (c.chapter === curve.beats[0]?.chapterNumber && !c.isResolved) {
      // Check if payoff beats exist in the smoothed curve
      const hasPayoff = c.payoffBeatIds.some(id => smoothedBeats.some(b => b.id === id))
      return { ...c, isResolved: hasPayoff }
    }
    return c
  })

  const newPhase = detectTensionPhase(smoothedBeats)
  const newPattern = detectRhythmPattern(smoothedBeats)
  const overallTension = smoothedBeats.reduce((s, b) => s + b.tension, 0) / smoothedBeats.length

  const smoothedCurve: TensionCurve = {
    beats: smoothedBeats,
    phase: newPhase,
    overallTension: Math.round(overallTension),
    rhythmPattern: newPattern
  }

  return {
    recommendedAdjustments: recommendations,
    smoothedCurve,
    addedBeats: [],
    removedBeats: [],
    newClimaxNodes: updatedClimaxNodes.filter(c => c.chapter === curve.beats[0]?.chapterNumber)
  }
}

export function getChapterTension(state: NarrativeRhythmState, chapterId: string): TensionCurve | null {
  return state.tensionCurves[chapterId] || null
}

export function getTensionAtPosition(state: NarrativeRhythmState, chapterId: string, position: number): number {
  const curve = state.tensionCurves[chapterId]
  if (!curve || curve.beats.length === 0) return 50

  const closest = curve.beats.reduce((prev, curr) =>
    Math.abs(curr.position - position) < Math.abs(prev.position - position) ? curr : prev
  )
  return closest.tension
}

export function getRhythmSummary(state: NarrativeRhythmState): { totalBeats: number, totalClimaxes: number, avgTension: number, rhythmPattern: RhythmPattern } {
  const allBeats = Object.values(state.beatLibrary)
  return {
    totalBeats: allBeats.length,
    totalClimaxes: state.climaxNodes.length,
    avgTension: state.rhythmAnalysis?.avgTension || 0,
    rhythmPattern: state.rhythmAnalysis?.rhythmPattern || 'plateau'
  }
}