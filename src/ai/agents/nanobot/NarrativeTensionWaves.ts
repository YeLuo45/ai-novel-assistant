/**
 * NarrativeTensionWaves — V383
 * Tension curve tracking, emotional rhythm analysis, pacing wave visualization.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), generic-agent (pattern analysis)
 */

export interface TensionPoint {
  chapterId: string
  position: number  // 0-100 within chapter
  tensionLevel: number  // 0-100
  sceneType: SceneType
  notes?: string
}

export type SceneType = 'action' | 'dialogue' | 'description' | 'reflection' | 'transition' | 'climax' | 'resolution'

export interface TensionWave {
  id: string
  startChapter: string
  endChapter: string
  peakTension: number
  peakChapter: string
  waveType: WaveType
}

export type WaveType = 'rising' | 'falling' | 'oscillating' | 'plateau' | 'spike'

export interface TensionAnalysis {
  overallTrend: 'rising' | 'falling' | 'stable' | 'oscillating'
  averageTension: number
  peakTension: number
  lowTension: number
  tensionRange: number
  recommendations: string[]
}

export interface NarrativeTensionState {
  tensionPoints: TensionPoint[]
  waves: TensionWave[]
  currentTrend: TensionAnalysis | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeTensionState {
  return { tensionPoints: [], waves: [], currentTrend: null, typeAlias: {} }
}

export function recordTension(
  state: NarrativeTensionState,
  chapterId: string,
  position: number,
  tensionLevel: number,
  sceneType: SceneType
): NarrativeTensionState {
  const point: TensionPoint = { chapterId, position, tensionLevel, sceneType }
  const tensionPoints = [...state.tensionPoints, point]
  
  // Recalculate waves and trend
  const waves = detectWaves(tensionPoints)
  const trend = analyzeTrend(tensionPoints)
  
  return { ...state, tensionPoints, waves, currentTrend: trend }
}

function detectWaves(points: TensionPoint[]): TensionWave[] {
  if (points.length < 4) return []
  
  const waves: TensionWave[] = []
  const sortedPoints = [...points].sort((a, b) => {
    const aKey = `${a.chapterId}_${a.position}`
    const bKey = `${b.chapterId}_${b.position}`
    return aKey.localeCompare(bKey)
  })
  
  // Find peaks (local maxima)
  for (let i = 1; i < sortedPoints.length - 1; i++) {
    const prev = sortedPoints[i - 1].tensionLevel
    const curr = sortedPoints[i].tensionLevel
    const next = sortedPoints[i + 1].tensionLevel
    
    if (curr > prev && curr > next && curr > 60) {
      // This is a peak - find the wave
      // Look backwards for start
      let startIdx = i
      for (let j = i - 1; j >= 0; j--) {
        if (sortedPoints[j].tensionLevel < curr - 20) break
        startIdx = j
      }
      // Look forwards for end
      let endIdx = i
      for (let j = i + 1; j < sortedPoints.length; j++) {
        if (sortedPoints[j].tensionLevel < curr - 20) break
        endIdx = j
      }
      
      const waveType: WaveType = sortedPoints[startIdx].tensionLevel > sortedPoints[endIdx].tensionLevel
        ? 'falling' : sortedPoints[startIdx].tensionLevel < sortedPoints[endIdx].tensionLevel
        ? 'rising' : 'oscillating'
      
      const wave: TensionWave = {
        id: `wave_${i}`,
        startChapter: sortedPoints[startIdx].chapterId,
        endChapter: sortedPoints[endIdx].chapterId,
        peakTension: curr,
        peakChapter: sortedPoints[i].chapterId,
        waveType,
      }
      waves.push(wave)
    }
  }
  
  return waves.slice(0, 20)  // limit waves
}

function analyzeTrend(points: TensionPoint[]): TensionAnalysis {
  if (points.length < 2) {
    return { overallTrend: 'stable', averageTension: 50, peakTension: 50, lowTension: 50, tensionRange: 0, recommendations: [] }
  }
  
  const tensions = points.map(p => p.tensionLevel)
  const averageTension = tensions.reduce((a, b) => a + b, 0) / tensions.length
  const peakTension = Math.max(...tensions)
  const lowTension = Math.min(...tensions)
  const tensionRange = peakTension - lowTension
  
  // Determine overall trend
  const firstHalf = tensions.slice(0, Math.floor(tensions.length / 2))
  const secondHalf = tensions.slice(Math.floor(tensions.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  let overallTrend: TensionAnalysis['overallTrend'] = 'stable'
  if (secondAvg > firstAvg + 5) overallTrend = 'rising'
  else if (secondAvg < firstAvg - 5) overallTrend = 'falling'
  
  const recommendations: string[] = []
  if (averageTension < 30) recommendations.push('Overall tension is low - add more conflict')
  if (averageTension > 80) recommendations.push('Tension consistently high - consider releasing pressure for contrast')
  if (tensionRange < 20) recommendations.push('Tension range is flat - vary intensity for more impact')
  if (overallTrend === 'falling') recommendations.push('Tension is declining - build toward a climax')
  if (overallTrend === 'rising') recommendations.push('Good rising tension - maintain momentum')
  
  return { overallTrend, averageTension: Math.round(averageTension), peakTension, lowTension, tensionRange, recommendations }
}

export function getChapterTension(state: NarrativeTensionState, chapterId: string): {
  avgTension: number
  peakTension: number
  sceneBreakdown: Record<SceneType, number>
} {
  const chapterPoints = state.tensionPoints.filter(p => p.chapterId === chapterId)
  if (chapterPoints.length === 0) return { avgTension: 0, peakTension: 0, sceneBreakdown: { action: 0, dialogue: 0, description: 0, reflection: 0, transition: 0, climax: 0, resolution: 0 } }
  
  const avgTension = chapterPoints.reduce((s, p) => s + p.tensionLevel, 0) / chapterPoints.length
  const peakTension = Math.max(...chapterPoints.map(p => p.tensionLevel))
  const sceneBreakdown: Record<SceneType, number> = { action: 0, dialogue: 0, description: 0, reflection: 0, transition: 0, climax: 0, resolution: 0 }
  for (const p of chapterPoints) sceneBreakdown[p.sceneType]++
  
  return { avgTension: Math.round(avgTension), peakTension, sceneBreakdown }
}

export function compareTensionWaves(state: NarrativeTensionState, ch1: string, ch2: string): {
  moreIntense: string
  tensionDiff: number
} {
  const t1 = getChapterTension(state, ch1)
  const t2 = getChapterTension(state, ch2)
  return {
    moreIntense: t1.avgTension > t2.avgTension ? ch1 : ch2,
    tensionDiff: Math.abs(t1.avgTension - t2.avgTension),
  }
}
