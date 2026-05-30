/**
 * NarrativeArcAnalyzer — V355
 * Three-act/five-act structure analysis, pacing curves, arc shape detection.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops)
 */

export type ArcShape = 'rising' | 'falling' | 'rising_falling' | 'bowl' | 'dome' | 'plateau' | 'double_rise'
export type ActType = 'act1' | 'act2' | 'act3'

export interface ArcPoint {
  position: number    // 0-100 normalized position
  intensity: number   // 0-100 tension/emotion intensity
  chapterId?: string
  label?: string
}

export interface NarrativeArc {
  id: string
  shape: ArcShape
  points: ArcPoint[]
  dominantAct: ActType
  climaxPosition: number  // 0-100 where climax occurs
  actBoundaries: number[]  // [endOfAct1, endOfAct2] in 0-100
}

export interface ArcAnalyzerState {
  arcs: Record<string, NarrativeArc>
  currentArcId: string | null
  avgArcShape: ArcShape | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ArcAnalyzerState {
  return { arcs: {}, currentArcId: null, avgArcShape: null, typeAlias: {} }
}

export function createArc(state: ArcAnalyzerState, shape: ArcShape): ArcAnalyzerState {
  const id = `arc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const arc: NarrativeArc = {
    id, shape, points: [], dominantAct: 'act2',
    climaxPosition: 50, actBoundaries: [25, 75],
  }
  return {
    ...state,
    arcs: { ...state.arcs, [id]: arc },
    currentArcId: id,
  }
}

export function addArcPoint(
  state: ArcAnalyzerState,
  position: number,
  intensity: number,
  chapterId?: string,
  label?: string
): ArcAnalyzerState {
  if (!state.currentArcId) return state
  const arc = state.arcs[state.currentArcId]
  if (!arc) return state
  const point: ArcPoint = { position, intensity, chapterId, label }
  const points = [...arc.points, point].sort((a, b) => a.position - b.position)
  const updatedArc = { ...arc, points, climaxPosition: findClimaxPosition(points) }
  return { ...state, arcs: { ...state.arcs, [state.currentArcId]: updatedArc } }
}

export function findClimaxPosition(points: ArcPoint[]): number {
  if (points.length === 0) return 50
  const climax = points.reduce((max, p) => p.intensity > max.intensity ? p : max, points[0])
  return climax.position
}

export function detectArcShape(points: ArcPoint[]): ArcShape {
  if (points.length < 5) return 'plateau'
  const firstHalf = points.slice(0, Math.floor(points.length / 2))
  const secondHalf = points.slice(Math.floor(points.length / 2))
  const firstAvg = firstHalf.reduce((s, p) => s + p.intensity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, p) => s + p.intensity, 0) / secondHalf.length
  const peak = Math.max(...points.map(p => p.intensity))
  const trough = Math.min(...points.map(p => p.intensity))
  const midRange = (peak - trough) * 0.3
  const early = points.slice(0, Math.floor(points.length / 3))
  const late = points.slice(-Math.floor(points.length / 3))
  const earlyAvg = early.reduce((s, p) => s + p.intensity, 0) / early.length
  const lateAvg = late.reduce((s, p) => s + p.intensity, 0) / late.length
  if (secondAvg > firstAvg + midRange && lateAvg > earlyAvg + midRange) return 'rising'
  if (firstAvg > secondAvg + midRange && earlyAvg > lateAvg + midRange) return 'falling'
  if (firstAvg > midRange && secondAvg > midRange && peak === points[Math.floor(points.length / 2)]?.intensity) return 'dome'
  if (firstAvg < peak - midRange && secondAvg < peak - midRange && trough === points[Math.floor(points.length / 2)]?.intensity) return 'bowl'
  if (peak > firstAvg + midRange && peak > secondAvg + midRange) return 'rising_falling'
  if (Math.abs(firstAvg - secondAvg) < midRange) return 'plateau'
  return 'double_rise'
}

export function calculateActBoundaries(arc: NarrativeArc): number[] {
  const points = arc.points
  if (points.length < 3) return [25, 75]
  const climaxPos = arc.climaxPosition
  if (climaxPos < 40) return [Math.floor(climaxPos * 0.7), climaxPos + 20]
  if (climaxPos > 60) return [climaxPos - 20, Math.floor(climaxPos * 1.3)]
  return [Math.floor(climaxPos * 0.5), Math.floor(climaxPos * 1.5)]
}

export function getArcStatistics(state: ArcAnalyzerState, arcId: string) {
  const arc = state.arcs[arcId]
  if (!arc) return null
  const points = arc.points
  return {
    totalPoints: points.length,
    avgIntensity: points.length > 0 ? points.reduce((s, p) => s + p.intensity, 0) / points.length : 0,
    climaxPosition: arc.climaxPosition,
    shape: arc.shape,
    actBoundaries: arc.actBoundaries,
    range: points.length > 0 ? Math.max(...points.map(p => p.intensity)) - Math.min(...points.map(p => p.intensity)) : 0,
  }
}

export function suggestActAdjustments(state: ArcAnalyzerState, arcId: string): string[] {
  const arc = state.arcs[arcId]
  if (!arc) return []
  const suggestions: string[] = []
  const stats = getArcStatistics(state, arcId)
  if (!stats) return suggestions
  if (stats.climaxPosition < 30) suggestions.push('Climax occurs too early - consider moving key conflict later')
  if (stats.climaxPosition > 70) suggestions.push('Climax occurs too late - consider earlier build-up')
  if (arc.shape === 'rising') suggestions.push('Arc stays on one note - consider adding complications')
  if (arc.shape === 'plateau') suggestions.push('Flat arc - add rising and falling beats for tension')
  if (stats.range < 20) suggestions.push('Low emotional range - intensify key moments')
  return suggestions
}

export function compareArcs(state: ArcAnalyzerState, arcId1: string, arcId2: string) {
  const s1 = getArcStatistics(state, arcId1)
  const s2 = getArcStatistics(state, arcId2)
  if (!s1 || !s2) return null
  return {
    moreIntense: s1.avgIntensity > s2.avgIntensity ? arcId1 : arcId2,
    avgIntensityDiff: Math.abs(s1.avgIntensity - s2.avgIntensity),
    shapes: [s1.shape, s2.shape],
  }
}
