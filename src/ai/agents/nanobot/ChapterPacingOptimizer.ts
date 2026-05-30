/**
 * ChapterPacingOptimizer — V399
 * Chapter-level pacing optimization, scene density analysis, rhythm optimization for retention.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), generic-agent (optimization)
 */

export type SceneDensity = 'sparse' | 'moderate' | 'dense' | 'overloaded'
export type PacingRhythm = 'steady' | 'accelerating' | 'decelerating' | 'wave' | 'stop_and_go'

export interface SceneBreakdown {
  chapterId: string
  totalScenes: number
  avgSceneLength: number  // in words
  sceneDensity: SceneDensity
  pacingRhythm: PacingRhythm
  tensionDistribution: number[]  // per-scene tension 0-100
}

export interface PacingOptimizationReport {
  totalChapters: number
  avgPacingScore: number
  overPacedChapters: string[]  // too fast
  underPacedChapters: string[]  // too slow
  recommendations: string[]
}

export interface ChapterPacingState {
  scenes: SceneBreakdown[]
  optimizationReport: PacingOptimizationReport | null
  targetPacingScore: number
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ChapterPacingState {
  return { scenes: [], optimizationReport: null, targetPacingScore: 70, typeAlias: {} }
}

function calculateSceneDensity(totalWords: number, sceneCount: number): SceneDensity {
  const avgSceneLength = sceneCount > 0 ? totalWords / sceneCount : 0
  if (avgSceneLength < 200) return 'overloaded'
  if (avgSceneLength < 500) return 'dense'
  if (avgSceneLength < 1000) return 'moderate'
  return 'sparse'
}

function detectPacingRhythm(tensionDistribution: number[]): PacingRhythm {
  if (tensionDistribution.length < 3) return 'steady'
  const first = tensionDistribution.slice(0, Math.floor(tensionDistribution.length / 2))
  const second = tensionDistribution.slice(Math.floor(tensionDistribution.length / 2))
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length
  const secondAvg = second.reduce((a, b) => a + b, 0) / second.length
  
  if (secondAvg > firstAvg + 10) return 'accelerating'
  if (secondAvg < firstAvg - 10) return 'decelerating'
  
  // Check for wave pattern
  let waveCount = 0
  for (let i = 1; i < tensionDistribution.length - 1; i++) {
    if ((tensionDistribution[i] > tensionDistribution[i-1] && tensionDistribution[i] > tensionDistribution[i+1]) ||
        (tensionDistribution[i] < tensionDistribution[i-1] && tensionDistribution[i] < tensionDistribution[i+1])) {
      waveCount++
    }
  }
  if (waveCount > tensionDistribution.length / 3) return 'wave'
  
  // Check for stop-and-go (alternating high/low)
  let alternations = 0
  for (let i = 1; i < tensionDistribution.length; i++) {
    if ((tensionDistribution[i] > 60 && tensionDistribution[i-1] < 40) ||
        (tensionDistribution[i] < 40 && tensionDistribution[i-1] > 60)) {
      alternations++
    }
  }
  if (alternations > tensionDistribution.length / 2) return 'stop_and_go'
  
  return 'steady'
}

export function registerChapterScenes(
  state: ChapterPacingState,
  chapterId: string,
  sceneLengths: number[],
  tensionDistribution: number[]
): ChapterPacingState {
  const totalScenes = sceneLengths.length
  const totalWords = sceneLengths.reduce((a, b) => a + b, 0)
  const avgSceneLength = totalScenes > 0 ? Math.round(totalWords / totalScenes) : 0
  const sceneDensity = calculateSceneDensity(totalWords, totalScenes)
  const pacingRhythm = detectPacingRhythm(tensionDistribution)
  
  const breakdown: SceneBreakdown = { chapterId, totalScenes, avgSceneLength, sceneDensity, pacingRhythm, tensionDistribution }
  
  const scenes = [...state.scenes.filter(s => s.chapterId !== chapterId), breakdown]
  
  return { ...state, scenes }
}

export function setTargetPacingScore(state: ChapterPacingState, score: number): ChapterPacingState {
  return { ...state, targetPacingScore: Math.max(0, Math.min(100, score)) }
}

export function generateOptimizationReport(state: ChapterPacingState): PacingOptimizationReport {
  if (state.scenes.length === 0) {
    return { totalChapters: 0, avgPacingScore: 0, overPacedChapters: [], underPacedChapters: [], recommendations: [] }
  }
  
  const pacingScores = state.scenes.map(s => {
    let score = 70
    if (s.sceneDensity === 'dense' || s.sceneDensity === 'moderate') score += 10
    if (s.sceneDensity === 'sparse') score -= 10
    if (s.sceneDensity === 'overloaded') score -= 20
    if (s.pacingRhythm === 'accelerating' || s.pacingRhythm === 'wave') score += 15
    if (s.pacingRhythm === 'stop_and_go') score -= 10
    return Math.max(0, Math.min(100, score))
  })
  
  const avgPacingScore = Math.round(pacingScores.reduce((a, b) => a + b, 0) / pacingScores.length)
  
  const overPacedChapters = state.scenes
    .map((s, i) => ({ chapterId: s.chapterId, score: pacingScores[i] }))
    .filter(x => x.score > state.targetPacingScore + 15)
    .map(x => x.chapterId)
  
  const underPacedChapters = state.scenes
    .map((s, i) => ({ chapterId: s.chapterId, score: pacingScores[i] }))
    .filter(x => x.score < state.targetPacingScore - 15)
    .map(x => x.chapterId)
  
  const recommendations: string[] = []
  if (overPacedChapters.length > 0) recommendations.push(`Expand ${overPacedChapters.length} fast-paced chapters`)
  if (underPacedChapters.length > 0) recommendations.push(`Add tension to ${underPacedChapters.length} slow-paced chapters`)
  if (avgPacingScore > state.targetPacingScore + 10) recommendations.push('Overall pacing is fast - consider adding more reflection scenes')
  if (avgPacingScore < state.targetPacingScore - 10) recommendations.push('Overall pacing is slow - tighten chapter openings')
  if (avgPacingScore >= state.targetPacingScore - 10 && avgPacingScore <= state.targetPacingScore + 10) {
    recommendations.push('Pacing is well balanced')
  }
  
  return { totalChapters: state.scenes.length, avgPacingScore, overPacedChapters, underPacedChapters, recommendations }
}

export function compareChapterPacing(state: ChapterPacingState, ch1: string, ch2: string): {
  fasterChapter: string
  pacingDiff: number
  rhythmDiff: boolean
} {
  const s1 = state.scenes.find(s => s.chapterId === ch1)
  const s2 = state.scenes.find(s => s.chapterId === ch2)
  if (!s1 || !s2) return { fasterChapter: ch1, pacingDiff: 0, rhythmDiff: false }
  
  return {
    fasterChapter: s1.avgSceneLength < s2.avgSceneLength ? ch1 : ch2,
    pacingDiff: Math.abs(s1.avgSceneLength - s2.avgSceneLength),
    rhythmDiff: s1.pacingRhythm !== s2.pacingRhythm,
  }
}
