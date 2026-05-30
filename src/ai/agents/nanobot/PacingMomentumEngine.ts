/**
 * PacingMomentumEngine — V529
 * Tracks narrative pacing momentum, scene transitions, and reader engagement flow.
 * Inspired by: thunderbolt (feedback pipeline) + ruflo (hierarchical decomposition)
 */

export interface SceneMetrics {
  sceneId: string
  chapter: number
  pageRange: [number, number]
  pacingScore: number         // 0-100 (slow to fast)
  engagementScore: number     // 0-100
  transitionType: 'beat' | 'cut' | 'fade' | 'dissolve'
  tensionLevel: number        // 0-100
}

export interface PacingState {
  scenes: SceneMetrics[]
  momentumCurve: number[]     // momentum at each chapter
  currentPacingMode: 'meditative' | 'balanced' | 'suspenseful' | 'breathtaking'
  pacingViolations: Array<{ chapter: number, sceneId: string, description: string }>
  engagementDips: Array<{ chapter: number, depth: number }>
  recommendedPacing: number   // 0-100
}

export function createEmptyState(): PacingState {
  return {
    scenes: [],
    momentumCurve: [],
    currentPacingMode: 'balanced',
    pacingViolations: [],
    engagementDips: [],
    recommendedPacing: 50
  }
}

export function registerScene(state: PacingState, sceneId: string, chapter: number, startPage: number, endPage: number, pacingScore: number, engagementScore: number, transitionType: SceneMetrics['transitionType'], tensionLevel: number): PacingState {
  if (state.scenes.some(s => s.sceneId === sceneId)) return state

  const scene: SceneMetrics = {
    sceneId,
    chapter,
    pageRange: [startPage, endPage],
    pacingScore,
    engagementScore,
    transitionType,
    tensionLevel
  }

  return {
    ...state,
    scenes: [...state.scenes, scene]
  }
}

export function calculateMomentum(state: PacingState, chapter: number): PacingState {
  const chapterScenes = state.scenes.filter(s => s.chapter === chapter)
  if (chapterScenes.length === 0) return state

  const avgPacing = chapterScenes.reduce((sum, s) => sum + s.pacingScore, 0) / chapterScenes.length
  const avgEngagement = chapterScenes.reduce((sum, s) => sum + s.engagementScore, 0) / chapterScenes.length
  const avgTension = chapterScenes.reduce((sum, s) => sum + s.tensionLevel, 0) / chapterScenes.length

  const momentum = Math.round((avgPacing * 0.4 + avgEngagement * 0.3 + avgTension * 0.3))
  const momentumCurve = [...state.momentumCurve]
  momentumCurve[chapter] = momentum

  let currentPacingMode: PacingState['currentPacingMode'] = 'balanced'
  if (momentum > 85) currentPacingMode = 'breathtaking'
  else if (momentum > 70) currentPacingMode = 'suspenseful'
  else if (momentum < 30) currentPacingMode = 'meditative'

  return { ...state, momentumCurve, currentPacingMode }
}

export function detectEngagementDip(state: PacingState, chapter: number, threshold: number = 30): PacingState {
  const momentum = state.momentumCurve[chapter] || 50
  if (momentum < threshold) {
    const engagementDips = [...state.engagementDips, { chapter, depth: threshold - momentum }]
    return { ...state, engagementDips }
  }
  return state
}

export function detectPacingViolation(state: PacingState, chapter: number, sceneId: string, description: string): PacingState {
  return {
    ...state,
    pacingViolations: [...state.pacingViolations, { chapter, sceneId, description }]
  }
}

export function suggestPacingAdjustment(state: PacingState, chapter: number): number {
  const momentum = state.momentumCurve[chapter] || 50
  const targetMomentum = 65

  if (momentum < targetMomentum - 10) return Math.min(100, momentum + 15)
  if (momentum > targetMomentum + 10) return Math.max(0, momentum - 15)
  return momentum
}

export function calculateChapterPacing(state: PacingState, chapter: number): number {
  const chapterScenes = state.scenes.filter(s => s.chapter === chapter)
  if (chapterScenes.length === 0) return 50
  return Math.round(chapterScenes.reduce((sum, s) => sum + s.pacingScore, 0) / chapterScenes.length)
}

export function smoothMomentumCurve(state: PacingState, windowSize: number = 3): PacingState {
  if (state.momentumCurve.length < windowSize) return state

  const smoothed = [...state.momentumCurve]
  for (let i = windowSize - 1; i < smoothed.length; i++) {
    let sum = 0
    let count = 0
    for (let j = i - windowSize + 1; j <= i; j++) {
      if (smoothed[j] !== undefined) {
        sum += smoothed[j]
        count++
      }
    }
    if (count > 0) smoothed[i] = Math.round(sum / count)
  }

  return { ...state, momentumCurve: smoothed }
}

export function getSceneById(state: PacingState, sceneId: string): SceneMetrics | null {
  return state.scenes.find(s => s.sceneId === sceneId) || null
}

export function getScenesByChapter(state: PacingState, chapter: number): SceneMetrics[] {
  return state.scenes.filter(s => s.chapter === chapter)
}

export function getPacingSummary(state: PacingState): { totalScenes: number, avgMomentum: number, totalViolations: number, engagementDips: number, currentMode: string } {
  const moments = state.momentumCurve.filter(m => m !== undefined)
  const avgMomentum = moments.length > 0 ? Math.round(moments.reduce((s, m) => s + m, 0) / moments.length) : 50
  return {
    totalScenes: state.scenes.length,
    avgMomentum,
    totalViolations: state.pacingViolations.length,
    engagementDips: state.engagementDips.length,
    currentMode: state.currentPacingMode
  }
}