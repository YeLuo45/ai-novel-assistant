/**
 * PacingAnalyzer — V363
 * Chapter pacing analysis, scene rhythm optimization, tension wave visualization.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition)
 */

export interface PacingPoint {
  position: number      // 0-100 in chapter
  intensity: number    // 0-100 (action, tension, emotion)
  sceneType: SceneType
  description?: string
}

export type SceneType = 'action' | 'dialogue' | 'reflection' | 'transition' | 'climax' | 'exposition'

export interface PacingCurve {
  id: string
  chapterId: string
  points: PacingPoint[]
  avgPacing: number
  pacingShape: 'accelerating' | 'decelerating' | 'wave' | 'steady' | 'peaks'
  problemAreas: number[]  // positions with pacing issues
}

export interface PacingAnalyzerState {
  curves: Record<string, PacingCurve>
  avgChapterPacing: number
  pacingTrend: 'improving' | 'stable' | 'declining'
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): PacingAnalyzerState {
  return {
    curves: {},
    avgChapterPacing: 50,
    pacingTrend: 'stable',
    typeAlias: {},
  }
}

export function createPacingCurve(state: PacingAnalyzerState, chapterId: string): PacingAnalyzerState {
  const id = `curve_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const curve: PacingCurve = { id, chapterId, points: [], avgPacing: 50, pacingShape: 'steady', problemAreas: [] }
  return { ...state, curves: { ...state.curves, [id]: curve } }
}

export function addPacingPoint(
  state: PacingAnalyzerState,
  curveId: string,
  position: number,
  intensity: number,
  sceneType: SceneType,
  description?: string
): PacingAnalyzerState {
  const curve = state.curves[curveId]
  if (!curve) return state
  const point: PacingPoint = { position, intensity, sceneType, description }
  const points = [...curve.points, point].sort((a, b) => a.position - b.position)
  const avgPacing = points.reduce((s, p) => s + p.intensity, 0) / points.length
  const pacingShape = detectPacingShape(points)
  const problemAreas = findProblemAreas(points)
  return {
    ...state,
    curves: { ...state.curves, [curveId]: { ...curve, points, avgPacing, pacingShape, problemAreas } },
  }
}

export function detectPacingShape(points: PacingPoint[]): PacingCurve['pacingShape'] {
  if (points.length < 4) return 'steady'
  const firstHalf = points.slice(0, Math.floor(points.length / 2))
  const secondHalf = points.slice(Math.floor(points.length / 2))
  const firstAvg = firstHalf.reduce((s, p) => s + p.intensity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, p) => s + p.intensity, 0) / secondHalf.length
  const variance = points.reduce((s, p) => s + Math.pow(p.intensity - firstAvg, 2), 0) / points.length
  if (variance > 400) return 'peaks'
  if (secondAvg > firstAvg * 1.3) return 'accelerating'
  if (firstAvg > secondAvg * 1.3) return 'decelerating'
  const rising = points.filter((p, i) => i > 0 && points[i - 1].intensity < p.intensity).length
  const falling = points.filter((p, i) => i > 0 && points[i - 1].intensity > p.intensity).length
  if (Math.abs(rising - falling) <= 2) return 'wave'
  return 'steady'
}

export function findProblemAreas(points: PacingPoint[]): number[] {
  if (points.length < 3) return []
  const problems: number[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].intensity
    const curr = points[i].intensity
    const next = points[i + 1].intensity
    // Flag if current point is dramatically lower than both neighbors
    if (curr < prev * 0.6 && curr < next * 0.6) {
      problems.push(points[i].position)
    }
    // Flag if current point is part of a long flat section
    if (Math.abs(curr - prev) <= 5 && Math.abs(next - curr) <= 5) {
      problems.push(points[i].position)
    }
  }
  return problems
}

export function analyzeChapterPacing(state: PacingAnalyzerState, chapterId: string) {
  const curve = Object.values(state.curves).find(c => c.chapterId === chapterId)
  if (!curve) return null
  const actionPoints = curve.points.filter(p => p.sceneType === 'action')
  const dialoguePoints = curve.points.filter(p => p.sceneType === 'dialogue')
  const reflectionPoints = curve.points.filter(p => p.sceneType === 'reflection')
  return {
    chapterId,
    avgPacing: curve.avgPacing,
    pacingShape: curve.pacingShape,
    problemAreas: curve.problemAreas,
    sceneDistribution: {
      action: actionPoints.length,
      dialogue: dialoguePoints.length,
      reflection: reflectionPoints.length,
    },
    recommendations: generateRecommendations(curve),
  }
}

export function generateRecommendations(curve: PacingCurve): string[] {
  const recs: string[] = []
  if (curve.pacingShape === 'decelerating') recs.push('Consider adding action beats to maintain tension')
  if (curve.pacingShape === 'steady') recs.push('Add varied pacing - mix intense and quiet scenes')
  if (curve.pacingShape === 'accelerating') recs.push('Ensure resolution time after climax buildup')
  if (curve.problemAreas.length > 2) recs.push('Multiple pacing issues detected - review slow sections')
  const hasClimax = curve.points.some(p => p.sceneType === 'climax')
  if (!hasClimax) recs.push('No climax scene type found - consider adding a peak moment')
  return recs
}

export function compareChapterPacing(state: PacingAnalyzerState, chapterId1: string, chapterId2: string) {
  const c1 = Object.values(state.curves).find(c => c.chapterId === chapterId1)
  const c2 = Object.values(state.curves).find(c => c.chapterId === chapterId2)
  if (!c1 || !c2) return null
  return {
    fasterPaced: c1.avgPacing > c2.avgPacing ? chapterId1 : chapterId2,
    avgPacingDiff: Math.abs(c1.avgPacing - c2.avgPacing),
    shapes: [c1.pacingShape, c2.pacingShape],
  }
}
